# UI design directions

2026-10-26. Research input for the UI redesign (priority 2 in `../ROADMAP.md`). Three candidate directions with palettes checked against WCAG AA, a set of principles that hold whichever direction wins, and a recommendation. Companion visual: the "Fork design directions" canvas at https://claude.ai/artifact/UhvxNv69Z7KGBpviCJcXpe (private to Spencer), which renders a recipe card, an ingredient row and a diff row in each direction, light and dark.

Private notes that fed this: `../todo/DESIGN.md` (parchment and green stash, design-brief rules) and `../todo/TODO_UI.md` (reference sites).

## Where we are

The current look is warm cream pages, an espresso hero and navbar, saffron amber for actions and version identity, Lora for titles, Instrument Sans for everything else, JetBrains Mono for metadata. It is coherent and already distinctive. The audit of it:

| Finding | Evidence | Weight |
| --- | --- | --- |
| Amber as text fails contrast | `a { color: --color-accent }`: `#e8a83a` on `#faf4e8` is 1.9:1. Every inline link, the version number in the diff strip and "Current version →" fail AA (4.5:1). `--color-accent-mid` is 2.45:1. | Must fix |
| Muted text is borderline | `--color-text-3` `#8b7355` on cream is 4.1:1: passes only as large text, yet it carries meta lines at 11.5px mono. | Must fix |
| Hero bronze on espresso | `#8b7a5a` on `#1a1408` is 4.4:1; the breadcrumb and "Serves" line sit under AA. | Fix |
| Two dark surfaces | Navbar `#2e1f0f` and hero `#1a1408` are two unrelated darks; the seam between them reads as a mistake rather than a choice. | Design call |
| Three type families | Lora, Instrument Sans, JetBrains Mono is one more than the page needs; mono is doing "metadata" work a tabular sans does better. | Design call |
| Dark mode is unreachable | Tokens exist and are contrast-checked, but nothing sets `data-theme`. | Wire or drop |
| Tag pills look like buttons | Tags share the pill shape and amber fill of the CTA, so a tag reads as an action. The one-save pass already moved tags to a quiet style; the redesign should finish the separation. | Fix |

What is working and should survive any direction: the reading column at 720px, the `h4` eyebrow labels (INGREDIENTS, METHOD), the struck-through cross-off rows, the diff gutter glyphs (`+ − ~`) beside the colour, photos as the only saturated element on list pages.

## What the research says

Durable guidance, not trend labels. Sources at the end.

1. **Kitchen conditions decide the recipe page.** Wet hands, distance, divided attention, timers. One step on screen at a time in a cook mode, type at 18px or larger, a big next and previous target, keep the screen awake while cooking, and a touch fallback for anything gestural or voice. Crouton won an Apple Design Award on exactly this: a step-by-step cooking mode and a layout reviewers call intuitive.
2. **Calm, warm, low-stimulus palettes** are the current direction for food products: off-white grounds with terracotta, olive and mustard accents, generous spacing, depth only where it clarifies hierarchy. Fork is already there; the task is tuning, not a pivot.
3. **Dark mode is a designed system**, not inverted tokens: its own type weights, its own accent lightness, its own diff tints.
4. **Diff colour is a readability problem first.** Review Board, GitLab and others moved to desaturated add and remove tints, added glyphs so the change type never depends on colour, and underline or highlight intra-line changes. Fork already has the glyphs; the tints can be quieter.
5. **Editorial typography is a three-role split.** NYT Cooking runs a display serif for headlines, a workhorse sans for navigation and metadata, and a text serif for reading. Two families can cover it if the sans has a tabular-figure setting and the serif has optical sizes.
6. **Tokens in OKLCH.** Perceptual lightness makes hover states, tints and dark variants consistent across warm hues, where HSL lies badly (a yellow and a brown at the same HSL lightness look nothing alike). Browser support has been universal since 2023. WCAG 2.x ratios remain the compliance floor; APCA is a better readability predictor and worth checking in parallel.
7. **Restraint as the method.** Linear's stated first principle is quality, with opinionated defaults and near-zero latency over surface polish. Mela draws praise for polish and criticism for hiding core actions behind minimalism. The lesson for Fork: the fork button, the version strip and the diff are the product, and they stay prominent whatever gets quieter around them.

## Reference pass: food sites and cookbooks (2026-10-27)

Most recipe sites refuse automated fetches (NYT Cooking, Bon Appétit, Serious Eats, Food52, Half Baked Harvest), so this is from secondary sources plus the one page that loaded.

| Reference | What it does | Lesson for Fork |
| --- | --- | --- |
| NYT Cooking | Cheltenham headlines, Franklin for UI, Karnak slab for display; white page, one red accent; tap-to-cross ingredient checklist, steps highlight as you go, photo leads | Three type roles with one characterful display face; cross-off is a solved pattern we already have; the page is light, not a dark band |
| Mob (Studio Nari, 2021) | Custom sans from Right Grotesk, colours named after flavours, loud and playful; recipe page is tabs (Ingredients, Method, Nutrition), numbered steps, a cook mode that keeps the screen awake | Palette can come from food itself; cook mode with wake lock is table stakes |
| Bon Appétit | Aperitif, a custom condensed garamond-style display, photography first, print-led system | One distinctive display face carries the whole brand |
| Award cookbooks 2024 (Plated, Enjoy, Butter Butter, Cazador) | A grotesk plus a text serif, earthy tones with one bold colour, generous white, per-recipe typographic play | Contemporary cookbook design is closest to direction C: restrained type pairing, one strong colour, paper-coloured ground |

What this changes: every reference is a light page with the photo leading; none uses a dark hero band, so the espresso hero is the outlier and goes in B and C. The cookbook evidence raises C's standing on pedigree, but C's tomato accent sits one hue away from the diff's "removed" tint, which is a real conflict on a product whose centrepiece is a diff. B's green accent is the diff's "added" colour, so action and addition share one meaning.

## Principles for Fork

These hold for every direction below and should move into `AGENTS.md` once a direction is chosen.

- **Photos are the colour.** List pages and the recipe page carry one accent; everything else is paper, ink and hairlines. A saturated UI competes with the food.
- **One accent, two jobs.** The accent means "an action" or "a version". Nothing decorative uses it. Tags, meta, timings are ink tones.
- **Text in the accent hue must be its ink variant.** Every accent gets a text-safe partner at 4.5:1 or better on the page ground; the bright fill is for buttons with dark text on them.
- **Cook mode is a first-class layout**, not a stylesheet tweak: one step, 20px or larger, previous and next as 56px targets, wake lock, timers from the step text (M11).
- **The reading column is 720px** on recipe and compare pages. List pages may go to 1200px.
- **Hairlines over boxes.** Divide with 1px rules in a border tone; reserve cards with shadow for things that float (dialogs, menus, the sticky sidebar).
- **Numbers are tabular.** Quantities, times, version numbers and diff gutters align; use a sans with `font-variant-numeric: tabular-nums` or a mono, not both.
- **Monospace for what the system produced or what identifies a thing; sans for what a person wrote about food; the slab for titles and step numbers.** Settled 2026-10-27, revised the same day after the reviewer's third pass. Mono: the author line above the title (`@user`, no slug), version numbers everywhere (including the one beside the title), the version strip (commit message, author, time), the compare page's commit bar, the diff, history counts ("2 forks · 3 versions", a profile's commit count), timer inlays when M11 lands. Slab, plain `1 2 3` in the accent: method step numbers. Sans: ingredient quantities and gram weights (roman, ink-3, never italic), prep, cook, serves, handles in prose and in the navbar, tags as comma-separated text in the meta line, errors and status. Sidebar details only: letterspaced small-cap labels with values in Bitter italic. JetBrains Mono is the mono.
- **Every change carries a glyph and a colour.** `+ − ~` in the gutter, strike-through on removals, never colour alone.
- **Dark mode is designed.** Separate lightness for accent and tints; checked pairs; a `prefers-color-scheme` default with a manual override stored per viewer.
- **Motion only for state.** Row cross-off, menu open, save pending. Under 200ms, respect `prefers-reduced-motion`. No scroll effects, no hero animation.
- **AA across every pair**, verified by a script in the repo, not by eye. The audit above found three fails that looked fine.

## Three directions

All three keep the structure (navbar, hero, 720px column, sidebar, version strip, diff panels). They differ in palette, type and how much chrome stays. Every pair below was measured; ratios are WCAG 2.x against the stated ground.

### A. Warm kitchen, tuned

Keep the identity, fix what the audit found. Lowest risk, one or two days.

| Token | Light | Ratio | Dark | Ratio |
| --- | --- | --- | --- | --- |
| `bg` | `#faf4e8` |  | `#171208` |  |
| `surface` | `#ffffff` |  | `#241a0e` |  |
| `text` | `#1a1408` | 16.7 | `#faf4e8` | 17.4 |
| `text-2` | `#5c4a2c` (was `#6b5a3a`) | 7.8 | `#cdbd98` | 10.1 |
| `text-3` | `#7a6648` (was `#8b7355`) | 5.0 | `#9a8a68` | 5.5 |
| `accent` (fill) | `#e8a83a`, ink text on it | 8.8 | `#f0b650` | 10.2 |
| `accent-ink` (links, version numbers) | `#8a5e0a` **new** | 5.2 | `#f0b650` | 10.2 |
| `sienna` (quantities, step numbers) | `#a04424` | 5.7 | `#e07a52` | 7.1 |
| `add` / `add-bg` | `#205c22` / `#eaf4e2` | 7.1 | `#86d187` / `#1e2a14` | 8.6 |
| `remove` / `remove-bg` | `#8a3020` / `#fae8e0` | 7.0 | `#f0a08e` / `#2e1810` | 8.0 |

Changes beyond tokens: one dark (hero and navbar share `#1a1408`, the navbar loses its own tone); tags become ink-on-linen chips with a 1px border, no fill; the mono family goes, Instrument Sans with tabular numerals takes metadata; Lora stays for titles and gets a text size for descriptions.

Risk: it stays "the brown site". If the current look already feels dated to you, A only polishes it.

### B. Parchment and herb

Your stashed palette from March, with the three failing pairs fixed. Fresher and greener; still warm. Two to three days because every amber usage changes meaning.

| Token | Light | Ratio | Dark | Ratio |
| --- | --- | --- | --- | --- |
| `bg` | `#f7eed8` |  | `#1a1610` |  |
| `surface` | `#fdf6e8` |  | `#221e14` |  |
| `text` | `#1a1610` | 15.6 | `#f0e8d0` | 14.9 |
| `text-2` | `#4a4438` | 8.4 | `#b0a68e` | 7.5 |
| `text-3` | `#776d5c` (was `#8a8070`) | 4.4, use at 18px+ or darken to `#6c6252` | `#8a8070` | 4.6 |
| `accent` green | `#3b6a14` (was `#4a7c1e`, 4.3) | 5.6 | `#8fc452` | 8.7 |
| `accent-mid` fill | `#5c8f24`, ink text on it | 4.6 | `#a8d66a` |  |
| `tag` / `tag-pale` | `#6e5008` (was `#b8880a`, 2.5) / `#f5e4a8` | 5.9 | `#d4a830` / `#3a2e08` | 6.0 |
| `add` / `add-bg` | `#3b6a14` / `#e4f0d4` | 5.4 | `#8fc452` / `#1e2e10` |  |
| `remove` / `remove-bg` | `#a8321c` (was `#c24030`, 4.1) / `#f5e0dc` | 5.3 | `#f0a08e` / `#301814` |  |

Type: Fraunces for titles (a soft, slightly wonky serif with optical sizes; reads "cookbook" rather than "newspaper") over Instrument Sans. Or keep Lora if Fraunces is too playful.

Changes: hero goes light (parchment, not espresso), with the photo in the sidebar as now; the navbar is parchment with a hairline; green is actions and versions; golden tags finally look like tags, not buttons.

Risk: green plus gold plus food photography can tip into "organic grocer". Keep the green dark and the gold only on tags.

### C. Paper and ink

The developer-tool reading. Near-monochrome warm greys, ink text, one vivid accent (tomato), hairlines instead of cards, a text serif for reading. Photos supply all the colour. Most distinctive, most work (three to five days) because the hero, cards and sidebar all simplify.

| Token | Light | Ratio | Dark | Ratio |
| --- | --- | --- | --- | --- |
| `paper` | `#f6f3ee` |  | `#151311` |  |
| `surface` | `#fcfbf8` |  | `#1d1a17` |  |
| `ink` | `#141210` | 16.9 | `#ece7de` | 14.6 |
| `ink-2` | `#4f4a43` | 7.9 | `#b5aea4` | 8.4 |
| `ink-3` | `#6f6960` | 4.9 | `#8a837a` | 5.0 |
| `rule` | `#d9d3c8` (1.4, decorative only; 3:1 not required for hairlines) |  | `#2c2823` |  |
| `accent` tomato (links, version numbers) | `#b8381a` | 5.2 | `#ff7a52` | 7.2 |
| `accent` fill | `#d9481f` with paper text (4.2, large text only: buttons are 16px semibold, so pass at 3:1) |  |  |  |
| `add` / `add-bg` | `#1f5f2a` / `#e6f1e3` | 6.6 | `#86d187` / `#1b2a1b` |  |
| `remove` / `remove-bg` | `#9c2f1c` / `#f8e5df` | 6.1 | `#f0a08e` / `#2d1b16` |  |

Type: Newsreader (text serif, free, optical sizes) for titles and descriptions, Geist for UI and metadata with tabular figures, Geist Mono only in the diff. Or Source Serif 4 plus Inter if Geist feels too "Vercel".

Changes: no dark hero; the title sits on paper in a large serif, version number in tomato beside it; cards lose their shadow and become image plus two lines with a hairline below; the sidebar is a column of rules, not boxes; the diff is the most GitHub-like of the three.

Risk: it can read as austere. Tomato must be used sparingly (the fork button, version numbers, the current version in the strip) or it becomes a warning colour.

## Six accents for C (2026-10-27)

Spencer picked C. Six accents on the same paper, ink, type and diff tints, light and dark, on the canvas at https://claude.ai/artifact/NSeJa5Xb6Me8TtURKhGLWB. Every accent passes AA as text on its ground and as a filled button with paper (light) or ink (dark) text.

| # | Name | Light | Dark | Note |
| --- | --- | --- | --- | --- |
| 1 | Verdigris | `#0e6b66` (5.7) | `#5fc9c0` (9.4) | Blue-green, between the diff's green and red |
| 2 | Cobalt | `#2452a8` (6.7) | `#8ab4ff` (8.9) | The web's link colour; reads "tool" |
| 3 | Saffron ink | `#8a5e0a` (5.2) | `#f0b650` (10.2) | Today's amber, darkened until it can be text |
| 4 | Damson | `#6e2a60` (8.8) | `#e39ad3` (8.7) | Plum skin; most editorial; strongest contrast |
| 5 | Bay leaf | `#2f5d3a` (6.9) | `#86d187` (10.1) | Accent is the diff's "added" green; one colour fewer |
| 6 | Squid ink | `#141210` | `#ece7de` | No accent: ink buttons, underlined links, the diff is the only colour |

### Warm pops, after the cookbooks (2026-10-27)

Spencer's shelf (The Food Lab, Salt Fat Acid Heat, Smuggler's Cove) agrees on one model: paper, black or brown-black text, and the title carrying the single warm colour. Four more boards on the same canvas follow that model; each borrows its display treatment from one book.

| # | Name | Light | Dark | Display | After |
| --- | --- | --- | --- | --- | --- |
| 7 | Burnt orange | `#a84a0c` (5.2) | `#ff9a4d` (8.8) | Letterspaced serif caps, rust subtitle line | The Food Lab |
| 8 | Terracotta | `#b2432c` (5.1) | `#ff8f73` (8.3) | Zilla Slab 600, dotted rule | Salt Fat Acid Heat |
| 9 | Bronze | `#7a5a2a` (5.7) | `#d9b57a` (9.6) | Wide bold sans caps, small-cap labels with italic serif values, bold quantities | Smuggler's Cove |
| 10 | Marigold highlighter | `#e8a83a` as fill only, ink text on it (9.0) | `#f0b650` (10.2) | Newsreader; the amber sits under the version number, on the fork button and as the link underline, never as text | Today's amber, kept honest |

Terracotta is the one warm hue near the diff's "removed" tint; it works because the title is the only large terracotta element and the diff tints are pale. Burnt orange and bronze are clear of both diff colours.

## Decision (2026-10-27)

**Direction C, paper and ink, with the "fired clay" accent: terracotta shifted toward burnt orange.** Spencer's pick, seconded by his reviewer. Board 8 on the palette canvas is the reference.

| Token | Light | Ratio on ground | Dark | Ratio on ground |
| --- | --- | --- | --- | --- |
| paper | `#f6f3ee` |  | `#151311` |  |
| surface | `#fcfbf8` |  | `#1d1a17` |  |
| ink | `#141210` | 16.9 | `#ece7de` | 14.6 |
| ink-2 | `#4f4a43` | 7.9 | `#b5aea4` | 8.4 |
| ink-3 | `#6f6960` | 4.9 | `#8a837a` | 5.0 |
| rule | `#d9d3c8` |  | `#2c2823` |  |
| clay (titles, version numbers, links, fork button) | `#a04f28` | 5.2 | `#d79a73` | 7.7 |
| add / add-bg | `#1f5f2a` / `#e6f1e3` | 6.6 | `#86d187` / `#1b2a1b` | 8.2 |
| remove / remove-bg | `#9c2f1c` / `#f8e5df` | 6.1 | `#f0a08e` / `#2d1b16` | 7.9 |

The reviewer proposed `#A8542B` light and `#D79A73` dark. The dark value is used as given. The light value passes at 4.8:1, which is a thin margin for 11px mono in the version strip, so the same hue a step darker, `#a04f28` at 5.2:1, is the token; the difference is not visible side by side. The dark accent is deliberately lighter and less saturated than a straight lift of the light one, so it reads without glowing.

Type: a slab for titles, version numbers and method numbers (Bitter 600 leading; Newsreader 500 still in the running), Source Sans 3 for body and UI with tabular figures, Source Code Pro for the version strip and the diff.

Rules carried from the reviewer: clay appears on the title, the version number, the fork button and links, and nowhere else; the divider under the title is a 1px dotted hairline in the rule tone, not clay, so it does not compete with the four clay elements.

Next: token hygiene on master (direction-neutral: `accent-ink`, darker muted tones, one dark surface, a contrast script), then the redesign branch per the sequence above.

### Reviewer's build list and the open question (2026-10-27)

The reviewer ranked fired clay first across every board, verdigris second, the original tomato C third. Their build list, adopted:

- Fired clay on C's paper and ink; no second brand colour. Clay, ink tones and the two diff tints are the whole range.
- Slab heading over a humanist sans. Test pairing: **Bitter 600 + Source Sans 3** (their suggestion) against Zilla Slab + Geist. Bitter is the more bookish slab; Source Sans 3 is warmer than Geist and closer to the cookbook references.
- The Food Lab's hierarchy: compact ingredients, clear method numbers in the display face, restrained eyebrow labels.
- Space through margins and type; fine rules sparingly.
- Version messages stay monospace (Spencer's call, against the reviewer): the strip is the git metaphor made visible. Source Code Pro, the sibling of Source Sans 3. Mono also stays in the diff.

The one choice still open is the heading face: slab (sturdy, approachable) or Newsreader (lighter, editorial). Both are on a full recipe page with the seed photo and the same Source Sans 3 body at https://claude.ai/artifact/AEmVrLZ9AF5znQNEYZja5S. Spencer leans slab (Bitter 600); Newsreader stays in the running until the redesign spec, where the choice is made on the real pages.

### Eight templates on one token table (2026-10-27)

The reviewer's second pass proposed one table (paper `#F7F3EC`, ink `#1A1714`, clay `#A4512B` as the text accent, marigold `#E8A83A` as the only fill with ink on it, add `#2F6B37`/`#E6F0E3`, remove `#A3362B`/`#F6E3E0`, dark set as listed there) and eight templates on it. Two values failed AA and are corrected: ink-3 `#7A736B` (4.2) becomes `#6F6960` (4.9); Oxblood's red-orange remove `#C24A1E` (4.0) becomes `#A8401A` (5.0). All eight are mocked as compact recipe pages, light mode, same photo, at https://claude.ai/artifact/FyvrNogKSkXR5RK253pDyb.

| # | Template | What changes |
| --- | --- | --- |
| 1 | Fired clay | Clay is the only accent, including the fork button |
| 2 | Clay + marigold (reviewer's pick) | Clay for text you can act on; marigold fill on the fork button and the current-version chip |
| 3 | Marigold highlighter | Ink everywhere; marigold only as a fill and a 3px link underline |
| 4 | Saffron ink | Template 1 with `#8A6914` |
| 5 | Warm kitchen, tuned | Template 2 plus the espresso hero: title in paper, version number in marigold |
| 6 | Bronze label system | Template 2 plus Smuggler's Cove's label grammar: letterspaced small-cap labels, Bitter italic values, bold quantities. A component, not a palette |
| 7 | Enamel | Chalk paper, charcoal ink, enamel blue `#2F4F8F` text accent, marigold fill |
| 8 | Oxblood | Deep cherry `#7A2E3B` text accent, marigold fill, remove tint shifted to red-orange |

Held against the reviewer's spec: the monospace rule is Spencer's (breadcrumb, version numbers, strip, step numbers, history counts stay mono; the reviewer had mono in the diff only), and the espresso nav bar is kept in every board as they specified but is the thing to test both ways, since every food reference is a light page.

Structural ideas worth carrying into the roadmap from the same pass: sticky ingredient column (Mob), serving stepper that re-renders quantities in place (NYT), the latest commit message as the "why it works" slot above the recipe (Serious Eats), per-step ingredient highlighting in cook mode (Mela; nearly free from parsed `Ingredient.name`), a kitchen-mode type toggle (Readwise), and a fixed-aspect no-photo state (a clay-tinted panel with the title in the slab).

### Round 3 (2026-10-27)

Reviewer's third pass: keep 1, 2 and 5; drop 4 and 7; 8 is a maybe pending a browse-grid comparison; 6 is a component to fold in. Global changes adopted (Spencer agreed on the two that reversed earlier calls): plain Bitter step numerals in the accent, the author line loses the slug, tags become comma-separated text in the meta line, grams stay roman, the small-cap label grammar lives in the sidebar only. The canvas at https://claude.ai/artifact/3j3Qv463HkeiZqjmwnxZJR has 1, 2 and 5 with those changes, the 5 hero at 390px with the one-third and fold lines marked, the 2-vs-8 browse grid (card titles in ink; the accent shows only on version numbers and the no-photo panel), and two new candidates on template 2's roles: verdigris `#0E6B66` (5.7) and bay leaf `#2F5D3A` (6.9) as the text accent with the marigold fill. Oxblood's remove tint is `#A8401A` (5.0), the reviewer's `#C24A1E` being 4.0.

### Round 4: the locked system on real pages (2026-10-27)

Two reviewers converged on template 2. Locked: paper `#F7F3EC`, ink `#1A1714`, clay `#A4512B` as the only text accent, marigold `#E8A83A` as the only fill with ink on it, Bitter 500 for titles and step numerals, Source Sans 3 for everything else, JetBrains Mono for the author line, version numbers, the version strip and the diff. Light header everywhere; espresso stays on the nav bar only. Retired: saffron, enamel, oxblood, verdigris, bay leaf, the espresso hero.

Decisions this round: no-photo cards and pages show the title inside the clay-tinted panel in Bitter, nothing below (Spencer's call over Sol's); card meta is sans with only the version number in mono, so the forked card stops wrapping; method steps lose their rules and separate by numeral and space; the version strip collapses on mobile to the current version plus a "3 versions" link; on mobile the photo leads full width under the nav, then title, description, meta, strip, Fork/Save, prep/cook/serves, ingredients.

The canvas at https://claude.ai/artifact/JeBnxQYqrQCbraFGrsUxwY has the recipe page in both layouts (sidebar photo, and a 16:9 photo at content width between the meta line and the strip) plus 390px, the browse grid with Recent and Most forked sections at 4 and 2 across, the compare page with two version cards above the diff, and the edit page with the live parse note and the marigold "Save as new version". Open question for the reviewers: sidebar photo or wide photo.

### Round 5: fixes, system approved (2026-10-27)

Both reviewers approved the system; no more layout alternatives. The reviewers split on the recipe photo (one sidebar, one wide and capped); Spencer chose wide, capped at 420px with `object-fit: cover`, the sidebar sticky below it. On mobile the title comes before the photo, and the photo is 4:3, so the two stacks share one order and the Fork button lands in the first screen. The version strip is the collapsed form at every width: current version, its message, "Compare with v2", "3 versions". Nothing scrolls or clips.

Fixes adopted from the reviewers: version commentary out of the description field (history explains the change); mobile diff at 14px and mobile form fields at 16px, which also stops iOS zooming on focus; the mobile edit form keeps description, photo, tags and visibility, and the labels keep "(min)"; the save button says "Save" and the helper line states the outcome ("Saves as v4 · ingredients and steps changed"), since a settings-only save writes no version; the commit message stays optional with the generated message ("Updated ingredients, steps", from `generatedCommitMessage`) as its placeholder.

Two reviewer objections were checked against the repo and dropped: versions do snapshot title, servings and times, so the compare page's Details block stands; the commit message column is not null but the server generates one when blank, so "optional" is right.

New token, the focus ring: `:focus-visible` only, 2px solid clay `#A4512B` with 2px offset on light surfaces, 2px solid marigold `#E8A83A` on the espresso nav, following the element's radius; inline links get 2px padding so the ring clears the text. Nothing else changes on focus.

Also decided: dark mode deferred (the dark set above stays recorded, nothing is built); grid breakpoints 2 across under 700px, 3 to 1100px, 4 above; fonts self-hosted through fontsource; the redesign is one branch, built in reviewer two's order: tokens, nav and shell, recipe page, card and grid, compare, edit and new.

The canvas at https://claude.ai/artifact/QFTDpwCLRwuknh754yNPzc is the final set: recipe, browse, compare and edit at desktop and 390px, plus the focus ring board. Annotations and the comparison variants were stripped once decided, and its brief note restates the tokens, type, rules, layout and build order.

Final corrections after the reviewers' last pass: the editor heading is "Editing v3" (the old "a change makes v4" contradicted the settings-only save); the focus note says the browser decides when `:focus-visible` shows, with no logic hiding it after a click, so text fields keep their ring; the edit form's label is "Serves" everywhere, matching the sidebar; the mobile compare title row wraps instead of truncating; mobile strip, tags and helper copy now use the same strings as desktop. Reviewer two asked a second time to cut the Details block on the grounds that metadata is not snapshotted; it is (`recipe_versions` carries title, servings, prep and cook minutes), so the block stays and nothing goes on the roadmap for it.

Spencer's own pass, applied: the mobile photo is a 2:1 banner (195px at 390 wide), matching the capped desktop photo rather than a hero; the version chip is one shape everywhere, a 4px radius on the title chip and 3px on the mono chips in the strip and compare cards, since the pill was the odd one out; the sidebar values for prep, cook and serves drop the Bitter italic (an orphan from the round 3 label grammar) for Source Sans 600 roman, the same treatment as ingredient quantities; the secondary button keeps the ink outline, a clay outline was mocked beside it and dropped so marigold stays the only warm fill; the desktop edit form keeps its two columns but widens to 960px with a 5:7 split so the ingredient and step textareas get about 65 monospace characters per line.

External review (2026-10-27), applied to the mocks: the recipe page's secondary action is "Favorite", matching the nav and the existing feature, since "Save" also names the editor's commit; the editor gets Cancel beside Save and a navigation guard when the form is dirty (the form already tracks that); textareas grow with their content (`field-sizing: content`, rows as the fallback); the mobile nav carries a search icon beside the menu; the no-photo panel lightens from `#EFDCCF` to `#F5E9E0` so the clay title clears AA (4.65:1, was 4.17); the "optional" tag on the commit field uses ink-3 (its `#8A837A` was 3.39:1); and the hand-authored data now agrees across boards: eleven ingredients ending in "a pinch of flaky salt, to finish" (an unparsed line, shown as written), five steps, version cards counting 10 and 11, one description at both widths, every diff row on mobile, and the second cookie card in Most forked is a no-photo card so it no longer reads as a duplicate.

Pushed back: the muted token is 4.91:1 on paper by measurement, not the 3.3 the reviewer read off a PNG; ingredients beside the method is decided (sticky rail), though Spencer wants quantities inline in steps later ("Whisk flour (280 g)…"), on the roadmap; a serving scaler and a restore-from-compare action are features, on the roadmap, not blockers; title inside the no-photo panel is intentional. Maybe, not mocked: a check mark at the left edge of a checked-off ingredient, if the plain strike-through proves unclear; and, if the title baseline jumping between photo and no-photo cards bothers on the real grid, a monogram (first letter in Bitter, clay) or the Fork mark in the panel with the title below for every card, so one title per card and every row aligns. Spencer likes the monogram or mark; judge on the built grid first. The panel title is the card title size (17px desktop, 15px mobile), not larger, so the two card kinds share one type scale. Print stylesheet is already in the roadmap backlog. Mocks are closed.

Recipe page, as built (2026-10-27): no placeholder panel on a page without a photo, since the title above is already the headline; the version history opens as a toggle panel under the strip rather than a page, because no history page exists and the old strip linked every version inline; the sidebar's fork count is public forks only, the rule the list pages already use; the sidebar comes before the recipe in the DOM at every width, so the phone order (actions, details, ingredients) needs no CSS reordering; every ingredient measure is bold, not only rows with a known weight; actions run Fork, Favorite, Edit. Svelte trims a space at the edge of a block, so the comma between tags is written as an `&#32;` entity and the counts line is built as one string in script.

Card and browse, as built (2026-10-27): cards drop the description, the tag pills and the "Forked" badge; the fork count on the card and the attribution on the recipe page carry lineage, and the recipe header lists tags as links. The tag tabs link to the existing tag pages rather than filtering the browse page in place, so no new query logic; in-place filtering is a roadmap item. The browse page is sectioned: Recent (newest 8), Most forked (up to 4 forked recipes drawn from outside Recent, so no card shows twice), All recipes (the rest), each omitted when empty, so a small collection is a single Recent grid. On a tag page the All tab leads a signed-in user to the feed, since their `/recipes` is their own list. A side-scrolling row or a "see more" per section is a possible addition once the collection outgrows the caps. A signed-in user's own list keeps one grid and no tabs. Under 700px the author is hidden on cards, the recipe page has it.

Compare page, as built (2026-10-27): the column is 784px, wider than the round-2 reading column, so the diff's existing container query puts Ingredients beside Steps as the board shows, and stacks them under 700px. The version cards carry the snapshot each version stores (title, serves, prep and cook when set, ingredient count) with the date and author; the author stays on the phone card and wraps rather than being hidden. Removed rows are back on the locked tone at full opacity, so the note below is history. Card dates print in the viewer's own zone (Spencer's call over a UTC day), so the server's render may be corrected on hydration near midnight. The diff panels are 12px mono on desktop and 14px on phones everywhere they appear, the landing page included.

Edit and new, as built (2026-10-27): the helper line and the commit-message placeholder come from the same change groups the server uses (`changedGroups` over the parsed draft), so "Saves as v4 · ingredients and steps changed" and "Updated ingredients, steps" always agree with the version the server writes; a settings-only change says "Saves settings · no new version"; an invalid draft promises nothing and the error explains. The guard uses the browser's own confirm and, on a tab close or reload, cancels so the browser shows its prompt. Textareas grow with `field-sizing: content`, which ignores `rows`, so each keeps a `min-height` in line units (description 3, ingredients 11, steps 14) and an empty form still has room to type into. TagInput keeps its chips above the input rather than inside the box. Every field is 16px under 700px so iOS does not zoom; the mono fields repeat that rule in the components layer, which would otherwise beat the base layer's. Login and signup labels became eyebrows too, since the field label rule is global and one voice for labels is the point.

Spencer's click-through (2026-10-27), applied: the author line sits under the title, not above it as an eyebrow; the version chip is centred on the title line rather than on its baseline; the version strip spans the content column exactly and sits 14px under the photo; the sidebar adds only the fork count, since the strip already says "3 versions"; the sidebar sticks 24px from the top; the owner's Edit is the marigold action, since Fork is not offered to them; the phone menu drops Search (the icon beside it covers it), the bar stays above the dimming overlay, and the menu names the user as the desktop bar does; a struck-through ingredient keeps its grams at the line's size, since WebKit draws each inline box's strike at its own metrics; the overscroll strip above the page is espresso. Open for a decision: the landing page's full espresso hero, and whether tag links on the recipe page need a stronger affordance than colour. To revisit: whether the diff's ingredients and steps should stay monospace.

Shipped remove text is `#922D23`, not the locked `#A3362B`: removed diff rows render at 0.85 opacity and the locked value blends to 4.15:1 against paper, under the e2e threshold; `#922D23` blends to 4.79:1. The compare step dropped the opacity on 2026-10-27 and the token returned to `#A3362B` (5.44:1 unblended).

## Typography options, independent of palette

| Pairing | Titles | UI and meta | Reading | Fit |
| --- | --- | --- | --- | --- |
| Current | Lora 600 | Instrument Sans | Instrument Sans | Known quantity; drop the mono and turn on tabular figures |
| Cookbook | Fraunces 9pt optical, 500 | Instrument Sans | Lora or Fraunces text | Warmer, matches B |
| Editorial | Newsreader 500 | Geist or Inter | Newsreader text | Matches C; most "NYT Cooking" |
| Quiet | Source Serif 4 | Source Sans 3 | Source Serif 4 | One superfamily, safest rhythm |

All are on Google Fonts. Load at most two families plus one weight axis each; the current four-stylesheet load is 180KB.

## Components that change in every direction

- **Recipe card:** image 16:9, title (serif, two lines max), one meta line (author · time · v3 · 2 forks) in tabular figures, up to three tag chips. The forked badge moves from the photo overlay into the meta line as "forked" with the parent name on hover.
- **Recipe hero:** title, version number, tag chips, time and servings on one line, author. Breadcrumb goes; the author link is enough. The photo stays in the sidebar on desktop and leads on mobile, as now.
- **Version strip:** horizontal scroll stays. Current version in accent-ink, the rest in ink-3; "Compare" becomes an icon-plus-label link at 13px.
- **Ingredient rows:** cross-off stays native checkbox plus strike. Quantity in sienna or accent-ink with tabular figures, gram weight in ink-3 after the quantity.
- **Diff:** one panel per group with the gutter glyph, quieter tints (above), intra-line changes underlined as well as tinted.
- **Cook mode (new, M11 pairs with it):** full-screen route or dialog, one step at a time, 22px step text, 56px previous and next, ingredient drawer, wake lock. Design it in the chosen direction before building M11 timers so the timer inlay has a home.
- **Forms:** the one-save form keeps its single flow; inputs take the direction's surface and a 2px accent-ink focus ring.

## Recommendation

**B, Parchment and herb, with the Cookbook type pairing**, and A's token hygiene applied first as a separate commit.

Why: A fixes the contrast bugs but leaves the site looking like it did in March. C is the most striking, but Fork's premise is already "developer tool for recipes"; making the surface look like a developer tool as well doubles down on the one thing a home cook might find cold. B keeps the warmth, finally gives tags their own colour, and the light hero fixes the two-darks seam without an argument about which dark wins. The green is also the diff "added" colour, so the accent and the diff speak the same language.

Sequence:

1. Token hygiene on master now, direction-neutral: `accent-ink` for links and version numbers, darker `text-2` and `text-3`, one dark surface, a contrast script in `scripts/` run by `pnpm verify`. Half a day; fixes three AA failures on the live site.
2. Brainstorm B against the artifact: swap the two or three values you disagree with, pick Fraunces or Lora.
3. Spec and plan the redesign as one branch (this is a major feature): tokens in OKLCH, components in the list above, cook mode layout, dark mode wired to `prefers-color-scheme`.
4. M11 timers land inside cook mode.

If you would rather keep the espresso hero, take A and skip step 2; the sequence is otherwise the same.

## Sources

- Recipe app design patterns and cook mode guidance: [screensdesign.com](https://screensdesign.com/articles/recipe-app-design-examples/), [Mealime cooking mode](https://support.mealime.com/article/88-how-to-use-cooking-mode), [GNOME Recipes "Cook Now" proposal](<https://wiki.gnome.org/Design(2f)Apps(2f)Recipes(2f)CookNow.html>), [BBC Good Food stay-awake teardown](https://builtformars.com/company/bbc-good-food)
- Crouton and Mela reviews: [MacStories on Crouton](https://www.macstories.net/reviews/crouton-review-an-elegant-modern-recipe-manager-and-cooking-aid/), [Crouton Apple Design Award](https://interest.co.nz/technology/128138/new-zealander-devin-daviess-crouton-named-top-app-interaction-category-apples), [MacStories on Mela](https://www.macstories.net/?p=67531), [a critique of Mela's minimalism](https://abigailsteinhart.notion.site/Adding-recipes-to-Mela-73058a0f1c4b470395fc4f62a53c801c)
- 2026 trend summaries (weighted lightly): [daisyUI trends](https://trends.daisyui.com/ui-design-trends-2026/), [Moburst app trends](https://www.moburst.com/blog/top-mobile-web-design-trends/)
- NYT typography roles: [Fonts In Use, NYT 2013 redesign](https://fontsinuse.com/uses/3907/the-new-york-times-article-redesign-may-2013), [shadcn.io NYT token reconstruction (unofficial)](https://www.shadcn.io/design/nytimes)
- Font pairings: [Pangram Pangram 2025 pairings](https://pangrampangram.com/blogs/journal/best-font-pairings-2025), [Made Good Designs serif and sans pairings](https://madegooddesigns.com/serif-sans-serif-pairings/)
- Diff readability: [Review Board colour-blind diff styling](https://reviews.reviewboard.org/r/10981), [Review Board softer diff palette](https://reviews.reviewboard.org/r/13197/diff/), [GitLab desaturated diff colours](https://gitlab.com/gitlab-org/gitlab-ce/merge_requests/24582)
- OKLCH and contrast: [OKLCH explained for designers](https://uxdesign.cc/oklch-explained-for-designers-dc6af4433611), [Front-End Checklist on OKLCH](https://frontendchecklist.io/rules/css/color-oklch)
- Restraint: [Lessons from Karri Saarinen of Linear](https://www.antoinebuteau.com/lessons-from-karri-saarinen-of-linear.md), [Simon Collison, A philosophy of restraint](https://noti.st/colly/JCst37)
