---
name: Fork
description: Recipes under version control, set like an annotated cookbook on cream paper.
colors:
  paper: '#f7f3ec'
  lifted-paper: '#fffdf9'
  clay-tint: '#f5e9e0'
  espresso: '#1a1408'
  ink: '#1a1714'
  ink-2: '#4a443e'
  ink-3: '#6f6960'
  cream: '#f7f3ec'
  tan: '#b8a880'
  clay: '#b23c00'
  marigold: '#eca620'
  marigold-deep: '#dc980a'
  rule: '#e4ded4'
  rule-2: '#d9d3c8'
  diff-add: '#2f6b37'
  diff-add-bg: '#e6f0e3'
  diff-remove: '#a3362b'
  diff-remove-bg: '#f6e3e0'
typography:
  display:
    fontFamily: 'Bitter, Georgia, serif'
    fontSize: '2.5rem'
    fontWeight: 500
    lineHeight: 1.15
  headline:
    fontFamily: 'Bitter, Georgia, serif'
    fontSize: '1.75rem'
    fontWeight: 500
    lineHeight: 1.25
  title:
    fontFamily: 'Bitter, Georgia, serif'
    fontSize: '1.0625rem'
    fontWeight: 500
    lineHeight: 1.25
  body:
    fontFamily: 'Source Sans 3, -apple-system, BlinkMacSystemFont, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: 'Source Sans 3, -apple-system, BlinkMacSystemFont, sans-serif'
    fontSize: '0.6875rem'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: '0.08em'
  mono:
    fontFamily: 'JetBrains Mono, Fira Code, monospace'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: '4px'
  md: '6px'
  lg: '8px'
  pill: '100px'
spacing:
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '24px'
  '6': '32px'
  '7': '48px'
  '8': '64px'
components:
  button-primary:
    backgroundColor: '{colors.marigold}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '12px 16px'
  button-primary-hover:
    backgroundColor: '{colors.marigold-deep}'
    textColor: '{colors.ink}'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '11px 16px'
  button-ghost-hover:
    backgroundColor: '{colors.clay-tint}'
    textColor: '{colors.ink}'
  input:
    backgroundColor: '{colors.lifted-paper}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '9px 12px'
  tag:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-2}'
    rounded: '{rounded.pill}'
    padding: '2px 9px'
  tag-hover:
    backgroundColor: '{colors.clay-tint}'
    textColor: '{colors.ink-2}'
  version-chip:
    backgroundColor: '{colors.marigold}'
    textColor: '{colors.ink}'
    typography: '{typography.mono}'
    rounded: '{rounded.sm}'
    padding: '0 6px'
  card:
    backgroundColor: '{colors.lifted-paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: '16px'
  navbar:
    backgroundColor: '{colors.espresso}'
    textColor: '{colors.tan}'
    height: '56px'
---

# Design System: Fork

## Overview

**Creative North Star: "The Annotated Cookbook"**

Fork looks like a cookbook that has been cooked from: cream paper, a serif for the recipe names, and a cook's notes in the margin. The notes are the product. Version numbers, handles, dates and diffs are set in a monospace face, the way a pencil annotation differs from the printed page, so a reader always knows which marks are the recipe and which are its history. Everything else recedes: one dark surface (the espresso navbar), one text accent (clay), one action colour (marigold).

Density is editorial rather than app-like. Body text sits at 16px with generous leading, the page has one 1200px column with 24px gutters (18px on a phone), and recipe cards are content on the paper, not tiles. Surfaces separate by a step in tone, never by shadow. The system is warm (paper, clay, marigold), exact (tabular figures, one focus ring, 8px rhythm) and simple (three faces doing three jobs, two button styles, one chip). Its colour should be decently vibrant: the owner finds the current clay and marigold a little dull and wants more life in them, short of anything neon.

Confirmed rejections: no gradients, no glass, no shadows on resting elements, no colour other than clay and marigold outside the diff.

**Key Characteristics:**

- Cream paper ground with one espresso bar; nothing else is dark.
- Bitter for names and titles, Source Sans 3 for everything read, JetBrains Mono for every mark that is history or measurement.
- Clay is the only coloured text; marigold is the only fill.
- Depth is tonal: paper, lifted paper, clay tint, espresso.
- Version chips, bylines and diffs are first-class marks, set in mono.

## Colors

A paper-and-ink palette with two warm accents and a semantic pair for diffs.

### Primary

- **Clay** (#b23c00): the only text accent. Page titles (h1), links, recipe names on hover, version numbers in card meta, step numbers. Hover state for a clay link is ink, not a lighter clay.
- **Marigold** (#eca620): the only fill. Primary buttons, the "+ New Recipe" navbar action, and the current-version chip. Always carries ink text. Hover darkens to **Marigold Deep** (#dc980a); nothing fades.

### Neutral

- **Paper** (#f7f3ec): page background and stat tiles inside cards.
- **Lifted Paper** (#fffdf9): cards, inputs, dialogs, the version strip. One step above paper.
- **Clay Tint** (#f5e9e0): no-photo panels on recipe cards, ghost-button and tag hover fills.
- **Espresso** (#1a1408): the navbar, and the strip above the page on overscroll. The one dark surface.
- **Ink** (#1a1714): running text, headings other than h1, button text on marigold.
- **Ink 2** (#4a443e): secondary copy, descriptions, tag text.
- **Ink 3** (#6f6960): muted labels, gram weights, timestamps, placeholders (4.9:1 on paper).
- **Cream** (#f7f3ec) and **Tan** (#b8a880): text on espresso. Cream for the wordmark and the active link, tan for the rest.
- **Rule** (#e4ded4) and **Rule 2** (#d9d3c8): dividers and card borders; input borders and heading underlines use Rule 2.

### Semantic (diff only)

- **Diff Add** (#2f6b37) on **Diff Add Background** (#e6f0e3), 5.47:1.
- **Diff Remove** (#a3362b) on **Diff Remove Background** (#f6e3e0), 5.44:1. Also the error style for forms.

### Colour pass, 28 October 2026

Clay and marigold were raised in chroma from #a4512b and #e8a83a: same hues, same lightness, same paper. Clay now sits at the sRGB chroma limit for its lightness. If it reads loud on link-heavy pages, step it back to #af470b and leave the marigold.

### Named Rules

**The Clay Is Text Rule.** Clay never fills a shape, with one named exception: the strike-row square fills clay when ticked (decided 29 October 2026). It colours titles, links and version marks. Its hover is ink.

## Typography

**Display Font:** Bitter (with Georgia, serif), weights 500 and 600 **Body Font:** Source Sans 3 (with -apple-system, BlinkMacSystemFont, sans-serif), weights 400, 500, 600 and 400 italic **Label/Mono Font:** JetBrains Mono (with Fira Code, monospace), weights 400 and 600

**Character:** A sturdy slab serif for the names, a plain humanist sans for the reading, and a monospace for the marks a cook makes on the page. Figures are tabular everywhere so quantities and grams line up.

### Hierarchy

- **Display** (500, 2.5rem, 1.15, clay): page h1. Recipe titles, "Recipes", "Search", the profile handle. One clamp on every page, `clamp(1.75rem, 1.2rem + 1.8vw, 2.5rem)`, so phones get about 1.75rem (29 October 2026; no page sets its own h1 size, the landing hero included: its 56px and 44px went at the end of that day, and its lede sits on the ramp at 1.0625rem).
- **Byline** (600, 1rem, 1.5, ink, Source Sans): "By @author · 1 fork" under a recipe's title; the handle mono and clay at the line's size.
- **Description** (400, 1.0625rem, 1.5, ink, Source Sans): a recipe's description under its byline, plain body text.
- **Headline** (500, 1.75rem, 1.25, ink): h2 on pages that need a second serif level ("Recipes worth forking").
- **Title** (500, 1.0625rem, 1.25): recipe card names in Bitter. Clay on a no-photo panel, ink on a photo card.
- **Body** (400, 1rem, 1.65, ink): running text, ingredients, steps. Descriptions at 1.0625rem in Ink 2. Measure stays under about 72 characters, except method steps, which run the full column (28 October 2026; a 68ch cap was tried on 29 October and read as too narrow).
- **Sans label** (600, 0.6875rem, 0.08em, uppercase, Ink 3): the page's one uppercase label: section eyebrows ("Ingredients", "Method", "Recent"), form legends, and the recipe page's phone section tabs at 0.75rem. The recipe page's measure is not a label; see Version note.
- **Mono** (400, 0.75rem, 1.5): dates, diff rows and commit messages in history. On the recipe page mono is spent on the version bar under the hero and nowhere in the header; the measure is sans and the byline's handle is mono at the line's size, like every username (decided 29 October 2026). Gram weights are not mono: they sit inside a sans ingredient line at the line's own size, in Ink 3, so the strike runs through them as one line (decided 29 October 2026). The recipe page's tag line uses 1rem (decided 29 October 2026); step numerals are Bitter 1.125rem in clay. Diff and compare surfaces use 0.875rem. Card version marks use 600 at 0.6875rem.
- **Also in use** and on the ramp: 0.8125rem (card meta, byline, numerals), 0.875rem (navbar links, diff, tag options), 0.9375rem (buttons, card body, the auth subtitle, the phone menu), 1.375rem (the wordmark). Nothing sits off the ramp (29 October 2026: 0.9rem, 0.95rem, 1.1rem, 1.5rem, 1.625rem, 2rem and 2.125rem were snapped to their nearest step).
- **Avatar** (the profile header): a 72px circle of clay tint with the handle's initial in Bitter 500 clay at 1.75rem; 56px and 1.375rem on a phone. The no-photo panel's treatment, for the same reason: there is no photo.
- **Stacked photo crops** (the recipe page): beside the header the photo is 3:2 with 6px corners; at or below 1023 it stacks under the title at 16:9 with the same 6px corners; at or below 699 it is 21:9, edge to edge, no radius.

### Named Rules

**The Pencil Rule.** Anything that is history or measurement (version number, date, grams, diff text) is set in JetBrains Mono. Anything that is the recipe (title, description, ingredients, steps) is not. The reader tells the two apart by face alone. Usernames are identifiers and are set in mono like version numbers and dates: clay, at the size of the line they sit in, so the byline reads "By" sans, "@author" mono, "· 1 fork" sans. The byline's sans exception, decided earlier on 29 October 2026, was withdrawn the same day; the version and its history stay mono in the bar under the hero. One place a handle is not mono: the profile page's h1, which is a page title and takes the Display face, Bitter in clay, like every other h1 (decided 29 October 2026).

**The One Clay Line Rule.** Clay running text is the h1 and links. Headings below h1 are ink.

## Layout

One centred column, `max-width: 1200px`, with 24px side gutters on desktop and 18px on phones (`.page`, `.page-inner`). Spacing follows an 8px scale (4, 8, 12, 16, 24, 32, 48, 64); Tailwind `p-5` to `p-8` are mapped onto the 24, 32, 48 and 64 steps.

Landing page, 29 October 2026: the logged-out home is that same column. The hero, the sample diff and the recipe grid all sit inside one `.page-inner`, on the one left edge every list page has (the hero and the diff used to carry their own 1200px column with the gutter inside it, which put them 24px further in at 1280). Under the diff the four newest recipes (one row at 1280, two by two on a phone) sit under the browse page's "Recent" eyebrow with its rule, and the page closes on an "All recipes →" link to `/recipes`, where the hero's "Browse recipes" also goes.

Closing links, 29 October 2026: a link that ends a page or an empty state takes the arrow form ("All recipes →", "Explore recipes →") and the shared `.arrow-link`, 24px tall at desktop from its own line and 44px on a phone by padding pulled back by margin. The back link above a page title (`.back-link`) is as wide as its text, not the column, with the same 24px and 44px hits.

Page width, 29 October 2026: every page is the 1200px column with the site gutters (`.page-inner`); the auth card is a card, not a page width. The compare page gave up its own 784px measure for it, and the diff's Ingredients and Method panels fill the column side by side from a 1024 viewport (the column is 61rem there, which is the container query's threshold) and stack below.

Recipe grids are 2 columns on a phone, 3 from 700px, 4 from 1100px, with 24px gaps. The recipe page body is a 380px aside beside a reading column with a 48px gap; the aside is sticky at 20px and, when the list is taller than the screen, scrolls inside itself (`max-height: calc(100dvh - 40px)`, 4px of padding behind a matching negative margin so focus rings are not clipped, thin Rule 2 scrollbar; decided 29 October 2026). While rows are hidden below, the bottom 24px fades (a scroll-driven animation; no fade where scroll timelines are unsupported). Below 1024px it is static and uncapped. Tag tabs are a single scrolling row that bleeds to the screen edge on phones.

Breakpoints: 699px (phone), 768px (navbar collapses below it), 1024px, 1100px.

Phones are composed on purpose but never override the desktop and iPad layout: desktop is designed first, then the phone gets its own crop and order.

## Elevation & Depth

Flat, by tonal step. Paper, lifted paper, clay tint and espresso are the four surfaces, and a 1px rule separates what tone cannot. No element at rest carries a shadow.

### Shadow Vocabulary

- **Raised** (`box-shadow: 0 4px 16px rgba(26, 23, 20, 0.12)`): native `<dialog>` opened with `showModal()`, over a `rgba(26, 20, 8, 0.5)` backdrop. The one true overlay.
- **Card** (`box-shadow: 0 1px 3px rgba(26, 23, 20, 0.08), 0 1px 2px rgba(26, 23, 20, 0.05)`): legacy token still on the auth card and version strip. Under the flat rule it is to be removed, not reused.

### Named Rules

**The Flat-At-Rest Rule.** Surfaces are flat. A shadow appears only on something that truly floats above the page: a dialog, a menu.

## Shapes

Small, consistent corners: 4px on chips and icon buttons, 6px on buttons, inputs and card photos, 8px on cards and dialogs, 6px on the version bar, pills only on tags. Borders are 1px in Rule or Rule 2. Recipe cards have no box at all; the photo or the clay-tint panel (4:3) is the only shape. Photos are cropped, never letterboxed.

## Components

### Buttons

- **Shape:** 6px corners, text 0.9375rem.
- **Primary:** marigold fill, ink text, 600 weight, 12px 16px padding. Hover darkens to marigold deep over 0.15s; no opacity fade.
- **Ghost:** transparent with a 1px ink border, 500 weight, 11px 16px. Hover fills clay tint.
- **Focus:** the global ring, 2px clay with 2px offset; marigold inside the navbar.
- **Navbar action:** marigold, 0.875rem, 7px 14px. The only fill in the bar.

One exception, decided 28 October 2026: the recipe page's action row (Fork or Edit, Favorite) is set as 44px pills with a leading icon, the header's last line. Everywhere else a button keeps the 6px corner.

Fork is one click, decided 29 October 2026: the pill submits, the server makes the copy and redirects to it. No two-step confirm, no dialog. Logged out, the same pill leads to login and back to this page.

### Chips

- **Version chip:** marigold fill, ink mono 600 text, 0 6px padding, 4px corners. Marigold carries no fixed meaning: it is the vibrant accent, spent sparingly on bold things (the primary button, the chip). On the recipe page the chip marks the version being read, so it stays marigold on an older version too; on the compare page it marks the "To" side; the recipe card's version mark is clay text (decided 29 October 2026, Spencer: "marigold only as the version being read is not inherently true, it's just a vibrant accent colour we should use sparingly").

- **Tags:** transparent pill, 1px Rule 2 border, Ink 2 text at 0.75rem 500. Hover fills clay tint and darkens the border. On espresso: tan text with a 22% white border.
- **Tag tabs:** plain text at 0.875rem, Ink 2, 2px transparent underline; the current tab is ink, 600, with a clay underline. A pressed filter (search, favorites) is a tag pill instead, a state rather than a place: a 1px Ink 2 border around the text band, 6px outside the button each side so two pressed neighbours keep a gap, Ink 2 text, no underline (29 October 2026). The filter row is a group of toggle buttons, not a nav; "Clear all" leads it, so a phone reaches it without scrolling, and a press keeps keyboard focus. On a phone every tab reaches 44px by padding above the text, pulled back by the row's margin.

### Cards / Containers

- **Recipe card:** no surface, border or shadow. 4:3 photo or clay-tint panel with 6px corners, Bitter title at 1.0625rem (clamped to three lines on a photo, four on the panel; the stretched link carries the whole title), a sans 0.8125rem meta row in Ink 3 whose author is a mono clay link (it must read as clickable) and whose version mark is mono 600 clay at 0.6875rem; the dots between the items are drawn by CSS, never typed, so a wrapped row never ends with one; below 1024 there are no dots and the items sit 10px apart, so no wrapped line starts with one either (29 October 2026). The photo's alt is empty, since the heading and the stretched link already name the recipe; the first row's photos load eagerly and the very first carries `fetchpriority="high"`, the rest lazily; every grid passes the card its index, the tag and search pages included. Both the photo title and the panel title balance their lines. The author link reaches 24px at desktop without moving. Hover scales the photo 1.03 and turns the title clay.
- **Panels (compare cards, commit bar):** lifted paper, 1px Rule border, 8px corners, 16px padding. The recipe page's version bar is the same paper at 6px corners and 12px 16px padding (see Version note).
- **Stat tiles:** paper on lifted paper, sans label over a 600 value.

### Inputs / Fields

- **Style:** lifted paper, 1px Rule 2 border, 6px corners, 9px 12px padding, 0.9375rem (1rem on phones so iOS does not zoom).
- **Focus:** the global clay ring.
- **Error:** diff-remove text and border on diff-remove background.
- **Textarea:** grows with content (`field-sizing: content`).
- **Strike rows** (recipe page ingredients and steps, decided 29 October 2026): the input is a native checkbox, visually hidden, and the whole row is its label with a 44px hit; when checked the row strikes through and its text and grams dim to 60%; the square stays full clay. Its visible control is a 14px square, 1px Ink 3 border, 3px corners, filled clay when checked (no check mark), 10px before the text: at the row start on an ingredient row, before the numeral in the number column on a method row.
- **The editor** (decided 29 October 2026, the editor's exception to the Pencil Rule, in Spencer's words: "in the editor every text box is mono"): on the new and edit pages the title, description, servings, both times, the tag search, ingredients, steps and the commit message are all JetBrains Mono at 0.8125rem on a 1.6 line (1rem on a phone, the no-zoom floor), so every single-line box is one height and the commit message matches its siblings. Text under edit is raw text, not yet the recipe; the recipe page keeps the rule. The ingredients placeholder shows what comes back ("2¼ cups", not "2 1/4"). Invalid fields wear the error tokens above through `:user-invalid` and `aria-invalid`, with the message under the field in the server's wording and `aria-describedby`; a failed save focuses the field it names, and the global error box is for conflicts and failures no field owns. The save's outcome is the header's mono line ("Editing v3 · saves as v4", "saves settings only"), not a helper beside Save. Save is at least 112px wide beside Cancel. A tag pill's remove button is a 16px square with a 44px hit on a phone; the tag options are not Tab stops (arrows and Enter on the input). The editor is the site's 1200px column, settings 5 beside the long text's 7 with a 40px gap, one column below 860 (29 October 2026).

### Navigation

A "Skip to content" link is the first tab stop on every page, hidden until focused, then a marigold pill over the navbar's left; on a recipe page it reads "Skip to ingredients" and lands on the recipe past the header.

- Espresso bar, 56px, 1200px inner column. Bitter wordmark "Fork." in cream with a marigold full stop. Links in tan, 0.875rem 500, cream on hover or when active. One marigold action. Below 768px the links collapse behind 44px icon buttons.

### Browser surfaces

The marks the browser draws are the system's own. Focus: one 2px clay ring with 2px offset on `:focus-visible`, marigold inside the navbar. Selection: `::selection` is marigold behind ink text, site-wide, the one fill (decided 29 October 2026). Overscroll: the strip above the page is espresso. The recipe page's phone section tabs are toggle buttons carrying `aria-pressed`; its hero photo is the one image above the fold and carries `fetchpriority="high"` and `decoding="async"`; the bar's screen-reader version line ends in a full stop so the note does not run into it.

### Version note (signature)

Decided 29 October 2026, revised twice the same day: first the commit message left the closed header for the version list; then, after a side-by-side of the byline version, a bar above the hero and a bar below it (boards "Bar A, D, E"), the version moved out of the header altogether into a bar under the hero, the hinge between the dish and the recipe. The header reads title, byline, description, measure, tags, actions, with nothing boxed and nothing pinned.

- **Title:** Bitter, clay.
- **Byline** (sans 1rem 600, links clay; the handle mono at the line's size): `By @author · 1 fork`. No version in the header.
- **Description:** sans 1.0625rem ink, plain body text.
- **Measure:** one sans line at 1rem, value then label for all three: `15 min prep · 13 min cook · 36 servings`, values 600 ink, labels Ink 2, dots in Ink 3 (they were Rule 2 until 29 October 2026, when Spencer could not see them). A pair never splits; the dots are drawn by CSS between pairs, and a phone drops them for a 10px gap so no dot strands. No rule above it.

- **Tags:** a comma-separated line at 1rem; each tag a clay 600 link, ink on hover, the commas Ink 2 (revised 29 October 2026: grey tags carried no link affordance).
- **Actions:** the 44px pills (see Buttons), unpinned, directly after the tags.
- **Hit areas:** the byline's author link and the tag links reach 24px on desktop and 44px on a phone (below 700px) without moving the text, with the padding trick the bar uses (`display: inline-block; padding: 11px 0; margin-block: -11px`; decided 29 October 2026).

- **Spacing** down the column: 8, 8, 8, 8, 16 (tags were 2px under the measure until 29 October 2026; now the same 8 as every other line). The column ends where it ends; it is never stretched to the photo.
- **Photo:** 3:2 beside the header, capped at 340px tall, 6px corners. Stacked below 1024px it sits directly under the title, before the byline.
- **Ingredients:** a measured line bolds its measure ("**2¼ cups** (281g) all-purpose flour"); a counted line is all measure, so it is bold whole ("**2 large eggs** (≈100g)"); a line with no number is plain. On every width.
- **Sections below 1024px:** the Ingredients | Method bar is a switch, not a jump: one section shows, the other is hidden, and switching puts the section's top under the bar. Decided 29 October 2026 because scrolling past one section to reach the other felt bad.
- **Version bar** (under the hero; its bottom edge is the divider, there is no page rule; absent on a one-version recipe): lifted paper, 1px Rule, 6px corners, 12px 16px padding, no shadow, the page's gutters. One mono 0.875rem line: the version number as the marigold chip (0.75rem 600, ink on marigold; the other rows' numbers are clay), the note in ink clamped to one line while closed (two lines below 1024px, where the controls already have a row of their own; decided 29 October 2026), then at the right "3 versions ▾" (the one toggle, 12px chevron that flips). The current line carries no compare of its own, open or closed; each other row compares itself with the one being read (decided 29 October 2026). Viewing an older version the line leads with its state alone after the chip, "v2 Older version", then the note, with "Back to v3 · 3 versions ▾" at the right where the latest keeps its toggle (below 1024 the controls take their own row as on the latest, and below 700px the note takes one of its own under the state; decided 29 October 2026, Spencer: "older version i agree"), and v3's row below reads "Compare with v2". Open: the note runs in full and the other versions list under a rule, each row (number and message) a link to that version, in Ink 2 darkening on hover, with "Compare with vN" at the right. Below 1024 the controls drop under the note rather than crush it; on a phone each link and the toggle are 44px tall and each row's compare sits under it. The dots between the controls are drawn by CSS between items (`.item + .item::before`), never typed, so no line begins or ends with one; below 700px the items wrap 10px apart with no dots at all (decided 29 October 2026). Escape closes the list only while focus is inside the bar.

No italic, no uppercase in the header, no chip in the header, no note in the header.

### Diff rows (signature)

Mono at 0.875rem, one row per ingredient or step, a 1ch gutter for `+`, `−` or `~`, added and removed words on their semantic backgrounds. Ingredient and step rows are capped at 72 characters; the Details rows run the column, so a renamed title stays on one line.

29 October 2026, after the compare page critique (Spencer's decisions): unchanged rows are Ink 3 so the changed rows carry the page; added and removed keep their colours. The two sides of a change are `<del>` and `<ins>` with a real space and an unseen "to" between them, so "¾½ cup" reads and copies as "¾ to ½ cup"; the gutter glyph is aria-hidden and each changed row opens with an unseen "Changed:", "Added:" or "Removed:". The third panel is "Method", and the Details panel speaks the recipe page's measure, value then label: "4 to 8 servings", "11 min to 13 min cook". A removed ingredient keeps its old place in the list. After the last row one link reads the To version. The compare page's "To" chip is the version chip (marigold, 0 6px, 4px corners) at the card number's 18px rather than the bar's 12px: deliberate, it is the card's number, not a mark in a line.

Second sweep, 29 October 2026 (Spencer's decisions): a modified row is ink, its `~` included, so it stands apart from the Ink 3 rows around it; not clay, which would read too close to the removal red. Modified step numbers stay clay, unchanged ones Ink 3. A step number ends in an unseen stop so a screen reader says "5. Gradually stir", not "5 Gradually stir". The summary line that counted the change is gone: the Details panel is the summary. The version cards carry number, author, date and message only; the title, servings and times live in Details with their del/ins. Each card's number links to its version (the latest to the plain recipe URL), so the older version is reachable; the To number keeps the chip look. Card usernames and the back link reach 24px at desktop and 44px on a phone by padding and negative margin, as the recipe page's links do.

End of day, 29 October 2026 (Spencer's decisions): a closed picker shows only its version, "v2 ▾"; the open list carries each message, "v2 · Increased vanilla to 2 tsp". The native select does the work, its own text transparent under a face drawn in flow that also sets its natural width. The From and To eyebrows are gone; the selects are named "From version" and "To version", and the arrow between them is mono at their size and hidden from screen readers. Ingredients and Method share the version cards' grid, two equal columns 24px apart, so Method starts on the To card's edge. A lone insertion or deletion inside a changed row opens with an unseen "added:" or "removed:", as a replacement carries its "to". On a phone each card number reaches 44px by a box above and below it, so the To chip keeps its shape. The same version on both sides titles the tab "v2 · same version · Recipe".

## Do's and Don'ts

### Do:

- **Do** set version numbers, dates, handles, the version bar and diff text in JetBrains Mono. Gram weights stay sans inside their ingredient line; the card's time and fork count are sans.
- **Do** say "Log in" for signing in, everywhere: the navbar, the login page's tab, subtitle and button, and every link to it. "Sign up" is the other verb, and "Sign in" beside it differs by two letters.
- **Do** keep clay for titles, links and version marks, and marigold for the one action.
- **Do** separate surfaces with a tone step or a 1px rule; reserve shadows for dialogs.
- **Do** keep body text at 16px, ink, with a measure under about 72 characters.
- **Do** compose desktop and iPad first; give the phone its own crop and order without reshaping the desktop.
- **Do** hold the layout when a recipe has no photo; the clay-tint panel is the fallback.

### Don't:

- **Don't** add a second dark surface, a gradient, a blur or a glow.
- **Don't** fill anything with clay (the ticked strike square is the one exception), or colour text marigold.
- **Don't** put a shadow on a card, strip or button at rest.
- **Don't** invent proof: no ratings, counts, testimonials or press.
- **Don't** let the version UI crowd the recipe; where it harms reading, reduce it on that surface rather than the whole system.
