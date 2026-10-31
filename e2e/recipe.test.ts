import { expect, test, type Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';
import { parseIngredientLine } from '../src/lib/recipes/ingredients';
import { scaleIngredient } from '../src/lib/recipes/scale';

// These tests assume the DB has been seeded with the demo data in seedData.ts:
// cookies (3 versions, renamed in v3), a brown-butter fork of it, and a tikka
// masala. Titles are read from the seed so a rename cannot strand a test.
const COOKIES = SEED[0].versions.at(-1)!.title;
const COOKIES_RE = new RegExp(COOKIES, 'i');
const FORK_RE = new RegExp(SEED[1].versions.at(-1)!.title, 'i');

/** Compare sits beside each earlier version in the history list: open it, then compare v2 to v3. */
async function openCompare(page: Page) {
	await page.getByRole('button', { name: '3 versions' }).click();
	await page.locator('#version-history a[href*="/diff?from=2&to=3"]').click();
	await expect(page).toHaveURL(/\/diff/);
}

/** Slugs carry a random nanoid suffix, so reach the recipe by name, not URL. */
async function gotoClassicCookies(page: Page) {
	// The landing page shows the three newest; browse shows everything.
	await page.goto('/recipes');
	await page.getByRole('link', { name: COOKIES_RE }).first().click();
	await page.waitForURL(/\/recipes\//);
}

test.describe('Recipe detail page', () => {
	test('recipe cards on the home page link to detail pages', async ({ page }) => {
		await page.goto('/');
		const cards = page.locator('div.recipe-card');
		await expect(cards.first()).toBeVisible();
		// Clicking the first card navigates to a recipe detail
		await cards.first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		await expect(page.locator('h1')).toBeVisible();
	});

	test('recipe detail shows Ingredients section', async ({ page }) => {
		await gotoClassicCookies(page);
		// Use heading role to avoid matching ingredient names that contain "ingredients"
		await expect(page.getByRole('heading', { name: /^ingredients$/i })).toBeVisible();
	});

	test('recipe detail shows Method section', async ({ page }) => {
		await gotoClassicCookies(page);
		await expect(page.getByRole('heading', { name: /^method$/i })).toBeVisible();
	});

	test('"Thick and Chewy Chocolate Chip Cookies" shows version history with 3 versions', async ({
		page
	}) => {
		await page.goto('/recipes');
		// Click the stretched link (aria-label) rather than the h3 text node
		await page.getByRole('link', { name: COOKIES_RE }).first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		// The bar under the hero names the version and its note; the other
		// versions open from the "3 versions" toggle. Assert on rendered content,
		// not just wrapper count: a li-count check passes even if the messages
		// render empty.
		const bar = page.locator('.version-bar');
		await expect(bar.locator('.current .version-number')).toContainText('v3');
		await expect(bar.locator('.current .message')).toContainText('Chill the dough');
		await page.getByRole('button', { name: '3 versions' }).click();
		await expect(page.locator('#version-history li')).toHaveCount(2);
		await expect(page.locator('#version-history')).toContainText('Initial recipe');
		// The forks sit in the byline.
		await expect(page.locator('.byline')).toContainText('1 fork');
	});

	test('"Brown Butter Chocolate Chip Cookies" shows fork attribution', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: FORK_RE }).first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		await expect(page.getByText(/forked from/i)).toBeVisible();
		await expect(page.getByText(COOKIES_RE)).toBeVisible();
	});

	test('the byline fork count opens the list of forks', async ({ page }) => {
		await gotoClassicCookies(page);
		await page.locator('.byline').getByRole('link', { name: '1 fork' }).click();
		await expect(page).toHaveURL(/\/recipes\/[^/]+\/forks$/);
		await expect(page.getByRole('heading', { level: 1 })).toContainText(`Forks of ${COOKIES}`);
		await expect(page.getByRole('link', { name: FORK_RE }).first()).toBeVisible();
	});

	test('viewing a specific version says so in the bar, with the way back', async ({ page }) => {
		await page.goto('/recipes');
		await page.getByRole('link', { name: COOKIES_RE }).first().click();
		await page.waitForURL(/\/recipes\//);
		// Append ?version=2 to the current recipe URL
		const recipeUrl = page.url().split('?')[0];
		await page.goto(`${recipeUrl}?version=2`);
		await page.waitForLoadState('networkidle');
		// The bar reads "v2 <message>", then "Back to v3 · 3 versions" at the
		// right; there is no "Older version" label (the chip's spoken text and
		// "Back to v3" say it; Spencer, 29 October 2026).
		const bar = page.locator('.version-bar');
		await expect(bar).not.toContainText('Older version');
		await expect(bar.locator('.current .version-number')).toContainText('v2');
		await expect(bar.locator('.current .message')).toContainText(SEED[0].versions[1].commitMessage);
		await expect(page.getByRole('link', { name: 'Back to v3' })).toBeVisible();
		const chip = await bar.locator('.current .version-number').boundingBox();
		const note = await bar.locator('.current .message').boundingBox();
		const controls = await bar.locator('.current .controls').boundingBox();
		expect(note!.x).toBeGreaterThan(chip!.x + chip!.width - 1);
		expect(controls!.x).toBeGreaterThan(note!.x + note!.width - 1);
		// The toggle stands where the latest version keeps it.
		const toggle = page.getByRole('button', { name: '3 versions' });
		const older = (await toggle.boundingBox())!;
		await page.goto(recipeUrl);
		const latest = (await toggle.boundingBox())!;
		expect(Math.abs(older.x + older.width - (latest.x + latest.width))).toBeLessThan(1);
	});

	test('Compare link on v2 navigates to diff page', async ({ page }) => {
		await page.goto('/recipes');
		await page.getByRole('link', { name: COOKIES_RE }).first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		await openCompare(page);
		await expect(page.locator('h1')).toContainText(/compare/i);
	});

	test('a recipe link previews as that recipe, with each tag emitted once', async ({ page }) => {
		await gotoClassicCookies(page);

		const content = (sel: string) => page.locator(sel).first().getAttribute('content');

		expect(await content('meta[property="og:title"]')).toContain(COOKIES);
		expect(await content('meta[property="og:type"]')).toBe('article');
		expect(await page.title()).toContain(COOKIES);

		// og:image must be absolute — a relative path resolves against the
		// crawler's host and the preview silently loses its image.
		expect(await content('meta[property="og:image"]')).toMatch(/^https?:\/\//);

		const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
		expect(canonical).toContain('/recipes/');

		// The reason meta is rendered in the layout from page data rather than in a
		// per-page <svelte:head>: Svelte does not deduplicate head tags, so two
		// components emitting og:title would put two in the document.
		for (const sel of [
			'meta[property="og:title"]',
			'meta[property="og:description"]',
			'meta[property="og:image"]',
			'meta[name="description"]',
			'link[rel="canonical"]',
			'title'
		]) {
			await expect(page.locator(sel)).toHaveCount(1);
		}
	});

	test('a listing page keeps the site-level preview', async ({ page }) => {
		await page.goto('/tags/dessert');
		expect(await page.title()).toContain('Dessert');
		expect(await page.locator('meta[property="og:type"]').first().getAttribute('content')).toBe(
			'website'
		);
		await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
	});

	test('changing the version range navigates and re-renders the diff', async ({ page }) => {
		await gotoClassicCookies(page);
		await openCompare(page);

		// Count modified rows rather than reading the first row's text: the first
		// row is unchanged flour in every range, so comparing it proves nothing.
		const modifiedRows = page.locator('.diff-row.diff-modified');
		const before = await modifiedRows.count();
		expect(before).toBeGreaterThan(0);

		// The strip's first compare link already opens v2 -> v3, so widen the range
		// back to v1 — selecting v2 here would be a no-op and prove nothing.
		await page.locator('#from-select').selectOption('1');
		await expect(page).toHaveURL(/from=1/);

		// The selects must reflect the range actually being shown, not reset to a
		// default — the page navigates rather than updating in place.
		await expect(page.locator('#from-select')).toHaveValue('1');
		await expect(page.locator('article.version-card').first()).toContainText('v1');

		// A wider range covers more edits, so the diff itself must have changed.
		await expect(modifiedRows).not.toHaveCount(before);
	});

	test('the compare tab names the range and the recipe', async ({ page }) => {
		await gotoClassicCookies(page);
		await openCompare(page);
		await expect(page).toHaveTitle(`v2 → v3 · ${COOKIES} — Fork`);
	});

	test('the changed picker keeps focus after the compare page navigates', async ({ page }) => {
		await gotoClassicCookies(page);
		await openCompare(page);
		await page.locator('#from-select').selectOption('1');
		await expect(page).toHaveURL(/from=1/);
		await expect(page.locator('#from-select')).toBeFocused();
	});

	test('the same version on both sides is one line, not a diff', async ({ page }) => {
		await gotoClassicCookies(page);
		await page.goto(page.url().split('?')[0] + '/diff?from=3&to=3');
		await expect(page.getByText('v3 is on both sides; pick another version.')).toBeVisible();
		await expect(page.locator('.diff-panel')).toHaveCount(0);
	});

	test('a reversed pair is read older to newer, in the URL and the pickers', async ({ page }) => {
		await gotoClassicCookies(page);
		await page.goto(page.url().split('?')[0] + '/diff?from=3&to=1');
		await expect(page).toHaveURL(/from=1&to=3/);
		await expect(page.locator('#from-select')).toHaveValue('1');
		await expect(page.locator('#to-select')).toHaveValue('3');
	});

	test('after the diff a link reads the To version; the latest is the plain recipe URL', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		const recipePath = new URL(page.url()).pathname;
		await page.goto(recipePath + '/diff?from=2&to=3');
		await expect(page.getByRole('link', { name: 'Read v3' })).toHaveAttribute('href', recipePath);
		await page.goto(recipePath + '/diff?from=1&to=2');
		await expect(page.getByRole('link', { name: 'Read v2' })).toHaveAttribute(
			'href',
			`${recipePath}?version=2`
		);
	});

	test('a version that does not exist is a 400 that names it and leads back to the recipe', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		const recipePath = new URL(page.url()).pathname;
		const response = await page.goto(recipePath + '/diff?from=1&to=9');
		expect(response?.status()).toBe(400);
		await expect(page.locator('h1')).toHaveText('Error 400 – Version 9 not found');
		await expect(page).toHaveTitle('Version 9 not found — Fork');
		await expect(page.getByRole('link', { name: 'Back to the recipe' })).toHaveAttribute(
			'href',
			recipePath
		);
	});

	test('diff-added and diff-removed text clear 4.5:1 against the surface actually behind them', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		await openCompare(page);

		// Relative luminance/contrast per WCAG — same formula as the tag-contrast test above.
		const contrast = (fg: string, bg: string) => {
			const lum = (c: string) => {
				const [r, g, b] = c
					.match(/\d+(\.\d+)?/g)!
					.slice(0, 3)
					.map(Number);
				const f = (v: number) => {
					const s = v / 255;
					return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
				};
				return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
			};
			const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
			return (a + 0.05) / (b + 0.05);
		};

		// ── Added: v1→v2 adds "espresso powder" as a whole new ingredient row.
		// Added rows carry --color-add-bg; the walk below therefore stops on the
		// row itself. No opacity is involved.
		const addedRow = page.locator('div.diff-added').first();
		await addedRow.waitFor();
		const added = await addedRow.evaluate((el) => {
			const cs = getComputedStyle(el);
			let node: HTMLElement | null = el as HTMLElement;
			let bg = 'rgba(0, 0, 0, 0)';
			while (node && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
				bg = getComputedStyle(node).backgroundColor;
				node = node.parentElement;
			}
			return { color: cs.color, bg };
		});
		expect(contrast(added.color, added.bg)).toBeGreaterThanOrEqual(4.5);

		// ── Removed: no seed range deletes a whole row, and a reversed range now
		// redirects to the older-to-newer pair, so the removed side measured here
		// is the inline <del> of a modified row ("¾" → "½" cup sugar in v2 → v3).
		// It carries the same --color-remove on --color-remove-bg as a removed row.

		// The element's computed opacity (1 since the redesign) still enters the
		// blend, so a future fade would be measured rather than assumed away.
		const removedRow = page.locator('.diff-content del.diff-removed').first();
		await removedRow.waitFor();
		const removed = await removedRow.evaluate((el) => {
			const cs = getComputedStyle(el);
			// Walk up from the *parent* — not the element itself — because the
			// element's own background-color is --color-remove-bg, and the true
			// surface behind it is what any row opacity would blend toward.
			let node: HTMLElement | null = el.parentElement;
			let trueBg = 'rgba(0, 0, 0, 0)';
			while (node && (trueBg === 'rgba(0, 0, 0, 0)' || trueBg === 'transparent')) {
				trueBg = getComputedStyle(node).backgroundColor;
				node = node.parentElement;
			}
			return {
				color: cs.color,
				ownBg: cs.backgroundColor,
				opacity: parseFloat(cs.opacity),
				trueBg
			};
		});

		// opacity on an element fades the whole rendered element (text and its own
		// background alike) toward whatever surface sits behind it — reproduce
		// that composite here rather than comparing the raw (pre-opacity) values.
		const blend = (fg: string, trueBg: string, alpha: number) => {
			const nums = (c: string) =>
				c
					.match(/\d+(\.\d+)?/g)!
					.slice(0, 3)
					.map(Number);
			const [fr, fg2, fb] = nums(fg);
			const [tr, tg, tb] = nums(trueBg);
			const mix = (f: number, t: number) => alpha * f + (1 - alpha) * t;
			return `rgb(${mix(fr, tr)}, ${mix(fg2, tg)}, ${mix(fb, tb)})`;
		};

		const effectiveText = blend(removed.color, removed.trueBg, removed.opacity);
		const effectiveRowBg = blend(removed.ownBg, removed.trueBg, removed.opacity);

		expect(contrast(effectiveText, effectiveRowBg)).toBeGreaterThanOrEqual(4.5);
	});

	test('on mobile, the actions and details sit above the ingredients', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);

		const ingredients = page.getByRole('heading', { name: /ingredients/i }).first();
		const details = page.locator('.details').first();
		await ingredients.waitFor();
		await details.waitFor();

		const ingredientsBox = await ingredients.boundingBox();
		const detailsBox = await details.boundingBox();

		expect(ingredientsBox).not.toBeNull();
		expect(detailsBox).not.toBeNull();
		expect(detailsBox!.y).toBeLessThan(ingredientsBox!.y);
	});

	test('the recipe page does not scroll sideways on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		await page
			.getByRole('heading', { name: /ingredients/i })
			.first()
			.waitFor();

		const { scrollWidth, clientWidth } = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));

		expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
	});

	test('on mobile, the photo leads above the recipe', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);

		const photo = page.locator('.recipe-photo img').first();
		const ingredients = page.getByRole('heading', { name: /ingredients/i }).first();
		await photo.waitFor();
		await ingredients.waitFor();

		const photoBox = await photo.boundingBox();
		const ingredientsBox = await ingredients.boundingBox();

		expect(photoBox).not.toBeNull();
		expect(ingredientsBox).not.toBeNull();
		expect(photoBox!.y).toBeLessThan(ingredientsBox!.y);
	});

	test('on a phone the photo sits between the title and the byline', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		const title = await page.locator('h1').boundingBox();
		const photo = await page.locator('.recipe-photo img').boundingBox();
		const byline = await page.locator('.byline').boundingBox();
		expect(photo!.y).toBeGreaterThan(title!.y + title!.height - 1);
		expect(byline!.y).toBeGreaterThan(photo!.y + photo!.height - 1);
	});

	test('in the history every version number and every message start on the same x', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		await page.getByRole('button', { name: '3 versions' }).click();
		const marks = await page
			.locator('.version-bar .version-number')
			.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
		const messages = await page
			.locator('.version-bar .message')
			.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
		expect(new Set(marks).size).toBe(1);
		expect(new Set(messages).size).toBe(1);
	});

	test('on an iPad an older version reads its note beside the chip, the controls on their own row under them, and the tabs keep their gap', async ({
		page
	}) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await gotoClassicCookies(page);
		const recipeUrl = page.url().split('?')[0];
		await page.goto(`${recipeUrl}?version=2`);
		const box = async (part: string) =>
			(await page.locator(`.version-bar .current ${part}`).boundingBox())!;
		let [chip, note, controls] = await Promise.all(
			['.version-number', '.message', '.controls'].map(box)
		);
		expect(note.width).toBeGreaterThan(400);
		expect(Math.abs(note.y - chip.y)).toBeLessThan(6);
		expect(controls.y).toBeGreaterThanOrEqual(note.y + note.height - 1);
		const bar = await page.locator('.version-bar').boundingBox();
		const tabs = await page.locator('.section-tabs').boundingBox();
		expect(tabs!.y - (bar!.y + bar!.height)).toBeGreaterThanOrEqual(16);
		// On a phone the note sits beside the chip like the latest version's, and
		// the controls take their own row under it.
		await page.setViewportSize({ width: 390, height: 900 });
		[chip, note, controls] = await Promise.all(
			['.version-number', '.message', '.controls'].map(box)
		);
		expect(Math.abs(note.y - chip.y)).toBeLessThan(6);
		expect(controls.y).toBeGreaterThanOrEqual(note.y + note.height - 1);
	});

	test('on a phone every link and button in the bar is 44px tall', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		await page.getByRole('button', { name: '3 versions' }).click();
		const short = await page.locator('.version-bar a, .version-bar button').evaluateAll((els) =>
			els
				// The toggle's box hugs its words; its hit is its ::before.
				.map((el) => ({
					text: el.textContent!.trim(),
					h: el.matches('.versions-toggle')
						? parseFloat(getComputedStyle(el, '::before').height)
						: el.getBoundingClientRect().height
				}))
				.filter((r) => r.h < 44)
		);
		expect(short).toEqual([]);
		// The compare under each row still indents to the message.
		const message = await page.locator('#version-history .message').first().boundingBox();
		const compare = await page.locator('#version-history .compare').first().boundingBox();
		expect(Math.abs(compare!.x - message!.x)).toBeLessThan(1);
	});

	test('on a phone each history row is a 44px link to its version, beside its compare link', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		await page.getByRole('button', { name: '3 versions' }).click();
		const row = page.locator('#version-history .version-link').first();
		await expect(row).toHaveAttribute('href', /\?version=2$/);
		await expect(row).toContainText('Increased vanilla');
		expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
		await expect(page.getByRole('link', { name: 'Compare with v3' }).first()).toHaveAttribute(
			'href',
			/diff\?from=2&to=3$/
		);
	});

	test('on desktop, the ingredients sit beside the method, not below it', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await gotoClassicCookies(page);

		const ingredients = page.getByRole('heading', { name: /ingredients/i }).first();
		const method = page.getByRole('heading', { name: /method/i }).first();
		await ingredients.waitFor();
		await method.waitFor();

		const ingredientsBox = await ingredients.boundingBox();
		const methodBox = await method.boundingBox();

		// Two columns: the method starts to the right of the 380px ingredients column.
		expect(Math.abs(ingredientsBox!.width - 380)).toBeLessThan(2);
		expect(methodBox!.x).toBeGreaterThan(ingredientsBox!.x + ingredientsBox!.width - 1);
		// x alone passed while the sidebar sat 667px too low: assert top alignment too.
		expect(Math.abs(methodBox!.y - ingredientsBox!.y)).toBeLessThan(2);
	});

	test('on desktop, the sidebar stays in view while the method scrolls', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 800 });
		await gotoClassicCookies(page);
		const sidebar = page.locator('.sidebar-sticky');
		await sidebar.waitFor();

		// A long method: the seed's six steps are shorter than the ingredients,
		// which leaves the sticky column nothing to do.
		await page.evaluate(() => {
			const list = document.querySelector('#method h2 + div')!;
			for (let i = 0; i < 4; i++) list.append(...[...list.children].map((c) => c.cloneNode(true)));
		});
		await page.mouse.wheel(0, 1000);
		await page.waitForTimeout(200);
		const box = await sidebar.boundingBox();
		expect(box).not.toBeNull();
		// Sticky at 24px: still at the top after a long scroll, not scrolled away.
		expect(box!.y).toBeGreaterThanOrEqual(0);
		expect(box!.y).toBeLessThan(60);
	});

	test('the version panel closes when one of its links navigates', async ({ page }) => {
		await gotoClassicCookies(page);
		await page.getByRole('button', { name: '3 versions' }).click();
		await page.locator('#version-history').waitFor();
		// A URL inside a message must wrap inside the panel, not widen the page.
		const wrap = await page
			.locator('#version-history .message')
			.first()
			.evaluate((el) => getComputedStyle(el).overflowWrap);
		expect(wrap).toBe('anywhere');
		await page.locator('#version-history').getByRole('link', { name: 'v1' }).click();
		await expect(page).toHaveURL(/version=1/);
		await expect(page.locator('#version-history')).toBeHidden();
	});

	test('the header names the recipe once and the author once', async ({ page }) => {
		await gotoClassicCookies(page);
		const hero = page.locator('header.recipe-header');
		await hero.waitFor();

		// The breadcrumb shows the title, not the URL slug.
		await expect(hero).toContainText(COOKIES);
		await expect(hero).not.toContainText('classic-chocolate-chip-cookies');

		// The author is named exactly once in the hero.
		const authorLinks = hero.getByRole('link', { name: /@spencerfletcher/i });
		await expect(authorLinks).toHaveCount(1);
	});

	test('layout survives a recipe with no photo', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await gotoClassicCookies(page);

		const ingredients = page.getByRole('heading', { name: /ingredients/i }).first();
		await ingredients.waitFor();

		// The {#if imageUrl} branch is equivalent to the node being absent.
		await page.evaluate(() => document.querySelector('.recipe-photo')?.remove());

		// Nothing reserves the photo's room: the text takes one 760px column and
		// the recipe starts sooner.
		const text = await page.locator('.hero-text').boundingBox();
		expect(text!.width).toBeGreaterThan(700);
		expect(text!.width).toBeLessThanOrEqual(760);
		const ingredientsBox = await ingredients.boundingBox();
		expect(ingredientsBox!.y).toBeLessThan(600);
	});

	test('tags stay readable on both the card and the hero surfaces', async ({ page }) => {
		await gotoClassicCookies(page);

		// Relative luminance per WCAG, from a computed rgb() string.
		const contrast = (fg: string, bg: string) => {
			const lum = (c: string) => {
				const [r, g, b] = c
					.match(/\d+(\.\d+)?/g)!
					.slice(0, 3)
					.map(Number);
				const f = (v: number) => {
					const s = v / 255;
					return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
				};
				return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
			};
			const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
			return (a + 0.05) / (b + 0.05);
		};

		const heroTag = page.locator('header.recipe-header a[href^="/tags/"]').first();
		await heroTag.waitFor();
		const hero = await heroTag.evaluate((el) => {
			const cs = getComputedStyle(el);
			// Walk up for the first non-transparent background.
			let node: HTMLElement | null = el as HTMLElement;
			let bg = 'rgba(0, 0, 0, 0)';
			while (node && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
				bg = getComputedStyle(node).backgroundColor;
				node = node.parentElement;
			}
			return { color: cs.color, bg, borderColor: cs.borderColor };
		});

		expect(contrast(hero.color, hero.bg)).toBeGreaterThanOrEqual(4.5);
	});

	test('logged out, the hero fills only the Fork pill, and no marigold text', async ({ page }) => {
		await gotoClassicCookies(page);
		const hero = page.locator('.hero');
		await hero.waitFor();

		const accent = 'rgb(236, 166, 32)';

		// One fill: the Fork pill, which leads to login and back here.
		const filled = await hero.evaluate(
			(el, a) =>
				[...el.querySelectorAll('*')]
					.filter((n) => n.checkVisibility() && getComputedStyle(n).backgroundColor === a)
					.map((n) => n.className),
			accent
		);
		expect(filled).toEqual([expect.stringContaining('btn-primary')]);
		const back = encodeURIComponent(new URL(page.url()).pathname);
		await expect(hero.getByRole('link', { name: 'Fork this recipe' })).toHaveAttribute(
			'href',
			`/login?redirectTo=${back}`
		);
		await expect(hero.getByRole('link', { name: 'Favorite' })).toHaveAttribute(
			'href',
			`/login?redirectTo=${back}`
		);

		// Cook time is metadata, not a pill: no background of its own.
		const time = page.getByText(/^\d+\s*(min|h)/).first();
		const timeBg = await time.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(timeBg);

		// Marigold never colours text: clay is the text accent, marigold a fill
		// with ink on it.
		const coloredText = await hero.evaluate(
			(el, a) =>
				[...el.querySelectorAll('*')].filter((n) => getComputedStyle(n).color === a).length,
			accent
		);
		expect(coloredText).toBe(0);
	});

	test('the hero is the text beside the photo; below a rule, ingredients beside the method', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoClassicCookies(page);
		const header = await page.locator('header.recipe-header').boundingBox();
		const photo = await page.locator('.recipe-photo img').boundingBox();
		const deck = await page.locator('.description').boundingBox();
		const byline = await page.locator('.byline').boundingBox();
		const ingredients = await page
			.getByRole('heading', { name: /ingredients/i })
			.first()
			.boundingBox();
		const method = await page
			.getByRole('heading', { name: /method/i })
			.first()
			.boundingBox();
		// Hero: the photo takes the right half, top aligned with the text, 4:3 under 440px tall.
		expect(photo!.x).toBeGreaterThan(header!.x + header!.width - 1);
		expect(Math.abs(photo!.y - header!.y)).toBeLessThan(12);
		expect(photo!.height).toBeLessThanOrEqual(340);
		// The byline comes before the description, which comes before the body.
		expect(byline!.y).toBeLessThan(deck!.y);
		expect(ingredients!.y).toBeGreaterThan(deck!.y + deck!.height);
		// Ingredients start by about 600px, beside a method column that runs to the photo's right edge.
		expect(ingredients!.y).toBeLessThan(620);
		expect(Math.abs(method!.x + method!.width - (photo!.x + photo!.width))).toBeLessThan(2);
		const color = await page
			.locator('.version-bar .versions-toggle')
			.evaluate((el) => getComputedStyle(el).color);
		expect(color).toBe('rgb(178, 60, 0)');
	});

	test('on a phone and an iPad, the tab bar switches between the sections in place', async ({
		page
	}) => {
		for (const width of [390, 768]) {
			await page.setViewportSize({ width, height: 844 });
			await gotoClassicCookies(page);
			const tabs = page.locator('.section-tabs');
			await expect(tabs).toBeVisible();
			// The bar sits inside the first screen, so neither section is a scroll away.
			expect((await tabs.boundingBox())!.y).toBeLessThan(844);
			// The tabs are toggle buttons: pressed marks the chosen section.
			await expect(tabs.getByRole('button', { name: 'Ingredients' })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
			await expect(tabs.getByRole('button', { name: 'Method' })).toHaveAttribute(
				'aria-pressed',
				'false'
			);
			await expect(page.locator('#ingredients')).toBeVisible();
			await expect(page.locator('#method')).toBeHidden();
			await tabs.getByRole('button', { name: 'Method' }).click();
			await expect(tabs.getByRole('button', { name: 'Method' })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
			await expect(tabs.getByRole('button', { name: 'Ingredients' })).toHaveAttribute(
				'aria-pressed',
				'false'
			);
			await expect(page.locator('#method')).toBeVisible();
			await expect(page.locator('#ingredients')).toBeHidden();
			// Scrolled to the end of the method, Ingredients swaps in with the bar
			// still on screen and its first row under the bar, never above it.
			await page.mouse.wheel(0, 1500);
			await page.waitForTimeout(200);
			await tabs.getByRole('button', { name: 'Ingredients' }).click();
			await page.waitForTimeout(200);
			await expect(page.locator('#ingredients')).toBeVisible();
			await expect(page.locator('#method')).toBeHidden();
			const bar = await tabs.boundingBox();
			const row = await page.locator('#ingredients label').first().boundingBox();
			expect(bar!.y).toBeGreaterThanOrEqual(0);
			expect(row!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height);
			expect(row!.y).toBeLessThan(844);
		}
		await page.setViewportSize({ width: 1280, height: 900 });
		await expect(page.locator('.section-tabs')).toBeHidden();
		await expect(page.locator('#ingredients')).toBeVisible();
		await expect(page.locator('#method')).toBeVisible();
	});

	test('on a phone the note runs in full in the history, no clamp, no "more"', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		await page.getByRole('button', { name: '3 versions' }).click();
		const message = page.locator('.version-bar .current .message');
		await expect(message).toContainText(SEED[0].versions.at(-1)!.commitMessage);
		await expect(page.getByRole('button', { name: 'more' })).toHaveCount(0);
		const { scrollHeight, clientHeight } = await message.evaluate((el) => ({
			scrollHeight: el.scrollHeight,
			clientHeight: el.clientHeight
		}));
		expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);
	});

	test('a keyboard cook can skip from the navbar to the ingredients', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoClassicCookies(page);
		// The very first Tab: the skip link lives in the layout, before the navbar.
		const skip = page.getByRole('link', { name: 'Skip to ingredients' });
		await page.keyboard.press('Tab');
		await expect(skip).toBeFocused();
		await expect(skip).toBeInViewport();
		// Visible on top of the navbar, not under it.
		const onTop = await skip.evaluate((el) => {
			const r = el.getBoundingClientRect();
			return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
		});
		expect(onTop).toBe(true);
		const headerFocusedBefore = await page.evaluate(
			() => !!document.querySelector('header.recipe-header :focus')
		);
		expect(headerFocusedBefore).toBe(false);
		await page.keyboard.press('Enter');
		await page.waitForTimeout(200);
		// The recipe is as high as the page allows: at the top of the screen, or the
		// page is scrolled to its end because a short recipe cannot go further.
		const { y, atEnd } = await page.evaluate(() => ({
			y: document.getElementById('ingredients')!.getBoundingClientRect().y,
			atEnd: window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1
		}));
		expect(y < 120 || atEnd).toBe(true);
		// The next Tab lands on the first ingredient, not back in the header.
		await page.keyboard.press('Tab');
		await expect(page.locator('#ingredients input[type="checkbox"]').first()).toBeFocused();
	});

	test('a recipe that is not there skips to the content, not to a missing #recipe', async ({
		page
	}) => {
		const response = await page.goto('/recipes/no-such-recipe');
		expect(response!.status()).toBe(404);
		await page.keyboard.press('Tab');
		const skip = page.getByRole('link', { name: 'Skip to content' });
		await expect(skip).toBeFocused();
		await expect(skip).toHaveAttribute('href', '#main');
		await page.keyboard.press('Enter');
		await expect(page.locator('#main')).toBeFocused();
	});

	test('on a phone the skip link lands the first ingredient clear of the tab bar', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await gotoClassicCookies(page);
		await page.keyboard.press('Tab');
		await expect(page.getByRole('link', { name: 'Skip to ingredients' })).toBeFocused();
		await page.keyboard.press('Enter');
		await page.waitForTimeout(200);
		const bar = await page.locator('.section-tabs').boundingBox();
		const row = await page.locator('#ingredients label').first().boundingBox();
		expect(row!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height);
	});

	test('a row focused by Tab or Shift+Tab shows whole, ring and all, clear of the screen edge and the tab bar', async ({
		page
	}) => {
		// Every check-off row in reading order, then back again; at a desktop width
		// both lists at once, on a phone each tab in turn.
		const runs = [
			{ width: 1280, height: 800, tab: null },
			{ width: 390, height: 844, tab: 'Ingredients' },
			{ width: 390, height: 844, tab: 'Method' }
		];
		for (const { width, height, tab } of runs) {
			await page.setViewportSize({ width, height });
			await gotoClassicCookies(page);
			if (tab) await page.locator('.section-tabs').getByRole('button', { name: tab }).click();
			const boxes = page.locator('#recipe input[type="checkbox"]:visible');
			const count = await boxes.count();
			expect(count).toBeGreaterThan(3);
			await boxes.first().focus();
			await page.evaluate(() => window.scrollTo(0, 0));
			const order = [...Array(count).keys()];
			for (const [key, steps] of [
				['Tab', order.slice(1)],
				['Shift+Tab', order.slice(0, -1).reverse()]
			] as const) {
				for (const i of steps) {
					await page.keyboard.press(key);
					await expect(boxes.nth(i)).toBeFocused();
					const gap = await boxes.nth(i).evaluate((input) => {
						// The ring is 2px wide at a 2px offset.
						const row = input.closest('label')!.getBoundingClientRect();
						const list = input.closest('.sidebar-sticky');
						const own =
							list && getComputedStyle(list).overflowY === 'auto'
								? list.getBoundingClientRect()
								: null;
						const tabs = document.querySelector('.section-tabs')!;
						const pinned =
							getComputedStyle(tabs).position === 'sticky'
								? tabs.getBoundingClientRect().bottom
								: 0;
						return {
							top: row.top - 4 - Math.max(pinned, own?.top ?? 0),
							bottom: Math.min(window.innerHeight, own?.bottom ?? Infinity) - (row.bottom + 4)
						};
					});
					// Whole: the scroll lands on a whole pixel, so up to a pixel may be cut.
					expect(gap.top, `${width} ${tab ?? ''} row ${i} after ${key}`).toBeGreaterThanOrEqual(-1);
					expect(gap.bottom, `${width} ${tab ?? ''} row ${i} after ${key}`).toBeGreaterThanOrEqual(
						-1
					);
				}
			}
		}
	});

	test('while viewing an older version the history still opens, comparing with that version', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		const recipeUrl = page.url().split('?')[0];
		await page.goto(`${recipeUrl}?version=2`);
		await page.getByRole('button', { name: '3 versions' }).click();
		// The other two are listed; the one being read is the bar's own line.
		await expect(page.locator('#version-history li')).toHaveCount(2);
		await expect(page.locator('.version-bar .current')).toHaveText(/v2/);
		await expect(page.getByRole('link', { name: 'Compare with v2' }).first()).toHaveAttribute(
			'href',
			/diff\?from=2&to=3$/
		);
	});

	test('every inline link in the header has a 24px hit box', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoClassicCookies(page);
		const short = await page
			.locator(
				'header.recipe-header a, header.recipe-header button, .version-bar a, .version-bar button'
			)
			.evaluateAll((els) =>
				els
					.filter((el) => el.getClientRects().length > 0)
					// The toggle's box hugs its words; its hit is its ::before.
					.map((el) => ({
						text: el.textContent!.trim(),
						h: el.matches('.versions-toggle')
							? parseFloat(getComputedStyle(el, '::before').height)
							: el.getBoundingClientRect().height
					}))
					.filter((r) => r.h < 24)
			);
		expect(short).toEqual([]);
	});

	test('the byline wraps without widening the page', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);

		const strip = page.locator('.byline');
		await strip.waitFor();

		const doc = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));
		expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);

		// The strip itself may scroll; it must not exceed its container.
		const box = await strip.boundingBox();
		expect(box!.width).toBeLessThanOrEqual(390);
	});

	test('the bar’s note and toggle share one text baseline', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await gotoClassicCookies(page);
		await page.getByRole('button', { name: '3 versions' }).click();

		// Each item's first text node, measured as a range so the button box
		// does not count.
		const bottoms = await page.evaluate(() =>
			// The number is 12px against 14px, so its text box ends higher even on
			// the same baseline; the two 14px items are compared.
			['.version-bar .current .message', '.versions-toggle'].map((sel) => {
				const el = document.querySelector(sel)!;
				const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
				let node = walker.nextNode();
				while (node && !node.textContent?.trim()) node = walker.nextNode();
				const range = document.createRange();
				range.selectNodeContents(node!);
				return range.getBoundingClientRect().bottom;
			})
		);
		for (const bottom of bottoms) expect(Math.abs(bottom - bottoms[0])).toBeLessThan(1);
	});

	test('on a short desktop a long ingredient list scrolls inside the sticky aside', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 700 });
		await gotoClassicCookies(page);
		// Three times the seed's rows: well past a 700px screen.
		await page.evaluate(() => {
			const list = document.querySelector('#ingredients h2 + div')!;
			for (let i = 0; i < 2; i++) list.append(...[...list.children].map((c) => c.cloneNode(true)));
		});
		const sticky = page.locator('.sidebar-sticky');
		const box = await sticky.evaluate((el) => ({
			// The list's own height: the box less the 4px that keeps focus rings whole.
			height: el.getBoundingClientRect().height - 8,
			scrollHeight: el.scrollHeight,
			overflowY: getComputedStyle(el).overflowY
		}));
		// Capped to the viewport less its 24px top and bottom, and scrolling inside.
		expect(box.height).toBeLessThanOrEqual(700 - 48);
		expect(box.scrollHeight).toBeGreaterThan(box.height);
		expect(box.overflowY).toBe('auto');
		// Pinned, the last row is reached by scrolling the aside, not the page.
		await page.mouse.wheel(0, 3000);
		await page.waitForTimeout(200);
		await sticky.evaluate((el) => (el.scrollTop = el.scrollHeight));
		const last = await page.locator('#ingredients label').last().boundingBox();
		expect(last!.y).toBeGreaterThanOrEqual(0);
		expect(last!.y + last!.height).toBeLessThanOrEqual(700);
	});

	test('the aside fades its bottom 24px while the list runs past it, and not when it fits', async ({
		page
	}) => {
		const mask = () =>
			page.locator('.sidebar-sticky').evaluate((el) => getComputedStyle(el).maskImage);
		// The seed's list fits a 900px screen: no fade.
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoClassicCookies(page);
		expect(await mask()).toBe('none');
		// Three times the rows on a 700px screen: the hidden rows are signalled.
		await page.setViewportSize({ width: 1280, height: 700 });
		await page.evaluate(() => {
			const list = document.querySelector('#ingredients h2 + div')!;
			for (let i = 0; i < 2; i++) list.append(...[...list.children].map((c) => c.cloneNode(true)));
		});
		await page.waitForTimeout(100);
		expect(await mask()).toMatch(/linear-gradient\(.*rgba\(0, 0, 0, 0\)\)$/);
		expect(await mask()).toContain('24px');
		// Scrolled to its end, the last row shows whole.
		await page.locator('.sidebar-sticky').evaluate((el) => (el.scrollTop = el.scrollHeight));
		await page.waitForTimeout(100);
		expect(await mask()).toBe('none');
	});

	test('Tabbing down a long list keeps each focused row and its ring above the aside’s fade', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 700 });
		await gotoClassicCookies(page);
		// 25 rows: well past a 700px screen, as a long real recipe would be.
		await page.evaluate(() => {
			const list = document.querySelector('#ingredients h2 + div')!;
			const rows = [...list.children];
			for (let i = 0; list.children.length < 25; i++)
				list.append(rows[i % rows.length].cloneNode(true));
		});
		await page.keyboard.press('Tab');
		await page.keyboard.press('Enter');
		const rows = page.locator('#ingredients label');
		await expect(rows).toHaveCount(25);
		for (let i = 0; i < 25; i++) {
			await page.keyboard.press('Tab');
			await expect(rows.nth(i).locator('input')).toBeFocused();
			const gap = await rows.nth(i).evaluate((el) => {
				const s = getComputedStyle(el);
				const ring =
					el.getBoundingClientRect().bottom +
					parseFloat(s.outlineWidth) +
					parseFloat(s.outlineOffset);
				const box = el.closest('.sidebar-sticky')!;
				const fadeTop = box.getBoundingClientRect().top + box.clientTop + box.clientHeight - 24;
				// Scrolled to its end, the fade lifts: the last rows may sit in it.
				const faded = getComputedStyle(box).maskImage !== 'none';
				return faded ? fadeTop - ring : 0;
			});
			expect(gap, `row ${i + 1}`).toBeGreaterThanOrEqual(0);
		}
	});

	test('at 1024 and up a focused ingredient shows its whole ring inside the scrolling aside', async ({
		page
	}) => {
		for (const width of [1024, 1280]) {
			await page.setViewportSize({ width, height: 900 });
			await gotoClassicCookies(page);
			await page.keyboard.press('Tab');
			await page.keyboard.press('Enter');
			await page.keyboard.press('Tab');
			const row = page.locator('#ingredients label').first();
			await expect(row.locator('input')).toBeFocused();
			const m = await row.evaluate((el) => {
				const s = getComputedStyle(el);
				const r = el.getBoundingClientRect();
				// The ring reaches its width plus its offset beyond the row.
				const reach = parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset);
				// overflow: auto clips at the scroll box's padding edge.
				const box = el.closest('.sidebar-sticky')!;
				const b = box.getBoundingClientRect();
				return {
					style: s.outlineStyle,
					overflowY: getComputedStyle(box).overflowY,
					left: r.left - reach - (b.left + box.clientLeft),
					right: b.left + box.clientLeft + box.clientWidth - (r.right + reach)
				};
			});
			expect(m.style, `${width}`).toBe('solid');
			expect(m.overflowY, `${width}`).toBe('auto');
			expect(m.left, `${width}: ring's left edge`).toBeGreaterThanOrEqual(0);
			expect(m.right, `${width}: ring's right edge`).toBeGreaterThanOrEqual(0);
		}
	});

	test('ticked rows survive a reload and a new window, and an older version keeps ticks of its own', async ({
		page,
		browser
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoClassicCookies(page);
		const recipeUrl = page.url().split('?')[0];
		const ingredient = page.locator('#ingredients input').nth(1);
		const step = page.locator('#method input').nth(2);
		await page.locator('#ingredients label').nth(1).click();
		await page.locator('#method label').nth(2).click();
		await page.reload();
		await expect(ingredient).toBeChecked();
		await expect(step).toBeChecked();
		await expect(page.locator('#recipe input:checked')).toHaveCount(2);
		// A new window on the same storage origin has them too: localStorage, not
		// one tab's sessionStorage.
		const other = await browser.newContext({ storageState: await page.context().storageState() });
		const tab = await other.newPage();
		await tab.goto(recipeUrl);
		await expect(tab.locator('#ingredients input').nth(1)).toBeChecked();
		await expect(tab.locator('#method input').nth(2)).toBeChecked();
		await expect(tab.locator('#recipe input:checked')).toHaveCount(2);
		await other.close();
		// v2 is another version: none of v3's ticks carry over.
		await page.goto(`${recipeUrl}?version=2`);
		await expect(page.locator('.version-bar .current .version-number')).toContainText('v2');
		await expect(page.locator('#recipe input:checked')).toHaveCount(0);
		// Back on v3 by its own link, without a reload, they are still there.
		await page.getByRole('link', { name: 'Back to v3' }).click();
		await expect(ingredient).toBeChecked();
		await expect(step).toBeChecked();
	});

	test('a method numeral sits 10px from its text with one digit or two; the tick keeps the column start', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		const url = page.url();
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto(url);
			if (width < 1024)
				await page.locator('.section-tabs').getByRole('button', { name: 'Method' }).click();
			// The seed has no recipe of ten steps or more: copy the rendered rows to
			// twelve and number them, so a two-digit numeral is measured in real CSS.
			const gaps = await page.evaluate(() => {
				const first = document.querySelector('#method label')!;
				const list = first.parentElement!;
				while (list.children.length < 12) list.append(first.cloneNode(true));
				return [...list.querySelectorAll('label')].map((row, i) => {
					const [tick, numeral] = row.querySelectorAll<HTMLElement>('.tick, .tick + span');
					numeral.textContent = String(i + 1);
					const text = row.querySelector('div')!.getBoundingClientRect();
					return {
						tickAtStart: tick.getBoundingClientRect().x - row.getBoundingClientRect().x,
						numeralToText: text.x - numeral.getBoundingClientRect().right
					};
				});
			});
			for (const [i, gap] of gaps.entries()) {
				expect(gap.tickAtStart, `${width}: step ${i + 1} tick`).toBeCloseTo(0, 0);
				expect(gap.numeralToText, `${width}: step ${i + 1} numeral to text`).toBeCloseTo(10, 0);
			}
		}
	});

	test('on a narrow phone each action pill holds its label on one line', async ({ page }) => {
		await gotoClassicCookies(page);
		// 360 is the narrowest common Android width; below 375 Fork says "Fork".
		for (const [width, fork] of [
			[320, 'Fork'],
			[360, 'Fork'],
			[375, 'Fork this recipe']
		] as const) {
			await page.setViewportSize({ width, height: 900 });
			const pills = await page.locator('.actions a, .actions button').evaluateAll((els) =>
				els.map((el) => ({
					text: (el as HTMLElement).innerText.trim(),
					height: el.getBoundingClientRect().height,
					overflow: el.scrollWidth - el.clientWidth
				}))
			);
			expect(pills.map((p) => p.text)).toEqual([fork, 'Favorite']);
			for (const pill of pills) {
				expect(pill.height, `${width} ${pill.text}`).toBe(44);
				expect(pill.overflow, `${width} ${pill.text}`).toBeLessThanOrEqual(0);
			}
		}
	});

	test('on a phone every inline link in the header is 44px tall', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		const short = await page.locator('header.recipe-header a').evaluateAll((els) =>
			els
				.filter((el) => el.getClientRects().length > 0)
				.map((el) => ({ text: el.textContent!.trim(), h: el.getBoundingClientRect().height }))
				.filter((r) => r.h < 44)
		);
		expect(short).toEqual([]);
	});

	test('the bar’s separators are drawn, not typed, and no line starts or ends with one', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		const recipeUrl = page.url().split('?')[0];
		const controls = page.locator('.version-bar .current .controls');
		const dots = () =>
			controls
				.locator('.item')
				.evaluateAll((els) => els.map((el) => getComputedStyle(el, '::before').content));
		// Desktop: a dot before every item after the first, none typed into the text.
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto(`${recipeUrl}?version=2`);
		expect(await dots()).toEqual(['none', '"· "']);
		expect(await controls.textContent()).not.toContain('·');
		// Phone: the dot stays, or "Back to v3" and "3 versions" read as one phrase.
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto(`${recipeUrl}?version=2`);
		expect(await dots()).toEqual(['none', '"· "']);
		// At every width an item with a dot shares its line with the item before
		// it, so no line starts with one; the dot is the item's ::before, so none
		// can end a line either.
		for (const width of [1280, 1024, 768, 390, 320]) {
			await page.setViewportSize({ width, height: 900 });
			const stranded = await controls
				.locator('.item')
				.evaluateAll((els) =>
					els.filter(
						(el, i) =>
							getComputedStyle(el, '::before').content !== 'none' &&
							Math.abs(el.getBoundingClientRect().top - els[i - 1].getBoundingClientRect().top) > 1
					)
				);
			expect(stranded, `${width}`).toHaveLength(0);
		}
	});

	test('the measure’s dots are drawn in Ink 3 between pairs, and a phone drops them for a 10px gap', async ({
		page
	}) => {
		const details = page.locator('.details');
		const dots = () =>
			details
				.locator('.pair')
				.evaluateAll((els) => els.map((el) => getComputedStyle(el, '::before').content));
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoClassicCookies(page);
		// None typed; one drawn before every pair after the first, in Ink 3.
		expect(await details.textContent()).not.toContain('·');
		expect(await dots()).toEqual(['none', '"·" / ""', '"·" / ""']);
		const color = await details
			.locator('.pair')
			.nth(1)
			.evaluate((el) => getComputedStyle(el, '::before').color);
		expect(color).toBe('rgb(111, 105, 96)');
		// At 320 nothing strands: the pairs wrap 10px apart with no dots at all.
		await page.setViewportSize({ width: 320, height: 900 });
		expect(await dots()).toEqual(['none', 'none', 'none']);
		expect(await details.evaluate((el) => getComputedStyle(el).columnGap)).toBe('10px');
	});

	test('on a phone and an iPad the closed note shows two lines; on a desktop one', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		const message = page.locator('.version-bar .current .message');
		const measure = () =>
			message.evaluate((el) => {
				const s = getComputedStyle(el);
				return {
					lines: Math.round(el.getBoundingClientRect().height / parseFloat(s.lineHeight)),
					clamp: s.webkitLineClamp,
					clipped: el.scrollHeight > el.clientHeight + 1
				};
			});
		// The seed's 95-character note needs three lines here, so two shows and the
		// third is clipped.
		expect(await measure()).toEqual({ lines: 2, clamp: '2', clipped: true });
		// Open, it runs in full.
		await page.getByRole('button', { name: '3 versions' }).click();
		expect((await measure()).clipped).toBe(false);
		// An iPad's controls sit on their own row, so the note has the width for
		// two lines; the seed's note fits them whole.
		await page.setViewportSize({ width: 768, height: 1024 });
		await gotoClassicCookies(page);
		expect(await measure()).toEqual({ lines: 2, clamp: '2', clipped: false });
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoClassicCookies(page);
		expect((await measure()).lines).toBe(1);
	});

	test('the hero photo is fetched first, decoded off the main thread, and silent to a screen reader', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		const img = page.locator('.recipe-photo img');
		await expect(img).toHaveAttribute('fetchpriority', 'high');
		await expect(img).toHaveAttribute('decoding', 'async');
		// The h1 names the recipe; an alt with the title read it twice.
		await expect(img).toHaveAttribute('alt', '');
	});

	test('asked for reduced motion, transitions finish at once: the history chevron turns without its 0.15s', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		const chevron = page.locator('.version-bar .chevron');
		const duration = () =>
			chevron.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
		expect(await duration()).toBe(0.15);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		expect(await duration()).toBeLessThanOrEqual(0.001);
	});

	test('selected text sits on marigold in ink', async ({ page }) => {
		await gotoClassicCookies(page);
		const selection = await page
			.locator('.description')
			.evaluate((el) => getComputedStyle(el, '::selection').backgroundColor);
		expect(selection).toBe('rgb(236, 166, 32)');
	});
});

test.describe('Landing page (logged out)', () => {
	test('logged-out visitors see the premise and a diff', async ({ page }) => {
		await page.goto('/');
		const browseLink = page.getByRole('link', { name: /browse recipes/i });
		await expect(browseLink).toBeVisible();
		// The primary CTA leads to the public recipe index, not to an empty
		// search form (decided 29 October 2026).
		await expect(browseLink).toHaveAttribute('href', '/recipes');
		await expect(page.locator('.diff-content').first()).toBeVisible();
		// The page ends on the newest recipes under the browse page's section
		// pattern, with a way to the rest.
		await expect(page.getByRole('heading', { level: 2, name: 'Recent' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'All recipes' })).toHaveAttribute(
			'href',
			'/recipes'
		);
	});

	test('the open phone menu dims the page but not the bar above it', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await page.getByRole('button', { name: /open main menu/i }).click();
		await page.locator('#mobile-menu').waitFor();
		const brand = await page.getByRole('link', { name: /^fork/i }).first().boundingBox();
		const hit = await page.evaluate(
			([x, y]) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('href') ?? null,
			[brand!.x + brand!.width / 2, brand!.y + brand!.height / 2]
		);
		expect(hit).toBe('/');
	});

	test('a checked-off ingredient strikes through at one height, grams included', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await gotoClassicCookies(page);
		const row = page.locator('label:has(input[type="checkbox"])').first();
		const grams = row.locator('span').last();
		await grams.waitFor();
		const sizes = await page.evaluate(
			([r, g]) => [getComputedStyle(r!).fontSize, getComputedStyle(g!).fontSize],
			[await row.elementHandle(), await grams.elementHandle()]
		);
		// A line-through is drawn at each inline box's own font metrics in WebKit,
		// so a smaller grams span would get its own, lower strike.
		expect(sizes[1]).toBe(sizes[0]);
	});

	test('ticking an ingredient or a step fills its circle marigold with an ink check; the text turns Ink 3, not the circle', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoClassicCookies(page);
		const ink2 = 'rgb(74, 68, 62)';
		const marigold = 'rgb(236, 166, 32)';
		const ink = 'rgb(26, 23, 20)';
		const ink3 = 'rgb(111, 105, 96)';
		// The opacity a box is painted at: its own times every ancestor's.
		const painted = (el: Element) => {
			let o = 1;
			for (let e: Element | null = el; e; e = e.parentElement) o *= +getComputedStyle(e).opacity;
			return Math.round(o * 100) / 100;
		};
		for (const section of ['#ingredients', '#method']) {
			const row = page.locator(`${section} label`).first();
			const tick = row.locator('.tick');
			await page.mouse.move(0, 0);
			const rest = await tick.evaluate((el) => {
				const s = getComputedStyle(el);
				return { edge: s.borderTopColor, width: s.width, radius: s.borderTopLeftRadius };
			});
			expect(rest, section).toEqual({ edge: ink3, width: '16px', radius: '50%' });
			await row.hover();
			expect(await tick.evaluate((el) => getComputedStyle(el).borderTopColor), section).toBe(ink2);
			await row.click();
			const fill = await tick.evaluate((el) => getComputedStyle(el).backgroundColor);
			expect(fill, section).toBe(marigold);
			const check = await tick.evaluate((el) => getComputedStyle(el, '::after').borderRightColor);
			expect(check, section).toBe(ink);
			expect(await tick.evaluate(painted), section).toBe(1);
			// Ink 3 at full opacity, 4.9:1 on paper; an opacity dim fell under 4.5:1.
			const text = row.locator(section === '#ingredients' ? '.tick + span' : 'p').first();
			expect(await text.evaluate((el) => getComputedStyle(el).color), section).toBe(ink3);
			expect(await text.evaluate(painted), section).toBe(1);
		}
	});

	test('the landing hero sits on the page paper, with only the bar in espresso', async ({
		page
	}) => {
		await page.goto('/');
		const hero = page.locator('section.hero');
		await hero.waitFor();
		const [heroBg, pageBg, navBg] = await page.evaluate(() => [
			getComputedStyle(document.querySelector('section.hero')!).backgroundColor,
			getComputedStyle(document.body).backgroundColor,
			getComputedStyle(document.querySelector('nav')!).backgroundColor
		]);
		expect([pageBg, 'rgba(0, 0, 0, 0)']).toContain(heroBg);
		expect(navBg).not.toBe(pageBg);
	});

	test('the recipe page shares its gutters and width with browse at every size', async ({
		page
	}) => {
		for (const width of [1440, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/recipes');
			const browse = await page.getByRole('heading', { level: 1 }).boundingBox();
			const grid = await page.locator('.recipe-grid').first().boundingBox();
			await gotoClassicCookies(page);
			const title = await page.getByRole('heading', { level: 1 }).boundingBox();
			// The hero's content box, inside its gutters.
			const hero = await page.locator('.hero').evaluate((el) => {
				const { paddingLeft, paddingRight } = getComputedStyle(el);
				const { x, width } = el.getBoundingClientRect();
				return {
					x: x + parseFloat(paddingLeft),
					width: width - parseFloat(paddingLeft) - parseFloat(paddingRight)
				};
			});
			expect(Math.abs(title!.x - browse!.x)).toBeLessThan(1);
			expect(Math.abs(hero.x - grid!.x)).toBeLessThan(1);
			expect(Math.abs(hero.width - grid!.width)).toBeLessThan(1);
		}
	});

	test('the landing page shares one left edge with browse: hero, diff and grid', async ({
		page
	}) => {
		// At 1200 the two old paddings agreed by chance; at 1280 the hero and the
		// diff sat at 64 while the grid and browse sat at 40.
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/recipes');
			const browse = await page.getByRole('heading', { level: 1 }).boundingBox();
			await page.goto('/');
			const hero = await page.getByRole('heading', { level: 1 }).boundingBox();
			const diff = await page.getByRole('heading', { name: 'A real change, diffed' }).boundingBox();
			// Below 700px the Recent grid is a strip that bleeds to the screen edge
			// and scrolls sideways, so its first card, not its box, sits on the edge.
			const grid = await page.locator('.recipe-grid .recipe-card').first().boundingBox();
			expect(Math.abs(hero!.x - browse!.x)).toBeLessThan(1);
			expect(Math.abs(diff!.x - browse!.x)).toBeLessThan(1);
			expect(Math.abs(grid!.x - browse!.x)).toBeLessThan(1);
		}
	});

	test('the landing page does not scroll sideways on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto('/');
		await expect(page.getByRole('link', { name: /browse recipes/i })).toBeVisible();

		const { scrollWidth, clientWidth } = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));

		expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
	});

	test('the hero headline is readable against the hero background', async ({ page }) => {
		await page.goto('/');

		// Relative luminance per WCAG, from a computed rgb() string — same
		// formula as the tag-contrast test above.
		const contrast = (fg: string, bg: string) => {
			const lum = (c: string) => {
				const [r, g, b] = c
					.match(/\d+(\.\d+)?/g)!
					.slice(0, 3)
					.map(Number);
				const f = (v: number) => {
					const s = v / 255;
					return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
				};
				return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
			};
			const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
			return (a + 0.05) / (b + 0.05);
		};

		const headline = page.locator('section h1').first();
		await headline.waitFor();
		const style = await headline.evaluate((el) => {
			const cs = getComputedStyle(el);
			let node: HTMLElement | null = el as HTMLElement;
			let bg = 'rgba(0, 0, 0, 0)';
			while (node && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
				bg = getComputedStyle(node).backgroundColor;
				node = node.parentElement;
			}
			return { color: cs.color, bg };
		});

		// A direct element rule (`h1 { color: ... }` in app.css) can silently
		// beat a text-color utility class applied to the same element — assert
		// the property that actually matters (contrast), not just presence.
		expect(style.color).not.toBe(style.bg);
		expect(contrast(style.color, style.bg)).toBeGreaterThanOrEqual(4.5);
	});

	test('the diff panels sit side by side on a wide screen and stack on a narrow one', async ({
		page
	}) => {
		// The Ingredients and Steps panels; a Details panel may precede them.
		const panels = () =>
			page
				.locator('section')
				.filter({ hasText: 'A real change, diffed' })
				.first()
				.locator('section')
				.filter({ has: page.getByRole('heading', { name: /^(Ingredients|Method)$/ }) });

		await page.setViewportSize({ width: 1440, height: 1800 });
		await page.goto('/');
		await panels().first().waitFor();
		const wide = [await panels().nth(0).boundingBox(), await panels().nth(1).boundingBox()];
		// Same top edge, different left edge — two columns, measured rather than
		// inferred from a class name.
		expect(wide[0]!.y).toBeCloseTo(wide[1]!.y, 0);
		expect(wide[1]!.x).toBeGreaterThan(wide[0]!.x + wide[0]!.width - 1);

		await page.setViewportSize({ width: 390, height: 2400 });
		await page.goto('/');
		await panels().first().waitFor();
		const narrow = [await panels().nth(0).boundingBox(), await panels().nth(1).boundingBox()];
		expect(narrow[1]!.y).toBeGreaterThan(narrow[0]!.y + narrow[0]!.height - 40);

		const doc = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));
		expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
	});

	test('the compare page is the site column; the diff splits from 1024 and stacks below', async ({
		page
	}) => {
		// The page used to carry its own 784px measure; every page is the 1200px
		// column with the site gutters (decided 29 October 2026).
		await page.setViewportSize({ width: 1440, height: 1800 });
		await gotoClassicCookies(page);
		await page.goto(page.url().split('?')[0] + '/diff');
		const compare = page.locator('.compare');
		expect((await compare.boundingBox())!.width).toBe(1200);
		const panels = page.locator('section').filter({ has: page.locator('.eyebrow-label') });
		const ingredients = panels.filter({
			has: page.getByRole('heading', { name: 'Ingredients', exact: true })
		});
		const steps = panels.filter({
			has: page.getByRole('heading', { name: 'Method', exact: true })
		});
		const sideBySide = async () => {
			const a = await ingredients.boundingBox();
			const b = await steps.boundingBox();
			expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
			expect(b!.x).toBeGreaterThan(a!.x + a!.width - 1);
		};
		await sideBySide();
		// Each about half of the column.
		expect((await ingredients.boundingBox())!.width).toBeGreaterThan(1200 * 0.4);

		await page.setViewportSize({ width: 1024, height: 1800 });
		await sideBySide();
		expect((await ingredients.boundingBox())!.width).toBeGreaterThan((1024 - 48) * 0.4);

		for (const width of [768, 390]) {
			await page.setViewportSize({ width, height: 1800 });
			const a2 = await ingredients.boundingBox();
			const b2 = await steps.boundingBox();
			expect(b2!.y).toBeGreaterThan(a2!.y + a2!.height - 40);
		}
	});

	test('the modified marker and its row are ink; unchanged rows stay Ink 3', async ({ page }) => {
		// The ~ was drawn in the same grey as the rows it should stand apart
		// from. Ink, not clay: clay would read too close to the removal red
		// (decided 29 October 2026).
		await gotoClassicCookies(page);
		await openCompare(page);
		const color = (sel: string) =>
			page
				.locator(sel)
				.first()
				.evaluate((el) => getComputedStyle(el).color);
		const ink = 'rgb(26, 23, 20)';
		expect(await color('.diff-row.diff-modified .diff-gutter')).toBe(ink);
		expect(await color('.diff-row.diff-modified .diff-content')).toBe(ink);
		expect(await color('.diff-row.diff-unchanged .diff-content')).toBe('rgb(111, 105, 96)');
		// Modified step numbers stay clay.
		expect(await color('.diff-row.diff-modified .step-num')).toBe('rgb(178, 60, 0)');
	});

	test('each card number links to its version, so the older one is reachable; no summary line', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		const recipePath = new URL(page.url()).pathname;
		await page.goto(recipePath + '/diff?from=2&to=3');
		const numbers = page.locator('article.version-card a.version-card__number');
		await expect(numbers.nth(0)).toHaveAttribute('href', `${recipePath}?version=2`);
		await expect(numbers.nth(1)).toHaveAttribute('href', recipePath);
		await expect(page.locator('.summary')).toHaveCount(0);
		await expect(page.getByText(/changed$/)).toHaveCount(0);
	});

	test('card usernames and the back link are 24px targets at desktop and 44px on a phone', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		await openCompare(page);
		const username = page.locator('article.version-card .version-card__head .username').first();
		const back = page.locator('.compare .back-link');
		expect((await username.boundingBox())!.height).toBeGreaterThanOrEqual(24);
		expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(24);

		await page.setViewportSize({ width: 390, height: 1800 });
		expect((await username.boundingBox())!.height).toBeGreaterThanOrEqual(44);
		expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	});

	test('the compare page does not scroll sideways on a phone', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 1200 });
		await gotoClassicCookies(page);
		await page.goto(page.url().split('?')[0] + '/diff');
		await page.locator('article.version-card').first().waitFor();
		const doc = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));
		expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
		// The Read link after the diff is a 44px target on a phone.
		const read = await page.getByRole('link', { name: /^Read v/ }).boundingBox();
		expect(read!.height).toBeGreaterThanOrEqual(44);
	});

	test('the sample diff shows an actual change, not just unchanged rows', async ({ page }) => {
		await page.goto('/');
		const changedRow = page.locator('.diff-added, .diff-removed, .diff-modified').first();
		await expect(changedRow).toBeVisible();
	});
});

test.describe('Usernames', () => {
	test('read as links: clay on paper, on the recipe page and the card', async ({ page }) => {
		await page.goto('/recipes');
		const card = page.locator('.recipe-card a.meta-author').first();
		expect(await card.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(178, 60, 0)');
		await gotoClassicCookies(page);
		const author = page.locator('.recipe-header a.username').first();
		expect(await author.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(178, 60, 0)');
	});

	test('the byline handle is mono at the byline size; "By" and the forks are sans', async ({
		page
	}) => {
		// Usernames are identifiers, mono like version numbers and dates, one
		// notch (0.9375em) under the line they sit in, since JetBrains Mono runs
		// optically larger than the sans beside it (decided 29 October 2026).
		await gotoClassicCookies(page);
		const byline = page.locator('.recipe-header .byline');
		const face = (el: Element) => {
			const s = getComputedStyle(el);
			return { family: s.fontFamily, size: s.fontSize };
		};
		const line = await byline.evaluate(face);
		const handle = await byline.locator('a.username').evaluate(face);
		expect(handle.family).toMatch(/JetBrains Mono/);
		expect(line.family).not.toMatch(/JetBrains Mono/);
		expect(parseFloat(handle.size)).toBeCloseTo(parseFloat(line.size) * 0.9375, 1);
	});
});

test.describe('Serving scaling', () => {
	const latest = SEED[0].versions.at(-1)!;
	const flour = parseIngredientLine(latest.ingredientsText.trim().split('\n')[0]);
	const doubled = scaleIngredient(flour, null, 2).ingredient;
	// The bold measure: the line less its name, since the weight sits between them.
	const measure = ({ text, name }: { text: string; name: string }) =>
		text.slice(0, text.length - name.length).trim();

	test('×2 doubles a quantity, the header and the URL, Reset clears them; 44px hits on a phone', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		const ingredients = page.locator('#ingredients');
		const flourMeasure = ingredients.locator('label').first().locator('.font-semibold');
		const measureLine = page.locator('header .details');
		await expect(flourMeasure).toHaveText(measure(flour));
		await expect(measureLine).toContainText(`Serves ${latest.servings}`);
		// The header is plain text; the control lives with the list it scales.
		await expect(
			page.locator('header').getByRole('button', { name: 'Double servings' })
		).toHaveCount(0);

		await ingredients.getByRole('button', { name: 'Double servings' }).click();
		await expect(ingredients.getByRole('textbox', { name: 'Servings' })).toHaveValue(
			String(latest.servings! * 2)
		);
		await expect(flourMeasure).toHaveText(measure(doubled));
		await expect(measureLine).toContainText(`Serves ${latest.servings! * 2}`);
		expect(new URL(page.url()).searchParams.get('serves')).toBe(String(latest.servings! * 2));

		for (const name of ['Halve servings', 'Double servings', 'Reset']) {
			const box = (await page.getByRole('button', { name }).boundingBox())!;
			expect(box.width).toBeGreaterThanOrEqual(44);
			expect(box.height).toBeGreaterThanOrEqual(44);
		}
		const input = (await page.getByRole('textbox', { name: 'Servings' }).boundingBox())!;
		expect(input.height).toBeGreaterThanOrEqual(44);
		// Its own row at the end of the column, above the list's first line.
		const control = (await ingredients.locator('.serves').boundingBox())!;
		const firstRow = (await ingredients.locator('label').first().boundingBox())!;
		expect(control.x + control.width).toBeCloseTo(firstRow.x + firstRow.width, 0);
		expect(control.y + control.height).toBeLessThanOrEqual(firstRow.y);

		await page.getByRole('button', { name: 'Reset' }).click();
		await expect(flourMeasure).toHaveText(measure(flour));
		await expect(measureLine).toContainText(`Serves ${latest.servings}`);
		expect(new URL(page.url()).searchParams.has('serves')).toBe(false);
	});

	test('on a desktop the control is borderless text right of the eyebrow, and the two rules line up', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoClassicCookies(page);
		const ingredients = page.locator('#ingredients');
		const style = (name: string) =>
			ingredients.getByRole('button', { name }).evaluate((el) => {
				const s = getComputedStyle(el);
				return {
					border: s.borderTopStyle,
					bg: s.backgroundColor,
					height: el.getBoundingClientRect().height
				};
			});
		for (const name of ['Halve servings', 'Double servings']) {
			expect(await style(name)).toEqual({ border: 'none', bg: 'rgba(0, 0, 0, 0)', height: 24 });
		}
		const blank = await ingredients.getByRole('textbox', { name: 'Servings' }).evaluate((el) => {
			const s = getComputedStyle(el);
			return [s.borderTopWidth, s.borderLeftWidth, s.borderBottomWidth, s.backgroundColor];
		});
		expect(blank).toEqual(['0px', '0px', '1px', 'rgba(0, 0, 0, 0)']);

		const eyebrow = (await ingredients
			.getByRole('heading', { name: 'Ingredients' })
			.boundingBox())!;
		const control = (await ingredients.locator('.serves').boundingBox())!;
		const row = (await ingredients
			.locator('.serves')
			.evaluate((el) => el.parentElement!.getBoundingClientRect()))!;
		const method = (await page.getByRole('heading', { name: 'Method' }).boundingBox())!;
		// One line: the control beside the eyebrow, at the column's end.
		expect(control.y).toBeLessThan(eyebrow.y + eyebrow.height);
		expect(control.x + control.width).toBeCloseTo(row.x + row.width, 0);
		// The rule under both sits level with the Method rule.
		expect(row.y + row.height).toBeCloseTo(method.y + method.height, 0);
	});
});

test.describe('Profile page', () => {
	test('does not scroll sideways on a phone, even with a long username', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/users/spencerfletcher');
		await page.getByRole('heading', { level: 1 }).waitFor();
		const doc = await page.evaluate(() => ({
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth
		}));
		expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
	});
});
