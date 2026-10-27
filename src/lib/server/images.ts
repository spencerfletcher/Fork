import type { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

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
	const path = `${userId}/${nanoid()}.${ext}`;
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
 * Best-effort cleanup of an upload the save did not end up using. Storage is
 * outside the database transaction, so this can fail after the rollback
 * succeeded; that leaves an orphaned file, which is logged, never surfaced.
 */
export async function removeRecipeImage(supabase: SupabaseClient, path: string): Promise<void> {
	const { error } = await supabase.storage.from(BUCKET).remove([path]);
	if (error) console.error('Could not remove unused upload', path, error);
}

/** The chosen photo from a multipart form, or null when the input was left empty. */
export function imageFileFrom(formData: FormData): File | null {
	const file = formData.get('image');
	return file instanceof File && file.size > 0 ? file : null;
}
