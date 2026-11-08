# Decision worksheet · Fork MVP design · 10 Nov 2026

Print this or keep it open beside `index.html`. Tick one box per line, write notes in the space. "Recommended everywhere except…" is a complete answer: leave the recommended rows alone and mark only what you change.

## A. Comparisons (open `compare/`)

### 1. Navigation and frequent actions · `compare/1-navigation.html`
- [ ] A · top nav on desktop, paper bottom tab bar on phone, recipe actions in the band (recommended)
- [ ] B · hamburger on phone, sticky action bar pinned to the bottom of the recipe page
- [ ] Other: ______________________________________________

Notes:

______________________________________________________________

### 2. Recipe/Cook density and hierarchy · `compare/2-cook-density.html`
- [ ] A · collapsed strip, ingredients column always visible on desktop, phone section switch (recommended)
- [ ] B · reading mode, one column, ingredients checklist first, one long scroll on phone
- [ ] Other: ______________________________________________

Notes:

______________________________________________________________

### 3. Editor toolbar and live headings · `compare/3-editor-toolbar.html`
- [ ] A · collapsible "Insert ▾" above each text box, heading lines larger and heavier, `#` in Ink 3 (recommended)
- [ ] B · one persistent toolbar at the top of the form, headings heavier only with a clay rule marker
- [ ] Other: ______________________________________________

Notes:

______________________________________________________________

## B. Taste calls carried over from the 8 Nov pack (still open)

Each is drawn in the recommended form across the screens. Ticking "No" means the builder reverts to the shipped wording or behaviour named in brackets.

| # | Decision | Recommended | Yes | No | Notes |
|---|---|---|---|---|---|
| 4 | Verbs: "Save" and "Make my version" replace "Favorite" and "Fork"; counts say "saves" and "adaptations" [shipped: Favorite / Fork / forks] | Yes | [ ] | [ ] | |
| 5 | Cook is the marigold primary for owners too; "Edit recipe" becomes the ghost [shipped: Fork is the fill] | Yes | [ ] | [ ] | |
| 6 | New cook defaults to "Only me"; after the first approved friend, last choice is remembered | Yes | [ ] | [ ] | |
| 7 | New recipe defaults to "Only me" with the radio pair "Who can see this recipe" [shipped: unticked "Public" checkbox] | Yes | [ ] | [ ] | |
| 8 | Discover leads with one featured photo card; Cookbook is a uniform grid | Yes | [ ] | [ ] | |
| 9 | Group headings on the recipe page in Bitter title size (as shipped on 9 Nov) rather than sans | Yes (keep) | [ ] | [ ] | |
| 10 | Friends feed has no Comment action in the first release (Appreciate · Save · ⋯) | Yes | [ ] | [ ] | |
| 11 | Signed-out recipe page shows a "Log in to save" text link under Cook [28 Oct decision: no login round trip invited; shipped: Cook only] | No (drop it) | [ ] | [ ] | |
| 12 | Cook ticks: 24px square, ticked = struck row in Ink 3, no marigold [shipped: 16px marigold circle, called a stopgap in DESIGN.md] | Yes | [ ] | [ ] | |
| 13 | Discover lead card = newest public recipe (not most saved) | Yes | [ ] | [ ] | |

## C. Confirm the settled direction (tick to confirm; strike anything that changed on review)

- [ ] Ordinary recipes need no syntax; `# Name` is the only group marker; Cooklang optional, later
- [ ] Yield ("Makes") separate from servings; counts and volumes scale; pan sizes and temperatures are not multiplied and get an adjustment notice
- [ ] Permanent owner-only deletion with a two-step inline confirm; no Trash, no drafts
- [ ] Journal: dish and date required, everything else optional; no public ratings
- [ ] Comments and notifications stay out of the first release

## D. Anything the screens got wrong

Page · what · what it should be:

______________________________________________________________

______________________________________________________________

______________________________________________________________

## E. Your combination in one line

"Recommended everywhere except: ______________________________"
