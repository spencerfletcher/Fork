import { describe, test, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formOf, photoFile } from '#lib/testing/actions.js';
import {
	CAPS,
	CAP_MESSAGES,
	fieldOfMessage,
	PHOTO_MAX_BYTES,
	PHOTO_SIZE_MESSAGE,
	PHOTO_TYPE_MESSAGE
} from '#lib/recipes/validation.js';
import { PHOTO_UPLOAD_FAILED, readSubmission, storePhoto, uploadPhoto } from './submission';

const form = (fields: Record<string, string>, file?: File) => formOf(fields, file);

const VALID = { title: 'Soup', ingredients: '1 cup stock', steps: 'Heat.', servings: '4' };
const PHOTO = photoFile('soup.png');

/** Storage whose upload answers with `error`, and a public URL from the path. */
const storage = (error: unknown = null) =>
	({
		storage: {
			from: () => ({
				upload: vi.fn().mockResolvedValue({ error }),
				getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn/${path}` } })
			})
		}
	}) as unknown as SupabaseClient;

describe('readSubmission', () => {
	test('a valid form reads as its draft, content and settings', () => {
		const read = readSubmission(form({ ...VALID, visibility: 'friends' }));
		expect(read.ok).toBe(true);
		if (!read.ok) return;
		expect(read.draft.title).toBe('Soup');
		expect(read.content.title).toBe('Soup');
		expect(read.settings.visibility).toBe('friends');
	});

	test('invalid content is a 400 that hands the draft back', () => {
		const read = readSubmission(form({ ...VALID, title: '' }));
		expect(read.ok).toBe(false);
		if (read.ok) return;
		expect(read.failure.status).toBe(400);
		expect(read.failure.data.draft.ingredients).toBe(VALID.ingredients);
	});
});

describe('readSubmission: length caps on public text', () => {
	const chars = (n: number, c = 'a') => c.repeat(n);
	const tags = (n: number) => Array.from({ length: n }, (_, i) => `tag ${i}`);
	const refusal = (
		fields: Record<string, string | string[]>,
		before?: Parameters<typeof readSubmission>[1]
	) => {
		const read = readSubmission(form({ ...VALID, ...fields } as Record<string, string>), before);
		return read.ok ? null : read.failure.data.error;
	};
	// formOf takes arrays for repeated fields.
	const withTags = (names: string[]) => formOf({ ...VALID, tags: names });

	test('each cap holds its value, counted after trimming, and one more character is refused', () => {
		const at = {
			title: chars(CAPS.title),
			description: chars(CAPS.description),
			commitMessage: chars(CAPS.commitMessage)
		};
		expect(refusal({ ...at, title: `  ${at.title}  ` })).toBeNull();
		for (const field of ['title', 'description', 'commitMessage'] as const)
			expect(refusal({ ...at, [field]: chars(CAPS[field] + 1) })).toBe(CAP_MESSAGES[field]);
	});

	test('characters, not UTF-16 units: an emoji counts once', () => {
		expect(refusal({ title: chars(CAPS.title, '🍅') })).toBeNull();
	});

	test('a tag of the cap is kept, one longer refused; so with the number of tags', () => {
		const ok = readSubmission(withTags([chars(CAPS.tag), ...tags(CAPS.tags - 1)]));
		expect(ok.ok).toBe(true);
		const long = readSubmission(withTags([chars(CAPS.tag + 1)]));
		expect(long.ok ? null : long.failure.data.error).toBe(CAP_MESSAGES.tag);
		const many = readSubmission(withTags(tags(CAPS.tags + 1)));
		expect(many.ok ? null : many.failure.data.error).toBe(CAP_MESSAGES.tags);
	});

	test('an edit is never refused for what the recipe already has: its title, description and tags', () => {
		const before = {
			title: chars(CAPS.title + 5),
			description: chars(CAPS.description + 5),
			tagNames: [chars(CAPS.tag + 5), ...tags(CAPS.tags + 2)]
		};
		const read = readSubmission(
			formOf({
				...VALID,
				title: before.title,
				description: before.description,
				tags: before.tagNames.map((t) => t.toUpperCase())
			}),
			before
		);
		expect(read.ok).toBe(true);
		// A changed one is held to the cap, and the tags may not grow past it.
		expect(refusal({ title: before.title + 'b' }, before)).toBe(CAP_MESSAGES.title);
		const grown = readSubmission(withTags([...before.tagNames, 'one more']), before);
		expect(grown.ok ? null : grown.failure.data.error).toBe(CAP_MESSAGES.tags);
		const newLong = readSubmission(
			withTags([...before.tagNames.slice(1), chars(CAPS.tag + 1, 'z')]),
			before
		);
		expect(newLong.ok ? null : newLong.failure.data.error).toBe(CAP_MESSAGES.tag);
	});

	test('the title’s message shows under the title; the others show as the form’s own error', () => {
		expect(fieldOfMessage(CAP_MESSAGES.title)).toBe('title');
		for (const field of ['description', 'commitMessage', 'tag', 'tags'] as const)
			expect(fieldOfMessage(CAP_MESSAGES[field])).toBeUndefined();
	});
});

describe('uploadPhoto', () => {
	const draft = (formData: FormData) => {
		const read = readSubmission(formData);
		if (!read.ok) throw new Error('fixture must be valid');
		return read.draft;
	};

	test('no photo chosen uploads nothing', async () => {
		const formData = form(VALID);
		expect(await uploadPhoto(formData, storage(), 'user-1', draft(formData))).toEqual({
			ok: true,
			image: null
		});
	});

	test("a chosen photo is stored under the user's folder", async () => {
		const formData = form(VALID, PHOTO);
		const upload = await uploadPhoto(formData, storage(), 'user-1', draft(formData));
		expect(upload.ok && upload.image?.path).toMatch(/^user-1\/.+\.png$/);
	});

	test('a refused upload is a 400 that hands the draft back', async () => {
		const formData = form(VALID, PHOTO);
		const upload = await uploadPhoto(formData, storage('denied'), 'user-1', draft(formData));
		expect(upload.ok).toBe(false);
		if (upload.ok) return;
		expect(upload.failure.status).toBe(400);
		expect(upload.failure.data).toMatchObject({
			error: PHOTO_UPLOAD_FAILED,
			code: 'upload_failed',
			draft: { title: 'Soup', hadPhoto: true }
		});
	});
});

describe('storePhoto', () => {
	test('no photo chosen stores nothing', async () => {
		expect(await storePhoto(form({}), storage(), 'user-1')).toEqual({ ok: true, image: null });
	});

	test('a photo of exactly the cap is stored; one byte over is refused as invalid, before any upload', async () => {
		const at = photoFile('at.png', 'image/png', PHOTO_MAX_BYTES);
		expect(await storePhoto(form({}, at), storage(), 'user-1')).toMatchObject({ ok: true });
		const big = photoFile('big.png', 'image/png', PHOTO_MAX_BYTES + 1);
		const stored = await storePhoto(form({}, big), storage('never asked'), 'user-1');
		expect(stored).toEqual({ ok: false, code: 'invalid', error: PHOTO_SIZE_MESSAGE });
	});

	test('a file whose bytes are not a photo is refused as invalid, whatever type it claims', async () => {
		const page = new File(['<html><script>alert(1)</script>'], 'x.png', { type: 'image/png' });
		const stored = await storePhoto(form({}, page), storage('never asked'), 'user-1');
		expect(stored).toEqual({ ok: false, code: 'invalid', error: PHOTO_TYPE_MESSAGE });
	});

	test('a photo is stored as the type its bytes say', async () => {
		const jpeg = photoFile('holiday.png', 'image/jpeg');
		const stored = await storePhoto(form({}, jpeg), storage(), 'user-1');
		expect(stored.ok && stored.image?.path).toMatch(/\.jpg$/);
	});

	test('a refused upload says so, for the caller to shape', async () => {
		expect(await storePhoto(form({}, PHOTO), storage('denied'), 'user-1')).toEqual({
			ok: false,
			code: 'upload_failed',
			error: PHOTO_UPLOAD_FAILED
		});
	});
});
