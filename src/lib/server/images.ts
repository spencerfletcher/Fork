import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'recipe-images';

export type UploadedImage = { url: string; path: string };

/**
 * Stores a recipe photo under the user's folder at a fresh random path and
 * returns its public URL. Throws when Storage refuses; callers decide what a
 * failed upload means for the save.
 */
export async function uploadRecipeImage(
	supabase: SupabaseClient,
	userId: string,
	file: File
): Promise<UploadedImage> {
	const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
	const path = `${userId}/${crypto.randomUUID()}.${ext}`;
	const { error } = await supabase.storage
		.from(BUCKET)
		.upload(path, file, { contentType: file.type, upsert: false });
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
