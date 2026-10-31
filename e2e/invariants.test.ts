import { expect, test, type Locator, type Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';

// Site-wide invariants, one sweep per rule. The file runs in both projects:
// `chromium` (signed out) sweeps the public rows and `chromium-auth` (the seed
// user, who owns every seed recipe) the signed-in rows. The values are the
// rules DESIGN.md states; layout details live there, not here.

const COOKIES_RE = new RegExp(SEED[0].versions.at(-1)!.title, 'i');
const DESKTOP = [1280, 1024, 768];
const PHONE = 390;
const DOT_PNG = {
	name: 'dot.png',
	mimeType: 'image/png',
	buffer: Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
		'base64'
	)
};

const signedIn = () => test.info().project.name === 'chromium-auth';

/** Opens a page; may return a cleanup for anything it created. */
type Open = (page: Page) => Promise<void | (() => Promise<void>)>;

const goto =
	(url: string): Open =>
	async (page) => {
		await page.goto(url);
		await page.waitForLoadState('networkidle');
	};

async function cookiesPath(page: Page) {
	await page.goto('/recipes');
	return (await page.getByRole('link', { name: COOKIES_RE }).first().getAttribute('href'))!;
}

const cookies =
	(suffix: string): Open =>
	async (page) => {
		await goto((await cookiesPath(page)) + suffix)(page);
	};

const newWithPhoto: Open = async (page) => {
	await goto('/recipes/new')(page);
	await page.locator('input[name="image"]').setInputFiles(DOT_PNG);
};

const newWithTag: Open = async (page) => {
	await goto('/recipes/new')(page);
	await page.getByRole('combobox', { name: /tag/i }).focus();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
};

// A long unbroken title on a two-version recipe, for the compare page.
const longTitleCompare: Open = async (page) => {
	await goto('/recipes/new')(page);
	await page.locator('textarea[name="title"]').fill('E2E' + 'x'.repeat(57));
	await page.locator('input[name="servings"]').fill('4');
	await page.getByLabel('Ingredients').fill('2 cups flour');
	await page.getByLabel('Steps').fill('Mix all ingredients.');
	// Private, so the guest project's seed counts never see it.
	await page.getByLabel(/public/i).uncheck();
	await page.getByRole('button', { name: /create recipe/i }).click();
	await page.waitForURL(/\/recipes\/(?!new)/);
	const url = page.url().split('?')[0];
	await goto(`${url}/edit`)(page);
	await page.getByLabel('Steps').fill('Mix, then bake.');
	await page.getByRole('button', { name: 'Save', exact: true }).click();
	await page.waitForURL(url);
	await page.goto(`${url}/diff?from=1&to=2`);
	await page.locator('article.version-card').first().waitFor();
	return async () => {
		await page.evaluate(async (u) => {
			await fetch(`${u}/edit?/deleteRecipe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: ''
			});
		}, url);
	};
};

async function opened(page: Page, open: Open, check: () => Promise<void>) {
	const cleanup = await open(page);
	try {
		await check();
	} finally {
		if (cleanup) await cleanup();
	}
}

// ─── Targets: 24px at desktop, 44px below 700 ─────────────────────────────────

type Target = {
	name: string;
	auth?: boolean;
	open: Open;
	target: (page: Page) => Locator;
	/** Desktop widths to check at 24px; [] for a phone-only target. */
	desktop?: number[];
	/** Both dimensions, for a button rather than a line of text. */
	square?: boolean;
	/** Also 44px under a coarse pointer at a desktop width. */
	coarse?: boolean;
};

const TARGETS: Target[] = [
	{
		name: 'login switch link',
		open: goto('/login'),
		target: (p) => p.locator('.auth-switch').getByRole('link', { name: 'Create one' })
	},
	{
		name: 'signup switch link',
		open: goto('/signup'),
		target: (p) => p.locator('.auth-switch').getByRole('link', { name: 'Log in' })
	},
	{
		name: 'Clear search',
		open: goto('/search?q=zzzz'),
		target: (p) => p.getByRole('link', { name: 'Clear search' })
	},
	{
		name: 'Clear filters',
		open: goto('/search?q=zzzz&tags=dessert'),
		target: (p) => p.getByRole('link', { name: 'Clear filters' })
	},
	{
		name: 'compare back link',
		open: cookies('/diff?from=2&to=3'),
		target: (p) => p.locator('.compare .back-link')
	},
	{
		name: 'compare card numbers',
		open: cookies('/diff?from=2&to=3'),
		target: (p) => p.locator('a.version-card__number'),
		desktop: []
	},
	{
		name: 'Explore recipes',
		auth: true,
		open: goto('/favorites'),
		target: (p) => p.getByRole('link', { name: 'Explore recipes →' })
	},
	{
		name: 'tag pill remove',
		auth: true,
		open: newWithTag,
		target: (p) => p.getByRole('button', { name: /^Remove / }),
		square: true
	},
	{
		name: 'public checkbox row',
		auth: true,
		open: goto('/recipes/new'),
		target: (p) => p.locator('label:has(> input[name="isPublic"])'),
		coarse: true
	},
	{
		name: 'photo remover',
		auth: true,
		open: newWithPhoto,
		target: (p) => p.getByRole('button', { name: 'Remove photo' }),
		desktop: [],
		square: true,
		coarse: true
	},
	{
		name: 'editor back link',
		auth: true,
		open: cookies('/edit'),
		target: (p) => p.locator('.editor-header .back-link')
	}
	// recipe page: added in part 2
];

/** Every match's hit box: the element or its ::before, whichever is larger. */
const hits = (target: Locator) =>
	target.evaluateAll((els) =>
		els.map((el) => {
			const r = el.getBoundingClientRect();
			const b = getComputedStyle(el, '::before');
			const grown = b.content !== 'none' && b.position === 'absolute';
			return {
				width: Math.max(r.width, grown ? parseFloat(b.width) || 0 : 0),
				height: Math.max(r.height, grown ? parseFloat(b.height) || 0 : 0)
			};
		})
	);

async function expectTargets(row: Target, page: Page, min: number) {
	const boxes = await hits(row.target(page));
	expect(boxes.length, row.name).toBeGreaterThan(0);
	for (const box of boxes) {
		expect(box.height, row.name).toBeGreaterThanOrEqual(min);
		if (row.square) expect(box.width, row.name).toBeGreaterThanOrEqual(min);
	}
}

test.describe('Targets', () => {
	for (const row of TARGETS) {
		test(`${row.name} is 24px at desktop and 44px on a phone`, async ({ page }) => {
			test.skip(!!row.auth !== signedIn());
			await page.setViewportSize({ width: 1280, height: 900 });
			await opened(page, row.open, async () => {
				for (const width of row.desktop ?? DESKTOP) {
					await page.setViewportSize({ width, height: 900 });
					await expectTargets(row, page, 24);
				}
				await page.setViewportSize({ width: PHONE, height: 900 });
				await expectTargets(row, page, 44);
			});
		});
	}
});

test.describe('Targets under a coarse pointer', () => {
	test.use({ hasTouch: true });
	for (const row of TARGETS.filter((r) => r.coarse)) {
		test(`${row.name} is 44px at a desktop width`, async ({ page }) => {
			test.skip(!!row.auth !== signedIn());
			await page.setViewportSize({ width: 1280, height: 900 });
			await opened(page, row.open, async () => {
				expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
				await expectTargets(row, page, 44);
			});
		});
	}
});

// ─── No horizontal scroll at 390 ──────────────────────────────────────────────

type Screen = { name: string; auth?: boolean; open: Open };

const PAGES: Screen[] = [
	{ name: 'landing', open: goto('/') },
	{ name: 'recipes', open: goto('/recipes') },
	{ name: 'tag page', open: goto('/tags/dessert') },
	{ name: 'search', open: goto('/search?tags=dessert') },
	{ name: 'login', open: goto('/login') },
	{ name: 'signup', open: goto('/signup') },
	{ name: 'compare', open: cookies('/diff?from=2&to=3') },
	{ name: 'feed', auth: true, open: goto('/') },
	{ name: 'my recipes', auth: true, open: goto('/recipes') },
	{ name: 'favorites', auth: true, open: goto('/favorites') },
	{ name: 'new recipe', auth: true, open: goto('/recipes/new') },
	{ name: 'edit recipe', auth: true, open: cookies('/edit') },
	{ name: 'profile', auth: true, open: goto('/users/spencerfletcher') },
	{ name: 'compare with a long unbroken title', auth: true, open: longTitleCompare }
	// recipe page: added in part 2
];

test.describe('No horizontal scroll', () => {
	for (const row of PAGES) {
		test(`${row.name} does not scroll sideways at ${PHONE}`, async ({ page }) => {
			test.skip(!!row.auth !== signedIn());
			await page.setViewportSize({ width: PHONE, height: 900 });
			await opened(page, row.open, async () => {
				const doc = await page.evaluate(() => ({
					scrollWidth: document.documentElement.scrollWidth,
					clientWidth: document.documentElement.clientWidth
				}));
				expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
			});
		});
	}
});

// ─── Focus ring visible and unobscured ────────────────────────────────────────

type Focus = Screen & {
	/** The element to focus; without one, the page's first Tab stop. */
	target?: (page: Page) => Locator;
	widths?: number[];
};

const FOCUS: Focus[] = [
	// The long-title page is a write; its ring is any other compare page's.
	...PAGES.filter((p) => p.open !== longTitleCompare),
	{
		name: 'current tag tab',
		open: goto('/recipes'),
		target: (p) =>
			p.getByRole('navigation', { name: 'Browse by tag' }).getByRole('link', { name: 'All' })
	},
	{
		name: 'pressed filter',
		open: goto('/search?tags=dessert'),
		target: (p) =>
			p.getByRole('group', { name: 'Filter by tag' }).getByRole('button', { name: 'Dessert' }),
		widths: [1280, PHONE]
	}
];

test.describe('Focus ring', () => {
	for (const row of FOCUS) {
		const what = row.target ? row.name : `the first Tab on ${row.name}`;
		test(`${what} shows a whole, unobscured ring`, async ({ page }) => {
			test.skip(!!row.auth !== signedIn());
			for (const width of row.widths ?? [1280]) {
				await page.setViewportSize({ width, height: 900 });
				await opened(page, row.open, async () => {
					if (row.target) await row.target(page).focus();
					else await page.keyboard.press('Tab');
					const ring = await page.evaluate(() => {
						const el = document.activeElement!;
						const s = getComputedStyle(el);
						const out = parseFloat(s.outlineOffset) + parseFloat(s.outlineWidth);
						const r = el.getBoundingClientRect();
						const box = {
							top: r.top - out,
							bottom: r.bottom + out,
							left: r.left - out,
							right: r.right + out
						};
						// Every ancestor that clips, and the viewport, must hold the ring.
						const clips: string[] = [];
						const fits = (c: { top: number; bottom: number; left: number; right: number }) =>
							box.top >= c.top &&
							box.bottom <= c.bottom &&
							box.left >= c.left &&
							box.right <= c.right;
						if (!fits({ top: 0, bottom: innerHeight, left: 0, right: innerWidth }))
							clips.push('viewport');
						for (let a = el.parentElement; a; a = a.parentElement) {
							const o = getComputedStyle(a);
							if (o.overflowX !== 'visible' || o.overflowY !== 'visible') {
								if (a === document.documentElement || a === document.body) continue;
								if (!fits(a.getBoundingClientRect())) clips.push(a.className || a.tagName);
							}
						}
						const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
						return {
							focusVisible: el.matches(':focus-visible'),
							style: s.outlineStyle,
							width: parseFloat(s.outlineWidth),
							clips,
							onTop: !!hit && (hit === el || el.contains(hit))
						};
					});
					expect(ring).toEqual({
						focusVisible: true,
						style: 'solid',
						width: 2,
						clips: [],
						onTop: true
					});
				});
			}
		});
	}
});

// ─── Forced colours keep the marks ────────────────────────────────────────────

type Mark = Screen & {
	mark: (page: Page) => Locator;
	/** What must survive: an underline, a drawn border, or the element itself. */
	kind: 'underline' | 'border' | 'visible';
	widths?: number[];
};

const MARKS: Mark[] = [
	{
		name: 'the current navbar link',
		open: goto('/recipes'),
		mark: (p) => p.locator('nav a.navbar-link[aria-current="page"]'),
		kind: 'underline'
	},
	{
		name: 'the current tag tab',
		open: goto('/recipes'),
		mark: (p) =>
			p.getByRole('navigation', { name: 'Browse by tag' }).getByRole('link', { name: 'All' }),
		kind: 'border'
	},
	{
		name: 'a pressed filter',
		open: goto('/search?tags=dessert'),
		mark: (p) =>
			p.getByRole('group', { name: 'Filter by tag' }).getByRole('button', { name: 'Dessert' }),
		kind: 'border'
	},
	{
		name: 'the primary button box',
		open: cookies('/diff?from=1&to=999'),
		mark: (p) => p.getByRole('link', { name: 'Compare first and latest' }),
		kind: 'border'
	},
	{
		name: 'the picker caret',
		open: cookies('/diff?from=2&to=3'),
		mark: (p) => p.locator('.picker__caret').first(),
		kind: 'visible',
		widths: [1280, PHONE]
	}
];

test.describe('Forced colours', () => {
	for (const row of MARKS) {
		test(`${row.name} keeps its mark`, async ({ page }) => {
			test.skip(!!row.auth !== signedIn());
			await page.emulateMedia({ forcedColors: 'active' });
			for (const width of row.widths ?? [1280]) {
				await page.setViewportSize({ width, height: 900 });
				await opened(page, row.open, async () => {
					const mark = row.mark(page);
					await expect(mark).toBeVisible();
					if (row.kind === 'visible') return;
					const drawn = await mark.evaluate((el, kind) => {
						const s = getComputedStyle(el);
						if (kind === 'underline') return s.textDecorationLine.includes('underline');
						const canvas = getComputedStyle(document.body).backgroundColor;
						return (
							s.borderBottomStyle !== 'none' &&
							parseFloat(s.borderBottomWidth) >= 1 &&
							s.borderBottomColor !== canvas
						);
					}, row.kind);
					expect(drawn).toBe(true);
				});
			}
		});
	}
});

// ─── iOS: fields at 16px on a phone, so focus does not zoom ───────────────────

type Field = Screen & { field: (page: Page) => Locator };

const FIELDS: Field[] = [
	{ name: 'the search box', open: goto('/search'), field: (p) => p.getByRole('searchbox') },
	{ name: 'the login email', open: goto('/login'), field: (p) => p.locator('input[type="email"]') },
	{
		name: 'the compare picker',
		open: cookies('/diff?from=2&to=3'),
		field: (p) => p.locator('#from-select')
	},
	{
		name: 'the editor title',
		auth: true,
		open: goto('/recipes/new'),
		field: (p) => p.locator('textarea[name="title"]')
	}
	// recipe page: added in part 2
];

test.describe('iOS field size', () => {
	for (const row of FIELDS) {
		test(`${row.name} is 16px on a phone`, async ({ page }) => {
			test.skip(!!row.auth !== signedIn());
			await page.setViewportSize({ width: PHONE, height: 900 });
			await opened(page, row.open, async () => {
				expect(await row.field(page).evaluate((el) => getComputedStyle(el).fontSize)).toBe('16px');
			});
		});
	}
});
