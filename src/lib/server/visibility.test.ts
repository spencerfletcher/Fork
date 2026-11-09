import { vi, describe, test, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { chain } from '#lib/testing/drizzle.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema.js';
import { recipes } from './db/schema.js';
import { VISIBILITIES, type Visibility } from '#lib/recipes/validation.js';

const { selectMock } = vi.hoisted(() => ({ selectMock: vi.fn() }));
vi.mock('#lib/server/db/index.js', () => ({ db: { select: selectMock } }));

import { canView, canViewRow, canSetVisibility, friendIdsOf, visibleTo } from './visibility.js';

const OWNER = { id: 'owner' };
const FRIEND = { id: 'friend' };
const OTHER = { id: 'other' };

const row = (visibility: Visibility, authorId: string | null = OWNER.id) => ({
	visibility,
	authorId
});

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

describe('visibleTo', () => {
	test('a logged-out visitor sees public recipes only', () => {
		expect(visibleTo(null)).toEqual(eq(recipes.visibility, 'public'));
		expect(visibleTo(undefined)).toEqual(eq(recipes.visibility, 'public'));
	});

	test('a signed-in visitor also sees their own, and friends recipes by an accepted friend either way', () => {
		const { sql, params } = new PgDialect().sqlToQuery(visibleTo(OTHER));
		expect(params).toEqual(['public', OTHER.id, 'friends', 'accepted', OTHER.id, OTHER.id]);
		expect(sql).toBe(
			'("recipes"."visibility" = $1 or "recipes"."author_id" = $2 or ("recipes"."visibility" = $3 and exists (select 1 from "friendships" "fr" where "fr"."status" = $4 and (("fr"."requester_id" = $5 and "fr"."addressee_id" = "recipes"."author_id") or ("fr"."addressee_id" = $6 and "fr"."requester_id" = "recipes"."author_id")))))'
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
