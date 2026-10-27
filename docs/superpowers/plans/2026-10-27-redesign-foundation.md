# Redesign Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the locked design system's tokens, fonts, base styles and navbar into the app so every page renders on the new palette before any page is restyled.

**Architecture:** One stylesheet, `src/app.css`, holds every token and the shared component classes; pages consume tokens through Tailwind's `@theme inline` registration and CSS variables. This step rewrites the token values in place and keeps every existing token name alive as an alias, so no page breaks before its own step. Fonts move from Google Fonts to self-hosted `@fontsource` packages. The navbar is the one component restyled here because every page shares it.

**Tech Stack:** SvelteKit 2, Svelte 5, Tailwind 4 (`@theme inline`), Vitest, `@fontsource/*`.

**Spec:** `docs/research/2026-10-26-ui-design-directions.md`, sections "Round 4" and "Round 5", and the canvas at https://claude.ai/artifact/QFTDpwCLRwuknh754yNPzc (Focus ring board, mobile nav on every 390px board).

## Global Constraints

- Branch `redesign`; every task commits there. No Co-Authored-By lines.
- Light tokens: paper `#F7F3EC`, surface `#FFFDF9`, ink `#1A1714`, ink-2 `#4A443E`, ink-3 `#6F6960`, rule `#E4DED4`, input border `#D9D3C8`, clay `#A4512B` (text accent only), marigold `#E8A83A` (the only fill, ink text on it), add `#2F6B37` on `#E6F0E3`, remove on `#F6E3E0`, tint `#F5E9E0` (no-photo panel, hover tint), nav `#1A1408` with tan `#B8A880` links and paper `#F7F3EC` for the brand and the active link.
- Remove text ships as `#922D23`, not the spec's `#A3362B`: removed diff rows render at opacity 0.85 (VersionDiff.svelte) and the spec value blends to 4.15:1 against paper, under the e2e threshold. `#922D23` blends to 4.79:1. Revisit when the compare step drops the opacity.
- Type: Bitter 500 for headings (600 only for the brand mark), Source Sans 3 for body and UI with tabular figures, JetBrains Mono for the author line, version numbers, strip, commit messages and diff. Self-hosted, never a Google Fonts request.
- Focus: `:focus-visible` only, 2px solid clay with 2px offset; inside the navbar, marigold. No rule hides it after a click.
- Dark mode deferred: the `[data-theme='dark']` block is removed, nothing replaces it.
- Radii: sm 4px (chips), md 6px (buttons, inputs, cards), lg 8px (photos), pill 100px (tag pills).
- Grid: 2 columns under 700px, 3 to 1100px, 4 above.
- Every colour pair the app draws text with clears 4.5:1; the token test pins the pairs listed in Task 2.

## Review Focus

- Links on the dark recipe hero: `text-accent` turns clay, 2.4:1 on espresso. The hero is replaced in the recipe step; until then the author link and version chip there must keep using tan or marigold, never `text-accent`. Task 2 Step 7 covers it.
- The primary button's hover: marigold has no hover token in the spec. Task 2 fixes `--color-marigold-hover` at `#D99A2C` so hover darkens rather than fades.
- A visitor tabbing through the page sees the ring on every control, including the marigold button (ring sits outside the fill on paper) and the nav brand. Task 3 asserts the nav search link is a real `<a>`.
- `.tag` pills still appear on the hero, the card and the editor until their steps land; with the new border token they must stay visible on paper and on espresso. Task 2 Step 7 covers `.tag--on-dark`.
- Fonts load from the bundle, so the Content Security Policy must stop allowing the Google hosts, or a stale cached stylesheet keeps loading from them. Task 1 removes both hosts from `vite.config.ts`.

---

### Task 1: Self-hosted fonts

**Files:**
- Modify: `package.json` (dependencies)
- Modify: `src/app.html:11-17` (remove preconnect and stylesheet links)
- Modify: `src/app.css:1` (font imports after the Tailwind import)
- Modify: `vite.config.ts:38-42` (`style-src`, `font-src`)

**Interfaces:**
- Produces: the font families `'Bitter'`, `'Source Sans 3'`, `'JetBrains Mono'` available to any stylesheet by name. Task 2 points the `--font-*` tokens at them.

- [ ] **Step 1: Install the three packages**

Run: `pnpm add @fontsource/bitter @fontsource/source-sans-3 @fontsource/jetbrains-mono`
Expected: three new entries under `dependencies`, lockfile updated.

- [ ] **Step 2: Import the weights the system uses**

At the top of `src/app.css`, after `@import 'tailwindcss';`:

```css
@import '@fontsource/bitter/500.css';
@import '@fontsource/bitter/600.css';
@import '@fontsource/source-sans-3/400.css';
@import '@fontsource/source-sans-3/500.css';
@import '@fontsource/source-sans-3/600.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/600.css';
```

- [ ] **Step 3: Remove the Google Fonts links**

Delete the two `<link rel="preconnect">` lines and the `<link href="https://fonts.googleapis.com/…">` from `src/app.html`. Remove `'https://fonts.googleapis.com'` from `style-src` and `'https://fonts.gstatic.com'` from `font-src` in `vite.config.ts`, keeping `'data:'`.

- [ ] **Step 4: Verify no external font request survives**

Run: `grep -rn "fonts.g" src vite.config.ts`
Expected: no output.

Run: `pnpm build 2>&1 | tail -3`
Expected: build completes; the `.svelte-kit/output/client/_app/immutable/assets/` folder contains `.woff2` files for Bitter, Source Sans 3 and JetBrains Mono.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/app.html src/app.css vite.config.ts
git commit -m "Self-host Bitter, Source Sans 3 and JetBrains Mono"
```

---

### Task 2: Tokens, base styles and shared classes

**Files:**
- Create: `src/app.css.test.ts`
- Modify: `src/app.css` (the `:root` block, the `[data-theme='dark']` block, `@layer base`, `@layer components`)
- Modify: `src/routes/recipes/[slug]/components/RecipeHero.svelte` (only the classes named in Step 7)

**Interfaces:**
- Consumes: the font families from Task 1.
- Produces: token names, all registered in `@theme inline` so the matching Tailwind utilities exist:
  - kept, revalued: `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-navbar-bg`, `--color-hero-bg`, `--color-text`, `--color-text-2`, `--color-text-3`, `--color-text-cream`, `--color-text-tan`, `--color-text-bronze`, `--color-accent` (now clay), `--color-accent-mid` (now ink, the clay hover), `--color-accent-pale` (now the tint), `--color-sienna` (now ink), `--color-paprika` (now remove), `--color-tag`, `--color-tag-border`, `--color-tag-hover-bg`, `--color-border`, `--color-border-2`, `--color-add`, `--color-add-bg`, `--color-remove`, `--color-remove-bg`, `--font-serif`, `--font-sans`, `--font-mono`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`.
  - new: `--color-marigold` `#E8A83A`, `--color-marigold-hover` `#D99A2C`, `--color-tint` `#F5E9E0`, `--color-input-border` `#D9D3C8`.
  - classes: `.btn-primary` (marigold fill, ink text, radius md), `.btn-ghost` (1px ink outline, ink text, radius md), `.recipe-grid` at the new breakpoints.

- [ ] **Step 1: Write the failing token test**

`src/app.css.test.ts` reads `src/app.css` with `node:fs`, parses every `--name: #hex;` line inside `:root` into a map, and asserts with a WCAG contrast helper (the same formula as `e2e/recipe.test.ts:164`):

```ts
const pairs: [string, string, number][] = [
	['--color-text', '--color-bg', 4.5],
	['--color-text-2', '--color-bg', 4.5],
	['--color-text-3', '--color-bg', 4.5],
	['--color-text-3', '--color-surface', 4.5],
	['--color-accent', '--color-bg', 4.5],
	['--color-accent', '--color-tint', 4.5],
	['--color-add', '--color-add-bg', 4.5],
	['--color-remove', '--color-remove-bg', 4.5],
	['--color-text', '--color-marigold', 4.5],
	['--color-text-tan', '--color-navbar-bg', 4.5],
	['--color-text-cream', '--color-navbar-bg', 4.5],
	['--color-marigold', '--color-navbar-bg', 3]
];
test.each(pairs)('%s on %s clears %s:1', (fg, bg, min) => {
	expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
});
test('exact values the design locked', () => {
	expect(tokens['--color-bg']).toBe('#f7f3ec');
	expect(tokens['--color-accent']).toBe('#a4512b');
	expect(tokens['--color-marigold']).toBe('#e8a83a');
	expect(tokens['--color-remove']).toBe('#922d23');
});
test('no dark theme block', () => {
	expect(css).not.toContain("[data-theme='dark']");
});
test('fonts are the locked families', () => {
	expect(tokens['--font-serif']).toMatch(/^'Bitter'/);
	expect(tokens['--font-sans']).toMatch(/^'Source Sans 3'/);
	expect(tokens['--font-mono']).toMatch(/^'JetBrains Mono'/);
});
```

Lower-case the hex values when parsing. Font tokens are parsed from the same block as strings.

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run src/app.css.test.ts`
Expected: FAIL on the exact-value test (`--color-bg` is `#faf4e8`) and the dark theme test.

- [ ] **Step 3: Rewrite the `:root` block**

Values from Global Constraints. Aliases: `--color-surface-2` = paper, `--color-hero-bg` = `#1A1408`, `--color-text-cream` = paper, `--color-text-tan` and `--color-text-bronze` = `#B8A880`, `--color-accent-mid` = ink, `--color-accent-pale` = tint, `--color-sienna` = ink, `--color-paprika` = remove, `--color-tag` = ink-2, `--color-tag-border` = input border, `--color-tag-hover-bg` = tint, `--color-border` = rule, `--color-border-2` = input border. Shadows unchanged. Fonts: `'Bitter', Georgia, serif`, `'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif`, `'JetBrains Mono', 'Fira Code', monospace`. Radii per Global Constraints. Register the four new tokens in `@theme inline`. Delete the whole `[data-theme='dark']` block and the two comments in `:root` that describe it. Keep the comment on why `--color-remove` is darker, updated to the new numbers.

- [ ] **Step 4: Rewrite `@layer base`**

`body`: `font-variant-numeric: tabular-nums`. `h1`, `h2`: `font-weight: 500`. `h4` and `.eyebrow-label`: `color: var(--color-text-3)`, `font-size: 0.6875rem` (11px), `letter-spacing: 0.08em`, weight 600. `a`: `color: var(--color-accent)`; `a:hover`: `color: var(--color-text)`. Inputs: `border: 1px solid var(--color-input-border)`, `border-radius: var(--radius-md)`. Replace the `input:focus, textarea:focus, select:focus` rule with:

```css
:focus-visible {
	outline: 2px solid var(--color-accent);
	outline-offset: 2px;
}
```

- [ ] **Step 5: Rewrite the shared classes**

`.btn-primary`: `background: var(--color-marigold)`, `color: var(--color-text)`, `border-radius: var(--radius-md)`, `padding: 12px 16px`, `font-size: 0.9375rem`; hover `background: var(--color-marigold-hover)`. `.btn-ghost`: `border: 1px solid var(--color-text)`, `color: var(--color-text)`, `border-radius: var(--radius-md)`, `padding: 11px 16px`; hover `background: var(--color-tint)`. `.recipe-grid`: `repeat(2, 1fr)` default, `repeat(3, 1fr)` at `min-width: 700px`, `repeat(4, 1fr)` at `min-width: 1100px`. `.back-link:hover`: `color: var(--color-text)`. `.diff-open-link`, `.commit-bar__versions`: unchanged (they read `--color-accent`, now clay). `.dialog-title`: weight 500.

- [ ] **Step 6: Run the token test**

Run: `pnpm vitest run src/app.css.test.ts`
Expected: PASS, every pair.

- [ ] **Step 7: Keep the dark hero readable until its step**

In `RecipeHero.svelte`, change every `text-accent` to `text-marigold` (version number, any link on the espresso surface). Leave `.tag--on-dark` as is: its border is a white alpha, unaffected by tokens.

Run: `grep -n "text-accent" "src/routes/recipes/[slug]/components/RecipeHero.svelte"`
Expected: no output.

- [ ] **Step 8: Whole suite and type check**

Run: `pnpm check && pnpm test:unit run`
Expected: `svelte-check found 0 errors`; every unit test passes (no test asserts on a colour value).

- [ ] **Step 9: Commit**

```bash
git add src/app.css src/app.css.test.ts "src/routes/recipes/[slug]/components/RecipeHero.svelte"
git commit -m "Tokens: locked palette, Bitter and Source Sans 3, focus ring, no dark block"
```

---

### Task 3: Navbar

**Files:**
- Modify: `src/lib/components/ui/Navbar.svelte`
- Test: `src/lib/components/ui/Navbar.svelte.test.ts`

**Interfaces:**
- Consumes: `--color-marigold`, `--color-marigold-hover`, `--color-text-tan`, `--color-text-cream`, `--color-navbar-bg`, `--font-serif`, `--radius-md` from Task 2.
- Produces: the navbar markup every later page sits under. No new exports.

- [ ] **Step 1: Write the failing tests**

Append to the `describe('Navbar')` block:

```ts
test('mobile nav has a search icon link beside the menu toggle', () => {
	render(Navbar, { props: { user: null } });
	const icon = screen
		.getAllByRole('link', { name: 'Search' })
		.find((l) => l.getAttribute('aria-label') === 'Search');
	expect(icon).toHaveAttribute('href', '/search');
});

test('the new recipe control reads "+ New recipe"', () => {
	render(Navbar, { props: { user: makeUser('chef@example.com') } });
	expect(screen.getAllByRole('link', { name: '+ New recipe' }).length).toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/lib/components/ui/Navbar.svelte.test.ts`
Expected: FAIL, both: no link with `aria-label="Search"`; the control reads "+ New Recipe".

- [ ] **Step 3: Restyle the navbar**

Markup changes: the bar is `h-14` on desktop, `h-[52px]` under `md`; next to the menu toggle, visible only under `md`, an `<a href="/search" aria-label="Search">` sized 44×44 with an inline stroke magnifier SVG (`aria-hidden="true"`), colour tan; CTA text "+ New recipe"; mobile menu list order unchanged.

Style changes in the component's `<style>`: `.nav-brand` Bitter 600 at `1.375rem`, paper; the dot `text-marigold`; `.navbar-link` Source Sans 500 at `0.875rem`, tan, active and hover paper; `.nav-cta` marigold fill, ink text, `border-radius: var(--radius-md)`, padding `7px 14px`, weight 600, hover `--color-marigold-hover`; the `@username` link mono `0.75rem` tan; `.nav-menu-toggle` and the search link 44×44; add

```css
nav :focus-visible {
	outline-color: var(--color-marigold);
}
```

- [ ] **Step 4: Run the navbar tests**

Run: `pnpm vitest run src/lib/components/ui/Navbar.svelte.test.ts`
Expected: PASS, all tests including the two new ones.

- [ ] **Step 5: Look at it**

Run: `pnpm dev` and open `/`, `/recipes` and one recipe at 1200px and 390px.
Expected: espresso bar, paper brand with marigold dot, tan links, marigold "+ New recipe" with ink text; at 390px the search icon sits left of the menu toggle; Tab shows a marigold ring in the bar and a clay ring on the page.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/ui/Navbar.svelte src/lib/components/ui/Navbar.svelte.test.ts
git commit -m "Navbar: locked palette, Bitter brand, mobile search icon, marigold focus"
```

---

### Task 4: End-to-end check

**Files:** none changed.

- [ ] **Step 1: Run the e2e suite against a local database**

Run: `pnpm test:e2e`
Expected: PASS. The two contrast tests in `e2e/recipe.test.ts` (diff rows at 4.5:1 with the row opacity, tags on card and hero) are the ones this step can break; both clear with the values in Global Constraints.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 3: Record the shipped remove value**

In `docs/research/2026-10-26-ui-design-directions.md`, after the Round 5 external-review paragraph, one sentence: the shipped remove text is `#922D23` because removed diff rows render at 0.85 opacity and the locked `#A3362B` blends under 4.5:1; return to the locked value when the compare step drops the opacity.

```bash
git add docs/research/2026-10-26-ui-design-directions.md
git commit -m "Design directions: shipped remove tone and why"
```
