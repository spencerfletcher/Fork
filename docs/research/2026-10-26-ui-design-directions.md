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
