import { describe, test, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadRecipeImage, removeRecipeImage, imageFileFrom } from './images';

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

const png = new File(['x'], 'Dinner Photo.PNG', { type: 'image/png' });

describe('uploadRecipeImage', () => {
	test("uploads under the user's folder with the file's extension and returns the public url", async () => {
		const m = storageMock();
		const result = await uploadRecipeImage(m.supabase, 'user-1', png);
		expect(m.from).toHaveBeenCalledWith('recipe-images');
		const [path, file, options] = m.upload.mock.calls[0];
		expect(path).toMatch(/^user-1\/[A-Za-z0-9_-]+\.png$/);
		expect(file).toBe(png);
		expect(options).toEqual({ contentType: 'image/png', upsert: false });
		expect(result).toEqual({ path, url: `https://cdn.test/recipe-images/${path}` });
	});

	test('throws when storage reports an error', async () => {
		const m = storageMock({ uploadError: { message: 'bucket full' } });
		await expect(uploadRecipeImage(m.supabase, 'user-1', png)).rejects.toThrow(
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
