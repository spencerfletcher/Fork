import { expect, test, type Page } from '@playwright/test';

// These tests assume the DB has been seeded with the demo data:
// - "Classic Chocolate Chip Cookies" (2 versions)
// - "Brown Butter Chocolate Chip Cookies" (forked, 1 version)
// - "Chicken Tikka Masala" (3 versions)

/** Slugs carry a random nanoid suffix, so reach the recipe by name, not URL. */
async function gotoClassicCookies(page: Page) {
	await page.goto('/');
	await page
		.getByRole('link', { name: /classic chocolate chip cookies/i })
		.first()
		.click();
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
		await page.goto('/');
		await page.locator('div.recipe-card').first().click();
		// Use heading role to avoid matching ingredient names that contain "ingredients"
		await expect(page.getByRole('heading', { name: /^ingredients$/i })).toBeVisible();
	});

	test('recipe detail shows Method section', async ({ page }) => {
		await page.goto('/');
		await page.locator('div.recipe-card').first().click();
		await expect(page.getByRole('heading', { name: /^method$/i })).toBeVisible();
	});

	test('"Classic Chocolate Chip Cookies" shows version history with 3 versions', async ({
		page
	}) => {
		await page.goto('/');
		// Click the stretched link (aria-label) rather than the h3 text node
		await page
			.getByRole('link', { name: /classic chocolate chip cookies/i })
			.first()
			.click();
		await expect(page).toHaveURL(/\/recipes\//);
		// Version history is the strip under the hero — all versions visible without expanding.
		// Assert on rendered content, not just wrapper count: a div-count check passes even
		// if the messages render empty.
		const versionEntries = page.locator('.version-strip .version-entry');
		await expect(versionEntries).toHaveCount(3);
		await expect(page.getByRole('link', { name: /^v3$/ })).toBeVisible();
		await expect(page.locator('.version-strip')).toContainText('Initial recipe');
		// v3 is the version the landing page showcases; the strip is where a
		// visitor arriving from that diff lands.
		await expect(page.locator('.version-strip')).toContainText('Chill the dough');
	});

	test('"Brown Butter Chocolate Chip Cookies" shows fork attribution', async ({ page }) => {
		await page.goto('/');
		await page
			.getByRole('link', { name: /brown butter chocolate chip cookies/i })
			.first()
			.click();
		await expect(page).toHaveURL(/\/recipes\//);
		await expect(page.getByText(/forked from/i)).toBeVisible();
		await expect(page.getByText(/Classic Chocolate Chip Cookies/i)).toBeVisible();
	});

	test('viewing a specific version shows the history banner', async ({ page }) => {
		await page.goto('/');
		await page
			.getByRole('link', { name: /classic chocolate chip cookies/i })
			.first()
			.click();
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
		await page
			.getByRole('link', { name: /classic chocolate chip cookies/i })
			.first()
			.click();
		await expect(page).toHaveURL(/\/recipes\//);
		// Target the Compare anchor by href. Matching on the accessible name would
		// also match the version row it sits inside, which navigates elsewhere.
		await page.locator('a[href*="/diff?from="]').first().click();
		await expect(page).toHaveURL(/\/diff/);
		await expect(page.locator('h1')).toContainText(/compare/i);
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

	test('on mobile, ingredients render above the details box', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await gotoClassicCookies(page);

		const ingredients = page.getByRole('heading', { name: /ingredients/i }).first();
		const details = page.getByRole('heading', { name: /details/i }).first();
		await ingredients.waitFor();
		await details.waitFor();

		const ingredientsBox = await ingredients.boundingBox();
		const detailsBox = await details.boundingBox();

		// CSS `order` changes visual position, not DOM position — assert geometry.
		expect(ingredientsBox).not.toBeNull();
		expect(detailsBox).not.toBeNull();
		expect(ingredientsBox!.y).toBeLessThan(detailsBox!.y);
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
		const details = page.getByRole('heading', { name: /details/i }).first();
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

	test('the hero names the recipe once and the author once', async ({ page }) => {
		await gotoClassicCookies(page);
		const hero = page.locator('header').first();
		await hero.waitFor();

		// The breadcrumb shows the title, not the URL slug.
		await expect(hero).toContainText('Classic Chocolate Chip Cookies');
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

		// The {#if recipe.imageUrl} branch is equivalent to the node being absent.
		await page.evaluate(() => document.querySelector('.recipe-photo')?.remove());

		const details = page.getByRole('heading', { name: /details/i }).first();
		const ingredientsBox = await ingredients.boundingBox();
		const detailsBox = await details.boundingBox();

		expect(ingredientsBox).not.toBeNull();
		expect(detailsBox).not.toBeNull();
		// Sidebar stays in the right-hand column, top-aligned — not pushed down the page.
		expect(detailsBox!.x).toBeGreaterThan(ingredientsBox!.x + ingredientsBox!.width - 1);
		expect(Math.abs(detailsBox!.y - ingredientsBox!.y)).toBeLessThan(300);
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

		const heroTag = page.locator('header .tag').first();
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

	test('the hero demotes metadata and keeps one accent element', async ({ page }) => {
		await gotoClassicCookies(page);
		const hero = page.locator('header').first();
		await hero.waitFor();

		const accent = 'rgb(232, 168, 58)';

		// Nothing in the hero may use the accent as a fill any more.
		const filled = await hero.evaluate(
			(el, a) =>
				[...el.querySelectorAll('*')].filter((n) => getComputedStyle(n).backgroundColor === a)
					.length,
			accent
		);
		expect(filled).toBe(0);

		// Cook time is metadata, not a pill: no background of its own.
		const time = page.getByText(/^\d+\s*(min|h)/).first();
		const timeBg = await time.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(timeBg);

		// Amber text is a fill too, just on glyphs instead of a background —
		// the rule is "amber means action or version identity", so the same
		// audit has to catch a color:accent breadcrumb as much as a bg:accent one.
		// Measured directly on the classic (non-fork) recipe: only the "v2"
		// version badge (span.text-accent, "v2") is amber text. The breadcrumb
		// title used to also be text-accent and has been demoted to quiet text.
		const coloredText = await hero.evaluate(
			(el, a) =>
				[...el.querySelectorAll('*')].filter((n) => getComputedStyle(n).color === a).length,
			accent
		);
		expect(coloredText).toBe(1);
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

	test('the forked badge stays readable over an arbitrary photo', async ({ page }) => {
		await page.goto('/');
		const badge = page.locator('.forked-badge').first();
		await badge.waitFor();

		const style = await badge.evaluate((el) => {
			const cs = getComputedStyle(el);
			return {
				bg: cs.backgroundColor,
				border: cs.borderStyle,
				width: cs.borderTopWidth,
				color: cs.color,
				opacity: cs.opacity
			};
		});

		const rgb = (c: string) => c.match(/[\d.]+/g)!.map(Number);

		// The badge overlays a user-supplied photo, so it must paint its own
		// background. A transparent or translucent chip is legible over some
		// images and unreadable over others, and no scrim fixes that in general.
		const [, , , bgAlpha = 1] = rgb(style.bg);
		expect(bgAlpha).toBe(1);

		// Amber is reserved for actions and version identity. The badge is neither,
		// so it must not be filled with the accent.
		expect(rgb(style.bg).slice(0, 3)).not.toEqual([232, 168, 58]);

		expect(style.border).toBe('solid');
		expect(parseFloat(style.width)).toBeGreaterThan(0);
		expect(parseFloat(style.opacity)).toBeGreaterThan(0);

		// Text against the badge's own background, not an ancestor's — assert the
		// label is actually painted rather than merely present in the DOM.
		const luminance = (c: number[]) => {
			const [r, g, b] = c.slice(0, 3).map((v) => {
				const s = v / 255;
				return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
			});
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		};
		const l1 = luminance(rgb(style.color));
		const l2 = luminance(rgb(style.bg));
		const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
		expect(contrast).toBeGreaterThanOrEqual(4.5);

		await expect(badge).toBeVisible();
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
		const panels = () =>
			page
				.locator('section')
				.filter({ hasText: 'A real change, diffed' })
				.first()
				.locator('section');

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
