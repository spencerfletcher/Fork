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
    padding: '0 5px'
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

Fork looks like a cookbook that has been cooked from: cream paper, a serif for the recipe names, and a cook's notes in the margin. The notes are the product. Version numbers, bylines, dates and gram weights are set in a monospace face, the way a pencil annotation differs from the printed page, so a reader always knows which marks are the recipe and which are its history. Everything else recedes: one dark surface (the espresso navbar), one text accent (clay), one action colour (marigold).

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

**The Clay Is Text Rule.** Clay never fills a shape. It colours titles, links and version marks. Its hover is ink.

## Typography

**Display Font:** Bitter (with Georgia, serif), weights 500 and 600 **Body Font:** Source Sans 3 (with -apple-system, BlinkMacSystemFont, sans-serif), weights 400, 500, 600 and 400 italic **Label/Mono Font:** JetBrains Mono (with Fira Code, monospace), weights 400 and 600

**Character:** A sturdy slab serif for the names, a plain humanist sans for the reading, and a monospace for the marks a cook makes on the page. Figures are tabular everywhere so quantities and grams line up.

### Hierarchy

- **Display** (500, 2.5rem, 1.15, clay): page h1. Recipe titles, "Recipes", "Search", the profile handle. Phones drop to about 1.75rem.
- **Byline** (600, 1rem, 1.5, ink, Source Sans): "By @author · 3 versions · 1 fork" under a recipe's title; the links clay.
- **Description** (400, 1.0625rem, 1.5, ink, Source Sans): a recipe's description under its byline, plain body text.
- **Headline** (500, 1.75rem, 1.25, ink): h2 on pages that need a second serif level ("Recipes worth forking").
- **Title** (500, 1.0625rem, 1.25): recipe card names in Bitter. Clay on a no-photo panel, ink on a photo card.
- **Body** (400, 1rem, 1.65, ink): running text, ingredients, steps. Descriptions at 1.0625rem in Ink 2. Measure stays under about 72 characters.
- **Sans label** (600, 0.6875rem, 0.08em, uppercase, Ink 3): the page's one uppercase label: section eyebrows ("Ingredients", "Method", "Recent"), form legends, and the recipe page's phone section tabs at 0.75rem. The recipe page's measure is not a label; see Version note.
- **Mono** (400, 0.75rem, 1.5): dates, diff rows and commit messages in history. On the recipe page mono is spent on the version chip in the byline and on the history list it opens (0.875rem, Ink 2); the byline and the measure are sans (decided 29 October 2026). Gram weights are not mono: they sit inside a sans ingredient line at the line's own size, in Ink 3, so the strike runs through them as one line (decided 29 October 2026). The recipe page's tag line uses 1rem (decided 29 October 2026); step numerals are Bitter 1.125rem in clay. Diff and compare surfaces use 0.875rem. Card version marks use 600 at 0.6875rem.
- **Also in use** and on the ramp: 0.8125rem (card meta, byline, numerals), 0.875rem (navbar links, diff), 0.9375rem (buttons, card body), 1.375rem (the wordmark).

### Named Rules

**The Pencil Rule.** Anything that is history or measurement (version number, date, grams, diff text) is set in JetBrains Mono. Anything that is the recipe (title, description, ingredients, steps) is not. The reader tells the two apart by face alone. One exception, decided 29 October 2026: the recipe byline and its counts ("By @author · 1 fork · 3 versions") are sans at the byline size, so the only mono in that line is the version chip.

**The One Clay Line Rule.** Clay running text is the h1 and links. Headings below h1 are ink.

## Layout

One centred column, `max-width: 1200px`, with 24px side gutters on desktop and 18px on phones (`.page`, `.page-inner`). Spacing follows an 8px scale (4, 8, 12, 16, 24, 32, 48, 64); Tailwind `p-5` to `p-8` are mapped onto the 24, 32, 48 and 64 steps.

Recipe grids are 2 columns on a phone, 3 from 700px, 4 from 1100px, with 24px gaps. The recipe page body is a 380px aside beside a reading column with a 48px gap; the aside is sticky at 24px. Tag tabs are a single scrolling row that bleeds to the screen edge on phones.

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

Small, consistent corners: 4px on chips and icon buttons, 6px on buttons, inputs and card photos, 8px on cards, dialogs and the version strip, pills only on tags. Borders are 1px in Rule or Rule 2. Recipe cards have no box at all; the photo or the clay-tint panel (4:3) is the only shape. Photos are cropped, never letterboxed.

## Components

### Buttons

- **Shape:** 6px corners, text 0.9375rem.
- **Primary:** marigold fill, ink text, 600 weight, 12px 16px padding. Hover darkens to marigold deep over 0.15s; no opacity fade.
- **Ghost:** transparent with a 1px ink border, 500 weight, 11px 16px. Hover fills clay tint.
- **Focus:** the global ring, 2px clay with 2px offset; marigold inside the navbar.
- **Navbar action:** marigold, 0.875rem, 7px 14px. The only fill in the bar.

One exception, decided 28 October 2026: the recipe page's action row (Fork or Edit, Favorite) is set as 44px pills with a leading icon, the header's last line. Everywhere else a button keeps the 6px corner.

### Chips

- **Version chip:** marigold fill, ink mono 600 text, 0 5px padding, 3px to 4px corners. Marks the current version on the recipe page, the version strip and the compare page.
- **Tags:** transparent pill, 1px Rule 2 border, Ink 2 text at 0.75rem 500. Hover fills clay tint and darkens the border. On espresso: tan text with a 22% white border.
- **Tag tabs:** plain text at 0.875rem, Ink 2, 2px transparent underline; the current tab is ink, 600, with a clay underline.

### Cards / Containers

- **Recipe card:** no surface, border or shadow. 4:3 photo or clay-tint panel with 6px corners, Bitter title at 1.0625rem, mono meta row in Ink 3 with the version mark in clay. Hover scales the photo 1.03 and turns the title clay.
- **Panels (version strip, compare cards, commit bar):** lifted paper, 1px Rule border, 8px corners, 16px padding (9px 14px on the strip).
- **Stat tiles:** paper on lifted paper, sans label over a 600 value.

### Inputs / Fields

- **Style:** lifted paper, 1px Rule 2 border, 6px corners, 9px 12px padding, 0.9375rem (1rem on phones so iOS does not zoom).
- **Focus:** the global clay ring.
- **Error:** diff-remove text and border on diff-remove background.
- **Textarea:** grows with content (`field-sizing: content`).

### Navigation

A "Skip to content" link is the first tab stop on every page, hidden until focused, then a marigold pill over the navbar's left; on a recipe page it reads "Skip to ingredients" and lands on the recipe past the header.

- Espresso bar, 56px, 1200px inner column. Bitter wordmark "Fork." in cream with a marigold full stop. Links in tan, 0.875rem 500, cream on hover or when active. One marigold action. Below 768px the links collapse behind 44px icon buttons.

### Version note (signature)

Decided 29 October 2026, revised the same day after mocking up the header in four layouts: the commit message leaves the closed header and lives only in the version list, so the header reads title, byline, description, measure, tags, actions, with nothing boxed and nothing pinned.

- **Title:** Bitter, clay.
- **Byline** (sans 1rem 600, links clay): `By @author · 1 fork · v3 · 3 versions ▾`. The chip is the marigold version chip in mono, a badge, not a control, with an sr-only "Version 3, latest:" prefix. "3 versions" is the one toggle: a word in the sentence at the byline size with a 12px chevron, which flips when open. While viewing an older version the byline keeps the chip and the chevron and reads "v2 · v2 of 3 ▾ · Older version · Back to v3" (revised 29 October 2026 after a critique: the state must be unmistakable).
- **Description:** sans 1.0625rem ink, plain body text.
- **Measure:** one sans line at 1rem, value then label for all three: `15 min prep · 13 min cook · 36 servings`, values 600 ink, labels Ink 2, dots in Rule 2. A pair never splits; the line wraps only at the dots. No rule above it.
- **Tags:** a comma-separated line at 1rem, Ink 2, clay on hover.
- **Actions:** the 44px pills (see Buttons), unpinned, directly after the tags.
- **Spacing** down the column: 8, 8, 8, 2, 16. The column ends where it ends; it is never stretched to the photo.
- **Photo:** 3:2 beside the header, capped at 340px tall, 6px corners. Stacked below 1024px it sits directly under the title, before the byline.
- **Ingredients:** a measured line bolds its measure ("**2¼ cups** (281g) all-purpose flour"); a counted line is all measure, so it is bold whole ("**2 large eggs** (≈100g)"); a line with no number is plain. On every width.
- **Sections below 1024px:** the Ingredients | Method bar is a switch, not a jump: one section shows, the other is hidden, and switching puts the section's top under the bar. Decided 29 October 2026 because scrolling past one section to reach the other felt bad.
- **History list** (opened by "3 versions", under the byline): lifted paper, 1px Rule, 6px corners, 10px 14px padding, no shadow. Rows in mono 0.875rem: the current version's row carries the chip and its message in ink; each other version its number in clay 600, its message in Ink 2, and "Compare with vN" at the right.

No italic, no uppercase in the header, no chip in the title, no note under the description.

### Diff rows (signature)

Mono at 0.875rem, one row per ingredient or step, a 1ch gutter for `+`, `−` or `~`, added and removed words on their semantic backgrounds. Rows are capped at 72 characters.

## Do's and Don'ts

### Do:

- **Do** set every version number, byline, date, count and gram weight in JetBrains Mono.
- **Do** keep clay for titles, links and version marks, and marigold for the one action.
- **Do** separate surfaces with a tone step or a 1px rule; reserve shadows for dialogs.
- **Do** keep body text at 16px, ink, with a measure under about 72 characters.
- **Do** compose desktop and iPad first; give the phone its own crop and order without reshaping the desktop.
- **Do** hold the layout when a recipe has no photo; the clay-tint panel is the fallback.

### Don't:

- **Don't** add a second dark surface, a gradient, a blur or a glow.
- **Don't** fill anything with clay, or colour text marigold.
- **Don't** put a shadow on a card, strip or button at rest.
- **Don't** invent proof: no ratings, counts, testimonials or press.
- **Don't** let the version UI crowd the recipe; where it harms reading, reduce it on that surface rather than the whole system.
