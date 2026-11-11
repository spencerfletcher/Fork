import type { SupabaseClient } from '@supabase/supabase-js';
import type { PHOTO_TYPES } from '#lib/recipes/validation.js';

const BUCKET = 'recipe-images';

export type UploadedImage = { url: string; path: string };

type PhotoType = (typeof PHOTO_TYPES)[number];

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

// How each photo type's file starts (null: any byte), and what it is stored as.
const PHOTO_FORMATS: Record<PhotoType, { magic: (number | null)[]; ext: string }> = {
	'image/jpeg': { magic: [0xff, 0xd8, 0xff], ext: 'jpg' },
	'image/png': { magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], ext: 'png' },
	'image/gif': { magic: ascii('GIF8'), ext: 'gif' },
	'image/webp': { magic: [...ascii('RIFF'), null, null, null, null, ...ascii('WEBP')], ext: 'webp' }
};

/** The photo type a file's first bytes say it is, or null: the browser's type is only a claim. */
export async function photoTypeOf(file: File): Promise<PhotoType | null> {
	const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
	const types = Object.keys(PHOTO_FORMATS) as PhotoType[];
	return (
		types.find((type) =>
			PHOTO_FORMATS[type].magic.every((byte, i) => i < head.length && (byte ?? head[i]) === head[i])
		) ?? null
	);
}

/**
 * Stores a recipe photo under the user's folder at a fresh random path, as
 * `type` (checked from its bytes), and returns its public URL. Throws when
 * Storage refuses; callers decide what a failed upload means for the save.
 */
export async function uploadRecipeImage(
	supabase: SupabaseClient,
	userId: string,
	file: File,
	type: PhotoType
): Promise<UploadedImage> {
	const path = `${userId}/${crypto.randomUUID()}.${PHOTO_FORMATS[type].ext}`;
	const { error } = await supabase.storage
		.from(BUCKET)
		.upload(path, file, { contentType: type, upsert: false });
	if (error) throw new Error('Photo upload failed');
	const {
		data: { publicUrl }
	} = supabase.storage.from(BUCKET).getPublicUrl(path);
	return { url: publicUrl, path };
}

/**
 * Best-effort cleanup of photos nothing uses any more: an upload a failed save
 * did not keep, or a deleted recipe's. Storage is outside the database
 * transaction, so this can fail after the database work succeeded; that leaves
 * an orphaned file, which is logged, never surfaced.
 */
export async function removeRecipeImage(
	supabase: SupabaseClient,
	...paths: string[]
): Promise<void> {
	const { error } = await supabase.storage.from(BUCKET).remove(paths);
	if (error) console.error('Could not remove unused upload', paths.join(', '), error);
}

// Every public url the client hands out has this path, after the project's host.
const PUBLIC_PATH = `/storage/v1/object/public/${BUCKET}/`;

/** The bucket path a stored imageUrl points at, or null for a photo hosted anywhere else. */
export function imagePathOf(url: string): string | null {
	const at = url.indexOf(PUBLIC_PATH);
	return at === -1 ? null : url.slice(at + PUBLIC_PATH.length);
}

/** The chosen photo from a multipart form, or null when the input was left empty. */
export function imageFileFrom(formData: FormData): File | null {
	const file = formData.get('image');
	return file instanceof File && file.size > 0 ? file : null;
}
