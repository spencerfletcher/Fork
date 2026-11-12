import { describe, test, expect, vi } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PHOTO_TYPES } from '#lib/recipes/validation.js';
import { PHOTO_MAGIC, photoFile } from '#lib/testing/actions.js';
import {
	uploadRecipeImage,
	removeRecipeImage,
	imageFileFrom,
	imagePathOf,
	photoTypeOf,
	stripMetadata,
	UnreadablePhoto
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

// ─── Photo fixtures, byte by byte ─────────────────────────────────────────────

const bytesOf = (s: string) => [...s].map((c) => c.charCodeAt(0));
const cat = (...parts: (number[] | Uint8Array)[]) => new Uint8Array(parts.flatMap((p) => [...p]));
const has = (haystack: Uint8Array, needle: string) =>
	Buffer.from(haystack).includes(Buffer.from(needle, 'latin1'));

const GPS = 'GPS 51.5007N 0.1246W';

/** A JPEG segment: marker, big-endian length (counting itself), payload. */
const seg = (marker: number, payload: number[]) => {
	const len = payload.length + 2;
	return [0xff, marker, len >> 8, len & 0xff, ...payload];
};

/** An Exif APP1 payload: IFD0 with Orientation (when given) and, with `gps`, a GPS IFD holding it. */
function exif(order: 'II' | 'MM', orientation: number | null, gps?: string) {
	const u16 = (n: number) => (order === 'II' ? [n & 0xff, n >> 8] : [n >> 8, n & 0xff]);
	const u32 = (n: number) =>
		order === 'II'
			? [...u16(n & 0xffff), ...u16(n >>> 16)]
			: [...u16(n >>> 16), ...u16(n & 0xffff)];
	const entries: number[][] = [];
	if (orientation !== null)
		entries.push([...u16(0x0112), ...u16(3), ...u32(1), ...u16(orientation), 0, 0]);
	const gpsAt = 8 + 2 + 12 * (entries.length + (gps ? 1 : 0)) + 4;
	if (gps) entries.push([...u16(0x8825), ...u16(4), ...u32(1), ...u32(gpsAt)]);
	const ifd0 = [...u16(entries.length), ...entries.flat(), ...u32(0)];
	const gpsIfd = gps
		? [
				...u16(1),
				...u16(2),
				...u16(2),
				...u32(gps.length),
				...u32(gpsAt + 18),
				...u32(0),
				...bytesOf(gps)
			]
		: [];
	return [...bytesOf('Exif\0\0'), ...bytesOf(order), ...u16(42), ...u32(8), ...ifd0, ...gpsIfd];
}

const SOI = [0xff, 0xd8];
const JFIF = seg(0xe0, bytesOf('JFIF\0\x01\x02\0\0\x01\0\x01\0\0'));
const ICC = seg(0xe2, bytesOf('ICC_PROFILE\0\x01\x01 colour'));
const DQT = seg(0xdb, [0, ...Array.from({ length: 64 }, (_, i) => i)]);
// SOS onward, the compressed pixels and EOI: never touched.
const SCAN = [...seg(0xda, [1, 1, 0, 0, 0x3f, 0]), 0x12, 0xff, 0x00, 0x34, 0xff, 0xd9];

const jpeg = (...segments: number[][]) => cat(SOI, ...segments, SCAN);

/** A PNG chunk; its CRC is copied, never checked, so any four bytes stand in. */
const chunk = (type: string, data: number[]) => {
	const n = data.length;
	return [
		n >>> 24,
		(n >> 16) & 0xff,
		(n >> 8) & 0xff,
		n & 0xff,
		...bytesOf(type),
		...data,
		1,
		2,
		3,
		4
	];
};
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const IHDR = chunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]);
const IDAT = chunk('IDAT', [0x78, 0x9c, 0x63, 0x60, 0, 0, 0, 2, 0, 1]);
const IEND = chunk('IEND', []);

/** A RIFF chunk, odd payloads padded to even as the format requires. */
const riffChunk = (fourcc: string, data: number[]) => {
	const n = data.length;
	return [
		...bytesOf(fourcc),
		n & 0xff,
		(n >> 8) & 0xff,
		(n >> 16) & 0xff,
		n >>> 24,
		...data,
		...(n % 2 ? [0] : [])
	];
};
const webp = (...chunks: number[][]) => {
	const body = [...bytesOf('WEBP'), ...chunks.flat()];
	const n = body.length;
	return cat(bytesOf('RIFF'), [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, n >>> 24], body);
};
// VP8X flags: ICC 0x20, alpha 0x10, EXIF 0x08, XMP 0x04.
const vp8x = (flags: number) => riffChunk('VP8X', [flags, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const ICCP = riffChunk('ICCP', bytesOf('colour'));
const VP8 = riffChunk('VP8 ', [0x30, 0x01, 0x00, 0x9d, 0x01]); // odd: padded

describe('stripMetadata', () => {
	test('JPEG: Exif, XMP, IPTC and comments go; the orientation stays as a lone Exif tag; the rest is byte for byte', () => {
		const photo = jpeg(
			JFIF,
			seg(0xe1, exif('II', 6, GPS)),
			seg(0xe1, bytesOf('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>XMP place</x:xmpmeta>')),
			seg(0xed, bytesOf('Photoshop 3.0\x008BIM IPTC city')),
			seg(0xfe, bytesOf('a comment')),
			ICC,
			DQT
		);
		const out = stripMetadata(photo, 'image/jpeg');
		expect(out).toEqual(jpeg(JFIF, seg(0xe1, exif('II', 6)), ICC, DQT));
		expect(has(out!, GPS)).toBe(false);
		expect(has(photo, GPS)).toBe(true);
	});

	test('JPEG: a big-endian orientation is read and written back', () => {
		const out = stripMetadata(jpeg(seg(0xe1, exif('MM', 8, GPS)), DQT), 'image/jpeg');
		expect(out).toEqual(jpeg(seg(0xe1, exif('II', 8)), DQT));
	});

	test('JPEG: upright (1) or no orientation writes no Exif at all', () => {
		expect(stripMetadata(jpeg(seg(0xe1, exif('II', 1, GPS)), DQT), 'image/jpeg')).toEqual(
			jpeg(DQT)
		);
		expect(stripMetadata(jpeg(seg(0xe1, exif('II', null, GPS)), DQT), 'image/jpeg')).toEqual(
			jpeg(DQT)
		);
	});

	test('PNG: eXIf and the text and time chunks go; the rest is byte for byte, CRCs included', () => {
		const photo = cat(
			PNG_SIG,
			IHDR,
			chunk('eXIf', exif('MM', 6, GPS).slice(6)),
			chunk('tEXt', bytesOf('Comment\0Taken at home')),
			chunk('iTXt', bytesOf('XML:com.adobe.xmp\0\0\0\0\0<x:xmpmeta/>')),
			chunk('zTXt', bytesOf('Raw profile\0\0xx')),
			chunk('tIME', [7, 234, 11, 12, 9, 30, 0]),
			IDAT,
			IEND
		);
		const out = stripMetadata(photo, 'image/png');
		expect(out).toEqual(cat(PNG_SIG, IHDR, IDAT, IEND));
		expect(has(out!, GPS)).toBe(false);
	});

	test('WebP: EXIF and XMP chunks go, their VP8X flags clear and the RIFF size follows', () => {
		const photo = webp(
			vp8x(0x20 | 0x10 | 0x08 | 0x04),
			ICCP,
			VP8,
			riffChunk('EXIF', exif('II', 6, GPS).slice(6)),
			riffChunk('XMP ', bytesOf('<x:xmpmeta>place</x:xmpmeta>'))
		);
		const out = stripMetadata(photo, 'image/webp');
		expect(out).toEqual(webp(vp8x(0x20 | 0x10), ICCP, VP8));
		expect(has(out!, GPS)).toBe(false);
	});

	test('a simple WebP (no VP8X, so no metadata) and a GIF pass through unchanged', () => {
		const simple = webp(VP8);
		expect(stripMetadata(simple, 'image/webp')).toEqual(simple);
		const gif = cat(bytesOf('GIF89a'), [1, 0, 1, 0, 0, 0, 0, 0x3b]);
		expect(stripMetadata(gif, 'image/gif')).toEqual(gif);
	});

	test('every stripped photo is still the type its bytes say', async () => {
		const outs = {
			'image/jpeg': stripMetadata(jpeg(seg(0xe1, exif('II', 6, GPS))), 'image/jpeg'),
			'image/png': stripMetadata(cat(PNG_SIG, IHDR, IDAT, IEND), 'image/png'),
			'image/webp': stripMetadata(webp(vp8x(0x08), VP8, riffChunk('EXIF', [1])), 'image/webp')
		};
		for (const [type, out] of Object.entries(outs))
			expect(await photoTypeOf(new File([out!], 'x', { type }))).toBe(type);
	});

	// Its first bytes vouched for the type; a structure that cannot be walked
	// could hide anything, so it is refused rather than stored as if clean.
	test('a structure that cannot be walked is null', () => {
		const cases: [Uint8Array<ArrayBuffer>, (typeof PHOTO_TYPES)[number]][] = [
			[cat(SOI, [0xff, 0xe1, 0x40, 0x00, 1, 2]), 'image/jpeg'], // segment longer than the file
			[cat(SOI, [0x00, 0x00]), 'image/jpeg'], // no marker where one must be
			[cat(SOI, JFIF), 'image/jpeg'], // ends before any scan
			[cat(PNG_SIG, IHDR, [0, 0, 1, 0, ...bytesOf('IDAT'), 1]), 'image/png'], // chunk past the end
			[cat(PNG_SIG, IHDR, IDAT), 'image/png'], // no IEND
			[webp(vp8x(0x08), VP8).slice(0, 40), 'image/webp'], // chunk past the end
			[webp(riffChunk('ABCD', [1, 2])), 'image/webp'] // not a WebP image chunk first
		];
		for (const [bytes, type] of cases) expect(stripMetadata(bytes, type)).toBeNull();
	});
});

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
		expect(new Uint8Array(await (file as Blob).arrayBuffer())).toEqual(
			new Uint8Array(await png.arrayBuffer())
		);
		expect(options).toEqual({ contentType: 'image/png', upsert: false });
		expect(result).toEqual({ path, url: `https://cdn.test/recipe-images/${path}` });
	});

	test('what reaches Storage is the photo with its location stripped, never the upload as sent', async () => {
		const m = storageMock();
		const photo = jpeg(JFIF, seg(0xe1, exif('II', 6, GPS)), DQT);
		await uploadRecipeImage(m.supabase, 'user-1', new File([photo], 'a.jpg'), 'image/jpeg');
		const [, body] = m.upload.mock.calls[0];
		expect(new Uint8Array(await (body as Blob).arrayBuffer())).toEqual(
			jpeg(JFIF, seg(0xe1, exif('II', 6)), DQT)
		);
	});

	test('a photo whose structure cannot be walked is never uploaded', async () => {
		const m = storageMock();
		const broken = new File([cat(SOI, [0xff, 0xe1, 0x40, 0x00])], 'a.jpg');
		await expect(uploadRecipeImage(m.supabase, 'user-1', broken, 'image/jpeg')).rejects.toThrow(
			UnreadablePhoto
		);
		expect(m.upload).not.toHaveBeenCalled();
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
