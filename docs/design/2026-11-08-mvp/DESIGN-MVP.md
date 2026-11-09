# Fork MVP design update, 8 November 2026

Open `index.html`. Pages use the shipped tokens and class names from `src/app.css` and the self-hosted fonts; `mk-` classes are board labels only. Screenshots at 390 and 1280 are in `screenshots/`.

The world stays: cream paper, clay for text only, marigold the one fill, no shadows at rest. This pass changes which action leads and how much Cook keeps, and adds groups, yield and the cook event.

## Recipe overview (`recipe-overview.html`)

**Changes**

- **Cook is the marigold primary for everyone.** Problem: Fork had the fill and Cook was the third outlined pill (critique, 8 Nov, P2). Owner: Cook, then Edit recipe as the ghost. Visitor: Cook, Save, Make my version. Logged out: Cook only.
- **Save and Make my version replace Favorite and Fork** (the roadmap's verbs). Save keeps Favorite's pressed state.
- **The measure moves above tags and counts**, which came first (critique P2). Yield joins it as "Makes 36 cookies", omitted when empty. Stats show adaptations, saves, versions.
- **Groups:** a Bitter title-size name (ink) over its rows, 20px above. Steps number straight through the groups, so "step 4" stays unambiguous. No groups, no headings.
- **A personal line** for logged-in readers: "You cooked this on Sat 24 Oct · Log a cook".

**Stays:** title band and no-photo rules, version bar, strike rows, the scaler, Dynamic Is Clay, the phone section switch.

## Cook view (`cook-view.html`)

**Changes**

- **The band collapses to one ~80px strip**: title (Bitter 1.375rem clay), measure, Done cooking. Ingredients began at y≈510 of 720 (critique P1); now they start under the strip.
- **Photo, tags, stats, version bar, Save and Make my version step out.** The "3 versions" link pointed at a removed bar (critique P2); nothing left points at something hidden.
- **The method ends with "Log this cook"**, opening the Journal form prefilled with recipe, version, servings and today.
- **Phone:** strip and section switch pin together; **each tab keeps its own scroll position**, so checking a quantity never loses your step.

**Stays:** larger method type, wake lock, ticks as "done", the scaler. No "current step" marker.

## Editor (`editor-groups-yield.html`)

**Changes**

- **Accepted group entry, 9 November:** keep plain-text `# Dough` headings and add an optional collapsible **Insert** toolbar. **Section heading** inserts `# Section name` and selects the name for replacement. Typing, toolbar insertion and paste produce the same groups. Render heading lines larger/heavier immediately, retaining the visible `#` in a softer readable color. Keep copy/paste markers and clear read-back feedback; ordinary ungrouped recipes need no syntax. An empty group is a field error on save, not while someone is still naming it. The static HTML mockups predate this live-formatting interaction and need a focused prototype.
- **"Makes"** (optional) under Serves/Prep/Cook, separate from servings. Scale recognized count/volume yields with servings; preserve unrecognized authored wording rather than guessing. Pan sizes and temperatures retain their numbers, with a clear scaling notice that they may need adjustment.
- **The public checkbox becomes "Who can see this recipe": Only me / Public**, each with one sentence. New recipes default to Only me (roadmap slice 2). The unticked checkbox never said who could see it.
- **The header line names the save state:** "Editing v3 · Unsaved changes · saves as v4"; after a blocked save, "2 fields need attention". No draft feature implied.

**Stays:** 5/7 grid, field voices, error timing, commit message, phone Save bar, PhotoField, TagInput. **Not drawn:** delete, which belongs to the parallel deletion work.

## Journal and Friends (`journal-feed.html`)

**New pages**

- **Navigation: Cookbook · Journal · Friends · Discover** (the roadmap's task model). Cookbook absorbs My Recipes and Favorites as filters; Discover is today's public browse.
- **Journal:** by month, day in Bitter in the margin; dish, version and servings, audience icon, caption, optional thumbnail. The **note for next time** sits on lifted paper marked "only you", with "Change the recipe →".
- **Log a meal:** dish and date required; recipe or link, photo, caption, private note, audience optional. Improvised meals are complete. A private recipe shared to Friends says friends see the dish, not the recipe.
- **Friends:** one 680px column, newest first, order stated. Cooked date (plus logged date when different), 3:2 photo when present, caption, source (version link, "from her own cookbook" unlinked, or external domain). Quiet actions: Appreciate, Comment, Save. ⋯ menu: Mute, Unfriend, Report, Block. Rail: requests and invite link.
- **Empty states:** what the page will hold, one action, no illustration.

## Component inventory

| Component | Tokens |
|---|---|
| Action pills | `.btn-primary`/`.btn-ghost` + 44px pill; pressed `--color-marigold-tint` + `--color-marigold` border |
| Group name | `--font-serif` 500 1.0625rem, `--color-text` |
| Cook strip | `--color-band`; title `--color-accent`; `.measure` |
| Read-back line | `.form-hint` voice, group names `--color-text` 600 |
| Insert toolbar and live section marker | Collapsible, labelled and keyboard-operable; section name larger/heavier, visible `#` softer but readable. Exact tokens to be checked in the prototype; no new palette required. |
| Audience choice (recipe, cook) | `--color-surface` rows, `--color-input-border`; selected = 1px ink inset; recipe radios `accent-color: --color-accent` (extends the checkbox exception) |
| Private note | `--color-surface`, 1px `--color-border`, `--radius-md`, lock + "only you" in `--color-text-2` |
| Feed entry | rule-separated, no box; `.avatar` (clay tint, Bitter initial); photo 3:2 `--radius-md` |
| Text action | `.text-btn`: sans 600 0.9375rem `--color-text-2`, ink on hover, 44px hit |
| Overflow menu | `--color-surface`, `--shadow-raised` (a true overlay) |
| Phone tab bar | `--color-surface`, 1px `--color-border-2` above, current: ink + 2px `--color-accent` top edge |

Pencil Rule holds (mono only for handles and version ids). New text pairs are Ink 1–3 on paper, lifted paper or band, all ≥4.5:1.

## Mobile

- Bottom tab bar below 768px, hidden in Cook and the editor, which pin their own bars.
- Recipe actions: Cook full width, the other two in two columns below.
- 44px targets throughout.

## Research deliberately not taken

- Next-step-only Cook, a "current step" highlight, step-ingredient popovers: thin evidence; switch plus ticks covers it.
- Hiding the navbar in Cook (Things' Slim Mode): try the strip first.
- Ratings or counts on Journal entries: no public scores in the pilot.
- Draft/autosave language, graphical cooking, timers, AI, Trash: post-MVP.

## Taste decisions for Spencer

1. **Group entry — settled 9 November:** optional collapsible Insert toolbar plus plain-text `#` headings with immediate larger/heavier styling. Keep the marker visible in a softer readable color. Controls make syntax discoverable; typing remains a shortcut. Do not require Cooklang or general Markdown knowledge.
2. **Verbs on the recipe page:** "Make my version" and "Save" in place of "Fork" and "Favorite"? The brand stays Fork, and the counts would say "adaptations". *Recommend yes.* The research says not to require Git knowledge to choose an action.
3. **Cook as the marigold primary for owners too** (Edit drops to the ghost)? *Recommend yes.* Owners cook from their own recipes more than they edit them.
4. **Phone navigation:** a paper bottom tab bar with four destinations, or keep the hamburger? *Recommend the tab bar.* Three pillars behind a menu would bury Journal and Friends.
5. **Default audience for a new cook:** Only me or Friends? *Recommend Only me* until the person has approved a friend, then their last choice.
6. **Yield scaling — settled:** scale supported counts and volumes ("12 buns", "1.2 L") with servings. Do not multiply pan sizes or temperatures; flag that they may need adjustment when scaling. Keep ambiguous text unchanged.
