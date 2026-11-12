import { vi, describe, test, expect, beforeEach } from 'vitest';
import { formEvent, invokeAction, loadEvent, loadPage } from '#lib/testing/actions.js';
import { LIMITED, LIMITED_FAILURE } from '#lib/testing/rateLimit.js';
import { CONTACT_MAX, LINK_MAX, MAX_REPORT, REPORT_ERRORS } from '#lib/server/moderation.js';
import { REPORT_HONEYPOT } from '#lib/moderation.js';
import type { PageData } from './$types';

const m = vi.hoisted(() => ({
	fileLinkReport: vi.fn(),
	rateLimited: vi.fn(),
	ensureProfile: vi.fn()
}));
vi.mock('#lib/server/db/index.js', () => ({ db: {} }));
vi.mock('$app/env/private', () => ({ MODERATOR_IDS: '' }));
vi.mock('#lib/server/moderation.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/server/moderation.js')>()),
	fileLinkReport: m.fileLinkReport
}));
vi.mock('#lib/server/rateLimit.js', () => ({ rateLimited: m.rateLimited }));
vi.mock('#lib/server/profiles.js', () => ({ ensureProfile: m.ensureProfile }));

import { actions, load } from './+page.server';

// Not localhost: the origin a link must match comes from the request.
const ORIGIN = 'https://fork.example';
const COOK = { id: 'cook-1', email: 'Cook@Example.com' };
const VALID = {
	link: `${ORIGIN}/recipes/soup-ab12?version=2#steps`,
	what: '  That photo is mine.  ',
	contact: '  Me@Example.COM '
};

const send = (fields: Record<string, string>, user: typeof COOK | null = null) =>
	invokeAction(actions.default as never, {
		...formEvent({ fields, locals: { user } }),
		url: new URL('/report', ORIGIN)
	});

beforeEach(() => {
	vi.clearAllMocks();
	m.rateLimited.mockResolvedValue(null);
});

describe('/report load', () => {
	test('signed out: an empty contact, noindex', async () => {
		const data = await loadPage<PageData>(load, loadEvent({ path: '/report' }));
		expect(data).toMatchObject({
			contact: '',
			caps: { link: LINK_MAX, what: MAX_REPORT, contact: CONTACT_MAX },
			meta: { title: 'Report a problem', noindex: true }
		});
	});

	test("signed in: the cook's own address to start from", async () => {
		const data = await loadPage<PageData>(load, loadEvent({ path: '/report', user: COOK }));
		expect(data.contact).toBe(COOK.email);
	});
});

describe('/report action', () => {
	test('signed out: files the path, the text and the contact, trimmed and lowercased, from no one', async () => {
		expect(await send(VALID)).toEqual({ sent: true });
		expect(m.fileLinkReport).toHaveBeenCalledWith(
			null,
			'/recipes/soup-ab12?version=2',
			'me@example.com',
			'That photo is mine.'
		);
		expect(m.rateLimited).toHaveBeenCalledWith('linkReports', null);
		expect(m.ensureProfile).not.toHaveBeenCalled();
	});

	test('signed in: from the cook, under their own cap', async () => {
		expect(await send(VALID, COOK)).toEqual({ sent: true });
		expect(m.ensureProfile).toHaveBeenCalledWith(COOK);
		expect(m.fileLinkReport).toHaveBeenCalledWith(
			COOK.id,
			'/recipes/soup-ab12?version=2',
			'me@example.com',
			'That photo is mine.'
		);
		expect(m.rateLimited).toHaveBeenCalledWith('reports', COOK.id);
	});

	test('a path alone is a link on Fork', async () => {
		await send({ ...VALID, link: '/users/priya' });
		expect(m.fileLinkReport).toHaveBeenCalledWith(
			null,
			'/users/priya',
			expect.any(String),
			expect.any(String)
		);
	});

	test.each([
		['link', '', REPORT_ERRORS.link.missing],
		['link', 'https://elsewhere.example/recipes/soup', REPORT_ERRORS.link.notFork],
		['link', '//elsewhere.example/recipes/soup', REPORT_ERRORS.link.notFork],
		['link', 'recipes/soup', REPORT_ERRORS.link.notFork],
		['link', `${ORIGIN}/${'a'.repeat(LINK_MAX)}`, REPORT_ERRORS.link.tooLong],
		['what', ' ', REPORT_ERRORS.what.missing],
		['what', 'x'.repeat(MAX_REPORT + 1), REPORT_ERRORS.what.tooLong],
		['contact', '', REPORT_ERRORS.contact.missing],
		['contact', 'me at example.com', REPORT_ERRORS.contact.invalid],
		['contact', 'me@example', REPORT_ERRORS.contact.invalid],
		['contact', `${'a'.repeat(CONTACT_MAX)}@example.com`, REPORT_ERRORS.contact.invalid]
	])('%s %j is refused inline, the input kept, nothing filed', async (field, value, message) => {
		const fields = { ...VALID, [field]: value };
		const result = await send(fields);
		expect(result).toMatchObject({
			status: 400,
			data: { code: 'invalid', error: message, errors: { [field]: message }, values: fields }
		});
		expect(m.fileLinkReport).not.toHaveBeenCalled();
	});

	test('every field wrong at once says so for each', async () => {
		const result = await send({ link: '', what: '', contact: '' });
		expect(result).toMatchObject({
			data: {
				errors: {
					link: REPORT_ERRORS.link.missing,
					what: REPORT_ERRORS.what.missing,
					contact: REPORT_ERRORS.contact.missing
				}
			}
		});
	});

	test('a filled honeypot gets the same thanks and stores nothing, even with fields wrong', async () => {
		for (const fields of [VALID, { link: '', what: '', contact: '' }]) {
			expect(await send({ ...fields, [REPORT_HONEYPOT]: 'https://spam.example' })).toEqual({
				sent: true
			});
		}
		expect(m.fileLinkReport).not.toHaveBeenCalled();
		expect(m.rateLimited).not.toHaveBeenCalled();
	});

	test.each([
		[null, 'linkReports', null],
		[COOK, 'reports', COOK.id]
	] as const)(
		'past the cap (%o) is a 429, the input kept, nothing filed',
		async (user, name, who) => {
			m.rateLimited.mockResolvedValueOnce(LIMITED);
			expect(await send(VALID, user)).toMatchObject({
				...LIMITED_FAILURE,
				data: { ...LIMITED_FAILURE.data, values: VALID }
			});
			expect(m.rateLimited).toHaveBeenCalledWith(name, who);
			expect(m.fileLinkReport).not.toHaveBeenCalled();
		}
	);
});
