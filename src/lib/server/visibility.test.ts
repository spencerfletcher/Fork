import { vi, describe, test, expect, beforeEach } from 'vitest';
import { and, eq, isNull } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { chain } from '#lib/testing/drizzle.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema.js';
import { recipes } from './db/schema.js';
import { VISIBILITIES, type Visibility } from '#lib/recipes/validation.js';

const { selectMock, findRecipeMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
	findRecipeMock: vi.fn()
}));
vi.mock('#lib/server/db/index.js', () => ({
	db: { select: selectMock, query: { recipes: { findFirst: findRecipeMock } } }
}));

import {
	canView,
	canViewRow,
	canSetVisibility,
	friendIdsOf,
	friendIdsOnce,
	inLibraryOf,
	keptCopyOf,
	NOT_AUTHORIZED,
	ownRecipe,
	viewableRecipe,
	visibleTo
} from './visibility.js';

const OWNER = { id: 'owner' };
const FRIEND = { id: 'friend' };
const OTHER = { id: 'other' };

const row = (
	visibility: Visibility,
	authorId: string | null = OWNER.id,
	deletedAt: Date | null = null
) => ({ visibility, authorId, deletedAt });

beforeEach(() => {
	vi.clearAllMocks();
});

describe('canView', () => {
	test('anyone can view a public recipe', () => {
		expect(canView(row('public'), null)).toBe(true);
		expect(canView(row('public'), undefined)).toBe(true);
		expect(canView(row('public'), OTHER)).toBe(true);
	});

	test('a private recipe is visible to its author only, friends included', () => {
		expect(canView(row('private'), OWNER)).toBe(true);
		expect(canView(row('private'), FRIEND, [OWNER.id])).toBe(false);
		expect(canView(row('private'), OTHER)).toBe(false);
		expect(canView(row('private'), null)).toBe(false);
	});

	test("a friends recipe is visible to its author and the author's friends", () => {
		expect(canView(row('friends'), OWNER)).toBe(true);
		expect(canView(row('friends'), FRIEND, [OWNER.id])).toBe(true);
		expect(canView(row('friends'), OTHER, [FRIEND.id])).toBe(false);
		expect(canView(row('friends'), FRIEND)).toBe(false);
		expect(canView(row('friends'), null, [OWNER.id])).toBe(false);
	});

	test('a recipe in the Trash is visible to nobody, its owner included', () => {
		for (const visibility of VISIBILITIES) {
			const trashed = row(visibility, OWNER.id, new Date());
			expect(canView(trashed, OWNER)).toBe(false);
			expect(canView(trashed, FRIEND, [OWNER.id])).toBe(false);
			expect(canView(trashed, null)).toBe(false);
		}
	});

	test('a non-public recipe whose author was deleted is visible to nobody', () => {
		for (const visibility of ['private', 'friends'] as const) {
			expect(canView(row(visibility, null), OTHER, [OWNER.id])).toBe(false);
			expect(canView(row(visibility, null), null)).toBe(false);
		}
	});
});

describe('friendIdsOf', () => {
	test('returns the other side of each accepted friendship, whichever way it was asked', async () => {
		selectMock.mockReturnValue(
			chain([
				{ requesterId: OWNER.id, addresseeId: 'a' },
				{ requesterId: 'b', addresseeId: OWNER.id }
			])
		);
		expect(await friendIdsOf(OWNER.id)).toEqual(['a', 'b']);
	});
});

describe('canViewRow', () => {
	test("looks the viewer's friends up only for someone else's friends recipe", async () => {
		selectMock.mockReturnValue(chain([{ requesterId: FRIEND.id, addresseeId: OWNER.id }]));

		expect(await canViewRow(row('public'), OTHER)).toBe(true);
		expect(await canViewRow(row('private'), OTHER)).toBe(false);
		expect(await canViewRow(row('friends'), OWNER)).toBe(true);
		expect(await canViewRow(row('friends'), null)).toBe(false);
		expect(selectMock).not.toHaveBeenCalled();

		expect(await canViewRow(row('friends'), FRIEND)).toBe(true);
		expect(selectMock).toHaveBeenCalledTimes(1);
	});

	test('a friends recipe stays hidden from a viewer who is not a friend', async () => {
		selectMock.mockReturnValue(chain([{ requesterId: OTHER.id, addresseeId: 'someone' }]));
		expect(await canViewRow(row('friends'), OTHER)).toBe(false);
	});
});

describe('friendIdsOnce', () => {
	test('asks the database once however often it is called', async () => {
		selectMock.mockReturnValue(chain([{ requesterId: FRIEND.id, addresseeId: OWNER.id }]));
		const friends = friendIdsOnce(FRIEND);
		expect(await friends()).toEqual([OWNER.id]);
		expect(await friends()).toEqual([OWNER.id]);
		expect(selectMock).toHaveBeenCalledTimes(1);
	});

	test('signed out has no friends and asks nothing', async () => {
		expect(await friendIdsOnce(null)()).toEqual([]);
		expect(selectMock).not.toHaveBeenCalled();
	});
});

describe('viewableRecipe', () => {
	test('the recipe at the slug, with the relations asked for, when the viewer may see it', async () => {
		const recipe = { ...row('public'), slug: 'soup' };
		findRecipeMock.mockResolvedValue(recipe);
		const withRelations = { author: true } as const;
		expect(await viewableRecipe('soup', OTHER, withRelations)).toBe(recipe);
		expect(findRecipeMock).toHaveBeenCalledWith(
			expect.objectContaining({
				where: and(eq(recipes.slug, 'soup'), isNull(recipes.deletedAt)),
				with: withRelations
			})
		);
	});

	test('null for no recipe, and for one the viewer may not see', async () => {
		findRecipeMock.mockResolvedValue(undefined);
		expect(await viewableRecipe('gone', OWNER)).toBeNull();
		findRecipeMock.mockResolvedValue(row('private'));
		expect(await viewableRecipe('soup', OTHER)).toBeNull();
	});

	test('shares one friends lookup with a later check in the same request', async () => {
		selectMock.mockReturnValue(chain([{ requesterId: FRIEND.id, addresseeId: OWNER.id }]));
		findRecipeMock.mockResolvedValue(row('friends'));
		const friends = friendIdsOnce(FRIEND);
		expect(await viewableRecipe('soup', FRIEND, undefined, friends)).not.toBeNull();
		expect(await canViewRow(row('friends'), FRIEND, friends)).toBe(true);
		expect(selectMock).toHaveBeenCalledTimes(1);
	});
});

describe('ownRecipe', () => {
	test("the author's own recipe", async () => {
		const recipe = row('private');
		findRecipeMock.mockResolvedValue(recipe);
		expect(await ownRecipe('soup', OWNER.id)).toBe(recipe);
	});

	test('a 404 for no recipe, and none for one in the Trash: the slug lookup reads live rows only', async () => {
		findRecipeMock.mockResolvedValue(undefined);
		await expect(ownRecipe('gone', OWNER.id)).rejects.toMatchObject({ status: 404 });
		expect(findRecipeMock).toHaveBeenCalledWith(
			expect.objectContaining({ where: and(eq(recipes.slug, 'gone'), isNull(recipes.deletedAt)) })
		);
	});

	test('a 403 that says Not authorized for anyone else, even on a public recipe', async () => {
		findRecipeMock.mockResolvedValue(row('public'));
		await expect(ownRecipe('soup', OTHER.id)).rejects.toMatchObject({
			status: 403,
			body: { message: NOT_AUTHORIZED }
		});
	});
});

describe('inLibraryOf', () => {
	test('visible, and either written or saved by the viewer; or a copy they keep', () => {
		const dialect = new PgDialect();
		const visible = dialect.sqlToQuery(visibleTo(OTHER));
		const kept = dialect.sqlToQuery(keptCopyOf(OTHER));
		const { sql, params } = dialect.sqlToQuery(inLibraryOf(OTHER));
		// The kept copies' placeholders follow the library's eight.
		const keptSql = kept.sql.replace(/\$(\d+)/g, (_, n: string) => `$${Number(n) + 8}`);
		expect(sql).toBe(
			`((${visible.sql} and ("recipes"."author_id" = $7 or "recipes"."id" in (select "recipe_id" from "favorites" where "favorites"."user_id" = $8))) or ${keptSql})`
		);
		expect(params).toEqual([...visible.params, OTHER.id, OTHER.id, ...kept.params]);
	});

	test('a kept copy is a withdrawn recipe (private, or in the Trash) whose save holds a copy version', () => {
		const { sql, params } = new PgDialect().sqlToQuery(keptCopyOf(OTHER));
		expect(sql).toBe(
			'(("recipes"."deleted_at" is not null or "recipes"."visibility" = $1) and "recipes"."id" in (select "recipe_id" from "favorites" where ("favorites"."user_id" = $2 and "favorites"."copy_version" is not null)))'
		);
		expect(params).toEqual(['private', OTHER.id]);
	});
});

describe('visibleTo', () => {
	test('a logged-out visitor sees public recipes only, none in the Trash', () => {
		const expected = and(isNull(recipes.deletedAt), eq(recipes.visibility, 'public'));
		expect(visibleTo(null)).toEqual(expected);
		expect(visibleTo(undefined)).toEqual(expected);
	});

	test('a signed-in visitor also sees their own, and friends recipes by an accepted friend either way, none in the Trash', () => {
		const { sql, params } = new PgDialect().sqlToQuery(visibleTo(OTHER));
		expect(params).toEqual(['public', OTHER.id, 'friends', 'accepted', OTHER.id, OTHER.id]);
		expect(sql).toBe(
			'("recipes"."deleted_at" is null and ("recipes"."visibility" = $1 or "recipes"."author_id" = $2 or ("recipes"."visibility" = $3 and exists (select 1 from "friendships" "fr" where "fr"."status" = $4 and (least("fr"."requester_id", "fr"."addressee_id") = least($5, "recipes"."author_id") and greatest("fr"."requester_id", "fr"."addressee_id") = greatest($6, "recipes"."author_id"))))))'
		);
	});

	// The relational query builder re-aliases every column in `where` to the
	// root table, so a friendships column must not reach it as a column.
	test('keeps the friendships columns on friendships inside a relational query', () => {
		const rqb = drizzle(postgres('postgres://unused@127.0.0.1:1/unused'), { schema });
		const { sql } = rqb.query.recipes.findMany({ where: visibleTo(OTHER) }).toSQL();
		expect(sql).toContain('exists (select 1 from "friendships"');
		expect(sql).not.toMatch(/"recipes"\."(status|requester_id|addressee_id)"/);
	});
});

describe('canSetVisibility', () => {
	// VISIBILITIES runs narrowest first. A value is refused only when it is wider
	// than both the parent's place and the fork's own current place.
	const triples = VISIBILITIES.flatMap((parent, p) =>
		VISIBILITIES.flatMap((current, c) =>
			VISIBILITIES.map((requested, r) => [parent, current, requested, r <= Math.max(p, c)] as const)
		)
	);

	test.each(triples)(
		'a fork of a %s recipe, now %s, set to %s: %s',
		(parent, current, requested, allowed) => {
			expect(canSetVisibility(parent, current, requested)).toBe(allowed);
		}
	);

	test('a recipe with no parent may be set to anything', () => {
		for (const current of VISIBILITIES)
			for (const v of VISIBILITIES) expect(canSetVisibility(null, current, v)).toBe(true);
	});

	test('a public fork whose parent went private may narrow to friends', () => {
		expect(canSetVisibility('private', 'public', 'friends')).toBe(true);
	});

	test('a private fork of a friends recipe can never be public', () => {
		expect(canSetVisibility('friends', 'private', 'public')).toBe(false);
	});
});
