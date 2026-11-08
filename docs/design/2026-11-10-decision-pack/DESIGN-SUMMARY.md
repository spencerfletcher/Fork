# Fork MVP design summary · 10 Nov 2026

Builder-ready once the WORKSHEET selections are in. Everything below is the recommended direction; a worksheet answer that differs replaces the matching line. Shipped and planned are as in `reports/Fork product roadmap.md`: groups, Makes, scaling notices on Makes, delete, cook mode, versions, compare, fork and favorite are shipped; Cookbook, Discover naming, the new verbs, the audience radios, the Insert toolbar, Journal and Friends are planned.

## The target in one line

A beautifully edited cookbook with the precision of a great productivity app: photography leads discovery (Cookbook, Discover), the working recipe leads Cook, emphasis has one meaning (marigold = the one primary, clay = text and reader-changed values), and saved state and audience are always said in words.

## Foundation (unchanged)

Paper `#f7f3ec`, ink, clay `#b23c00` as text only, marigold `#eca620` as the single fill. Bitter for titles and dish names, Source Sans 3 for everything else, JetBrains Mono only for handles and version ids. No shadows at rest; the one overlay is the ⋯ menu. 2px clay focus ring. 44px targets on phone, 24px minimum on desktop. All tokens are the ones in `src/app.css`; the pack adds no colour.

## Navigation (comparison 1, recommended A)

- Four destinations: **Cookbook · Journal · Friends · Discover**. Top bar at ≥768 with "New recipe" and the avatar; paper bottom tab bar below 768 (1px border above, current item ink with a 2px clay top edge).
- Cook and the editor hide the tab bar and pin their own bar (Done cooking strip; Save/Cancel).
- Recipe actions sit in the title band under the measure, Cook first. No sticky action bar on the recipe page.

## Cookbook

- My recipes and Favorites merge into one grid with a segmented filter **All · Mine · Saved**, the shipped search box (`name=q`) and shipped text-tab tags.
- Photo cards, 4:3, 1 / 2 / 4 columns (breaks at 600 and 1100). No-photo cards use the title-band treatment. Meta line: total time · version id; "Saved from @handle" on saved cards; lock + "Only me" on private ones. Own recipes carry no owner line.
- Empty library: the copy in CONTENT.md, "New recipe" primary and "Explore Discover →"; no search box over an empty list; no illustration. A filter that empties the grid keeps the filters and says "0 recipes match" in the status region.

## Discover

- Same card component, looser 1 / 2 / 3 grid, every card shows the cook's avatar and handle above the photo, and one large lead card for the newest public recipe. Lede "Public recipes from every cook on Fork." Order stated: "Newest first". Private recipes never appear.

## Recipe overview

- Title band keeps the shipped two columns (words left, 4:3 photo right) and the no-photo rule (words only, one 760px column).
- Measure order: prep · cook · Serves · Makes. Tags, then stats "N adaptations · N saves · N versions", then the version bar.
- **Cook is the marigold primary for everyone.** Owner: Cook, "Edit recipe" ghost. Visitor: Cook, Save, Make my version. Signed out: Cook only (worksheet row 11 decides the "Log in to save" link). Phone: Cook full width, the other two in two columns.
- Personal line for signed-in readers: "You cooked this on Sun 8 Nov · Log a cook".
- Groups: h3 in Bitter title size over their rows; steps number straight through. Scaled ×2: quantities, serves and "Makes 24 buns" in clay; one quiet notice above the method "Scaled ×2. Pan sizes and oven temperatures are not scaled; adjust bake time to the pan." Step text is never rewritten.
- Fork of a deleted recipe: byline "Original recipe deleted" (shipped).

## Cook (comparison 2, recommended A)

- The band collapses to one ~80px strip: title (Bitter 1.375rem clay), serves box, Makes, Done cooking. Prep and cook times drop out.
- ≥1024: ingredients 5/12 sticky, method 7/12 at 1.125rem/1.6, clay Bitter numerals. 834: two columns 4/8. <768: strip and section switch pin together (144px); each tab keeps its own scroll position.
- Ticks are 24px squares; ticked rows strike through in Ink 3 (worksheet row 12). No current-step marker. The method ends with "Done cooking" and "Log this cook" (planned), which opens the Journal form prefilled with recipe, version, servings and today.
- Measured first-ingredient position in the pack: 356px at 390 (inside the first screen), 248px at 1280.

## Editor (comparison 3, recommended A)

- Ordinary recipes need no syntax: no `#`, no toolbar open, no read-back line.
- Each text box (Ingredients, Method) has a collapsed **Insert ▾** beside its label; open, it offers **Section heading**, which inserts `# Section name` on its own line (above the current line when the caret is at a line start, below otherwise) and selects the name. No greyed future buttons.
- A line matching `# Name` renders larger (1.1875rem) and 600 weight while editing, with the `#` in Ink 3. Typed, inserted and pasted headings produce the same lines and the same styling. Bare `#` or `#2 can` never changes size. The prototype (`prototype/editor.html`) is contenteditable with one div per line; the script only toggles a class and one CSS variable, never rewrites text nodes, so native caret, selection, copy, paste and undo survive. Chrome needs styling deferred by one tick so Cmd+Z undoes typing in runs.
- Read-back under the box once a heading exists: "Reads as 3 groups: Dough 8 lines · Filling 5 lines · Glaze 4 lines"; steps "Reads as 9 steps in 3 groups: Dough 1–3 · …". Empty-group and bare-`#` errors arrive on Save, not while typing.
- Makes is an optional field beside Serves, 80 characters, with the shipped error wording. "Who can see this recipe" is a radio pair, **Only me** default, one sentence each; a recipe with adaptations notes that privacy doesn't hide them.
- Header line names the state: "Editing v3 · Unsaved changes · saves as v4" / "Couldn't save: N fields need attention" / "Couldn't reach the server. Your changes are still here." / "Saved as v4". No draft language.
- Danger area at the bottom: "Delete recipe…" in a red-outline ghost; the two-step inline confirm from `screens/delete.html`, then redirect to Cookbook.

## Journal (planned)

- Grouped by month, day in Bitter in the margin; dish, source (recipe + version id, "Improvised", or external domain), "Served N", audience always as icon + word, caption, modest 3:2 photo. The note for next time is the only lifted paper on the page, locked, "only you", with "Change the recipe →" (or "Make my version →" on someone else's recipe).
- Log a cook: Dish and Date required; recipe/version, servings, photo, caption, note and audience optional. "Who sees this cook": Only me (default) / Friends with one sentence each; a private recipe shared to friends says "Friends see the dish and your photo, not the recipe."
- No ratings, no counts.

## Friends (planned)

- One 680px column, "Newest first", entries with avatar, name and handle, cooked and logged dates, dish, photo, caption and source. Actions: Appreciate, Save (only when a shareable recipe is attached), ⋯ (Mute, Unfriend, Report, Block). No Comment in the first release.
- Rail at ≥1024 with Requests and Invite; below 1024 it becomes a strip above the feed. Empty state leads with any pending request, then "Invite a friend".

## Verification record

- Every page opened in Playwright Chromium and WebKit at 390 and 1280 from `file://`: zero page errors, zero failed requests, no horizontal overflow, all six font families loaded from `assets/fonts`. No `http` string in any html/css/js file.
- Heading outlines fixed to h1 → h2 → h3 on every state.
- Prototype exercised independently: typing `# Spice` styles the line (19px, 600); Cmd+Z removes it; Insert → Section heading selects "Section name"; a pasted block containing `# Drizzle` styles only that line. The builder's own suite ran 50 checks in Chromium and 46 in WebKit, all passing.

## Limitations, honestly

- **Google Chrome and the Chrome extension were not reachable from this session**, so verification used Playwright's Chromium and WebKit builds, not your installed browsers. Safari on a Mac or iPhone, Firefox, mobile autocorrect, dictation and screen readers are untested.
- **Photos are stand-ins.** The buns use a cookie photo (no bun photo in the local set); Shakshuka therefore has no photo and doubles as the visitor no-photo case. CONTENT.md lists what each photo shows.
- Full-page screenshots draw fixed bars mid-page; the live pages are correct. Comparison boards lazy-load their frames, so scroll to them.
- In the pack the "Static illustration" label can overlap the end of a long h1 at 390. Board label only.
- Cook's phone title truncates to one line in the strip. Alternatives: a two-line strip, or "Done" alone on the pill.
- Prototype: scroll memory and ticks reset on reload; the serves box in Cook doesn't recalculate.
- A few text buttons measure 41–43px tall rather than 44 (fork.css `.text-btn` padding). Builder note, not a design decision.
- Tablet 834 is demonstrated for Cook (two columns 4/8) and Friends (rail becomes a strip); other pages use the phone or desktop layout unchanged at 834.
