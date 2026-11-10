# CSS complexity audit, 10 November 2026

HEAD `24e3875`. Read-only sweep for rules that add convolution for no gain. Skipped: Navbar/MoreMenu/Dropdown, `.btn-sm`, `.clear-ticks`, `.commit-bar*`, `.inline-checkbox*`, FormActions `.danger` (a builder is changing those), a11y target sizes, focus rings, forced colours, reduced motion, tokens, and anything DESIGN.md decides.

## Summary

- `<style>` blocks: 3,489 lines across 62 `.svelte` files (top: recipe page 252, VersionBar 234, RecipeCard 206). `src/app.css`: 1,306 lines.
- Distinct breakpoints: 8 (13 literal values, because each is written as both a max and a min). Table below.
- Method: a Playwright probe (dev server on :5297, seed login) removed each declaration in app.css (base and components layers) and in every Svelte `<style>`, one at a time, and compared each matched element's computed value. 22 pages, 2 or 3 widths each (390/820/1280). "Tested" below means that probe showed no computed change on any page. State-only rules (`:hover`, open menus, error states) were not exercised, so those findings are "reasoned".
- The main finding: **about 110 declarations restate Tailwind preflight or the global `a`/`button`/`h1–h4` styles.** Svelte styles are unlayered and app.css is layered, so none of them is fighting anything. They are leftovers.
- Findings by category: 1 undo-only 11 · 2 reservations/magic numbers 12 · 3 redundant with cascade/shared class 19 · 4 layout indirection 6 · 5 dead/unreachable 3 · 6 comment debt 6 · 7 Tailwind mix 4.
- Dead selectors: apart from the builder's `.commit-bar*`/`.inline-checkbox*`, every app.css class and every probe-unmatched component selector greps to a real use (all of them state-dependent). The repo is clean on that front.
- Estimated removable: about 250 lines of CSS, plus 19 redundant utility tokens in markup.

## Top 15 (ranked by lines × files / risk)

| # | Where | Delete / replace | Evidence |
|---|---|---|---|
| 1 | ~20 files: `margin: 0` on h1/p/figure/form/ul (app.css:602,624,935,969,1111,1176,1180,1210; RecipeCard:212,272; JournalEntry:107,143,155; friends:161,196,228; FeedEntry:114,180,189; Discover:219; users:126,133; signup:177; reset-password:58; VersionDiff:235,266; diff:226; ChoiceGroup:55,94; TagInput:277; ConfirmStep:151; journal:83) | Delete. Preflight zeroes every element's margin and no base rule adds one back | Tested where matched; the rest reasoned |
| 2 | Button/fieldset/ul resets: `padding:0`, `border:0/none`, `background:none/transparent`, `font:inherit`, `list-style:none`, `box-sizing` (app.css:462,498-501,676-678,967-968; VersionBar:233-236; recipe page:327-329; TagInput:233-235,281; GTE:443-444,480; ChoiceGroup:53-54,64; Discover:220-221; EntryForm:309-310; PhotoField:149) | Delete. Preflight already does each one. Not ServesControl's `input` (it overrides the base input look) | Tested (probe "none") on all matched |
| 3 | `text-decoration: none` on links and buttons: app.css:506,682; CookLink:38; TabBar:88; Username:38; Discover:132,159,242; cookbook:142; recipe page:338; VersionBar:161,215; RecipeHeader:205,229,256; +layout:93 | Delete all 16. The base `a` rule already sets `none` | Tested |
| 4 | `cursor: pointer` on `<button>`/`<a>`: app.css:445,467,507,683; VersionBar:237; recipe page:330; GTE:448; TagInput:238 | Delete. Base `button{cursor:pointer}` covers buttons, and links already get it from the browser. Keep it on labels, `li` and the `.current` div | Tested |
| 5 | RecipeHeader.svelte:202-215, 228-234, 253-261 | Delete the `.byline :global(a), .stats a` color and decoration, the `.tags a` rules, the `.personal a` color and decoration, and all three `:hover` rules (about 17 lines). They restate global `a`/`a:hover`. Keep `font-weight: 600` | color/decoration tested; hover reasoned |
| 6 | VersionBar.svelte:212-239 `.versions-toggle` | Hand-rolled `.text-btn`: inline-flex, centred, gap, no box, clay, clay-deep hover. Use `class="text-btn"` and keep only the local `::before` hit and `[aria-expanded]` ink. About 14 lines | padding/border/bg/font/cursor tested |
| 7 | app.css:434-471 `.btn-primary` / `.btn-ghost` | Nine identical declarations: put them in one `.btn-primary, .btn-ghost {}` group. Drop `font-family` and `cursor` (tested no-ops) and `color` in both `:hover` rules (components layer already beats base `a:hover`). About 14 lines | font/cursor tested; hover reasoned |
| 8 | Eyebrow voice declared four times: app.css h4 339-346, `.field label,.field-legend` 879-887, `.eyebrow-label` 1285-1293, recipe page `.section-tabs button` 331-337 | Make it one selector list in app.css, and have `.section-tabs button` take `.eyebrow-label` plus its 0.8125rem. About 18 lines | Reasoned |
| 9 | app.css:1292 `.eyebrow-label { margin: 0 }`, 639-640 comment, 738 doubled selector | Delete the margin (preflight). Then `.eyebrow-label.section-heading` can become `.section-heading` (both uses carry both classes), and the stray "Both classes…" comment sitting above `.tag-tabs` goes too | Margin tested |
| 10 | recipe page:244-248, 285-288, 381-385 explicit `grid-column`/`grid-row` on `aside`/`.main`, then reset ≤1023 | Delete all three placements (7 lines). The aside is first in the DOM, so auto-placement gives the same columns, and on a phone the hidden tab is `display:none`. Keep `align-self: stretch` | Reasoned (DOM order checked) |
| 11 | recipe page:322-339 `.section-tabs button` | Delete `display:block`, `border:0`, `background:none`, `cursor`, `font-family`, `text-align`, `text-decoration`. 7 lines, all no-ops | Tested |
| 12 | VersionBar.svelte:265 and 352 `.history{gap:0}` (plus the "old 10px less a row's 6px" comment), 341-343 `.version-bar .version-link{display:inline-flex}`, 200/208 `.controls` declared twice | Delete both gaps (0 is the default), delete the phone display override (a flex item is blockified, so it changes nothing), merge the two `.controls` rules. About 10 lines | Tested (gap, display) |
| 13 | FormActions.svelte:40-42 and 57-61, app.css:1001 | Three flex-wrap rules across two files: base `wrap`, then `nowrap` from 700, then app.css `wrap` ≤699. Keep app.css's ≤699 `wrap` only and delete 6 lines. Sequence after the `.danger` builder lands | Base `wrap` tested no-op |
| 14 | JournalEntry.svelte:274-280 phone `.jday b, .jday span { margin:0; font-size/weight/color: inherit }` | Undo-only. Move the desktop `.jday b`/`.jday span` rules (118-129) into `@media (min-width:700px)` and delete the reset (−6) | Reasoned |
| 15 | Six versions of "padding pulled back by margin" for hits, each with its own px: `.hit-link` 4/11, `.back-link` 4/11, `.auth-switch a` 2/12, `.arrow-link,.empty-state a` 9, Discover `.empty a` 10 (no negative margin, so the text moves), cookbook `.cookbook-none a` 10 (same) | Route them through `.hit-link`, and give `.back-link` `.hit-link` plus `display:block; width:fit-content`. About 20 lines. Risk: the px differ because the line-heights differ, so re-measure each target | Reasoned; sizes not re-measured |

## Breakpoints

| Value | Uses | Job | Merge? |
|---|---|---|---|
| `max-width: 699px` / `min-width: 700px` | 34 + 3 coarse-or + 3 | The phone | Already one breakpoint |
| `width < 699px` | 1 (app.css:1095, `.clear-ticks`, builder's) | The phone | **Off by one**: it excludes 699px, unlike every other phone query. Should be `max-width: 699px` |
| `max-width: 767px` / `min-width: 768px` | 3 + 4 (+ Tailwind `md:` in Navbar) | Tab bar, navbar, cookbook filter row, profile "+ New" | One breakpoint. Decided in DESIGN.md (768) |
| `max-width: 1023px` / `min-width: 1024px` | 4 + 1 | Recipe page and friends one-column, VersionBar wrap, card dot-drop, SearchFilters | One breakpoint (Tailwind `lg`) |
| `max-width: 599px` / `min-width: 600px` | 1 + 2 | Cookbook/Discover grids go to 2 columns, roomy card titles | Could fold into 700. A taste call: changes 600–699 layouts |
| `min-width: 1100px` | 2 | Grids go to 4/3 columns | Keep |
| `max-width: 899px` | 1 (Discover lead stacks) | Lead goes to one column | Merge with 859 (one "two-column content" step), or with 1023 |
| `max-width: 859px` | 1 (app.css:988 editor `.form-grid`) | Editor goes to one column | See 899 |
| `max-width: 359px` | 1 (RecipeActions, nested) | 320 phones | Keep (stated need) |

## Long tail by category

### 1. Rules that only undo other rules
- recipe page:200-202 then 297-299: no-photo hero gets 40px, then a reset to 24px ≤1023. Put the 40px inside `min-width:1024px` (−3).
- recipe page:255-273 sticky sidebar then 387-392 un-sticky ≤1023 (4 props). Move the sticky set into `min-width:1024px` (−5).
- recipe page:175-177 `.body { padding-block: 0 }` exists only to cancel `.page`'s vertical padding. Fine as is; the alternative is a `.page--inline` modifier. Low value.
- RecipeCard.svelte:356-359: roomy titles reset to the base 1.0625rem ≤699, only for 600–699. Write `.recipe-card:not(.recipe-card--roomy)` in the ≤699 rule (−4). Reasoned; 600–699 not probed.
- friends:236-249, 292-298, 306-312: `.link-row` goes column, then row ≤1023, then column ≤699; `.btn-ghost` goes flex-start, then stretch. One `@media (700px ≤ width ≤ 1023px)` rule for the row (−5).
- friends:147-150 `.feed > :first-child { border-top:0; padding-top:0 }` cancels each entry's top rule. Use `* + *` borders. Reasoned.
- friends:176-182 then 278-286: `.rail` sticky flex, then static grid ≤1023. Desktop-only sticky in a min-width query (−2).
- VersionDiff.svelte:246-261: every row gets `border-bottom`, then `:last-child` and `.diff-item > .diff-row` remove it. `.diff-panel > * + * { border-top }` (−5). Reasoned.
- VersionDiff:293-295 `.diff-content--meta { max-width: none }` undoes the 72ch cap. Apply the cap with `:not(--meta)` (−3).
- RecipeCard:297-305 hides `.dot-list`'s dots ≤1023 and swaps in a gap. This is the stated behaviour ("no wrapped line starts with a dot") and it already lives in VersionBar too, so a shared `.dot-list--wrap` would serve both. Optional.

### 2. Artificial reservations and magic numbers
- RecipeActions.svelte:247 `padding: 8px 18px 8px 16px` on the pills: asymmetric with no comment (f439936). Probably optical compensation for the leading icon. Make it symmetric, or name the reason.
- DESIGN.md:324 still says "Save is at least 112px wide beside Cancel", but the rule is gone from code (yesterday's removal). This is doc drift: fix the sentence.
- cookbook:136/192 `.seg a { min-height: 38px }`, phone 40px, under a comment saying "44px hits". The comment and the numbers disagree. One of them is wrong (unverified which).
- Off-scale gaps and paddings with no token or comment: `.form-actions` gap 14px (app.css:985), `.cookbook-filters` 14px, `.lock-note` 12px 14px, `.card-panel` 15px, `.meta-row` 5px, `.picker__caret` right 11px, `.content-layout` padding-top 26px, `.editor-header` margin-bottom 18px, `.field-message` padding-top 18px, Discover `.discover-filters` 28px. Each is a candidate for `--space-*`. A taste call; none is harmful.
- VersionBar:309/361 `margin-left: 36px` twice: this is `min-width: 26px` + `gap: 10px`. Use `calc()` or a local custom property, so the chip width and the indent cannot drift apart.
- Kept as justified: `.tag-tabs button[data-label]::after` 600-weight ghost (stops neighbours moving on press); VersionBar `.version-number{min-width:26px}` (aligns the messages).

### 3. Redundant with the cascade or a shared class
- `.field-required` (app.css:893-895): `font-family`, `font-size`, `color` are inherited from the label (−3, tested).
- `.field-tags` (app.css:966-970) is a fieldset reset that preflight already does. Delete the rule (−5, tested). Same for ChoiceGroup `.choice-group` padding/margin and `.field-legend` padding (tested).
- `.auth-submit { width: 100% }` (app.css:1204): it is a stretched flex item already (tested).
- `.auth-page { background: var(--color-bg) }` (app.css:1125) matches body (reasoned).
- `.editor { max-width; margin: 0 auto }` (app.css:916-919) is `.page-inner`. Add the class in new/edit and delete 4 lines (reasoned).
- `.browse-header { min-width: 0 }` (app.css:620): no effect (tested).
- RecipeCard:210-217: `font-size: 1.0625rem` and `.card-title{color}` restate h3 (tested). `.meta-item:not(.vid){font-family}` (tested).
- Discover `.lead-title` `font-family`/`font-weight` restate h2 (tested); `.lead { color; text-decoration }` sits on a non-link.
- users:126 `.profile-text h1 { margin:0; overflow-wrap:anywhere }`: both restate base h1 (tested).
- RecipeHeader:150 `.recipe-header { gap: 0 }` is the default. `font-size: 1rem` on `.byline`/`.stats`/`.tags`/`.personal` equals body (tested on three of the four).
- EntryForm `@≤699 #recipe { font-size: 1rem }` duplicates the base phone input rule (tested).
- GroupedTextEditor:476-493 `.ed` re-types the base input look. `display`, `width`, `box-sizing`, `color`, `caret-color`, `font-family` are no-ops (tested, −6). The rest could join the base selector as `[contenteditable]`.
- GTE `.tool` `color`/`background`/`cursor` (tested). TagInput `.tag-remove` `height`/`padding`/`border`/`background`/`cursor`/`color` (tested on the edit page).
- RecipeActions:296-299 `width: 100%` on grid-item buttons, which already stretch (tested, −4).
- ChoiceGroup `.choice svg` width/height match the svg's attributes (tested). PhotoField `.photo,.photo-empty` `display`/`width` (tested).
- Diff page:225-231 `.version-card__message` `margin`/`color` (tested).
- Grid items in `minmax(0, …)` tracks do not need `min-width: 0` (the spec only applies the automatic minimum on `auto` tracks): recipe page `.hero-text`, `aside.min-w-0`, `.main.min-w-0`, JournalEntry `.jhead`/`.jbody`, friends `.req .nm`, diff `.picker`. Reasoned (the probe saw a computed change but no rect change).

### 4. Layout indirection
- VersionBar:144-155: the `.current`/`.history li`/`.version-link` shared flex rule followed by per-child flex overrides. Fine.
- cookbook:171-181 `display: contents` on SearchFilters plus two `:global` reaches into its children's layout. This is a parent restyling a child component's internals. A `layout="row"` prop on SearchFilters would own it. Medium risk.
- RecipeActions:240-249 `:global(.btn-primary/.btn-ghost)` turned into pills from outside. A `.btn-pill` modifier in app.css would put it next to the buttons.
- Discover:205-208 `.lead :global(.lead-cook)` hit override reaching into CookLink, which "owns it below 700". Two owners for one hit.
- `.browse-header .tag-tabs { margin-bottom: -11px }` (app.css:631-637) plus a ponytail note: a compensation for the tabs' underline. Leave as is; its ceiling is already documented.

### 5. Dead or unreachable
- No unused app.css classes beyond the builder's. `.p-8` greps only from a comment.
- `width < 699px` off-by-one (see table; builder's `.clear-ticks`).
- Vendor prefixes: `-webkit-box`/`-webkit-line-clamp` are still needed for clamping. `-webkit-background-clip: text` (GTE:539) is probably droppable for current Safari (unverified). `::-webkit-scrollbar` stays for Safari < 18.2.

### 6. Comment debt
- app.css:825 `.tag` "1px less than before to absorb the new border". This is history: say "2px 9px with the 1px border = 24px tall", or nothing.
- app.css:639-640: the comment is orphaned above `.tag-tabs` (see #9).
- VersionBar:259-261 "the old 10px less a row's 6px, so the first row's text stays where it was" (history), and VersionBar:138-139 "stays 22.4px, as it was in mono" (history; use `1.4rem` and say why the height matters).
- app.css:1118 "100dvh here scrolled every auth page for nothing". Keep the why, drop the anecdote.
- cookbook:184 "44px hits" against 40px code (see category 2).

### 7. Tailwind plus custom mix
- 19 elements carry `m-0`, `p-0` or `list-none` that preflight already gives: VersionBar:116 `history m-0 list-none p-0`, RecipeMethod:19, RecipeIngredients:76/88, RecipeHeader:69/74/92/98/110/136, Details:46, RecipeActions:223/226, forks:28, the three `+error.svelte` files, recipe page:105 `figure.m-0`, Navbar:27 (builder's). Delete the tokens. Reasoned: nothing in base or components sets an element margin.
- RecipeHeader:69 `h1.title [overflow-wrap:anywhere]` duplicates base h1. Delete it.
- Six hand-written `-webkit-box` clamps (RecipeCard ×3, Discover `.change-note`, RecipeHeader `.description`, VersionBar `.message.clamped`): use `line-clamp-N`, which the forks page already uses (about −20).
- `.ed` vs base inputs, and `.section-tabs button` vs `.eyebrow-label`: see above.

## Could not verify
- `:hover`, `:focus-visible`, open menus, error and empty states, `aria-pressed`, photo vs no-photo variants were mostly not exercised. Their findings are reasoned.
- Widths 600–699, 860–899 and 1024–1099 were not probed.
- Real-device behaviour: `env(safe-area-inset-bottom)`, iOS zoom, scroll timelines.
- The probe compares computed values. "Computed changed, layout same" (the `min-width:0` cases) was judged by element rects only, not by paint.
- Builder-owned files may have moved during the run. MoreMenu was hot-reloading while the probe ran.
- Probe script: `/private/tmp/claude-501/-Users-spfle-Dev-Fork/9a950094-9e6b-405a-ba90-66f03edd1133/scratchpad/probe.cjs` (results in `probe.json`, `probe2.json`).

net: -250 lines possible.
