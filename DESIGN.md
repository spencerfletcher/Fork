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
    padding: '11px 16px'
    border: '1px solid transparent'
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
- **Marigold** (#eca620): the only fill. Primary buttons, the "+ New recipe" navbar action, and the current-version chip. Always carries ink text. Hover darkens to **Marigold Deep** (#dc980a); nothing fades.

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
- **Diff Remove** (#a3362b) on **Diff Remove Background** (#f6e3e0), 5.44:1. Its text colour is also the error style for forms; the background is for diffs only.

### Colour pass, 28 October 2026

Clay and marigold were raised in chroma from #a4512b and #e8a83a: same hues, same lightness, same paper. Clay now sits at the sRGB chroma limit for its lightness. If it reads loud on link-heavy pages, step it back to #af470b and leave the marigold.

### Named Rules

**The Clay Is Text Rule.** Clay never fills a shape, with one named exception: the editor's public checkbox takes clay as its accent-color (decided 29 October 2026). It colours titles, links and version marks. Its hover is ink.

## Typography

**Display Font:** Bitter (with Georgia, serif), weights 500 and 600 **Body Font:** Source Sans 3 (with -apple-system, BlinkMacSystemFont, sans-serif), weights 400, 500, 600 and 400 italic **Label/Mono Font:** JetBrains Mono (with Fira Code, monospace), weights 400 and 600

**Character:** A sturdy slab serif for the names, a plain humanist sans for the reading, and a monospace for the marks a cook makes on the page. Figures are tabular everywhere so quantities and grams line up.

### Hierarchy

- **Display** (500, 2.5rem, 1.15, clay): page h1. Recipe titles, "Recipes", "Search", the profile handle. One clamp on every page, `clamp(1.75rem, 1.2rem + 1.8vw, 2.5rem)`, so phones get about 1.75rem (29 October 2026; no page sets its own h1 size, the landing hero included: its 56px and 44px went at the end of that day, and its lede sits on the ramp at 1.0625rem).
- **Byline** (600, 1rem, 1.5, ink, Source Sans): "By @author · 1 fork" under a recipe's title; the handle mono and clay one notch under the line's size (0.9375em).
- **Description** (400, 1.0625rem, 1.5, ink, Source Sans): a recipe's description under its byline, plain body text.
- **Headline** (500, 1.75rem, 1.25, ink): h2 on pages that need a second serif level ("Recipes worth forking").
- **Title** (500, 1.0625rem, 1.25): recipe card names in Bitter. Clay on a no-photo panel, ink on a photo card.
- **Body** (400, 1rem, 1.65, ink): running text, ingredients, steps. Descriptions at 1.0625rem in Ink 2. Measure stays under about 72 characters, except method steps, which run the full column (28 October 2026; a 68ch cap was tried on 29 October and read as too narrow).
- **Sans label** (600, 0.6875rem, 0.08em, uppercase, Ink 3): the page's one uppercase label: section eyebrows ("Ingredients", "Method", "Recent"), form legends, and the recipe page's phone section tabs at 0.75rem. The recipe page's measure is not a label; see Version note.
- **Mono** (400, 0.75rem, 1.5): dates, diff rows and commit messages in history. On the recipe page mono is spent on the version bar under the hero and nowhere in the header; the measure is sans and the byline's handle is mono one notch under the line's size, like every username (decided 29 October 2026). Gram weights are not mono: they sit inside a sans ingredient line at the line's own size, in Ink 3, so the strike runs through them as one line (decided 29 October 2026). The recipe page's tag line uses 1rem (decided 29 October 2026); step numerals are Bitter 1.125rem in clay. Diff and compare surfaces use 0.875rem. Card version marks use 600 at 0.6875rem.
- **Also in use** and on the ramp: 0.8125rem (card meta, byline, numerals), 0.875rem (the navbar action, diff, tag options), 0.9375rem (buttons, card body, the auth subtitle, navbar links and Log out), 1.375rem (the wordmark). Nothing sits off the ramp (29 October 2026: 0.9rem, 0.95rem, 1.1rem, 1.5rem, 1.625rem, 2rem and 2.125rem were snapped to their nearest step).
- **Avatar** (the profile header): a 72px circle of clay tint with the handle's initial in Bitter 500 clay at 1.75rem; 56px and 1.375rem on a phone, with a 1px transparent border inside that size so forced colours keep the circle. The no-photo panel's treatment, for the same reason: there is no photo.
- **Stacked photo crops** (the recipe page): beside the header the photo is 3:2 with 6px corners; at or below 1023 it stacks under the title at 16:9 with the same 6px corners; at or below 699 it is 21:9, edge to edge, no radius.

### Named Rules

**The Pencil Rule.** Anything that is history or measurement (version number, date, grams, diff text) is set in JetBrains Mono. Anything that is the recipe (title, description, ingredients, steps) is not. The reader tells the two apart by face alone. Usernames are identifiers and are set in mono like version numbers and dates: clay, one notch under the line they sit in (0.9375em, because JetBrains Mono runs optically larger than the sans and serif beside it; decided 29 October 2026), so the byline reads "By" sans, "@author" mono, "· 1 fork · forked from Parent" sans with the parent title a clay link. The fork count appears only when the recipe has forks of its own, and a fork names its parent but not the parent's author (one click away); there is no separate attribution line (decided 29 October 2026). The byline's sans exception, decided earlier on 29 October 2026, was withdrawn the same day; the version and its history stay mono in the bar under the hero. One place a handle is not mono: the profile page's h1, which is a page title and takes the Display face, Bitter in clay, like every other h1 (decided 29 October 2026).

**The One Clay Line Rule.** Clay running text is the h1 and links. Headings below h1 are ink.

## Layout

One centred column, `max-width: 1200px`, with 24px side gutters on desktop and 18px on phones (`.page`, `.page-inner`). Spacing follows an 8px scale (4, 8, 12, 16, 24, 32, 48, 64); Tailwind `p-5` to `p-8` are mapped onto the 24, 32, 48 and 64 steps.

Landing page, 29 October 2026: the logged-out home is that same column. The hero, the sample diff and the recipe grid all sit inside one `.page-inner`, on the one left edge every list page has (the hero and the diff used to carry their own 1200px column with the gutter inside it, which put them 24px further in at 1280). Under the diff the six newest recipes sit under the browse page's "Recent" eyebrow with its rule, in at most two rows: 4 + 2 at four columns, 3 + 3 at three, and below 700px the grid flows into two rows by column and scrolls sideways, edge to edge like the tag tabs row, with scroll snap, no visible scrollbar, and columns of 2.25 to the view so the next card peeks and says the strip scrolls (decided 29 October 2026). A card that takes keyboard focus is scrolled into view, since Chromium leaves a tabbed-to card off screen; smoothly, unless motion is reduced. Below 1024px, wherever the diff's panels stack, the sample diff folds each run of two or more unchanged rows into one Ink 3 "N unchanged" row, and below 700px it drops its Details panel too, so the first photo arrives within about a screen and a half; the compare page keeps every row and every panel (decided 29 October 2026). The last section closes on an "All recipes →" link to `/recipes`, where the hero's "Browse recipes" also goes; the diff's own "Open the full comparison →" takes the same arrow form. The page itself ends on a quiet ghost "Sign up to fork one" to `/signup`, under the last section on the column's left edge and centred on a phone, a 48.75px hit like every ghost; the landing is only ever signed out, so a signed-in home has no such line. The landing passes no index to its cards, so its below-fold photos load lazily.

Closing links, 29 October 2026: a link that ends a page or an empty state takes the arrow form ("All recipes →", "Explore recipes →") and the shared `.arrow-link`, 24px tall at desktop from its own line and 44px on a phone by padding pulled back by margin. A profile's owner gets the page's one action, "New recipe →" to `/recipes/new`, after the recipe list (or the empty line); nobody else sees it. It shows only below 768; from 768 the navbar's + New recipe is the one action. Empty-state links ("Clear search", "Clear filters") take the same 24px and 44px hits through `.empty-state a`; "Clear filters" keeps the query and clears the tags only. The back link above a page title (`.back-link`) is as wide as its text, not the column, with the same 24px and 44px hits.

Page width, 29 October 2026: every page is the 1200px column with the site gutters (`.page-inner`); the auth card is a card, not a page width.

Page tops, 31 October 2026: every list page (Recipes, My Recipes, a tag, Search, Favorites) starts at one spot. The h1 sits in `.browse-header` at the same y, 24px under it comes the filter row if the page has one (the search box, or the tag tabs once they wrap under the title on a phone), and 24px under that the content. Beside the title at 700px and up, the tabs' underline would hang below the h1 and push the browse pages' content 4 to 7px lower than My Recipes; a negative margin takes it back, so the content starts 24px under the h1 there too.

Error pages, 29 October 2026: every error page titles itself "Error 404 – Recipe not found" on the site h1, code and message in one line, centred on the screen like the login page with nothing boxed; a 404 under /recipes adds a lede naming the two real causes and a ghost "Search recipes" beside the primary "Go home"; a 500 says the fault is Fork's; the compare 400, which names the missing version ("Version 9 not found") and under it the versions the recipe has ("This recipe has v1 to v3."), follows the same format with "Compare first and latest" as its primary; a version that is not a number keeps "Pick two of the recipe's versions to compare." A recipe missing from the compare page answers as the root 404 under /recipes does: the private-recipe lede, "Go home" and a ghost "Search recipes"; a 5xx there takes the root page's 500 lede. `src/error.html`, the page SvelteKit shows when the app itself cannot render, carries the bar (24px inset, 52/56px tall), paper, Bitter 600 and the marigold button from the shipped fonts, titled "<message> — Fork", with "Try again" (a reload) as its primary and "Go home" as the ghost. Its buttons are the app's 48.75px (15px on a 1.65 line, 11px 16px, a 1px border, transparent on the primary so forced colours keep its box), and the wordmark link is 51px inside the 52px phone bar. The error title balances its lines. On a 404 the page reads "Page not found" in place of SvelteKit's "Not Found", and the tab title matches; only a missing /recipes/ address suggests the recipe may be private, any other says "There is nothing at this address."

Password recovery, 29 October 2026: a "Forgot password?" link under the login card's password field (clay link, 24/44 hits) leads to /forgot-password and /reset-password, both in the auth card, the first headed "Forgot your password?" and the second "Reset password"; on Supabase's own reset email; the sent state does not say whether the address has an account, and its "Didn't get it? Send again." link brings the form back with the address still filled in. The tab title follows the card: "Check your email" once the reset link is sent, "Link expired" on a dead link. The profile's stats line says "changes", not "commits". The compare page gave up its own 784px measure for it, and the diff's Ingredients and Method panels fill the column side by side from a 1024 viewport (the column is 61rem there, which is the container query's threshold) and stack below.

Auth forms: on login, sign-up and forgot password, a bad email gets "Enter an email address like name@example.com" under the field once it has been typed in and left, or a submit was stopped, with `aria-invalid` and `aria-describedby` on top of the browser's `type="email"` check; passing through without typing shows nothing. Leaving the email field for the submit button, by focus or by a pointer pressed on it, does not show the email message; the browser's blocked submit shows it, so the button never moves under a first tap. On a blocked submit, a field with its own message (email, username) cancels the browser's validation bubble and the first invalid one takes focus; later fields cancel too, so only a field with no message of its own and nothing invalid before it gets the native bubble. Focus leaving the submit button without a submit shows a held-back email message. Every auth card, the expired reset link included, ends with the switch line to Log in.

Favorites: the empty state sits the header's 24px gap under the h1, or 24px under the filters while one is active. With nothing saved it reads "No favorites yet. Favorite a recipe from its page.", in the recipe page button's own verb, and below 700px "Explore recipes →" takes its own line under the sentence.

Recipe grids are 2 columns on a phone, 3 from 700px, 4 from 1100px, with 24px gaps. The recipe page body is a 380px aside beside a reading column with a 48px gap; the aside is sticky at 20px and, when the list is taller than the screen, scrolls inside itself (`max-height: calc(100dvh - 40px)`, 4px of padding behind a matching negative margin so focus rings are not clipped, thin Rule 2 scrollbar; decided 29 October 2026). While rows are hidden below, the bottom 24px fades (a scroll-driven animation; no fade where scroll timelines are unsupported). Below 1024px it is static and uncapped. Tag tabs are a single scrolling row that bleeds to the screen edge on phones.

Breakpoints: 699px (phone), 768px (navbar collapses below it), 1024px, 1100px.

Phones are composed on purpose but never override the desktop and iPad layout: desktop is designed first, then the phone gets its own crop and order.

## Elevation & Depth

Flat, by tonal step. Paper, lifted paper, clay tint and espresso are the four surfaces, and a 1px rule separates what tone cannot. No element at rest carries a shadow.

### Shadow Vocabulary

- **Raised** (`box-shadow: 0 4px 16px rgba(26, 23, 20, 0.12)`): native `<dialog>` opened with `showModal()`, over a `rgba(26, 20, 8, 0.5)` backdrop. The one true overlay.
- **Card** (`box-shadow: 0 1px 3px rgba(26, 23, 20, 0.08), 0 1px 2px rgba(26, 23, 20, 0.05)`): legacy token still on the auth card and version strip. Under the flat rule it is to be removed, not reused.

### Named Rules

**The Flat-At-Rest Rule.** Surfaces are flat. A shadow appears only on something that truly floats above the page: a dialog, a menu. The open tag list is the one menu that also joins its box: flush under the search box with one shared edge, square where they meet (6px corners stay at the top of the box, 8px at the foot of the list), the list's Rule 2 sides matching the box's, the shadow clipped at the join, and the focus ring running around box and list together (decided 29 October 2026).

## Shapes

Small, consistent corners: 4px on chips and icon buttons, 6px on buttons, inputs and card photos, 8px on cards and dialogs, 6px on the version bar, pills only on tags. Borders are 1px in Rule or Rule 2. Recipe cards have no box at all; the photo or the clay-tint panel (4:3) is the only shape. Photos are cropped, never letterboxed.

## Components

### Buttons

- **Shape:** 6px corners, text 0.9375rem.
- **Primary:** marigold fill, ink text, 600 weight, 11px 16px padding inside a 1px transparent border (the border is there so forced colours keep the button a box when the fill is stripped; the height stays 48.8). Hover darkens to marigold deep over 0.15s; no opacity fade.
- **Ghost:** transparent with a 1px ink border, 600 weight like the primary, 11px 16px. Hover fills clay tint.
- **Focus:** the global ring, 2px clay with 2px offset; marigold inside the navbar.
- **Navbar action:** "+ New recipe", marigold, 0.875rem 600, 6px 13px inside a 1px transparent border (the primary button's forced-colours box; the size is unchanged). The only fill in the bar. The phone menu lists it as a plain "New recipe" row.

One exception, decided 28 October 2026: the recipe page's action row (Fork or Edit, Favorite) is set as 44px pills with a leading icon, the header's last line. Everywhere else a button keeps the 6px corner.

Fork is one click, decided 29 October 2026: the pill submits, the server makes the copy and redirects to it. No two-step confirm, no dialog. Logged out, the same pill leads to login and back to this page.

### Chips

- **Version chip:** marigold fill, ink mono 600 text, 0 6px padding, 4px corners, and a 1px transparent outline drawn inside, so it keeps its box in forced colours, where the fill is dropped. Marigold carries no fixed meaning: it is the vibrant accent, spent sparingly on bold things (the primary button, the chip). On the recipe page the chip marks the version being read, so it stays marigold on an older version too; on the compare page it marks the "To" side; the recipe card's version mark is clay text (decided 29 October 2026, Spencer: "marigold only as the version being read is not inherently true, it's just a vibrant accent colour we should use sparingly").

- **Tags:** transparent pill, 1px Rule 2 border, Ink 2 text at 0.75rem 500. Hover fills clay tint and darkens the border. On espresso: tan text with a 22% white border.
- **Tag tabs:** plain text at 0.875rem, Ink 2, 2px transparent underline; the current tab is ink, 600, with a clay underline. One component, `TagTabs`, for every tag row: the browse and tag pages link through it (a nav, one current tab, All first), and Search and Favorites toggle it (a group of toggle buttons with `aria-pressed`, no All). A pressed filter looks exactly like the current tab, and several can be pressed at once (Spencer, 31 October 2026: the pill was dropped). Each toggle holds its 600 width before it is pressed, so a press moves no neighbour. "Clear all" ends the row, in Ink 3, only while a tag is pressed, so a first pick inserts nothing before the tabs; a press keeps keyboard focus and does not scroll the page, and Clear all hands focus to the first tag (the row's 18px of scroll padding keeps a focused tab's ring from being clipped). On a phone every tab reaches 44px by padding above the text, pulled back by the row's margin. In forced colours the idle tabs' transparent underline is set to Canvas, so only the current or pressed tabs keep a line (forced colours would otherwise paint every tab's, marking all of them current).
- **Search box** (search and favorites): the placeholder and name read "Search by name or ingredient…", since the server matches title, description and ingredient names, not titles only. Enter or a tag press applies the query. The native × empties the field and re-runs the search on its own, so the results and the URL drop `?q=` while the selected tags stay (only when the URL has a query, so Enter on an already empty box navigates once); it is drawn in the field's ink (a 16px glyph on `currentColor`, 24px hit), not the browser's blue.

### Cards / Containers

- **Recipe card:** no surface, border or shadow. 4:3 photo or clay-tint panel with 6px corners (the panel 15px padding inside a 1px transparent border, so forced colours keep its box and the title stays 16px in), Bitter title at 1.0625rem (clamped to three lines on a photo, four on the panel; the stretched link carries the whole title), a sans 0.8125rem meta row in Ink 3 whose author is a mono clay link (it must read as clickable) at Username's step under the line (0.8125rem × 0.9375) and whose version mark is mono 600 clay at 0.6875rem, shown only from v2 (every recipe is v1, so the mark says nothing there; decided 29 October 2026); the dots between the items are drawn by CSS, never typed, so a wrapped row never ends with one; below 1024 there are no dots and the items sit 10px apart, so no wrapped line starts with one either (29 October 2026). The photo's alt is empty, since the heading and the stretched link already name the recipe; the first row's photos load eagerly and the very first carries `fetchpriority="high"`, the rest lazily; every list grid passes the card its index, the tag and search pages included; the landing does not, its grid being below the fold. Both the photo title and the panel title balance their lines. The author link reaches 24px at desktop without moving. Below 700px the meta row drops the author (the recipe page has it), except where the page passes `alwaysShowAuthor`, as /forks does. Hover scales the photo 1.03 and turns the title clay.
- **Panels (compare cards, commit bar):** lifted paper, 1px Rule border, 8px corners, 16px padding. The recipe page's version bar is the same paper at 6px corners and 12px 16px padding (see Version note).
- **Stat tiles:** paper on lifted paper, sans label over a 600 value.

### Inputs / Fields

- **Style:** lifted paper, 1px Rule 2 border, 6px corners, 9px 12px padding, 0.9375rem (1rem on phones so iOS does not zoom).
- **Focus:** the global clay ring.
- **Error:** diff-remove text and border, no fill, so an empty invalid box still looks empty.
- **Textarea:** grows with content (`field-sizing: content`).
- **Strike rows** (recipe page ingredients, decided 29 October 2026): the input is a native checkbox, visually hidden, and the whole row is its label with a 44px hit. A ticked ingredient turns its text Ink 3 (4.9:1 on paper), grams included, and keeps its strike-through; no opacity dim, so the circle keeps its full marigold. Its visible control, the `.tick` class in app.css, is a 16px circle with a 1px Ink 3 edge at rest (Rule 2 was too faint to see, Spencer, 31 October 2026), an Ink 2 edge while the row is hovered, and marigold with an ink check when ticked (Spencer, 31 October 2026, a stopgap he means to revisit: see the roadmap). In forced colours the circle keeps its own paint: a CanvasText edge, a Highlight fill and a HighlightText check when ticked. The focus ring stays on the row, the site's 2px clay ring at a 2px offset. The circle sits 10px before the text, at the row start. Method steps have no ticks (Spencer, 31 October 2026: cooks find ticking on the ingredients, and ticking steps earns little); a step is a list item whose clay numeral ends a 55px number column, so the numeral is always 10px from its step with one digit or two (decided 29 October 2026). Ticks are kept in localStorage per recipe and version for 12 hours, so a reload or a new tab keeps them (decided 29 October 2026). While the list has a tick, a "Clear ticks" text button ends it, right-aligned: Ink 3, ink on hover, 0.875rem like the weights note, which it shares a line with. It clears the ticks and their saved copy. Clear ticks hands focus to the first checkbox as it disappears. When an action moves focus to stand in for a control that disappears, a mouse click moves focus with `preventScroll`; keyboard activation lets the page scroll to where focus went. It has a 24px hit, 44px on a phone or under a coarse pointer. A row focused by the keyboard scrolls whole into view, ring and all: the page keeps 6px of scroll padding top and bottom, and 52px at the top below 1024 to clear the pinned tab bar. Each ingredient's hidden checkbox spans its row.
- **The editor** (decided 29 October 2026, the editor's exception to the Pencil Rule, in Spencer's words: "in the editor every text box is mono"): on the new and edit pages the title, description, servings, both times, the tag search, ingredients, steps and the commit message are all JetBrains Mono at 0.8125rem on a 1.6 line (1rem on a phone, the no-zoom floor), so every single-line box is one height and the commit message matches its siblings. Text under edit is raw text, not yet the recipe; the recipe page keeps the rule. The ingredients placeholder shows what comes back ("2¼ cups", not "2 1/4"). Invalid fields wear the error red above through `:user-invalid` and `aria-invalid`, with the message under the field in the server's wording and `aria-describedby`, only once the field has been edited and left or a save was blocked; passing through an untouched field says nothing, as the auth pages do; a failed save focuses the field it names, and the global error box is for conflicts and failures no field owns. The save's outcome is the header's mono line ("Editing v3 · saves as v4", on New "saves as v1", "saves settings only", and after a blocked save "2 fields need attention", counting down as fields are fixed), not a helper beside Save; a blocked save focuses the first invalid field. Save is at least 112px wide beside Cancel. Below 700px Save and Cancel sit in a bar pinned to the screen's bottom (sticky, surface fill, a 1px Rule above, edge to edge across the gutters, padded clear of the home indicator), so a long form saves without scrolling to its end; the page's scroll padding keeps a focused field clear of it. A tag pill's remove button is a 16px glyph box with a 24px hit, and 44px on a phone or under a coarse pointer, grown outward on a ::before so the pill and its focus ring keep the glyph box's size; removing a pill moves focus to the next pill's remove, else the previous, else the tag search; in forced colours the active tag option is outlined; in the open tag list, Create is separated from what sits above it by one 1px rule; the tag options are not Tab stops (arrows and Enter on the input); the tag list closes the instant focus leaves the component or a press lands outside it, with no delay, while a press on an option keeps it open for the pick. The editor is the site's 1200px column, settings 5 beside the long text's 7 with a 40px gap, one column below 860 (29 October 2026). Field messages (29 October 2026): the Serves, Prep and Cook errors run the full row under the three boxes, in field order, each still describing its own box; the steps hint and the ingredients note are in their box's aria-describedby, error first; the public checkbox row is a 24px target everywhere and 44px on a phone or under a coarse pointer, as is the photo remover; the photo buttons are 41px, one height with the boxes, and 44px on a phone or under a coarse pointer; after Remove photo a ghost "Keep photo" brings the photo back and focus moves between the two. Choose photo is a label set in the ghost button's voice, weight 600 included, so it matches Cancel. Ingredients and Steps each keep a format hint under the box, Ink 3 at 0.875rem; Ingredients reads "One per line: quantity, unit, ingredient — 2¼ cups flour". A screen reader hears the error, then the can't-scale note, then the hint. On a phone, a field focused under the sticky Save bar scrolls until the whole field, its error and hint included, clears the bar: the browser counts a partly visible box as in view and would leave it there. Smooth, or instant under reduced motion. The title is a one-row textarea that wraps a long title instead of scrolling it out of view; Enter types nothing and a pasted newline becomes a space, and it is one height with the single-line boxes while short. On New the header says "saves as v1" only while no field shows an error, as Edit makes no promise for an invalid draft. When the commit message would be generated, a hint under the box reads "Left blank, saves as: `<the generated message>`" until the cook types one.

### Navigation

A "Skip to content" link is the first tab stop on every page, hidden until focused, then a marigold pill over the navbar's left; on a recipe page that loaded it reads "Skip to ingredients" and lands on the recipe past the header; a recipe that failed to load keeps "Skip to content". Motion: one global `prefers-reduced-motion: reduce` rule finishes every transition and animation at once.

- Espresso bar, 56px, 1200px inner column. Bitter wordmark "Fork." in cream with a marigold full stop. Links in small caps (`font-variant-caps: all-small-caps`, synthesised from the capitals since the shipped Source Sans subset has no small-cap glyphs), 0.9375rem 600 with 0.08em tracking, tan, cream on hover or when current; the phone menu's rows take the same face at 1rem (decided 29 October 2026). The handle stays mono. Signed in the links are Search, Recipes (browse, `/`, current there and on `/tags/*`), My Recipes (`/recipes`) and Favorites; the current link carries `aria-current="page"` in the bar and the phone menu, as do Log in and Sign up on their own pages, the phone search icon on `/search`, and the owner's handle on their profile. One marigold action. The session button reads "Log out" and takes the links' face, in the bar and in the phone menu. Nothing in the bar wraps (links, Log out and the action are `nowrap`), the links and the account cluster keep 24px between them, so at 768 the handle does not read as a fifth link, and the handle in the bar is capped at 22ch at every width with an ellipsis, its full form in a `title`. The links never shrink; the handle is the one thing that gives way when the bar is full, so a normal handle shows whole from about 900 and loses a few characters at 768, and a 30-character handle (the sign-up maximum) ellipsises without wrapping anything or pushing the action off the bar. Below 768px the links collapse behind 44px icon buttons; in the phone menu the handle is a 44px row like the links, still mono but stepped down to 0.8125rem, since mono lowercase at the usual 15px out-shouts the small-caps rows and the links should be the loudest rows. Escape closes the phone menu only while focus is inside the nav, and returns focus to the menu button; focus leaving the nav (Tab past the last row) closes it, as the overlay click does. In forced colours, where cream and tan become one colour, the current bar link and phone menu row are underlined (4px offset) and the current phone search icon takes a 2px CanvasText outline inside its 44px box (the focus ring replaces it while focused), so "you are here" survives.

### Browser surfaces

The marks the browser draws are the system's own. Focus: one 2px clay ring with 2px offset on `:focus-visible`, marigold inside the navbar; on the open tag combobox the ring runs around box and list as one. Selection: `::selection` is marigold behind ink text, site-wide, the one fill (decided 29 October 2026). Overscroll: the strip above the page is espresso. The recipe page's phone section tabs are toggle buttons carrying `aria-pressed`; its hero photo is the one image above the fold and carries `fetchpriority="high"` and `decoding="async"`; the bar's screen-reader version line ends in a full stop so the note does not run into it.

### Version note (signature)

Decided 29 October 2026, revised twice the same day: first the commit message left the closed header for the version list; then, after a side-by-side of the byline version, a bar above the hero and a bar below it (boards "Bar A, D, E"), the version moved out of the header altogether into a bar under the hero, the hinge between the dish and the recipe. The header reads title, byline, description, measure, tags, actions, with nothing boxed and nothing pinned.

- **Title:** Bitter, clay.
- **Byline** (sans 1rem 600, links clay; the handle mono one notch under the line's size): `By @author · 1 fork`. No version in the header. The byline's fork count links to /recipes/<slug>/forks, "Forks of <title>": the recipe's public forks and the visitor's own private ones, newest first, as recipe cards under an "N forks" heading with its rule, and the recipe's back link above the title; it 404s wherever the recipe itself would. Under each card's byline, the fork's first commit note, sans 0.8125rem Ink 3, at most three lines. The forks list keeps each card's author on a phone, since who forked is the point of the page.
- **Description:** sans 1.0625rem ink, plain body text.
- **Measure:** one sans line at 1rem, plain text with no controls: the times value then label, the serves label then value, `15 min prep · 13 min cook · Serves 36`, where the serves are the current, scaled serves so the line stays true (decided 31 October 2026); values 600 ink, labels Ink 2, dots in Ink 3 (they were Rule 2 until 29 October 2026, when Spencer could not see them). A pair never splits; the dots are drawn by CSS between pairs, and a phone drops them for a 10px gap so no dot strands. No rule above it.
- **Scale control** (decided 31 October 2026, Spencer: "stepper sounds good, but make the text box editable so people can do custom amounts; ×2 and ÷2 rather than ±1"; moved the same day, "too busy, needs to be more elegant": "Move it to the Ingredients rule, borderless"): the control sits right-aligned in the Ingredients eyebrow row, on the eyebrow's baseline, above the one rule that runs under both, next to what it changes; nowhere else on the page. Nothing is boxed: `÷2` and `×2` are Ink 2 600 text at 0.9375rem with no border or fill, underlined on hover and focus like links, Ink 3 when disabled; the number is a 4ch blank, tabular and centred, ink 600 on no fill, with only a 1px Ink 3 rule under it (Ink 2 on focus, the site's focus ring otherwise), then "servings" in Ink 2. It is a text box with `inputmode="decimal"`, not `type="number"`, so there is no ±1 spinner or arrow step. Any amount from 0.25 is accepted, shown to two decimals at most; Enter or leaving the box applies it, and anything else puts the box back. ÷2 is disabled once it would go under 0.25. While scaled, a mono 0.75rem Ink 2 note gives the multiplier, number first with an ASCII x (`1.5x`; Spencer: mono is fine on a dynamic technical value like this, so mono is not only for the version note), and a clay 600 "Reset" returns to the stored serves. Every quantity and its gram estimate scale on the page only, nothing is saved, and a row scaling changed reads clay, its measure and its weight, as an estimate (Spencer: "have scaled items highlighted in the accent red to show that it's an estimate"; a ticked row still recedes to Ink 3), with one Ink 3 note under the list, "Scaled quantities are estimates.", or "Scaled quantities and whole-item weights are estimates." in place of the weights note: a clean half, third, quarter or eighth shows as its glyph, anything else to one decimal; full-word units follow the number (`1 cup` to `2 cups`); a line with no parsed quantity, and the method's text, stay as typed. The URL carries `?serves=72` (dropped at the stored value) by a shallow replace, so a scaled link shares and no press adds history; an invalid `?serves=` is ignored. Parts are 24px tall at desktop, and the row keeps the eyebrow's height so the Ingredients rule stays level with the Method rule. Below 1024px the eyebrow gives way to the section tabs, so the control stands alone at the end of its own row above the rule, and shows only on the Ingredients tab; below 700px the steps and Reset are 44px boxes and the number's box grows upward to 44px, its rule kept under the digits.

- **Tags:** a comma-separated line at 1rem; each tag a clay 600 link, ink on hover, the commas Ink 2 (revised 29 October 2026: grey tags carried no link affordance).
- **Actions:** the 44px pills (see Buttons), unpinned, directly after the tags. Favorite is a toggle button whose word never changes: it always reads "Favorite", the visible word is the accessible name, and the state is carried by `aria-pressed` (Spencer, 31 October 2026: "i don't like it growing size with favorited"); no `aria-label` that differs from the visible text. Off, it is the ink outline pill with a hollow star in the button's ink. On, the pill fills with the pale marigold tint (`--color-marigold-tint`, #fbefd0; #f7e4b6, `--color-marigold-tint-hover`, on hover so it still reacts) inside a 1px marigold border, the star fills marigold and keeps its ink edge (1.2px), and the word stays ink, so it reads as on without competing with the solid marigold Fork beside it (Spencer, 31 October 2026; a clay star looked wrong). In forced colours, where the tint and the marigold star go, the pressed pill takes a 2px border and a Highlight star on a CanvasText edge, as the ticks do.
- **Hit areas:** the byline's author link and the tag links reach 24px on desktop and 44px on a phone (below 700px) without moving the text, with the padding trick the bar uses (`display: inline-block; padding: 11px 0; margin-block: -11px`; decided 29 October 2026). An inline text control whose focus ring must hug the text grows its hit on a `::before` pseudo instead (24px, 44px on a phone), never with padding: the version bar's toggle and the tag pill's remove both do this.

- **Spacing** down the column: 8, 8, 8, 8, 16 (tags were 2px under the measure until 29 October 2026; now the same 8 as every other line). The column ends where it ends; it is never stretched to the photo.
- **Photo:** 3:2 beside the header, capped at 340px tall, 6px corners. Stacked below 1024px it sits directly under the title, before the byline.
- **Ingredients:** a measured line bolds its measure ("**2¼ cups** (281g) all-purpose flour"); a counted line is all measure, so it is bold whole ("**2 large eggs** (≈100g)"); a line with no number is plain. On every width. While scaled, the rows scaling changed read clay; see Scale control.
- **Sections below 1024px:** the Ingredients | Method bar is a switch, not a jump: one section shows, the other is hidden, and switching puts the section's top under the bar. Decided 29 October 2026 because scrolling past one section to reach the other felt bad.
- **Version bar** (under the hero; its bottom edge is the divider, there is no page rule; absent on a one-version recipe): lifted paper, 1px Rule, 6px corners, 12px 16px padding, no shadow, the page's gutters. One mono 0.875rem line: the version number as the marigold chip (0.75rem 600, ink on marigold; the other rows' numbers are clay), the note in ink clamped to one line while closed (two lines below 1024px, where the controls already have a row of their own; decided 29 October 2026), then at the right "3 versions ▾" (the one toggle, 12px chevron that flips). The current line carries no compare of its own, open or closed; each other row compares itself with the one being read (decided 29 October 2026). Viewing an older version the line reads chip, note, then "Back to v3 · 3 versions ▾" at the right where the latest keeps its toggle (below 1024 the controls take their own row as on the latest); there is no "Older version" label, since the chip's spoken text says it and "Back to v3" is clue enough (Spencer, 29 October 2026, revising the earlier "older version i agree"), and v3's row below reads "Compare with v2". Open: the note runs in full and the other versions list under a rule, each row (number and message) a link to that version, in Ink 2 darkening on hover, with "Compare with vN" at the right. Below 1024 the controls drop under the note rather than crush it; on a phone each link and the toggle are 44px tall and each row's compare sits under it. The dots between the controls are drawn by CSS between items (`.item + .item::before`), never typed, so no line begins or ends with one; below 700px the controls take a row of their own under the note and keep their dot ("Back to v3 · 3 versions ▾" never wraps there; decided 29 October 2026, revised the same evening after the two items read as one phrase without it). Escape closes the list only while focus is inside the bar.
- **Version bar, pointer:** closed, a click anywhere on the bar (chip, note, blank space) opens the list, with the pointer cursor; links and the toggle keep their own clicks, the toggle stays the keyboard and ARIA control, and open the bar is no close target. Open, each other version's row takes a 1px Ink 2 outline drawn inside (`outline-offset: -1px`, CanvasText in forced colours) on hover and focus-within; the current line never does (Spencer, 31 October 2026).

No italic, no uppercase in the header, no chip in the header, no note in the header.

### Diff rows (signature)

Mono at 0.875rem, one row per ingredient or step, a 1ch gutter for `+`, `−` or `~` in mono 600 (the heaviest weight the face ships), added and removed words on their semantic backgrounds. Ingredient and step rows are capped at 72 characters; the Details rows run the column, so a renamed title stays on one line. Word highlights cover words only: the spaces around a changed run, and a leading ", ", ". ", "; " or ": ", stay unhighlighted; a change that is only punctuation keeps its highlight. Diff sections sit 24px apart.

29 October 2026, after the compare page critique (Spencer's decisions): unchanged rows are Ink 3 so the changed rows carry the page; added and removed keep their colours. The two sides of a change are `<del>` and `<ins>` with a real space and an unseen "to" between them, so "¾½ cup" reads and copies as "¾ to ½ cup"; the gutter glyph is aria-hidden and each changed row opens with an unseen "Changed:", "Added:" or "Removed:". The third panel is "Method", and the Details panel speaks the recipe page's measure, value then label: "4 to 8 servings", "11 min to 13 min cook". A removed ingredient keeps its old place in the list. After the last row one link reads the To version. The compare page's "To" chip is the version chip (marigold, 0 6px, 4px corners) at the card number's 18px rather than the bar's 12px: deliberate, it is the card's number, not a mark in a line. The compare error's title balances its lines, like the root error page. Picking a version that reverses the pair swaps the two pickers before the page moves to the ordered range; focus goes to the picker that now holds the version you picked.

Second sweep, 29 October 2026 (Spencer's decisions): a modified row is ink, its `~` included, so it stands apart from the Ink 3 rows around it; not clay, which would read too close to the removal red. Modified step numbers stay clay, unchanged ones Ink 3. A step number ends in an unseen stop so a screen reader says "5. Gradually stir", not "5 Gradually stir". The summary line that counted the change is gone: the Details panel is the summary. The version cards carry number, author, date and message only; the title, servings and times live in Details with their del/ins. Each card's number links to its version (the latest to the plain recipe URL), so the older version is reachable; the To number keeps the chip look, 0 6px, with the chip's 1px transparent inset outline, off on focus-visible so the focus ring draws. Card usernames and the back link reach 24px at desktop and 44px on a phone by padding and negative margin, as the recipe page's links do.

End of day, 29 October 2026 (Spencer's decisions): the native select is the only thing drawn, and every option always reads "v2 · Increased vanilla to 2 tsp", closed or open; the closed box clips the long label at its edge, which every browser does cleanly. The select is 24ch at desktop (22ch of label, "v2 · Increased vanilla", then a space and the caret) and full width on a phone, and the caret is a real ▾, so forced colours keep both text and caret. The From and To eyebrows are gone; the selects are named "From version" and "To version", and the arrow between them is mono at their size and hidden from screen readers. Ingredients and Method share the version cards' grid, two equal columns 24px apart, so Method starts on the To card's edge. A lone insertion or deletion inside a changed row opens with an unseen "added:" or "removed:", as a replacement carries its "to". On a phone each card number reaches 44px by a box above and below it, so the To chip keeps its shape. The same version on both sides titles the tab "v2 · same version · Recipe". On a phone the caret sits at the select's right edge. Each diff panel is a list and each row a list item, so a reader hears the count. The 400 page names the missing version ("Version 9 not found", "Versions 9 and 12 not found"; a non-number says "Version not found"), and its main action is "Compare first and latest" (the bare `/diff`), with "Back to the recipe" as the ghost beside it. The heading sits 16px above the picker row, the picker row 24px above the version cards, and the cards 24px above the diff.

## Do's and Don'ts

### Do:

- **Do** set version numbers, dates, handles, the version bar and diff text in JetBrains Mono. Gram weights stay sans inside their ingredient line; the card's time and fork count are sans.
- **Do** say "Log in" for signing in and "Log out" for its opposite, everywhere: the navbar, the login page's tab, subtitle and button, and every link to it. "Sign up" is the other verb, and "Sign in" beside it differs by two letters.
- **Do** keep clay for titles, links and version marks, and marigold for the one action.
- **Do** separate surfaces with a tone step or a 1px rule; reserve shadows for dialogs.
- **Do** keep body text at 16px, ink, with a measure under about 72 characters.
- **Do** compose desktop and iPad first; give the phone its own crop and order without reshaping the desktop.
- **Do** hold the layout when a recipe has no photo; the clay-tint panel is the fallback.

### Don't:

- **Don't** add a second dark surface, a gradient, a blur or a glow.
- **Don't** fill anything with clay (the editor's checkbox is the one exception), or colour text marigold.
- **Don't** put a shadow on a card, strip or button at rest.
- **Don't** invent proof: no ratings, counts, testimonials or press.
- **Don't** let the version UI crowd the recipe; where it harms reading, reduce it on that surface rather than the whole system.
