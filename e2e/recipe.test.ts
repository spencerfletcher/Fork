import { expect, test, type Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';

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

	test('viewing a specific version says so in the bar, with the way back', async ({ page }) => {
		await page.goto('/recipes');
		await page.getByRole('link', { name: COOKIES_RE }).first().click();
		await page.waitForURL(/\/recipes\//);
		// Append ?version=2 to the current recipe URL
		const recipeUrl = page.url().split('?')[0];
		await page.goto(`${recipeUrl}?version=2`);
		await page.waitForLoadState('networkidle');
		// The bar reads "v2 · <message> · Older version · Back to v3 · 3 versions".
		const bar = page.locator('.version-bar');
		await expect(bar).toContainText('Older version');
		await expect(bar.locator('.current .version-number')).toContainText('v2');
		await expect(bar.locator('.current .message')).toContainText(SEED[0].versions[1].commitMessage);
		await expect(page.getByRole('link', { name: 'Back to v3' })).toBeVisible();
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

		// ── Removed: reverse the compared range (v2 → v1) so "espresso powder" —
		// present in v2, absent in v1 — renders as a genuinely removed whole row
		// on its --color-remove-bg background. No fixture recipe has a real cross-version deletion, so the
		// reversed range is what produces one without hardcoding a slug or altering
		// seed data.
		const diffUrl = new URL(page.url());
		diffUrl.searchParams.set('from', '2');
		diffUrl.searchParams.set('to', '1');
		await page.goto(diffUrl.toString());

		// The row's computed opacity (1 since the redesign) still enters the blend,
		// so a future fade would be measured rather than assumed away.
		const removedRow = page.locator('div.diff-removed').first();
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

	test('on an iPad the older-version controls drop under the note and the tabs keep their gap', async ({
		page
	}) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await gotoClassicCookies(page);
		await page.goto(`${page.url().split('?')[0]}?version=2`);
		const note = await page.locator('.version-bar .current .message').boundingBox();
		const controls = await page.locator('.version-bar .current .controls').boundingBox();
		expect(note!.width).toBeGreaterThan(400);
		expect(controls!.y).toBeGreaterThanOrEqual(note!.y + note!.height - 1);
		const bar = await page.locator('.version-bar').boundingBox();
		const tabs = await page.locator('.section-tabs').boundingBox();
		expect(tabs!.y - (bar!.y + bar!.height)).toBeGreaterThanOrEqual(16);
	});

	test('on a phone every link and button in the bar is 44px tall', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);
		await page.getByRole('button', { name: '3 versions' }).click();
		const short = await page
			.locator('.version-bar a, .version-bar button')
			.evaluateAll((els) =>
				els
					.map((el) => ({ text: el.textContent!.trim(), h: el.getBoundingClientRect().height }))
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
					.map((el) => ({ text: el.textContent!.trim(), h: el.getBoundingClientRect().height }))
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
			height: el.getBoundingClientRect().height,
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

	test('the bar’s separators are drawn, not typed, and a phone line never starts or ends with one', async ({
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
		expect(await dots()).toEqual(['none', '"· "', '"· "']);
		expect(await controls.textContent()).not.toContain('·');
		// Phone: the items wrap with a 10px gap and no dots, so no line can
		// begin or end with one.
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto(`${recipeUrl}?version=2`);
		expect(await dots()).toEqual(['none', 'none', 'none']);
		expect(await controls.evaluate((el) => getComputedStyle(el).columnGap)).toBe('10px');
	});

	test('the measure’s dots are visible: Ink 3, not a rule colour', async ({ page }) => {
		await gotoClassicCookies(page);
		const dot = page.locator('.details .dot').first();
		expect(await dot.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(111, 105, 96)');
	});

	test('on a phone the closed note shows two lines; on a desktop one', async ({ page }) => {
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
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoClassicCookies(page);
		expect((await measure()).lines).toBe(1);
	});

	test('the hero photo is fetched first and decoded off the main thread', async ({ page }) => {
		await gotoClassicCookies(page);
		const img = page.locator('.recipe-photo img');
		await expect(img).toHaveAttribute('fetchpriority', 'high');
		await expect(img).toHaveAttribute('decoding', 'async');
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
		// The primary CTA must lead to the actual public recipe index, not the
		// auth-gated "My Recipes" page — /search with no query lists every
		// visible recipe for a guest.
		await expect(browseLink).toHaveAttribute('href', '/search');
		await expect(page.locator('.diff-content').first()).toBeVisible();
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

	test('the landing page shares its left edge with browse', async ({ page }) => {
		await page.setViewportSize({ width: 1200, height: 900 });
		await page.goto('/recipes');
		const browse = await page.getByRole('heading', { level: 1 }).boundingBox();
		await page.goto('/');
		const hero = await page.getByRole('heading', { level: 1 }).boundingBox();
		const diff = await page.getByRole('heading', { name: 'A real change, diffed' }).boundingBox();
		expect(Math.abs(hero!.x - browse!.x)).toBeLessThan(1);
		expect(Math.abs(diff!.x - browse!.x)).toBeLessThan(1);
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
				.filter({ has: page.getByRole('heading', { name: /^(Ingredients|Steps)$/ }) });

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

	test('the compare page splits the diff on a wide screen and stacks it on a phone', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1440, height: 1800 });
		await gotoClassicCookies(page);
		await page.goto(page.url().split('?')[0] + '/diff');
		const panels = page.locator('section').filter({ has: page.locator('.eyebrow-label') });
		const ingredients = panels.filter({
			has: page.getByRole('heading', { name: 'Ingredients', exact: true })
		});
		const steps = panels.filter({ has: page.getByRole('heading', { name: 'Steps', exact: true }) });
		const a = await ingredients.boundingBox();
		const b = await steps.boundingBox();
		expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
		expect(b!.x).toBeGreaterThan(a!.x + a!.width - 1);

		await page.setViewportSize({ width: 390, height: 1800 });
		const a2 = await ingredients.boundingBox();
		const b2 = await steps.boundingBox();
		expect(b2!.y).toBeGreaterThan(a2!.y + a2!.height - 40);
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
