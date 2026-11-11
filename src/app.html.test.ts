import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// The icons and the manifest app.html names are served from static/; a renamed
// or missing file is a 404 the browser shows as a blank tab icon.
const html = readFileSync(join(__dirname, 'app.html'), 'utf8');
const staticFile = (path: string) => join(__dirname, '..', 'static', path);

describe('app.html icons', () => {
	const linked = [...html.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)"[^>]*>/g)].map(
		(m) => m[0]
	);
	const href = (tag: string) => /href="%sveltekit\.assets%\/([^"]+)"/.exec(tag)![1];

	test('the SVG mark first, PNG fallbacks, a touch icon and the manifest', () => {
		expect(linked.map(href)).toEqual([
			'favicon.svg',
			'favicon-32.png',
			'favicon-16.png',
			'apple-touch-icon.png',
			'manifest.webmanifest'
		]);
		for (const tag of linked) expect(existsSync(staticFile(href(tag)))).toBe(true);
	});

	test("the manifest's icons exist, one maskable, and it does not install standalone", () => {
		const manifest = JSON.parse(readFileSync(staticFile('manifest.webmanifest'), 'utf8')) as {
			display: string;
			icons: { src: string; purpose?: string }[];
		};
		expect(manifest.display).toBe('browser');
		for (const icon of manifest.icons) expect(existsSync(staticFile(icon.src.slice(1)))).toBe(true);
		expect(manifest.icons.filter((i) => i.purpose === 'maskable')).toHaveLength(1);
	});
});
