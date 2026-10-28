# Redesign — Edit and New Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the recipe form and its two pages (`/recipes/new`, `/recipes/[slug]/edit`) on the locked system: two-column editor at desktop, eyebrow labels, growing textareas, Save beside Cancel with a helper line that states the outcome, the generated commit message as the placeholder, and a navigation guard on a dirty form, matching the round-5 Edit boards at desktop and 390px.

**Architecture:** The server actions and validation stay as they are. One pure helper turns the form's draft strings into the change groups the server already computes (`changedGroups`), so the helper line and the placeholder agree with the message the server would generate. `RecipeForm.svelte` gets the layout, the actions row and the guard; the two pages get the header. Tests stay at page level, as they are today.

**Tech Stack:** SvelteKit 2 (`beforeNavigate`), Svelte 5 runes, zod schema already in `validation.ts`, scoped CSS on tokens, Vitest + Testing Library, Playwright.

**Spec:** `docs/research/2026-10-26-ui-design-directions.md`, "Round 5" (fixes adopted, final corrections, external review) and the "as built" paragraphs; the canvas at https://claude.ai/artifact/QFTDpwCLRwuknh754yNPzc, boards "Edit" and "Edit — 390px". Tokens: the foundation plan's Global Constraints.

## Global Constraints

- Branch `redesign`; every task commits there. No Co-Authored-By lines. Tests before markup.
- Column: content `max-width: 864px` centred (the board is 960px with 48px gutters). Header: `a.back-link` "← {recipe title}" on edit only; `h1` "Edit recipe" / "New recipe" in Bitter 500 `2.125rem` (`1.625rem` under 700px) line-height 1.1, clay; on edit a mono `0.75rem` ink-3 "Editing v{n}" beside it on the baseline (under it on a phone).
- Form grid: from 860px up `grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 28px`; left column title, description, photo, the serves/prep/cook row, tags, public checkbox; right column ingredients and steps. Under 860px one column in the same order as the phone board: title, description, photo, serves/prep/cook, tags, public, ingredients, steps. Then full width: the commit message field (edit only) above a `1px dotted var(--color-input-border)` rule, then the actions row.
- Labels are eyebrows: `0.6875rem` 600, `0.08em` tracking, uppercase, ink-3 (the `.field label` and `.field-legend` rules in `app.css` change to this). Copy: "Title", "Description", "Photo", "Serves", "Prep (min)", "Cook (min)", "Tags", "Ingredients", "Steps", "What changed?" with "optional" after it in ink-3 and no tracking. The public checkbox label stays "Make this recipe public" with "· applies to every version" in `0.75rem` ink-3 on the same line, replacing today's hint paragraph.
- Inputs: sans `0.9375rem`, `padding: 9px 12px`; ingredients and steps textareas mono `0.8125rem` line-height 1.6; every field `1rem` under 700px so iOS does not zoom. Textareas get `field-sizing: content` with their `rows` as the fallback minimum (description 3, ingredients 11, steps 14) and `resize: vertical`.
- Actions row: `button.btn-primary` "Save" (edit) or "Create recipe" (new), `a.btn-ghost` "Cancel" to the recipe (edit) or `/recipes` (new), then `span.form-hint` helper. Under 700px Save takes `flex: 1`, Cancel sits beside it, the helper centred underneath.
- Helper line on edit, from the dirty check: nothing when clean; content groups changed → "Saves as v{n+1} · {groups} changed" where groups are the changed groups' names joined with ", " and the last with " and " (`ingredients and steps`, `servings, ingredients and steps`); only settings (tags, visibility) changed → "Saves settings · no new version". On new the helper stays "Unsaved changes" when dirty. A commit message alone is not a change (as today).
- Commit message placeholder: `generatedCommitMessage(groups)` when content groups changed ("Updated ingredients, steps"), otherwise "What changed in this version?". Input mono `0.8125rem`.
- Navigation guard: with unsaved changes and not submitting, `beforeNavigate` cancels unless `confirm('Leave without saving? Your changes will be lost.')` is accepted; for `type === 'leave'` (tab close, hard reload) it cancels, which makes the browser show its own prompt. The guard never fires on the submit's own redirect.
- Photo block: the preview is `height: 150px` (160px under 700px) radius md with the existing remove button; the file input keeps its dashed box. TagInput keeps its current chips-above-input structure; only the chip and input colours follow the tokens already in `app.css`. No new hex values.

## Review Focus

- A draft that fails validation (blank title, negative time): the helper line must not throw or claim a version; it shows nothing for content and the placeholder falls back. Task 1 Step 1 asserts an invalid draft gives no groups.
- A photo change alone (new file chosen, or current photo removed) is a content change: "Saves as v{n+1} · photo changed". Task 2 Step 1.
- Submitting a dirty form must not trigger the guard on the redirect that follows. Task 2 Step 1 asserts the guard stays quiet while submitting.
- The keyboard: Tab order is title → description → photo → serves → prep → cook → tags → public → ingredients → steps → message → Save → Cancel at every width, because the two-column grid reorders nothing in the DOM. Task 3 looks at it.
- A phone with the ingredients textarea grown to forty lines: the page scrolls, nothing is clipped, Save is reachable. Task 3 Step 1 e2e types forty lines and asserts the Save button is in the document flow below the textarea.

---

### Task 1: Draft change groups

**Files:**

- Modify: `src/lib/recipes/validation.ts` (add `parseDraftContent`)
- Create: `src/lib/recipes/draftChanges.ts`
- Test: `src/lib/recipes/draftChanges.test.ts`

**Interfaces:**

- Consumes: `recipeContentSchema` (module-private in `validation.ts`), `changedGroups` and `generatedCommitMessage` from `src/lib/recipes/content.ts`, `RecipeDraft`.
- Produces: `parseDraftContent(draft: RecipeDraft): Result<ContentFields>` in `validation.ts`, the same schema `parseContent` uses, fed from the draft's strings. `draftChangedGroups(baseline: RecipeDraft, draft: RecipeDraft, photoChanged: boolean): ContentGroup[]` in `draftChanges.ts`: both drafts parsed with `parseDraftContent`; if either fails, `[]`; else `changedGroups` of the two with `imageUrl: null`, plus `'photo'` inserted at its `CONTENT_GROUPS` position when `photoChanged`. `describeGroups(groups: ContentGroup[]): string` joins with ", " and a final " and " (`['ingredients']` → "ingredients"; `['ingredients','steps']` → "ingredients and steps"; three → "servings, ingredients and steps").

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, test, expect } from 'vitest';
import { draftChangedGroups, describeGroups } from './draftChanges.js';
import type { RecipeDraft } from './validation.js';

const base: RecipeDraft = {
	title: 'Cookies',
	description: '',
	servings: '4',
	prepTimeMinutes: '10',
	cookTimeMinutes: '20',
	ingredients: '1 cup flour\n2 eggs',
	steps: 'Mix.\n\nBake.',
	commitMessage: '',
	editRevision: '3',
	isPublic: true,
	tags: ['Dessert'],
	hadPhoto: false,
	removeImage: false
};

describe('draftChangedGroups', () => {
	test('an untouched draft changes nothing', () => {
		expect(draftChangedGroups(base, { ...base }, false)).toEqual([]);
	});

	test('whitespace and a commit message are not changes', () => {
		const draft = {
			...base,
			title: ' Cookies ',
			ingredients: '1 cup flour\n\n2 eggs \n',
			commitMessage: 'x'
		};
		expect(draftChangedGroups(base, draft, false)).toEqual([]);
	});

	test('lists changed groups in the server order', () => {
		const draft = { ...base, steps: 'Mix well.\n\nBake.', servings: '8' };
		expect(draftChangedGroups(base, draft, false)).toEqual(['servings', 'steps']);
	});

	test('a photo change is a group of its own, in order', () => {
		expect(draftChangedGroups(base, { ...base, title: 'Biscuits' }, true)).toEqual([
			'title',
			'photo'
		]);
	});

	test('tags and visibility are settings, not content', () => {
		expect(draftChangedGroups(base, { ...base, isPublic: false, tags: [] }, false)).toEqual([]);
	});

	test('an invalid draft reports no groups rather than throwing', () => {
		expect(draftChangedGroups(base, { ...base, title: '', prepTimeMinutes: '-5' }, false)).toEqual(
			[]
		);
	});
});

describe('describeGroups', () => {
	test('joins with commas and a final and', () => {
		expect(describeGroups(['ingredients'])).toBe('ingredients');
		expect(describeGroups(['ingredients', 'steps'])).toBe('ingredients and steps');
		expect(describeGroups(['servings', 'ingredients', 'steps'])).toBe(
			'servings, ingredients and steps'
		);
	});
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/lib/recipes/draftChanges.test.ts` Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`validation.ts`: `export function parseDraftContent(draft: RecipeDraft): Result<ContentFields>` calling `parse(recipeContentSchema, { title: draft.title, description: draft.description, servings: draft.servings, prepTimeMinutes: draft.prepTimeMinutes, cookTimeMinutes: draft.cookTimeMinutes, ingredients: draft.ingredients, steps: draft.steps })`. `draftChanges.ts` per Interfaces; the photo insert is `CONTENT_GROUPS.filter((g) => g === 'photo' ? photoChanged : changed.includes(g))`.

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run src/lib/recipes/draftChanges.test.ts src/lib/recipes` Expected: PASS, including the existing content and validation tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recipes/validation.ts src/lib/recipes/draftChanges.ts src/lib/recipes/draftChanges.test.ts
git commit -m "Draft change groups: the form can say what a save will write, in the server's terms"
```

---

### Task 2: The form and its two pages

**Files:**

- Modify: `src/lib/components/recipes/RecipeForm.svelte`, `src/lib/components/recipes/IngredientEditor.svelte` (rows 11), `src/lib/components/recipes/StepEditor.svelte` (rows 14)
- Modify: `src/routes/recipes/[slug]/edit/+page.svelte`, `src/routes/recipes/new/+page.svelte`
- Modify: `src/app.css` (`.form`, `.field label`, `.field-legend`, `.field-row`, `.form-actions`, `.form-hint`, `.inline-checkbox`, textarea sizing, the 700px font size)
- Test: `src/routes/recipes/[slug]/edit/page.svelte.test.ts`, `src/routes/recipes/new/page.svelte.test.ts`

**Interfaces:**

- Consumes: `draftChangedGroups`, `describeGroups` from Task 1; `generatedCommitMessage` from `content.ts`; `beforeNavigate` from `$app/navigation`.
- Produces: `RecipeForm` props as today plus `cancelHref: string` and `nextVersion?: number` (edit passes `latestVersion.versionNumber + 1`; its presence switches the helper from "Unsaved changes" to the outcome line and enables the commit field, replacing `withCommitMessage`). Markup: `form.form` > `fieldset` > `div.form-grid` (two `div.form-col`), then `div.field.field-message` (when `nextVersion`), then `div.form-actions` with `button.btn-primary`, `a.btn-ghost`, `span.form-hint`. Pages: `div.page` > `div.editor` > `div.editor-header` (`a.back-link`, `div.editor-title` with `h1` and `span.editing`), then the form. Labels per Global Constraints.

- [ ] **Step 1: Change the tests**

Both test files mock `$app/navigation`: `const nav = vi.hoisted(() => ({ guards: [] as ((n: { cancel: () => void; type: string }) => void)[] })); vi.mock('$app/navigation', () => ({ beforeNavigate: (fn: never) => nav.guards.push(fn) }));` and clear `nav.guards` in `beforeEach`. Edit tests: every `getByLabelText(/servings/i)` becomes `/serves/i`, `/prep time/i` becomes `/^prep/i`, the button name `'Save changes'` becomes `'Save'`; the four "Unsaved changes" assertions become the helper line (`'Saves as v3 · title changed'` after typing a title; `screen.queryByText(/Saves as/)` null when restored; the failed-draft test expects `'Saves as v3 · servings, times changed'` for `failed({ servings: '', prepTimeMinutes: '-5' })` — no: that draft is invalid, so expect `screen.queryByText(/Saves as/)` to be null and `screen.getByRole('alert')` present). Add to the edit file:

```ts
test('shows the version the save will write and what changed', async () => {
	render(EditPage, { props: { data: makeData(), form: null } });
	expect(screen.queryByText(/Saves as/)).toBeNull();
	await fireEvent.input(screen.getByLabelText('Ingredients'), {
		target: { value: '1 cup flour\n3 eggs' }
	});
	await fireEvent.input(screen.getByLabelText('Steps'), {
		target: { value: 'Mix.\n\nBake longer.' }
	});
	expect(screen.getByText('Saves as v3 · ingredients and steps changed')).toBeInTheDocument();
	expect(screen.getByLabelText(/what changed/i)).toHaveAttribute(
		'placeholder',
		'Updated ingredients, steps'
	);
});

test('a settings-only change says no version will be written', async () => {
	render(EditPage, { props: { data: makeData(), form: null } });
	await fireEvent.click(screen.getByLabelText(/public/i));
	expect(screen.getByText('Saves settings · no new version')).toBeInTheDocument();
});

test('removing the photo counts as a content change', async () => {
	render(EditPage, { props: { data: makeData({ imageUrl: 'https://img/c.jpg' }), form: null } });
	await fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
	expect(screen.getByText('Saves as v3 · photo changed')).toBeInTheDocument();
});

test('the placeholder falls back when nothing has changed', () => {
	render(EditPage, { props: { data: makeData(), form: null } });
	expect(screen.getByLabelText(/what changed/i)).toHaveAttribute(
		'placeholder',
		'What changed in this version?'
	);
});

test('a dirty form asks before navigating away and cancels on no', async () => {
	vi.spyOn(window, 'confirm').mockReturnValue(false);
	render(EditPage, { props: { data: makeData(), form: null } });
	await fireEvent.input(title(), { target: { value: 'Biscuits' } });
	const cancel = vi.fn();
	nav.guards[0]({ cancel, type: 'link' });
	expect(cancel).toHaveBeenCalled();
});

test('a clean form navigates away without asking', () => {
	const confirm = vi.spyOn(window, 'confirm');
	render(EditPage, { props: { data: makeData(), form: null } });
	const cancel = vi.fn();
	nav.guards[0]({ cancel, type: 'link' });
	expect(confirm).not.toHaveBeenCalled();
	expect(cancel).not.toHaveBeenCalled();
});

test('the guard stays quiet while the form is submitting', async () => {
	const confirm = vi.spyOn(window, 'confirm');
	render(EditPage, { props: { data: makeData(), form: null } });
	await fireEvent.input(title(), { target: { value: 'Biscuits' } });
	await startSubmit();
	const cancel = vi.fn();
	nav.guards[0]({ cancel, type: 'goto' });
	expect(confirm).not.toHaveBeenCalled();
	expect(cancel).not.toHaveBeenCalled();
});

test('has Cancel back to the recipe beside Save, and the header names the version', () => {
	render(EditPage, { props: { data: makeData(), form: null } });
	expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/recipes/cookies');
	expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Edit recipe');
	expect(screen.getByText('Editing v2')).toBeInTheDocument();
});
```

New page: `getByLabelText(/prep time/i)` becomes `/^prep/i`; add `test('has Cancel to the recipe list', …)` asserting the Cancel link's href is `/recipes` and that `screen.queryByLabelText(/what changed/i)` is null; "Unsaved changes" tests stay.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run "src/routes/recipes/[slug]/edit/page.svelte.test.ts" src/routes/recipes/new/page.svelte.test.ts` Expected: FAIL on the renamed labels, the Save name, the helper line, the guard (no `beforeNavigate` registered) and Cancel.

- [ ] **Step 3: Rewrite the form, the two pages and the shared CSS**

`RecipeForm.svelte`: props per Interfaces; `const groups = $derived(nextVersion ? draftChangedGroups(baseline, draft, chosenPreview !== null || draft.removeImage) : [])`; `const settingsChanged = $derived(serialise-style comparison of isPublic and normalised tags)`; helper text per Global Constraints; placeholder `groups.length ? generatedCommitMessage(groups) : 'What changed in this version?'`; `beforeNavigate((n) => { if (!dirty || submitting) return; if (n.type === 'leave' || !confirm('Leave without saving? Your changes will be lost.')) n.cancel(); })`. Layout and labels per Global Constraints; the `IngredientEditor` and `StepEditor` keep their own `div.field` and only change `rows`. Pages: header per Interfaces, `nextVersion={(latestVersion?.versionNumber ?? 0) + 1}` and `cancelHref="/recipes/{recipe.slug}"` on edit, `cancelHref="/recipes"` on new. `app.css`: `.field label, .field-legend` to the eyebrow values; `.form-grid` and `.form-col` with the 860px breakpoint; `textarea { field-sizing: content; resize: vertical }`; under 700px `input:not([type='checkbox']), textarea, select { font-size: 1rem }`; `.form-actions` phone rule; keep `.required`.

- [ ] **Step 4: Run the tests, the SSR tests, check and lint**

Run: `pnpm vitest run src/routes/recipes && pnpm check && pnpm lint` Expected: PASS, 0 errors, clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/recipes/ src/routes/recipes/new/ "src/routes/recipes/[slug]/edit/" src/app.css
git commit -m "Recipe form on the locked system: two columns, eyebrow labels, growing textareas, Save beside Cancel with the outcome, generated message as placeholder, navigation guard"
```

---

### Task 3: E2e, look, record

**Files:**

- Modify: `e2e/authenticated.test.ts` (Save button name; append two tests)
- Modify: `docs/research/2026-10-26-ui-design-directions.md`, `docs/ROADMAP.md`

- [ ] **Step 1: Update and add e2e**

Every `getByRole('button', { name: /save changes/i })` becomes `getByRole('button', { name: 'Save', exact: true })`. Append to the "Edit recipe page" describe:

```ts
test('leaving a dirty editor asks first, and staying keeps the draft', async ({ page }) => {
	const url = await createRecipe(page, 'E2E Guard', '4');
	try {
		await gotoHydrated(page, `${url}/edit`);
		await page.locator('input[name="title"]').fill('E2E Guard Edited');
		page.once('dialog', (d) => d.dismiss());
		await page.getByRole('link', { name: 'Cancel' }).click();
		await expect(page).toHaveURL(/\/edit$/);
		await expect(page.locator('input[name="title"]')).toHaveValue('E2E Guard Edited');
	} finally {
		await deleteRecipe(page, url);
	}
});

test('the helper line states the version a save will write', async ({ page }) => {
	const url = await createRecipe(page, 'E2E Helper', '4');
	try {
		await gotoHydrated(page, `${url}/edit`);
		await page.getByLabel('Steps').fill('Mix, then bake.');
		await expect(page.getByText('Saves as v2 · steps changed')).toBeVisible();
		await expect(page.locator('input[name="commitMessage"]')).toHaveAttribute(
			'placeholder',
			'Updated steps'
		);
	} finally {
		await deleteRecipe(page, url);
	}
});

test('a long ingredient list grows the editor on a phone and Save stays below it', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 900 });
	const url = await createRecipe(page, 'E2E Grow', '4');
	try {
		await gotoHydrated(page, `${url}/edit`);
		const box = page.getByLabel('Ingredients');
		await box.fill(Array.from({ length: 40 }, (_, i) => `${i + 1} cup item ${i + 1}`).join('\n'));
		const textarea = await box.boundingBox();
		const save = await page.getByRole('button', { name: 'Save', exact: true }).boundingBox();
		expect(textarea!.height).toBeGreaterThan(600);
		expect(save!.y).toBeGreaterThan(textarea!.y + textarea!.height);
	} finally {
		await deleteRecipe(page, url);
	}
});
```

- [ ] **Step 2: Run the whole e2e suite**

Run: `pnpm test:e2e` Expected: all pass, 0 failed.

- [ ] **Step 3: Look at it**

Dev server signed in (the seed user; use the e2e auth state or sign in by hand), screenshots of the cookies edit page and `/recipes/new` at 1200 and 390. Compare against the two Edit boards. Expected: back link, clay h1 with "Editing v3" beside it, two columns 5:7 with eyebrow labels, mono textareas, dotted rule above "What changed? optional", Save marigold beside Cancel outlined and the helper after them; at 390 one column, 16px fields, Save full width beside Cancel, helper centred below.

- [ ] **Step 4: Record and close out**

One paragraph after the "Compare page, as built" paragraph in the design doc: the helper line and the placeholder are computed from the same change groups the server uses, so they agree with the generated message; a settings-only save says so; the guard uses the browser's confirm and lets the browser handle tab-close itself; TagInput keeps chips above the input rather than inside it. `docs/ROADMAP.md`: mark the redesign item done with the date and list what moved to the backlog during it (in-place tag filter, section overflow, None.png removal, nav highlight on tag pages).

```bash
git add e2e/authenticated.test.ts docs/research/2026-10-26-ui-design-directions.md docs/ROADMAP.md
git commit -m "Editor e2e for the guard, the helper line and the growing textarea; redesign closed out in the docs"
```
