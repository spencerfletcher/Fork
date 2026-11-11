import { describe, test, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formOf, photoFile } from '#lib/testing/actions.js';
import {
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
