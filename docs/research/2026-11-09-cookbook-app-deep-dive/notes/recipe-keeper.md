# Recipe Keeper deep dive — 9 November 2026

## What does Recipe Keeper offer, and how strong is the evidence?

### Takeaway

Recipe Keeper is strongest as a practical household recipe archive: flexible capture, detailed retrieval, meal planning, shopping, and printable cookbooks. Fork should borrow these conveniences while retaining its simpler organization vocabulary, recipe versioning, and quieter visual design.

Evidence labels: **T** = directly exercised in the installed Mac app; **V** = visible control/menu, behavior not exercised; **D** = developer documentation, not independently tested; **P** = proposed adaptation for Fork. Prior-session observations are explicitly distinguished from this follow-up. App identity: Tudorspan Recipe Keeper, Mac bundle `com.tudorspan.recipekeeper-macos`, App Store ID `1315583175`. The similarly named app ID `1510068935` is a different product and is excluded.

### Cited Findings

**Developer-documented inventory.** The [official website](https://recipekeeperonline.com/) describes website/social capture, photo/PDF OCR, other-app imports, offline availability and cross-device synchronization. It advertises weekly/monthly planning, plan-to-shopping transfer, aisle grouping, multiple shopping lists and recurring shopping favorites. PDF cookbooks support covers, chapters, custom text, contents pages, page numbers, and configurable typography/layout. These are documented capabilities, not import-accuracy, offline, or synchronization test results.

The [Mac App Store listing and release history](https://apps.apple.com/us/app/recipe-keeper/id1315583175?mt=12) additionally document pinned recent searches; any/all/unassigned category filters; category creation during editing; recipe-list quick actions; moving between recipes in a result list; bulk updates; keyboard shortcuts; calendar picking; nutrition filters; ingredient cross-off; current-direction highlighting; adjustable reading size; keeping the display awake; unit conversion; related-recipe links; and video links. Its planner can generate suggestions. These features are candidates for hands-on confirmation, not evidence that each implementation is polished.

The [iOS listing](https://apps.apple.com/us/app/recipe-keeper/id974683711) separately documents recipe, shopping, and meal-plan widgets; category assignment from Safari sharing; multi-image scanning; and photo navigation gestures. These are **mobile-only evidence**, not Mac observations. Mobile hardware testing remains outstanding.

**Prior hands-on session: directly tested or visible in the installed Mac app.** Source: conversation's native UI observations, retained here for auditability; these are not assertions derived from the website.

| Area | Observed feature or behavior | Evidence |
|---|---|---|
| Capture | New recipe menu offers manual entry, website import, photo scan, PDF scan, and text import | V |
| Capture | Text-import screen places source material next to editable recipe fields | V |
| Editing | Long-form ingredient/direction text entry; separate notes, nutrition, photos | T/V |
| Editing | Wide horizontal editor requires sideways navigation to reach later columns | T |
| Organization | Courses, Categories, Collections, Favorites, plus sidebar pins | V |
| Search | All words, exact phrase, any words, none; time, rating, nutrition, taxonomy and favorites filters | V |
| Search | Include/exclude recipes present in the meal planner within a selected past period | V |
| Recipe | Text size, copy text, related recipe link, unit conversion, duplicate, and cookbook actions | V |
| Scaling | Change servings temporarily, reset, or explicitly set permanently | T for temporary; V for permanent |
| Shopping | Selection/editing preview before adding ingredients; currently scaled quantities used | T; addition canceled |
| Publishing | Cookbook creation area provides PDF-oriented output controls | V; no export produced |
| Purchase | Mac upgrade screen explicitly offers one-time Pro, no subscription, other platforms sold separately | V |
| Appearance | Large missing-photo placeholder consumes significant space; strong orange surfaces | T, visual judgment |

**Controlled fixture and findings from the prior session.** Title: `Fork review test — Lemon buns (not kitchen-tested)`. Servings: 3. Ingredients include 250 g flour, 150 ml milk, 1 1/2 tsp yeast, 1 egg, 25 g butter, 50 g icing sugar, `1–2 tbsp lemon juice`, and salt to taste, with literal `# Dough` / `# Glaze` lines. Directions contain 40°C, a 20 cm pan, 180°C, and timed instructions. This is a parsing fixture, not a validated recipe.

- Changing servings from 3 to 6 doubled ordinary quantities and the mixed fraction. The en-dash range `1–2 tbsp` became **`2–2 tbsp`**. Both screenshot and accessibility text showed this. This establishes one reproducible input problem; it does not establish that every range syntax fails.
- Temperature, pan diameter, and timing numerals in directions stayed unchanged. Blindly scaling those would be worse; absence of contextual advice is a separate design issue.
- Literal `#` lines remained text and appeared as selected shopping items in the preview. This means these particular pasted markers were not recognized. It does not establish that Recipe Keeper has no alternative section convention.
- The preview allowed individual item selection/editing; it was canceled without adding groceries. No original user recipes were modified. The synthetic recipe remains.

**Follow-up native Mac evidence, 9 November 2026.** Source: direct UI interaction and in-app Help; help text is developer documentation even when viewed inside the app.

| Follow-up | Result | Evidence |
|---|---|---|
| Actual plain-text extraction | Opened a synthetic `.txt` via New recipe → Add recipe from text → Select text file. Parsed servings 3, prep 15 minutes, cook 25 minutes, three ingredient lines including `1–2 tbsp`, and two method paragraphs | T |
| Source preservation/correction | Source remained visible beside editable fields, with selection-to-field buttons for Title, Serving size, Prep, Cook and Ingredients | T for visibility; correction toolbar not exercised |
| Title fidelity | Input `Fork capture test — Lemon buns (not kitchen-tested)` became `Lemon buns` automatically. Restored full title before saving. Do not infer the extraction technology or generalize this one result | T |
| Ingredient progress | Clicking the flour line dimmed it while leaving its position intact | T, screenshot confirmed; accessibility text did not expose changed state |
| Current direction | Clicking first method paragraph made it bold; other paragraph remained regular weight | T, screenshot confirmed; no timer dashboard established |
| Method search | Searching `180°C` returned both synthetic recipes; the string occurred in their method, not title | T; proves this method query works, not every search tokenization case |
| Formatting help | Documents single `*` around text for bold and `_` for italic, with delimiters on the same line. No `#` heading convention documented in the inspected topic | D, in-app Help → bold and italic |
| Text-import fallback | Help describes automatic detection followed by selecting source text and assigning it to fields when detection fails | D, in-app Help → add from text |
| Portability help | Documents full-library Recipe Keeper `.zip` export via Settings → Import/Export, or selection export from search/browse | D, in-app Help → export; no output generated |
| Other help topics | Topics exist for changing shopping grouping/order, regular-item lists, checked-item positioning, recipe-title display, calendar integration, copying/moving meals, repeating plans, and shrinking sidebar | V for topics only; exact behavior not tested |

Test source file: `/private/tmp/fork-recipe-keeper-capture-test.txt`, 251 bytes. It remains, and the additional saved recipe `Fork capture test — Lemon buns (not kitchen-tested)` remains. The first flour item is dimmed and first direction highlighted on this new fixture. No original recipe, shopping list, settings, or account was changed. Final app state is Help → recipe export. No timers were started.

The source-text fixture intentionally contained only a clearly labeled title, servings, prep/cook times, three ingredients, and two directions. It is a successful clean-text extraction check with one title-fidelity issue; it does not represent difficult OCR, arbitrary emails, or website import quality. Automation encountered a transient app-state guard and some AX clicks that did not focus controls; refreshed state and screenshot-based actions resolved these. Those are automation limitations, not app defects.

### Inferences

Prioritize validated benefits over matching the number of controls. The most persuasive opportunities are quick retrieval of an existing recipe, reversible cooking-state controls, and capture that remains easy to correct. The range defect is a useful Fork test case, not a reason to dismiss Recipe Keeper's entire scaler.

### Gaps

Remaining unknowns: difficult-text extraction accuracy, structural section syntax beyond the inspected bold/italic help, linked-recipe semantics, offline reliability, synchronization conflicts, and successful export/import round-trips. In-app help was inspected because the public `/help` URL repeats the marketing homepage.

## What should Fork adopt, adapt, or avoid?

### Takeaway

Adopt the underlying conveniences without recreating Recipe Keeper's overlapping organizational concepts or horizontally sprawling editor. These are recommendations for placement in the roadmap, not changes to already approved phase boundaries.

### Cited Findings

The preceding direct-observation inventory and official sources support the following candidate list. **Every Fork behavior below is a proposal**, not a claim that Recipe Keeper already implements it exactly this way.

| Candidate | Recommended Fork adaptation | Timing / rationale |
|---|---|---|
| Ingredient and instruction search | Search across title, ingredient names, and method; show which field matched | Library/search work; helps find forgotten recipes |
| Include/exclude search | Plain-language include/exclude ingredient controls; advanced any/all options later | Useful as library grows; do not imply allergy certification |
| Recent and pinned searches | Remember recent queries; later allow deliberately saved searches | Small convenience; keep distinct from manually curated collections |
| Unassigned recipes filter | Find recipes outside any collection or without useful tags | Library maintenance, not another shelf |
| Cooking-history filters | Never cooked, not cooked recently, most cooked | Fork's Journal gives stronger evidence than merely having planned a meal |
| Create collection while filing | Picker includes a compact create-new option without losing selection | Collections phase; avoid forcing a separate settings trip |
| Recipe-list quick actions | Consistent keyboard/context menu for collection, shopping, planning, print | Desktop polish; actions also discoverable without right-click |
| Result-list navigation | Next/previous recipe preserves the current query and scroll position | Useful browsing refinement; not the same as a cooking session |
| Bulk organizing | Multi-select to file/tag several recipes | Later library management; clear scope before destructive changes |
| Source alongside editable import | Keep source text visible while correcting extracted fields | Import phase; preserve source attribution and originals |
| Manual source assignment | Select text, then assign to a recipe field when automatic extraction is wrong | Import recovery; avoids requiring perfect recognition |
| Faithful title import | Retain qualifications and warnings; show suggested cleanup rather than silently removing them | Import quality; the observed title shortening lost the test warning |
| Multi-page capture | Combine selected images/pages before extraction | OCR phase; avoids forcing one recipe per photo |
| Migration importers | Accept exports from existing recipe managers | Growth/import phase; report losses instead of silent dropping |
| Check-off and current step | Generous hit areas; temporary ingredient ticks and clear current-step marker | Core cooking polish; session state does not create recipe versions |
| Reading size and wake behavior | Easy type adjustment and deliberate keep-awake during cooking | Cooking accessibility; platform-dependent fallback |
| Temporary serving adjustment | Clear reset and distinction between this cook and saved recipe | Scaler work; permanent change becomes an explicit version in Fork |
| Shopping preview | Review quantities, omit pantry items, edit, choose list before committing | Shopping phase; retain recipe/source traceability |
| Aisle grouping / multiple lists | Practical shopping grouping, optional list/store selection | Later household workflow; begin with one good list |
| Regular grocery shortcuts | Add staples without manufacturing a recipe | Shopping polish; separate from recipe Favorites collection |
| Shopping attribution | Keep each item's contributing recipe available; allow compact display | Helps explain quantities and omitted meals; topic observed, exact display not tested |
| Checked-item stability | Default behavior should avoid moving an item before the user sees what changed | Shopping interaction choice; Recipe Keeper offers a topic about stopping checked-item relocation |
| Meal-plan to shopping | Aggregate selected meals, then review rather than silently adding everything | Planner phase; quantities and leftovers need explicit treatment |
| Meal plan picker | Small date picker, quick today/tomorrow, configurable meal slot | Planner polish; don't copy a calendar-heavy default home |
| Related recipes | Link a sauce/dough/base recipe with clear navigation back | Advanced recipes; define version/visibility semantics first |
| Video reference | Optional source/video link, not mandatory embedded media | Optional content capability; attribution and safe embeds matter |
| Print and cookbook PDF | Useful single-recipe print first; polished multi-recipe book later | Strong fit with Fork's editorial identity |
| Selected export | Export a collection/search selection as well as the whole library | Portability without excessive account-wide export |
| Offline access | Read saved recipe/cooking session when connectivity drops | Reliability target; stronger promise than generic caching |
| Household synchronization | Deliberate shared collection/list behavior and clear access | Later household offering; unrelated to public social publishing |

### Inferences

Design choices to settle or retain:

- **Editor layout:** user has selected Paprika's structure: title/metadata at top with photo on Fork's right, ingredients and method below. Recipe Keeper's horizontal columns are a negative reference. Preserve the finished recipe's reading order and make optional fields progressively visible.
- **Organization:** keep Save → Cookbook → Collections. Recipe Keeper's many parallel labels demonstrate how quickly navigation becomes complicated. Personal favorites can remain a collection/shortcut, not a new storage concept.
- **Planned versus cooked:** never label a recipe as cooked simply because it appeared on a meal plan. Use Journal records for cooking history; show planned history separately if useful.
- **Temporary versus authored changes:** scaling, unit display, ticks, and highlighted steps belong to the active cooking session. An explicit save creates a recipe version.
- **Progress discoverability and accessibility:** Recipe Keeper's ingredient/step text itself was clickable, with dim/bold feedback. Fork should make the affordance clearer with its agreed small ticks and generous hit areas, and expose checked/current states to assistive technology. The Recipe Keeper AX tree exposed the recipe as a single text block, so these visual state changes were not apparent in that inspection; this is not a complete VoiceOver audit.
- **Timers:** the user wants inline timers plus a multi-recipe dashboard with preserved per-recipe state. Recipe Keeper documentation inspected so far does not establish an equivalent dashboard; do not attribute that design to this app without testing.
- **Color customization:** twenty-five themes are not necessary for Fork's edited visual identity. Light/dark accessibility and a coherent palette are more relevant than numerous arbitrary skins.
- **Price:** prior installed Mac screen showed `$39.99` one time, storefront currency unverified. Its cross-platform separate-purchase model is evidence for ownership pricing, not proof that Fork can fund indefinite hosting from one fee.

### Gaps

Preference-sensitive choices include how much advanced search to expose initially, whether to offer compact/list browsing, and when to offer printed books. Those need product judgment and real household usage, not more competitor screenshots.

## What remains to make the review exhaustive?

### Takeaway

An exhaustive inventory can cover accessible screens and official documentation; an exhaustive quality assessment also needs real imports, large libraries, mobile devices, paid synchronization, and long-running cooking sessions. Keep those claims separate.

### Cited Findings

Coverage so far is recorded in the direct-evidence inventory above. Officially advertised sync/offline, OCR, and cross-device features are broader than a single Mac session can validate. [Official platform overview](https://recipekeeperonline.com/)

### Inferences

Recommended follow-up matrix:

1. Import a structured website, nonstructured page, copied email, clean scanned page, two-page recipe, handwriting, and a recipe containing grouped ingredients. Score attribution, yield, ranges, timings, photo ownership, and correction effort.
2. Export/import the synthetic grouped recipe, including photo, source URL, notes, and fractions; compare fields. Test migration with a user-supplied export without changing the original library.
3. Cook on phone/tablet with wet-hand-sized hit targets, large text, backgrounding, screen lock, audio interruptions, and accessibility navigation. Test notifications and timers if present.
4. With authorized paid accounts/devices, test offline edits, reconnection, simultaneous household edits, list conflicts, account recovery, and downgrade behavior.
5. Populate a separate approved test library with hundreds of recipes to evaluate retrieval, duplicate handling, bulk actions, and scrolling performance.

### Gaps

No purchase, trial, outbound share, user-account change, deletion, or modification of existing user recipes is authorized by this research. Current work uses menus and synthetic test content. Paid cross-device checks and mobile checks require the user's relevant access/devices; screenshots alone cannot prove them. No full accessibility audit has been performed.
