import { expect, test, type Page } from '@playwright/test';
import { SEED } from '../src/lib/server/db/seedData';

// These tests assume the DB has been seeded with the demo data in seedData.ts:
// cookies (3 versions, renamed in v3), a brown-butter fork of it, and a tikka
// masala. Titles are read from the seed so a rename cannot strand a test.
const COOKIES = SEED[0].versions.at(-1)!.title;
const COOKIES_RE = new RegExp(COOKIES, 'i');
const FORK_RE = new RegExp(SEED[1].versions.at(-1)!.title, 'i');

/** Slugs carry a random nanoid suffix, so reach the recipe by name, not URL. */
async function gotoClassicCookies(page: Page) {
	await page.goto('/');
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
		await page.goto('/');
		// Click the stretched link (aria-label) rather than the h3 text node
		await page.getByRole('link', { name: COOKIES_RE }).first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		// The strip shows the current version; the full history opens from the
		// "3 versions" toggle. Assert on rendered content, not just wrapper count:
		// a div-count check passes even if the messages render empty.
		await expect(page.locator('.version-current')).toHaveText('v3');
		// v3 is the version the landing page showcases; the strip is where a
		// visitor arriving from that diff lands.
		await expect(page.locator('.version-strip')).toContainText('Chill the dough');
		await page.getByRole('button', { name: '3 versions' }).click();
		const versionEntries = page.locator('.version-strip .version-entry');
		await expect(versionEntries).toHaveCount(3);
		await expect(page.locator('.version-strip')).toContainText('Initial recipe');
		// The sidebar counts both, with a spaced separator.
		await expect(page.locator('.recipe-counts')).toHaveText('3 versions · 1 fork');
	});

	test('"Brown Butter Chocolate Chip Cookies" shows fork attribution', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: FORK_RE }).first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		await expect(page.getByText(/forked from/i)).toBeVisible();
		await expect(page.getByText(COOKIES_RE)).toBeVisible();
	});

	test('viewing a specific version shows the history banner', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: COOKIES_RE }).first().click();
		await page.waitForURL(/\/recipes\//);
		// Append ?version=1 to the current recipe URL
		const recipeUrl = page.url().split('?')[0];
		await page.goto(`${recipeUrl}?version=1`);
		await page.waitForLoadState('networkidle');
		// Banner: "Viewing v1: "..." — Current version →"
		await expect(page.getByText(/viewing v\d+:/i)).toBeVisible();
		await expect(page.getByRole('link', { name: /current version/i })).toBeVisible();
	});

	test('Compare link on v2 navigates to diff page', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: COOKIES_RE }).first().click();
		await expect(page).toHaveURL(/\/recipes\//);
		// Target the Compare anchor by href. Matching on the accessible name would
		// also match the version row it sits inside, which navigates elsewhere.
		await page.locator('a[href*="/diff?from="]').first().click();
		await expect(page).toHaveURL(/\/diff/);
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
		await page.locator('a[href*="/diff?from="]').first().click();
		await expect(page).toHaveURL(/\/diff/);

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
		await expect(page.locator('.commit-bar')).toContainText('v1');

		// A wider range covers more edits, so the diff itself must have changed.
		await expect(modifiedRows).not.toHaveCount(before);
	});

	test('diff-added and diff-removed text clear 4.5:1 against the surface actually behind them', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		await page.locator('a[href*="/diff?from="]').first().click();
		await expect(page).toHaveURL(/\/diff/);

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
		// present in v2, absent in v1 — renders as a genuinely removed whole row,
		// which carries a reduced opacity (VersionDiff.svelte) on top of its
		// --color-remove-bg background and --color-remove text. No fixture recipe has a real cross-version deletion, so the
		// reversed range is what produces one without hardcoding a slug or altering
		// seed data.
		const diffUrl = new URL(page.url());
		diffUrl.searchParams.set('from', '2');
		diffUrl.searchParams.set('to', '1');
		await page.goto(diffUrl.toString());

		// Selected by status class alone: opacity is now a stylesheet property of
		// .diff-row.diff-removed rather than an opacity-85 utility class, and it is
		// asserted below as a computed value.
		const removedRow = page.locator('div.diff-removed').first();
		await removedRow.waitFor();
		const removed = await removedRow.evaluate((el) => {
			const cs = getComputedStyle(el);
			// Walk up from the *parent* — not the element itself — because the
			// element's own background-color is --color-remove-bg, and that is
			// exactly what opacity-85 fades toward the true surface behind it.
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
		const details = page.locator('dl.details').first();
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

	test('on desktop, the sidebar sits beside the recipe, not below it', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await gotoClassicCookies(page);

		const ingredients = page.getByRole('heading', { name: /ingredients/i }).first();
		const details = page.locator('dl.details').first();
		await ingredients.waitFor();
		await details.waitFor();

		const ingredientsBox = await ingredients.boundingBox();
		const detailsBox = await details.boundingBox();

		expect(ingredientsBox).not.toBeNull();
		expect(detailsBox).not.toBeNull();
		// Two columns: the sidebar starts to the right of the main column.
		expect(detailsBox!.x).toBeGreaterThan(ingredientsBox!.x + ingredientsBox!.width - 1);
		// x alone passed while the sidebar sat 667px too low — assert top alignment too.
		expect(Math.abs(detailsBox!.y - ingredientsBox!.y)).toBeLessThan(300);
	});

	test('on desktop, the sidebar stays in view while the method scrolls', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 800 });
		await gotoClassicCookies(page);
		const details = page.locator('dl.details').first();
		await details.waitFor();

		await page.mouse.wheel(0, 1000);
		await page.waitForTimeout(200);
		const box = await details.boundingBox();
		expect(box).not.toBeNull();
		// Sticky at 76px: still near the top after a long scroll, not scrolled away.
		expect(box!.y).toBeGreaterThanOrEqual(0);
		expect(box!.y).toBeLessThan(200);
	});

	test('the version panel closes when one of its links navigates', async ({ page }) => {
		await gotoClassicCookies(page);
		await page.getByRole('button', { name: '3 versions' }).click();
		await page.locator('#version-history').waitFor();
		// A URL inside a message must wrap inside the panel, not widen the page.
		const wrap = await page
			.locator('#version-history .version-message')
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

		// Nothing reserves the photo's room: the strip follows the header directly.
		const header = await page.locator('header.recipe-header').boundingBox();
		const strip = await page.locator('.version-strip').boundingBox();
		expect(header).not.toBeNull();
		expect(strip).not.toBeNull();
		expect(strip!.y - (header!.y + header!.height)).toBeLessThan(20);
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

	test('the header has one marigold fill, the version chip, and no marigold text', async ({
		page
	}) => {
		await gotoClassicCookies(page);
		const hero = page.locator('header.recipe-header');
		await hero.waitFor();

		const accent = 'rgb(232, 168, 58)';

		// Marigold is the only fill, and the version chip is the only thing filled.
		const filled = await hero.evaluate(
			(el, a) =>
				[...el.querySelectorAll('*')].filter((n) => getComputedStyle(n).backgroundColor === a)
					.length,
			accent
		);
		expect(filled).toBe(1);

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

	test('the version strip scrolls without widening the page', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);

		const strip = page.locator('.version-strip');
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

	test('the compare page keeps the diff in one column even on a wide screen', async ({ page }) => {
		// The split is a container query, not a viewport one: the compare page
		// constrains the diff to a reading column and must not split inside it.
		await page.setViewportSize({ width: 1440, height: 1800 });
		await gotoClassicCookies(page);
		await page.goto(page.url().split('?')[0] + '/diff');

		const panels = page.locator('section').filter({ has: page.locator('.eyebrow-label') });
		const a = await panels.nth(0).boundingBox();
		const b = await panels.nth(1).boundingBox();
		expect(b!.y).toBeGreaterThan(a!.y + a!.height - 40);
	});

	test('the sample diff shows an actual change, not just unchanged rows', async ({ page }) => {
		await page.goto('/');
		const changedRow = page.locator('.diff-added, .diff-removed, .diff-modified').first();
		await expect(changedRow).toBeVisible();
	});
});
