import { vi, describe, test, expect } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { chain } from '#lib/testing/drizzle.js';
import * as schema from './db/schema.js';
import { NOTIFICATION_KINDS, UNSEEN_MAX, type NotificationKind } from '#lib/notifications.js';

vi.mock('#lib/server/db/index.js', () => ({ db: {} }));
vi.mock('$app/env/private', () => ({ MODERATOR_IDS: '' }));

import {
	acceptsOf,
	forksOf,
	likesOn,
	newestFirst,
	notificationsFor,
	requestsTo,
	savesOf,
	unseenCount,
	type Notification
} from './notifications.js';

const ME = 'me';
// Builds real SQL; never connects.
const unconnected = drizzle(postgres('postgres://unused@127.0.0.1:1/unused'), { schema });

const READS = {
	request: requestsTo,
	accepted: acceptsOf,
	like: likesOn,
	save: savesOf,
	fork: forksOf
} satisfies Record<NotificationKind, unknown>;

/** The person on each kind's row, as its SQL names them. */
const ACTOR: Record<NotificationKind, string> = {
	request: '"friendships"."requester_id"',
	accepted: '"friendships"."addressee_id"',
	like: '"likes"."user_id"',
	save: '"favorites"."user_id"',
	fork: '"recipes"."author_id"'
};

const LIMIT = 7;
const sqlFor = (kind: NotificationKind, unseenOnly = false) =>
	READS[kind]({ me: ME, unseenOnly, limit: LIMIT, conn: unconnected as never }).toSQL();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&');

describe('each kind read', () => {
	test.each(NOTIFICATION_KINDS)(
		'%s: nobody in a block with the cook, either way, nor anyone they muted',
		(kind) => {
			const { sql, params } = sqlFor(kind);
			const actor = escape(ACTOR[kind]);
			expect(sql).toMatch(
				new RegExp(
					`not exists \\(select 1 from "friendships" "bk" where .*least\\(\\$\\d+, ${actor}\\)`
				)
			);
			expect(params).toContain('blocked');
			expect(sql).toMatch(
				new RegExp(
					`not exists \\(select 1 from "mutes" where "mutes"\\."muter_id" = \\$\\d+ and "mutes"\\."muted_id" = ${actor}\\)`
				)
			);
		}
	);

	test.each(['like', 'save', 'fork'] as const)("%s: the cook's own act is not news", (kind) => {
		const { sql } = sqlFor(kind);
		const own = kind === 'fork' ? 'is distinct from' : '<>';
		expect(sql).toMatch(new RegExp(`${escape(ACTOR[kind])} ${own} \\$\\d+`));
	});

	test('save: only a live recipe, not in the Trash (erased included) nor hidden', () => {
		const { sql } = sqlFor('save');
		expect(sql).toContain('"recipes"."deleted_at" is null');
		expect(sql).toContain('"recipes"."suppressed_at" is null');
	});

	test('fork: both the parent and the fork live', () => {
		const { sql } = sqlFor('fork');
		for (const t of ['recipes', 'parent']) {
			expect(sql).toContain(`"${t}"."deleted_at" is null`);
			expect(sql).toContain(`"${t}"."suppressed_at" is null`);
		}
	});

	test("fork: whether the cook may open the fork is visibleTo's rule on the fork", () => {
		const { sql } = sqlFor('fork');
		const select = sql.slice(0, sql.indexOf(' from "recipes" inner join '));
		expect(select).toContain('"recipes"."visibility" = $');
		expect(select).toContain('exists (select 1 from "friendships" "fr"');
	});

	test('accepted: dated by the accept, and only accepted pairs', () => {
		const { sql, params } = sqlFor('accepted');
		expect(sql).toContain('"friendships"."accepted_at" is not null');
		expect(sql).toContain('order by "friendships"."accepted_at" desc');
		expect(params).toContain('accepted');
	});

	test.each(NOTIFICATION_KINDS)('%s: unseen only adds the seen check to the where', (kind) => {
		const seen = /from "profiles" "seen" where "seen"\."id" = \$\d+/g;
		expect(sqlFor(kind, false).sql.match(seen)).toHaveLength(1);
		const unseen = sqlFor(kind, true);
		expect(unseen.sql.match(seen)).toHaveLength(2);
		expect(unseen.params).toContain(LIMIT);
	});
});

const item = (id: string, at: string): Notification => ({
	kind: 'request',
	id,
	at: new Date(at),
	unseen: false,
	username: 'x'
});

describe('newestFirst', () => {
	test('newest first, then the higher id at one instant', () => {
		const items = [
			item('request-a', '2026-11-01T10:00:00Z'),
			item('request-b', '2026-11-02T10:00:00Z'),
			item('request-c', '2026-11-01T10:00:00Z')
		];
		expect(items.sort(newestFirst).map((i) => i.id)).toEqual([
			'request-b',
			'request-c',
			'request-a'
		]);
	});
});

/** A conn whose first select reads the profile's muted kinds and each later one a kind's rows. */
function fakeConn(muted: string[], rows: Partial<Record<NotificationKind, unknown[]>> = {}) {
	const kindsRead: NotificationKind[] = [];
	const heard = NOTIFICATION_KINDS.filter((k) => !muted.includes(k));
	let call = 0;
	const select = vi.fn(() => {
		if (call++ === 0) return chain([{ muted }]);
		const kind = heard[call - 2];
		kindsRead.push(kind);
		return chain(rows[kind] ?? []);
	});
	return { conn: { select } as never, select, kindsRead };
}

describe('notificationsFor', () => {
	test('a muted kind is never read, and a stored value that is no kind is ignored', async () => {
		const { conn, kindsRead } = fakeConn(['like', 'fork', 'gone-kind']);
		await notificationsFor({ id: ME }, { limit: 5, conn });
		expect(kindsRead).toEqual(['request', 'accepted', 'save']);
	});

	test('the kinds merge newest first and stop at the limit', async () => {
		const at = (d: string) => new Date(`2026-11-${d}T12:00:00Z`);
		const { conn } = fakeConn([], {
			request: [{ at: at('03'), unseen: true, actorId: 'r', username: 'rae' }],
			like: [
				{ at: at('05'), unseen: true, actorId: 'l', username: 'lou', entryId: 4, dish: 'Dal' },
				{ at: at('01'), unseen: false, actorId: 'm', username: 'max', entryId: 4, dish: 'Dal' }
			],
			fork: [
				{
					at: at('04'),
					unseen: true,
					actorId: null,
					username: null,
					forkId: 9,
					slug: 'soup',
					title: 'Soup',
					forkSlug: 'secret',
					forkTitle: 'Secret soup',
					forkVisible: false
				}
			]
		});
		const items = await notificationsFor({ id: ME }, { limit: 3, conn });
		expect(items).toEqual([
			{
				kind: 'like',
				id: 'like-4-l',
				at: at('05'),
				unseen: true,
				username: 'lou',
				entry: { id: 4, dish: 'Dal' }
			},
			{
				kind: 'fork',
				id: 'fork-9',
				at: at('04'),
				unseen: true,
				username: null,
				recipe: { slug: 'soup', title: 'Soup' },
				// The cook may not open it: the event, but nothing of the fork.
				fork: null
			},
			{ kind: 'request', id: 'request-r', at: at('03'), unseen: true, username: 'rae' }
		]);
	});

	test('a fork the cook may open carries its slug and title', async () => {
		const { conn } = fakeConn([], {
			fork: [
				{
					at: new Date(),
					unseen: false,
					actorId: 'c',
					username: 'cy',
					forkId: 2,
					slug: 'soup',
					title: 'Soup',
					forkSlug: 'cys-soup',
					forkTitle: "Cy's soup",
					forkVisible: true
				}
			]
		});
		const [fork] = await notificationsFor({ id: ME }, { limit: 3, conn });
		expect(fork).toMatchObject({ fork: { slug: 'cys-soup', title: "Cy's soup" } });
	});
});

describe('unseenCount', () => {
	test(`reads each heard kind's unseen items, at most UNSEEN_MAX in all`, async () => {
		const many = Array.from({ length: UNSEEN_MAX }, (_, i) => ({
			at: new Date(i),
			unseen: true,
			actorId: `a${i}`,
			username: `u${i}`,
			recipeId: 1,
			slug: 's',
			title: 'T'
		}));
		const { conn, select } = fakeConn(['request'], { save: many, accepted: many.slice(0, 3) });
		expect(await unseenCount({ id: ME }, conn)).toBe(UNSEEN_MAX);
		expect(select).toHaveBeenCalledTimes(1 + NOTIFICATION_KINDS.length - 1);
	});
});
