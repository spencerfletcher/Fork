# Decision worksheet · Fork MVP design · 10 Nov 2026

Print this or keep it open beside `index.html`. Tick one box per line, write notes in the space. "Recommended everywhere except…" is a complete answer: leave the recommended rows alone and mark only what you change.

## A. Comparisons (open `compare/`)

### 1. Navigation and frequent actions · `compare/1-navigation.html`
- [x] A · top nav on desktop, paper bottom tab bar on phone, recipe actions in the band (recommended) Notes: I don't love the white bottom bar – should probably be more of a cream or maybe an espresso. Kind of weird since it's the only white in the project besides the version bar. For the mobile view, maybe we should have prep time cook time new line serve count make count. Also, the adaptations saves version bar is spaced a bit weirdly but we can come back to that. Maybe saves could be tied into the save button (which you forgot to add)? E.g. Save (1.2k). Also for the "You cooked this" bar, this should be a clickable link to see their log for when they cooked it before. 
- [ ] B · hamburger on phone, sticky action bar pinned to the bottom of the recipe page
- [ ] Other: ______________________________________________

Notes:

______________________________________________________________

### 2. Recipe/Cook density and hierarchy · `compare/2-cook-density.html`
- [x] A · collapsed strip, ingredients column always visible on desktop, phone section switch (recommended). Yup. One note, this might already be in the plan but I'd like to have a reference to ingredients in the method section – e.g. Warm the milk (240 ml) to about 40C, whisk in the yeast (7g) and sugar (50g), and leave for 5 minutes until foamy. Later on this toggle to see this or not should be in the settings menu. 
- [ ] B · reading mode, one column, ingredients checklist first, one long scroll on phone
- [ ] Other: ______________________________________________

Notes:

______________________________________________________________

### 3. Editor toolbar and live headings · `compare/3-editor-toolbar.html`
- [x] A · collapsible "Insert ▾" above each text box, heading lines larger and heavier, `#` in Ink 3 (recommended). Definitely this one. I think we should also add a Help ▼ drop down in the future as the amount of tips grows, but for now this is fine. Also, the photo should really be bigger – on phone should be full width with replace/remove below the photo, and on desktop probably not quite full width but still replace remove below – i also don't think either of these need borders around them, or if one of them has a border they both should it looks weird in the current state. 
- [ ] B · one persistent toolbar at the top of the form, headings heavier only with a clay rule marker
- [ ] Other: ______________________________________________

Notes:

______________________________________________________________

## B. Taste calls carried over from the 8 Nov pack (still open)

Each is drawn in the recommended form across the screens. Ticking "No" means the builder reverts to the shipped wording or behaviour named in brackets.

| # | Decision | Recommended | Notes |
|---|---|---|---|
| 4 | Verbs: "Save" and "Make my version" replace "Favorite" and "Fork"; counts say "saves" and "adaptations" [shipped: Favorite / Fork / forks] | Yes | Sure, save can be the default but I'm  not sure if we should change Fork, that is the calling card of the app and ties the name into the app. I understand that Fork isn't the most clear to non technical users but I think they'll figure it out pretty quickly, and if they really don't then we can consider maybe adding parentheses e.g. Fork (make your own). Counts should say saves and forks. This is pretty core to the identity and I'd only want to change it if users are really struggling. |
| 5 | Cook is the marigold primary for owners too; "Edit recipe" becomes the ghost [shipped: Fork is the fill] | Yes | Agree. Cook should be the primary action on a recipe page with other actions secondary. Also potential future addition – users being able to fork their own recipes, though maybe this would be better implemented in the edit page as a "Create a new recipe based on an existing one" rather than a fork button on the edit page, not sure. |
| 6 | New cook defaults to "Only me"; after the first approved friend, last choice is remembered | Yes | Yup. Options should probably be: Only me, only visible to friends, public. Only me should also be shareable by the link (or maybe this should be another granular level). |
| 7 | New recipe defaults to "Only me" with the radio pair "Who can see this recipe" [shipped: unticked "Public" checkbox] | Yes | Yup. |
| 8 | Discover leads with one featured photo card; Cookbook is a uniform grid | Yes | Sure, I like this. How would this affect the landing page when not logged in? Still the diff item, or would we change it some way? |
| 9 | Group headings on the recipe page in Bitter title size (as shipped on 9 Nov) rather than sans | Yes (keep) | Yup good. Though I'm a bit worried that's getting a bit too much for fonts – the ingredients section is small caps -> bitter -> sans serif, might be a bit much but maybe i'm overthinking |
| 10 | Friends feed has no Comment action in the first release (Appreciate · Save · ⋯) | Yes | Sure, comment can be added later. But I think appreciate should be like. Appreciate sounds weird. |
| 11 | Signed-out recipe page shows a "Log in to save" text link under Cook [28 Oct decision: no login round trip invited; shipped: Cook only] | No (drop it) | Oh we don't need that call, "no login round trip invited" is entirely unnecessary as a rule – login to save is fine. We want to encourage people to create an account. |
| 12 | Cook ticks: 24px square, ticked = struck row in Ink 3, no marigold [shipped: 16px marigold circle, called a stopgap in DESIGN.md] | Yes | Umm not a stopgap I made this decision, I think the 16px marigold circle is good for now but we can revisit this later. |
| 13 | Discover lead card = newest public recipe (not most saved) | Yes | No, should be most saved in last 24 hrs or something, we can change this around later to optimize. |

## C. Confirm the settled direction (tick to confirm; strike anything that changed on review)

- [x] Ordinary recipes need no syntax; `# Name` is the only group marker; Cooklang optional, later
- [x] Yield ("Makes") separate from servings; counts and volumes scale; pan sizes and temperatures are not multiplied and get an adjustment notice
- [x] Permanent owner-only deletion with a two-step inline confirm; no Trash, no drafts, for now yes, we will add those later. 
- [x] Journal: dish and date required, everything else optional; no public ratings – um a public rating would be fine to add if they want to. 
- [x] Comments and notifications stay out of the first release – yes

## D. Anything the screens got wrong

Page · what · what it should be:

______________________________________________________________

______________________________________________________________

______________________________________________________________

## E. Your combination in one line

"Recommended everywhere except: ______________________________"
