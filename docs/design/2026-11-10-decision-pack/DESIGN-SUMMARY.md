# Fork MVP design summary · decided 9 Nov 2026

**Build authorised 9 Nov 2026 (evening): implement this directly, no further mockup rounds; refine against the working app.** Spencer reviewed the pack on 9 Nov 2026 (WORKSHEET.md holds his notes); this file is the direction with his decisions folded in. Where he overrode the pack's recommendation the line says so. Shipped and planned are as in `docs/research/2026-11-08-product-roadmap/README.md`: groups, Makes, scaling notices on Makes, delete, cook mode, versions, compare, fork and favorite are shipped; Cookbook, Discover, the audience radios, the Insert toolbar, Journal and Friends are planned.

Vocabulary: a **log entry** is one record in the Journal (never "a cook" as a noun). **Cook** is the cooking view of a recipe and the verb.

## The target in one line

A beautifully edited cookbook with the precision of a great productivity app: photography leads discovery (Cookbook, Discover), the working recipe leads Cook, emphasis has one meaning (marigold = the one primary, clay = text and reader-changed values), and saved state and audience are always said in words.

## Foundation (unchanged)

Paper `#f7f3ec`, ink, clay `#b23c00` as text only, marigold `#eca620` as the single fill. Bitter for titles and dish names, Source Sans 3 for everything else, JetBrains Mono only for handles and version ids. No shadows at rest; the one overlay is the ⋯ menu. 2px clay focus ring. 44px targets on phone, 24px minimum on desktop. All tokens are the ones in `src/app.css`; the pack adds no colour. Three voices in one block (small-caps eyebrow, Bitter heading, sans rows) is the house stack, used by the title band and by groups alike; Spencer flagged it as a revisit candidate, not a change.

## Audience model (decided 9 Nov)

- **Recipe: Only me / Friends / Public.** Radio trio "Who can see this recipe", one sentence each, Only me default. Friends-level recipes are visible to approved friends (page, Save, Fork) and never appear in Discover. Making a recipe less visible never hides existing forks. Link sharing of a private recipe is later.
- **Log entry: Only me / Friends.** Radio pair "Who sees this entry", Only me default; after the first approved friend the last choice is remembered. A friends-level entry on a private recipe says "Friends see the dish and your photo, not the recipe."
- **Forks never widen access (decided 9 Nov, evening).** A fork of a Friends recipe may be Only me or Friends, never Public; a fork of a Public recipe may be anything. The server enforces this on create and on every later visibility change, not just the radio set.
- Schema note for the builder: `recipes.isPublic` becomes a three-valued visibility (`'private' | 'friends' | 'public'` as const), and every recipe read (page, Cookbook Saved, Fork, Discover, profile) checks it.

## Navigation (comparison 1 · A, confirmed)

- Four destinations: **Cookbook · Journal · Friends · Discover**. Top bar at ≥768 with "New recipe" and the avatar; **paper** bottom tab bar below 768 (1px border above, current item ink with a 2px clay top edge). White is reserved for the version bar.
- Cook and the editor hide the tab bar and pin their own bar (Done cooking strip; Save/Cancel).
- Recipe actions sit in the title band under the measure, Cook first. No sticky action bar.
- Phone measure wraps to two lines: prep · cook, then Serves · Makes.
- Signed out, `/` is Discover (see below). Signed in, `/` is Cookbook.

## Cookbook

- My recipes and Favorites merge into one grid with a segmented filter **All · Mine · Saved**, the shipped search box (`name=q`) and shipped text-tab tags.
- Photo cards, 4:3, 1 / 2 / 4 columns (breaks at 600 and 1100). No-photo cards use the title-band treatment. Meta line: total time · version id; "Saved from @handle" on saved cards; audience icon + word on non-public ones. Own recipes carry no owner line.
- Empty library: the copy in CONTENT.md, "New recipe" primary and "Explore Discover →"; no search box over an empty list; no illustration. A filter that empties the grid keeps the filters and says "0 recipes match" in the status region.

## Discover

- Same card component, looser 1 / 2 / 3 grid, every card shows the cook's avatar and handle above the photo. Lede "Public recipes from every cook on Fork."
- **Lead card = most saved in the last 7 days**, falling back to newest when nothing was saved (Spencer, overriding "newest"). Tunable later.
- Under the lead card, a **Recent changes** row: three small cards, each "v4 of Cardamom buns · Maria changed the glaze", linking to the diff. This keeps diffing and sharing above the fold on the signed-out landing without another page.
- Only public recipes, newest first after the lead.

## Recipe overview

- Title band keeps the shipped two columns (words left, 4:3 photo right) and the no-photo rule (words only, one 760px column).
- Measure order: prep · cook · Serves · Makes. Tags, then the stats line "N forks · N versions", then the version bar.
- **Verbs (Spencer's call): "Save" replaces "Favorite"; "Fork" stays.** Counts say "saves" and "forks". Fork is the product's calling card; revisit only if users visibly struggle (fallback: "Fork (make your own)").
- **Save pill carries its count: "Save · 1.2k".** The stats line therefore drops saves. Save is a moving favorite (follows the author's current version, disappears if access is withdrawn). "Keep this version" is a later option on a saved recipe, shown visibly as "Keeping v3 · Follow latest version", not only in the menu; a Cook URL picks the version for one session only (decided 9 Nov).
- **Cook is the marigold primary for everyone.** Owner: Cook, "Edit recipe" ghost. Visitor: Cook, Save · 1.2k, Fork. Signed out: Cook, then a **"Log in to save"** text link (Spencer: encourage accounts; no "no login round trip" rule exists). Phone: Cook full width, the other two in two columns.
- Personal line for signed-in readers: "You cooked this on Sun 8 Nov · Add to Journal", where the date is a link to that log entry.
- Groups: h3 in Bitter title size over their rows; steps number straight through. Scaled ×2: quantities, serves and "Makes 24 buns" in clay; one quiet notice above the method "Scaled ×2. Pan sizes and oven temperatures are not scaled; adjust bake time to the pan." Step text is never rewritten.
- Fork of a deleted recipe: byline "Original recipe deleted" (shipped).
- Later, not MVP: duplicating your own recipe (likely "Start from an existing recipe" on New recipe, not a Fork button), and inline ingredient quantities inside steps ("Warm the milk (240 ml)…"), P4 with the Cooklang-style ingredient markup and a settings toggle (decided 9 Nov).

## Cook (comparison 2 · A, confirmed)

- The band collapses to one ~80px strip: title (Bitter 1.375rem clay), serves box, Makes, Done cooking. Prep and cook times drop out.
- ≥1024: ingredients 5/12 sticky, method 7/12 at 1.125rem/1.6, clay Bitter numerals. 834: two columns 4/8. <768: strip and section switch pin together (144px); each tab keeps its own scroll position.
- **Cook is pinned to the version being read**: the existing version URL parameter carries into Cook, survives reload, and "Add to Journal" prefills that version and the serving scale (decided 9 Nov, evening).
- **Ticks stay the shipped 16px marigold circle** with the shipped 44px row hit on phone (Spencer's 31 Oct decision, confirmed 9 Nov; revisit candidate, roadmap M20). The pack's 24px square is withdrawn; `screens/cook.html` now draws the circle. Ticked rows strike through in Ink 3. No current-step marker.
- The method ends with "Done cooking" and "Add to Journal" (planned), which opens the Journal form prefilled with recipe, version, servings and today.

## Editor (comparison 3 · A, confirmed)

- Ordinary recipes need no syntax: no `#`, no toolbar open, no read-back line.
- Each text box (Ingredients, Method) has a collapsed **Insert ▾** beside its label; open, it offers **Section heading**, which inserts `# Section name` on its own line (above the current line when the caret is at a line start, below otherwise) and selects the name. No greyed future buttons. A **Help ▾** beside it is planned for when the tips grow.
- A line matching `# Name` renders larger (1.1875rem) and 600 weight while editing, with the `#` in Ink 3. Typed, inserted and pasted headings produce the same lines and the same styling. Bare `#` or `#2 can` never changes size. The prototype (`prototype/editor.html`) is contenteditable with one div per line; the script only toggles a class and one CSS variable, never rewrites text nodes, so native caret, selection, copy, paste and undo survive. Chrome needs styling deferred by one tick so Cmd+Z undoes typing in runs.
- Read-back under the box once a heading exists: "Reads as 3 groups: Dough 8 lines · Filling 5 lines · Glaze 4 lines"; steps "Reads as 9 steps in 3 groups: Dough 1–3 · …". Empty-group and bare-`#` errors arrive on Save, not while typing.
- **Photo field: larger.** Full width on phone, Replace / Remove as text buttons below it; on desktop the column width, same buttons below. No border on the photo or its empty slot.
- Makes is an optional field beside Serves, 80 characters, with the shipped error wording. "Who can see this recipe" is the radio trio above (Only me default).
- Header line names the state: "Editing v3 · Unsaved changes · saves as v4" / "Couldn't save: N fields need attention" / "Couldn't reach the server. Your changes are still here." / "Saved as v4". No draft language.
- Danger area at the bottom: "Delete recipe…" in a red-outline ghost; the two-step inline confirm from `screens/delete.html`, then redirect to Cookbook. Permanent for now; Trash and drafts are later.

## Journal (planned)

- Grouped by month, day in Bitter in the margin; dish, source (recipe + version id, "Improvised", or external domain), "Served N", audience always as icon + word, caption, modest 3:2 photo. The note for next time is the only lifted paper on the page, locked, "only you", with "Change the recipe →" (or "Fork →" on someone else's recipe).
- New entry form ("Add to Journal"): Dish and Date required; recipe/version, servings, photo, caption, note and audience optional. "Who sees this entry": Only me (default) / Friends.
- No ratings in MVP; likes on friends-level entries show their count. A public recipe rating is a later recipe feature, not a Journal one.

## Friends (planned)

- One 680px column, "Newest first". The feed mixes two event kinds in one chronology: friends' **log entries** (avatar, name, handle, cooked and logged dates, dish, photo, caption, source) and friends' **recipe events** ("Dev shared Shakshuka with friends", "Maria changed Cardamom buns, v3 → v4" with a diff link).
- Unfriend hides friends-level recipes at once and makes the ex-friend's forks of them private; block adds no requests or interactions either way and hides (not deletes) their likes; mute hides their entries for you only. Full rules in the product roadmap's 9 Nov section.
- Actions: **Like** (not "Appreciate"), Save (only when a shareable recipe is attached), ⋯ (Mute, Unfriend, Report, Block). **Like shows its count in the feed** ("Like · 3"; Spencer: cooking and engagement both matter). No Comment in the first release.
- Rail at ≥1024 with Requests and Invite; below 1024 it becomes a strip above the feed. Empty state leads with any pending request, then "Invite a friend".

## Later list (named on 9 Nov, out of MVP)

user collections, manual in v1 ("To cook", "Quick"), rule-based later ("every recipe Max adds"); the Cookbook filter row leaves room for them · Help ▾ in the editor · inline step quantities with Cooklang markup and a settings toggle · duplicate own recipe · link sharing of private recipes · Trash and drafts · Comment · recipe ratings · public log entries · revisit: tick affordance, three-voice type stack.

## Verification record

- Every page opened in Playwright Chromium and WebKit at 390 and 1280 from `file://`: zero page errors, zero failed requests, no horizontal overflow, all six font families loaded from `assets/fonts`. No `http` string in any html/css/js file.
- Heading outlines fixed to h1 → h2 → h3 on every state.
- Prototype exercised independently: typing `# Spice` styles the line (19px, 600); Cmd+Z removes it; Insert → Section heading selects "Section name"; a pasted block containing `# Drizzle` styles only that line. The builder's own suite ran 50 checks in Chromium and 46 in WebKit, all passing.
- 9 Nov follow-up edits (paper tab bar, 16px circle ticks in Cook, Friends radio in the editor, "Add to Journal" / "Who sees this entry" wording) were re-opened in Chromium and WebKit; **screenshots were not regenerated** and still show the pre-review state for those four details.

## Limitations, honestly

- **Google Chrome and the Chrome extension were not reachable from this session**, so verification used Playwright's Chromium and WebKit builds, not your installed browsers. Safari on a Mac or iPhone, Firefox, mobile autocorrect, dictation and screen readers are untested.
- **Photos are stand-ins.** The buns use a cookie photo (no bun photo in the local set); Shakshuka therefore has no photo and doubles as the visitor no-photo case. CONTENT.md lists what each photo shows.
- Comparison 1 shows the owner state, so the Save pill is absent there by design; the visitor state in `screens/recipe.html?state=visitor` has it.
- The pack does not draw: the Save count on the pill, the two-line phone measure, the Recent changes row on Discover, the larger editor photo, recipe events in the Friends feed, or the "You cooked this" date link. They are described above for the builder.
- Full-page screenshots draw fixed bars mid-page; the live pages are correct. Comparison boards lazy-load their frames, so scroll to them.
- Cook's phone title truncates to one line in the strip. Alternatives: a two-line strip, or "Done" alone on the pill.
- Prototype: scroll memory and ticks reset on reload; the serves box in Cook doesn't recalculate.
- A few text buttons measure 41–43px tall rather than 44 (fork.css `.text-btn` padding). Builder note, not a design decision.
