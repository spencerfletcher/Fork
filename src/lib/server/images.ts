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

type Bytes = Uint8Array<ArrayBuffer>;

const join = (parts: Uint8Array[]): Bytes => {
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let at = 0;
	for (const p of parts) {
		out.set(p, at);
		at += p.length;
	}
	return out;
};
const fourcc = (b: Uint8Array, at: number) => String.fromCharCode(...b.subarray(at, at + 4));
const startsWith = (b: Uint8Array, at: number, s: string) =>
	[...s].every((c, i) => b[at + i] === c.charCodeAt(0));

// JPEG segments that carry who, where and when: APP1 (Exif, XMP), APP13 (IPTC), COM.
const JPEG_DROPPED = new Set([0xe1, 0xed, 0xfe]);
// PNG chunks that do: Exif, the three text kinds (XMP rides in iTXt), last-modified time.
const PNG_DROPPED = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME']);
const WEBP_DROPPED = new Set(['EXIF', 'XMP ']);
const VP8X_EXIF = 0x08;
const VP8X_XMP = 0x04;

/** The Exif Orientation in an APP1 payload ("Exif\0\0" then TIFF), or null when absent or unreadable. */
function exifOrientation(p: Uint8Array): number | null {
	if (!startsWith(p, 0, 'Exif\0\0')) return null;
	const t = 6;
	const le = startsWith(p, t, 'II');
	if (!le && !startsWith(p, t, 'MM')) return null;
	const view = new DataView(p.buffer, p.byteOffset, p.byteLength);
	const u16 = (at: number) => (at + 2 <= p.length ? view.getUint16(at, le) : null);
	const ifd = t + (p.length >= t + 8 ? view.getUint32(t + 4, le) : p.length);
	const count = u16(ifd) ?? 0;
	for (let i = 0; i < count; i++) {
		const e = ifd + 2 + 12 * i;
		// Orientation is tag 0x0112, a SHORT (type 3).
		if (u16(e) === 0x0112 && u16(e + 2) === 3) return u16(e + 8);
	}
	return null;
}

/** The smallest Exif APP1 segment that says only `orientation`: little-endian, IFD0 of one tag. */
function orientationSegment(orientation: number): Uint8Array {
	const tiff = [0x49, 0x49, 42, 0, 8, 0, 0, 0];
	const ifd0 = [1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, orientation & 0xff, orientation >> 8, 0, 0];
	const payload = [...[...'Exif\0\0'].map((c) => c.charCodeAt(0)), ...tiff, ...ifd0, 0, 0, 0, 0];
	const len = payload.length + 2;
	return new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff, ...payload]);
}

function stripJpeg(b: Bytes): Bytes | null {
	const parts: Uint8Array[] = [b.subarray(0, 2)];
	let at = 2;
	while (at + 4 <= b.length) {
		if (b[at] !== 0xff) return null;
		const marker = b[at + 1];
		// SOS: the compressed pixels follow, kept byte for byte to the end.
		// ponytail: an image embedded after EOI (MPF, gain maps) keeps its own
		// Exif; walk past EOI into it if phones are found to put GPS there.
		if (marker === 0xda) return join([...parts, b.subarray(at)]);
		const end = at + 2 + ((b[at + 2] << 8) | b[at + 3]);
		if (end > b.length || end < at + 4) return null;
		const segment = b.subarray(at, end);
		if (!JPEG_DROPPED.has(marker)) parts.push(segment);
		else if (marker === 0xe1) {
			// Without its Orientation a phone photo would show on its side, so an
			// Exif that turns the picture is replaced by one that only turns it.
			const orientation = exifOrientation(segment.subarray(4));
			if (orientation !== null && orientation >= 2 && orientation <= 8)
				parts.push(orientationSegment(orientation));
		}
		at = end;
	}
	return null;
}

function stripPng(b: Bytes): Bytes | null {
	const parts: Uint8Array[] = [b.subarray(0, 8)];
	const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
	let at = 8;
	while (at + 12 <= b.length) {
		const type = fourcc(b, at + 4);
		const end = at + 12 + view.getUint32(at);
		if (end > b.length) return null;
		// Each chunk carries its own CRC, so a kept one is copied whole.
		if (!PNG_DROPPED.has(type)) parts.push(b.subarray(at, end));
		if (type === 'IEND') return join([...parts, b.subarray(end)]);
		at = end;
	}
	return null;
}

function stripWebp(b: Bytes): Bytes | null {
	const first = fourcc(b, 12);
	// A simple file (VP8 or VP8L alone) has nowhere to keep metadata.
	if (first === 'VP8 ' || first === 'VP8L') return b;
	if (first !== 'VP8X' || b.length < 30) return null;
	const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
	if (view.getUint32(16, true) < 10) return null; // VP8X's payload is ten bytes
	const parts: Uint8Array[] = [b.subarray(0, 12)];
	let at = 12;
	while (at < b.length) {
		if (at + 8 > b.length) return null;
		const size = view.getUint32(at + 4, true);
		const end = at + 8 + size + (size % 2); // odd payloads are padded to even
		if (end > b.length) return null;
		if (!WEBP_DROPPED.has(fourcc(b, at))) parts.push(b.subarray(at, end));
		at = end;
	}
	const out = join(parts);
	const outView = new DataView(out.buffer);
	outView.setUint32(4, out.length - 8, true);
	out[20] &= ~(VP8X_EXIF | VP8X_XMP); // VP8X's flags byte, first in its payload
	return out;
}

/**
 * A photo with the metadata that can say where and when it was taken removed,
 * without re-encoding it: JPEG's Exif, XMP, IPTC and comments (a turned photo
 * keeps a lone Exif Orientation, so it still shows upright), PNG's eXIf, text
 * and time chunks, WebP's EXIF and XMP chunks. GIF has none and passes through.
 * The pixels are byte for byte the same. Null when the structure cannot be
 * walked: its first bytes vouched for the type, nothing after them.
 */
export function stripMetadata(bytes: Bytes, type: PhotoType): Bytes | null {
	if (type === 'image/jpeg') return stripJpeg(bytes);
	if (type === 'image/png') return stripPng(bytes);
	if (type === 'image/webp') return stripWebp(bytes);
	return bytes;
}

/** A photo `stripMetadata` could not walk, so it was not stored. */
export class UnreadablePhoto extends Error {
	constructor() {
		super('Photo could not be read');
	}
}

/**
 * Stores a recipe photo under the user's folder at a fresh random path, as
 * `type` (checked from its bytes) with its metadata stripped, and returns its
 * public URL. Throws `UnreadablePhoto` for a file that cannot be stripped, and
 * when Storage refuses; callers decide what a failed upload means for the save.
 */
export async function uploadRecipeImage(
	supabase: SupabaseClient,
	userId: string,
	file: File,
	type: PhotoType
): Promise<UploadedImage> {
	const stripped = stripMetadata(new Uint8Array(await file.arrayBuffer()), type);
	if (!stripped) throw new UnreadablePhoto();
	const path = `${userId}/${crypto.randomUUID()}.${PHOTO_FORMATS[type].ext}`;
	const { error } = await supabase.storage
		.from(BUCKET)
		.upload(path, new Blob([stripped], { type }), { contentType: type, upsert: false });
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
