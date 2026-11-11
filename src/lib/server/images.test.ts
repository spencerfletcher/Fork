import { describe, test, expect, vi } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PHOTO_TYPES } from '#lib/recipes/validation.js';
import { PHOTO_MAGIC, photoFile } from '#lib/testing/actions.js';
import {
	uploadRecipeImage,
	removeRecipeImage,
	imageFileFrom,
	imagePathOf,
	photoTypeOf
} from './images';

/** A Supabase client whose storage bucket records calls and answers as told. */
function storageMock(
	opts: { uploadError?: { message: string }; removeError?: { message: string } } = {}
) {
	const upload = vi.fn().mockResolvedValue({ error: opts.uploadError ?? null });
	const remove = vi.fn().mockResolvedValue({ error: opts.removeError ?? null });
	const getPublicUrl = vi.fn((path: string) => ({
		data: { publicUrl: `https://cdn.test/recipe-images/${path}` }
	}));
	const from = vi.fn().mockReturnValue({ upload, remove, getPublicUrl });
	const supabase = { storage: { from } } as unknown as SupabaseClient;
	return { supabase, from, upload, remove, getPublicUrl };
}

const png = photoFile('Dinner Photo.PNG');

describe('photoTypeOf', () => {
	test.each(PHOTO_TYPES)(
		'%s is read from its bytes, whatever the browser called it',
		async (type) => {
			const bytes = new Uint8Array(16);
			bytes.set(PHOTO_MAGIC[type]);
			expect(await photoTypeOf(new File([bytes], 'x.bin', { type: 'image/png' }))).toBe(type);
		}
	);

	test('anything else is no photo: text, an SVG, a short file, a RIFF that is not WebP', async () => {
		const riff = new Uint8Array(16);
		riff.set([...'RIFF\0\0\0\0WAVE'].map((c) => c.charCodeAt(0)));
		for (const body of ['x', '<svg xmlns="http://www.w3.org/2000/svg"/>', '<html>', riff])
			expect(await photoTypeOf(new File([body], 'a.png', { type: 'image/png' }))).toBeNull();
		expect(await photoTypeOf(new File([new Uint8Array([0xff, 0xd8])], 'a.jpg'))).toBeNull();
	});
});

describe('uploadRecipeImage', () => {
	test("uploads under the user's folder with its type's extension and returns the public url", async () => {
		const m = storageMock();
		const result = await uploadRecipeImage(m.supabase, 'user-1', png, 'image/png');
		expect(m.from).toHaveBeenCalledWith('recipe-images');
		const [path, file, options] = m.upload.mock.calls[0];
		expect(path).toMatch(/^user-1\/[A-Za-z0-9_-]+\.png$/);
		expect(file).toBe(png);
		expect(options).toEqual({ contentType: 'image/png', upsert: false });
		expect(result).toEqual({ path, url: `https://cdn.test/recipe-images/${path}` });
	});

	test('the extension and content type are the checked type, never the name the browser sent', async () => {
		const m = storageMock();
		await uploadRecipeImage(
			m.supabase,
			'user-1',
			photoFile('page.html', 'image/webp'),
			'image/webp'
		);
		const [path, , options] = m.upload.mock.calls[0];
		expect(path).toMatch(/^user-1\/[A-Za-z0-9_-]+\.webp$/);
		expect(options).toEqual({ contentType: 'image/webp', upsert: false });
	});

	test('throws when storage reports an error', async () => {
		const m = storageMock({ uploadError: { message: 'bucket full' } });
		await expect(uploadRecipeImage(m.supabase, 'user-1', png, 'image/png')).rejects.toThrow(
			'Photo upload failed'
		);
	});
});

describe('removeRecipeImage', () => {
	test('removes the given path from the bucket', async () => {
		const m = storageMock();
		await removeRecipeImage(m.supabase, 'user-1/abc.png');
		expect(m.remove).toHaveBeenCalledWith(['user-1/abc.png']);
	});

	test('removes several paths in one call', async () => {
		const m = storageMock();
		await removeRecipeImage(m.supabase, 'user-1/a.png', 'user-1/b.png');
		expect(m.remove).toHaveBeenCalledTimes(1);
		expect(m.remove).toHaveBeenCalledWith(['user-1/a.png', 'user-1/b.png']);
	});

	test('swallows and logs a storage error', async () => {
		const m = storageMock({ removeError: { message: 'gone' } });
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		await expect(removeRecipeImage(m.supabase, 'user-1/abc.png')).resolves.toBeUndefined();
		expect(error).toHaveBeenCalledWith(
			'Could not remove unused upload',
			'user-1/abc.png',
			expect.objectContaining({ message: 'gone' })
		);
		error.mockRestore();
	});
});

describe('imageFileFrom', () => {
	test('returns the file when one was chosen', () => {
		const fd = new FormData();
		fd.append('image', png);
		expect(imageFileFrom(fd)).toBe(png);
	});

	test('ignores an empty file input and a missing field', () => {
		const fd = new FormData();
		fd.append('image', new File([], '', { type: 'application/octet-stream' }));
		expect(imageFileFrom(fd)).toBeNull();
		expect(imageFileFrom(new FormData())).toBeNull();
	});
});

describe('imagePathOf', () => {
	// The URL the real client writes into imageUrl, so the reader is pinned to the writer.
	const real = createClient('http://127.0.0.1:54321', 'anon-key');
	const stored = (path: string) =>
		real.storage.from('recipe-images').getPublicUrl(path).data.publicUrl;

	test('reads the storage path back out of a public url the client wrote', () => {
		expect(imagePathOf(stored('user-1/abc.png'))).toBe('user-1/abc.png');
	});

	test('is null for a photo that is not in the bucket', () => {
		expect(imagePathOf('https://images.example.com/cake.jpg')).toBeNull();
	});
});
