---
version: 1
slug: 'src-routes-recipes-slug-page-svelte'
primary_target: 'src/routes/recipes/[slug]/+page.svelte'
related_targets:
  [
    'src/routes/recipes/[slug]/components/RecipeActions.svelte',
    'src/lib/components/recipes/VersionStrip.svelte'
  ]
---

# Recipe page

Mode: Read, with Operate elements (strike rows, Fork, Favorite, Edit).

## Job and audience

A cook arrives from search, the feed, a tag page, a profile or a shared link, usually mid-task: phone or iPad on the counter, hands busy, or a desktop while planning. They need the ingredients and the method readable at arm's length and reachable in one move, and they need to understand in the first screen that this recipe has a history and can be forked. The owner arrives to cook from their own recipe or to edit it.

## Outcome and proof

Primary task: read and cook. Secondary: fork (visitor), edit (owner), favorite, open history, compare versions. Success is Ingredients on screen by about 600px at 1280 and inside the first screen's reach on a phone, the current commit message read before any chrome, and a visitor seeing Fork without logging in. The product-specific truth on the page is the commit message written as a cook's note, the version count, the fork count and the Compare link; nothing else is invented. Decisions 1 to 12 are recorded in `docs/research/2026-10-28-recipe-page-critique.md`, section 9, and bind this brief.

## Selected direction

Visual authority: DESIGN.md as it stands (cream paper, clay text accent, marigold action, Bitter, Source Sans 3, JetBrains Mono for history and measurement). Refinement inside the incumbent world, not a redesign.

Thesis (revised 29 October, twice: after the header rethink against eight reference sites, then after four header mock-ups): one face below the title; the byline "By @author · 1 fork" in bold sans with clay links; the description as plain body text; one measure line, value then label; tags as clay links; pills. Nothing boxed, nothing pinned; the column ends where it ends. Under the hero, the version bar on lifted paper (board "Bar E", chosen 29 October over the byline chip and a bar above the title): marigold chip for the version, the note clamped to one line, "3 versions ▾" and "Compare with v2" at the right; open, the other versions list under it as row links. Absent on a one-version recipe. Superseded thesis kept for the record: the description is the deck in sans; under it the version bar, unboxed: the marigold chip and the commit message at full length, then one mono byline with author and counts; Compare sits beside each earlier version in the history list. The note is italic Ink 2, the Method's tip voice. The header is three blocks at 24px: title and description; the bar; Prep/Cook/Serves in the eyebrow label with the tags on their own line beneath in sans Ink 2. A skip link leads from the navbar to the ingredients. The title chip and every other place the version number appeared are deleted.

Focal moment: title, deck and byline together, with the photo beside them.

Implementation consequence: VersionStrip leaves this page (it may survive on the diff page); RecipeActions loses the fork dialog; Details' labels move into a mono meta line; the sticky aside holds Ingredients instead of the photo.

## Scope and boundaries

Production-ready page, all three compositions, both roles, with and without photo, viewing current and older versions. Target: `src/routes/recipes/[slug]/+page.svelte` and its components under `src/routes/recipes/[slug]/components/`, plus `Details.svelte`, `RecipeIngredients.svelte`, `RecipeMethod.svelte` and `RecipeActions.svelte` where they live today. Untouched: the diff page, the editor, the card, the navbar, the database and the version model. Anti-goals: no serving scaling, no new version UI, no second dark surface, no shadows at rest, no tint panel standing in for a missing photo, no stats card.

## States and ranges

- Title: 2 to 60 characters, wraps to two lines at 52px on desktop and 36px on phone.
- Deck: the current version's commit message, 10 to about 200 characters, up to three lines; on version 1 the deck is the description and the description line is not repeated.
- Byline: `@author · v3 · 3 versions · 1 fork · Compare with v2`. Version 1 with no forks reads `@author · v1`. Counts are links; Compare is absent on v1. Date is dropped (history has it).
- Viewing an older version: the bar reads `v2 · note · Older version · Back to v3 · 3 versions ▾ · Compare with v3`; actions hidden; no other banner.
- Prep · Cook · Serves in one mono line, each time shown once, 13px minimum; any missing value is omitted, not shown blank.
- Ingredients: 1 to about 30 rows, the measure bold (a counted line such as "2 large eggs" bold whole), grams inline in parentheses, estimated grams marked as today; rows strike on tap with a 44px hit area.
- Method: 1 to about 20 steps, clay Bitter numerals; the column runs to the content's right edge, the step text caps at 68ch and rags right (29 October, reversing the 28 October "no cap" after two critiques measured ~103ch).
- Photo: present or absent. Absent collapses the hero to a single left-aligned 760px column; nothing fills the space.
- Roles: logged out (no action row at all; decided 28 October afternoon, a lone Fork read as odd and the login round trip was not worth it), visitor (Fork primary, Favorite ghost), owner (Edit primary, Favorite ghost, no Fork).
- Fork: one click; the copy opens with a default first commit message naming the source author and version.

## Interaction and layout

Desktop, 1024 and up: hero 6/6, title block left (title, byline, description, measure, tags, actions), photo right at 3:2 capped at 340px; the version bar full width under the hero; no rule, the bar's edge divides. Below a 1px rule: the existing 380px aside, sticky, holding Ingredients; reading column holds Method, full remaining width. Board: Q1 Sentence on the design canvas.

iPad, 700 to 1023: single column. Title, photo as a 16:9 band capped around 300px, the rest of the header, then the version bar, then the sticky Ingredients | Method bar, which switches one section for the other in place (revised 29 October 2026: no jumping down the page).

Phone, up to 699: title, photo as a 21:9 crop around 150px, byline, description, measure, tags, actions full width at 44px, the version bar, sticky tab bar under the navbar, then the chosen section only. Section headings are the tabs; no repeated labels. The tab bar sits inside the first screen and switches sections in one tap without moving down the page. Board: Q6 Phone.

Hierarchy: title, deck, byline, description, meta, actions, photo. Clay is text only: title, links, numerals. Marigold is the primary button. Hover is ink. Heading order h1, h2 (Ingredients, Method), no skips.

## Constraints and open decisions

SvelteKit, Svelte 5, Tailwind 4, tokens in `src/app.css`. TDD: component tests next to each file, e2e colour assertions updated with the composition. `pnpm check` and `pnpm test:unit` green before each commit; one commit per logical change. Keep the diff page's VersionStrip working if it is shared. Add the four font sizes the code uses to the DESIGN.md ramp. Struck rows persisting across reload is deferred. No open decisions remain for the builder; anything not covered here is a question back, not an invention.
