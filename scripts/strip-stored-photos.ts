// Strips location and other metadata from photos already in the recipe-images
// bucket, the way every new upload is stripped (stripMetadata).
//   pnpm photos:strip[:prod]            dry run: lists what would change
//   pnpm photos:strip[:prod] --apply    re-uploads each stripped photo to its own path
// Env as the seed reads it (loadEnv: the local stack, or the hosted project
// with :prod, guarded by SUPABASE_PROJECT_ID), plus SUPABASE_SECRET_KEY, since
// writing past the bucket's policies needs it. A photo that cannot be walked
// is reported and left as it is. A CDN may serve old bytes until its cache expires.
import { createClient } from '@supabase/supabase-js';
import { PHOTO_TYPES } from '#lib/recipes/validation.js';
import { stripMetadata } from '#lib/server/images.js';
import { loadEnv, required, targetFromEnv } from '#lib/server/db/env.js';

const BUCKET = 'recipe-images';
const PAGE = 1000;
const apply = process.argv.includes('--apply');
const env = loadEnv(targetFromEnv());
const key = required('SUPABASE_SECRET_KEY');
console.log(`${apply ? 'Stripping' : 'Dry run against'} ${env.description}`);

const bucket = createClient(env.SUPABASE_URL, key, {
	auth: { autoRefreshToken: false, persistSession: false }
}).storage.from(BUCKET);
const TYPE_OF: Record<string, (typeof PHOTO_TYPES)[number]> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	gif: 'image/gif'
};

/** Every name under `prefix`, a page at a time; folders come back with a null id. */
async function list(prefix: string) {
	const all: { name: string; id: string | null }[] = [];
	for (let offset = 0; ; offset += PAGE) {
		const { data, error } = await bucket.list(prefix, { limit: PAGE, offset });
		if (error) throw error;
		all.push(...data);
		if (data.length < PAGE) return all;
	}
}

const counts = { stripped: 0, clean: 0, unreadable: 0, skipped: 0 };
// Uploads sit one folder deep, under their owner's id.
for (const folder of await list('')) {
	if (folder.id !== null) continue;
	for (const file of await list(folder.name)) {
		const path = `${folder.name}/${file.name}`;
		const type = TYPE_OF[file.name.split('.').pop()?.toLowerCase() ?? ''];
		if (!type) {
			counts.skipped++;
			console.log(`skip (not a photo type): ${path}`);
			continue;
		}
		const { data, error } = await bucket.download(path);
		if (error) throw error;
		const bytes = new Uint8Array(await data.arrayBuffer());
		const stripped = stripMetadata(bytes, type);
		if (!stripped) {
			counts.unreadable++;
			console.log(`unreadable, left as is: ${path}`);
			continue;
		}
		if (stripped.length === bytes.length && stripped.every((b, i) => b === bytes[i])) {
			counts.clean++;
			continue;
		}
		counts.stripped++;
		console.log(
			`${apply ? 'strip' : 'would strip'}: ${path} (${bytes.length} → ${stripped.length} bytes)`
		);
		if (apply) {
			const { error: upload } = await bucket.upload(path, new Blob([stripped], { type }), {
				contentType: type,
				upsert: true
			});
			if (upload) throw upload;
		}
	}
}
console.log(counts, apply ? '' : '(dry run: pass --apply to write)');
