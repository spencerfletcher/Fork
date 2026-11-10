# Cookbook-app inventory: all 87 entries

The full set of capabilities and refinements found in the 9 November 2026 review of Crouton, Paprika 4 and Recipe Keeper on the Mac, retained in roadmap scope by Spencer on 9 November 2026 (all 87: the original 78 plus Q01 to Q09). The research record, with evidence detail and source links per entry, is the [deep dive](../research/2026-11-09-cookbook-app-deep-dive/README.md) and its notes on [Crouton](../research/2026-11-09-cookbook-app-deep-dive/notes/crouton.md), [Paprika](../research/2026-11-09-cookbook-app-deep-dive/notes/paprika.md) and [Recipe Keeper](../research/2026-11-09-cookbook-app-deep-dive/notes/recipe-keeper.md). This file is the current home of every entry's ID, phase and status; [ROADMAP.md](ROADMAP.md) section 5 summarises it.

How to read it:

- **Evidence:** T tested directly, V visible control only (operation not tested), D documented by the developer. A Fork adaptation is a recommendation, not a claim about the competitor.
- **Disposition** (the review's product judgment): Refine (an existing or selected direction), Adopt (recommended capability), Later (worthwhile, later dependency), Optional (an experiment or preference).
- **Phase:** derived from each entry's stated disposition and workstream in the sources. "Later" means retained with no phase named yet. Later and Optional are retained candidates, never silent rejections. Combining entries keeps their IDs; rejecting one needs a recorded product, usability, reliability or cost reason beside it.
- **Status** against the app published on 11 November 2026: shipped, next (P0 or P1 window), later (P2 onward or unphased).
- These are 87 tracked entries, not 87 standalone features. Related rows ship together as small coherent slices; resolve an entry's uncertain behaviour before implementing it.

## Editor and recipe representation (E01 to E11)

| ID | Entry | Evidence | Disposition | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| E01 | Recipe-shaped editor: title and metadata left, photo right spanning those rows, ingredients and method below; photo height bounded. **Selected choice.** | Paprika T; Spencer's screenshot and preference | Refine current design; mirror Paprika's composition, not its left photo | P1 (design pass) | next |
| E02 | Collapse optional description, notes, advanced metadata; show when a collapsed section has content; ingredients and method open | Paprika T/V | Refine; progressive disclosure, not a mandatory form | P1 | next |
| E03 | Contextual insert tools plus normal typing: insert a section, select its name, return focus, keep undo; typed or pasted `#` line gives the same result | Paprika T; Crouton V | Refine accepted editor; no compulsory Markdown or Cooklang | MVP | shipped (Section heading button) |
| E04 | Read back the interpreted groups; repair tools: Convert to section, move a misplaced line, split or merge steps | Crouton T/D | Refine groups; adopt repair tools with imports; keep original text and undo | Read-back MVP; repair P2 | read-back shipped; repair later |
| E05 | Bulk text entry stays fast; no forced per-ingredient form | All three T/V | Refine; do not copy Crouton's row editor as the only path | MVP | shipped (paste-first editor) |
| E06 | Predictable Save, undo and redo, tab order, keyboard insertion and reordering; unsaved-change warnings keep the edit | Paprika D; Crouton V | Refine quality; do not override browser shortcuts | P0 (cross-phase quality) | next (verify) |
| E07 | Source name and URL separate; a book, relative or chef is a source without a web address | Paprika T | Refine metadata and import; source distinct from Fork authorship | P1 | next |
| E08 | Time entry tolerates plain language, optional picker; rest and make-ahead visible; no invented total time from overlapping durations | Paprika D; Crouton D | Adopt within time metadata; picker versus text is open | P1 | next |
| E09 | Paste cleanup preview for bullets and line breaks; keep qualifiers and warnings; show changes before replacing | Paprika D; Recipe Keeper T | Adopt with import polish; deterministic cleanup first | P2 | later |
| E10 | Optional step photos, related-recipe links, video or source links; references survive renames; images do not interrupt every step | Paprika D; Crouton V; Recipe Keeper V/D | Later; keep media links separate from subrecipe semantics | P3 to P4 | later |
| E11 | Start from an existing owned recipe without retyping; say whether it makes an independent recipe, a fork or a version | All three V | Later, already deferred; avoid two actions that make indistinguishable copies | Later | later |

## Scaling and conversion (S01 to S08)

| ID | Entry | Evidence | Disposition | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| S01 | One multiplier field accepts `50%`, `1/2`, `0.5`; useful errors for zero, negative, malformed, non-finite, zero denominators. **Selected choice (with S02).** | Paprika T; Spencer's preference | Refine P2 scaler; all forms give the same factor | P2 | later |
| S02 | Slider and exact entry drive the same scale; show multiplier, servings and Makes together; keyboard entry stays. **Selected choice (with S01).** | Crouton V/T; Spencer's preference | Refine P2 scaler; slider bounds do not limit typed values | P2 | later |
| S03 | Scale to servings or to an amount of one ingredient on hand; pick the ingredient first; explain incompatible units | Crouton T | Adopt in scaler backlog; unknown base quantity cannot set a ratio | P2 | later |
| S04 | Persistent "Scaled ×…" state and explicit Reset; closing the control never resets it | Crouton T; Paprika T; Recipe Keeper T/V | Refine; temporary scaling makes no version | P2 | later |
| S05 | Range-, fraction- and count-aware display; keep "to taste", "divided", optional items, packages; never round half an egg to one | All three T | Refine correctness; full precision inside, round only for display | P2 | later |
| S06 | Serves and Makes stay separate; scale supported yields, keep pan sizes, temperatures and method wording, with the agreed notice | Paprika T; all three T | Refine accepted behaviour; no multiply-every-number rule | P2 | later (notice shipped) |
| S07 | Unit conversion near scaling but distinct; keep authored units; separate US measures and density-based mass and volume | Paprika V/D; Recipe Keeper V | Adopt P2 conversion; units must not jump while dragging | P2 | later |
| S08 | "Use for this cook" versus a lasting revision; a permanent serving change previews and makes a version | Recipe Keeper T/V; Fork proposal | Refine version semantics; scale, unit display and edits stay separate | P2 | later |

## Cooking, timers and session state (C01 to C13)

| ID | Entry | Evidence | Disposition | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| C01 | Inline duration opens a named timer; manual timers for unmarked tasks; show the chosen duration first, especially for `20-25 minutes`. **Selected choice (with C02, C03).** | Paprika T; Crouton D | Adopt P2 timers; no auto-start on advancing a step | P2 | later |
| C02 | Multi-timer overview across recipes from a compact persistent indicator: recipe, step, remaining or overdue, jump back | Paprika T/D; Crouton D; Spencer's preference | Adopt requested direction; complements inline controls | P2 | later |
| C03 | Timer state belongs to the active cook, version and task; reopening finds the existing timer; a second timer is explicit | Paprika T showed the need; Fork proposal | Adopt; two simultaneous cooks of one recipe never collide | P2 | later |
| C04 | Editable labels, quick durations, pause and resume, add time, reset, cancel; default to a useful step name | Paprika T/V; Crouton D | Adopt; ended timers stay visible until acknowledged | P2 | later |
| C05 | Recover deadlines and paused time after navigation and reload; honest save and recovery state; no counter-only timing | Paprika navigation T; persistence is a Fork proposal | Adopt as timer quality requirement; restart and background need separate validation | P2 | later |
| C06 | Keep each recipe's version, scale, ticks, reading position and later current step when switching; offer Continue cooking | Paprika T/D; Crouton T/D | Refine session recovery; extend in P3 Party mode; viewed is not cooked | P2 (P3 extension) | later (version and scale through Cook shipped) |
| C07 | Quick switching among active recipes with session tabs, pins or a compact list; a cooking pin is not Keep this version or a collection | Paprika V/D; Crouton D | Adopt P3 foundation; no automatic multi-dish schedule | P3 | later |
| C08 | Ingredients beside method, easy read-ahead, optional focused-step view; section progress such as "Dough · 2 of 6" | Crouton T/D | Refine existing columns; optional focus later; never force one step at a time | P2 | later (columns shipped) |
| C09 | All Ingredients or Current Step, scaled quantities near their references; divided-ingredient allocations explicit | Crouton T | Later P4 as agreed; substring matching is not enough | P4 | later |
| C10 | Stable ingredient ticks, generous hit areas, readable checked and current states, deliberate reset; state exposed to assistive technology | Recipe Keeper T; existing Fork decision | Refine ticks; a current-step marker is a later choice (the MVP has none) | P2 (M20 revisit) | shipped baseline; revisit later |
| C11 | Adjustable cooking type size; deliberate keep-awake with a fallback; keep reflow and ingredient access | Paprika V/D; Recipe Keeper V/D | Adopt cooking polish; no large appearance-settings project | P2 | later |
| C12 | Substitutions from an ingredient in context: quantity adjustments and expected effects, tied to this cook until reviewed for the Journal or a new version. **Named in the Paprika follow-up.** | Crouton V/D; Paprika V/D | Later assistance; separate supported substitutions from uncertain suggestions; never replace the authored recipe silently | P5 | later |
| C13 | Optional hands-free navigation and platform quick actions; touch and keyboard stay complete | Crouton D; Paprika D | Later platform and accessibility experiments; test need before camera gestures | P5 | later |

## Library and retrieval (L01 to L11)

| ID | Entry | Evidence | Disposition | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| L01 | Compact list beside the photo grid for photo-free or large libraries; remember the chosen view | Paprika V | Adopt library refinement; two modes are enough | P1 | next |
| L02 | Search title, ingredients, method, notes and source; show the matched field and text; keep person, ownership and collection scope visible | Recipe Keeper method T; Paprika D; Crouton D | Adopt search work; P1 relevance, P2 global scoping | P1 (P2 scoping) | next |
| L03 | Ingredient include and exclude, time ranges, sensible sorting, partial and accent-insensitive search; exact phrase and any/all rules on demand. **Named in the Paprika follow-up (multi-field search, saved rules via L10).** | Recipe Keeper V; Paprika D; Crouton D | Adopt progressively; exclusion filters are not allergy guarantees | P2 | later |
| L04 | Never cooked, not cooked recently, most cooked, saved-but-not-cooked views from the Journal; planned history separate | Recipe Keeper planner filter V; Fork adaptation | Adopt retrieval refinement; last and times cooked are P1 | P1 | next |
| L05 | Recent queries and recipes; returning from a result keeps query, filters and scroll; next and previous optional | Crouton D; Recipe Keeper D | Adopt small retrieval details; opening a page is not a Journal event | P1 | next |
| L06 | Create a collection while filing, keep the selection, multiple membership, same picker on owned and saved recipes | Recipe Keeper D; existing Fork decision | Refine P1 collections; Save still completes at once | P1 | next |
| L07 | Consistent card and result overflow actions by keyboard and ordinary click; right-click or long press as extras | Crouton D; Recipe Keeper D | Adopt library polish; no toolbar of every action on every card | P1 | next |
| L08 | Multi-select filing and tagging with clear scope and reversible membership | Recipe Keeper D | Later within library growth; destructive bulk actions need their own design | Later | later |
| L09 | Find unassigned or untagged recipes, or missing photos, as optional maintenance filters | Paprika D; Recipe Keeper D | Optional power-library views; photo-free recipes are valid | Later | later |
| L10 | Rule-based collections unify saved searches and automatic shelves; manual collections stay simple and independent. **Named in the Paprika follow-up.** | Paprika D; Crouton D; existing Fork direction | Later, already accepted; no separate saved-search store by default | Later (after P1 manual collections) | later |
| L11 | Explain current-source Save, Keep this version, an owned Fork and an exported snapshot consistently | Paprika D; existing Fork direction | Refine core language; none of these bypasses permissions | P1 | next |

## Capture, migration and portability (I01 to I08, X01 to X05)

| ID | Entry | Evidence | Disposition | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| I01 | Website, pasted text and text or Markdown file capture through one review path; keep source; show missing fields | All three V/D; Recipe Keeper text T | Adopt P2 easy import; paste-first editing stays MVP | P2 | later |
| I02 | Source beside editable parsed fields; select source text to assign it to a field | Recipe Keeper T/V; Paprika D | Adopt import correction; keep title qualifications, sections, yields, unusual text | P2 | later |
| I03 | Manual website-capture fallback after extraction fails; keep captured material and URL | Paprika D | Adopt import recovery; no unsupported-site dead end | P2 | later |
| I04 | Multi-image or multi-page photo and PDF capture, crop, rotate, correct before saving; append versus replace explicit | Paprika D; Crouton V/D; Recipe Keeper V/D | Later OCR capture; evaluate fractions and multi-column accuracy | P5 | later |
| I05 | Social-post capture with source and review; captions and text distinct from video understanding | Paprika D; Recipe Keeper D | Later capture; availability does not grant publication rights | P5 | later |
| I06 | Migration from cookbook exports with previewed counts, field-loss warnings, per-record failures | All three V/D | Adopt switching work; choose the first format from real pilot libraries | P2 | later |
| I07 | Duplicate warnings compare source and content, show candidates, allow keep, update or fork | Paprika D | Adopt import quality; same title is not duplication; no automatic bulk removal | P2 | later |
| I08 | Private partial capture of an idea, link or photo, visibly not cook-ready | Crouton D | Later capture and drafts; do not reopen MVP scope | Later | later |
| X01 | Readable single-recipe print with photo and notes options and clear version, scale and source; an ink-saving form first | Paprika V/D; Recipe Keeper V | Adopt P1 print; print matches the selected content | P1 | next |
| X02 | Human-readable export plus a structured archive with supported history, provenance, photos, groups, organization | All three V/D; Fork adaptation | Adopt P1 portability; Journal logs join the P2 export | P1 | next |
| X03 | Export selected recipes or a collection as well as the whole library; clear progress and failures | Recipe Keeper D; Crouton D | Adopt export refinement; test round-trips before claiming fidelity | P1 | next |
| X04 | Polished cookbook PDF with cover, chapters, contents, controlled typography | Recipe Keeper V/D | Later paid-value candidate; strong fit with Fork's identity | Later | later |
| X05 | Recipe-card and layout presets for physical uses | Paprika D | Optional print expansion; one excellent ordinary layout first | Later | later |

## Shopping and planning (G01 to G08, M01 to M06)

| ID | Entry | Evidence | Disposition | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| G01 | Shopping preview: ingredient selection, current scale, editable lines, destination list, explicit "Add N items" | All three T/V | Adopt P3 shopping; section headings never become items | P3 | later |
| G02 | Conservative consolidation showing contributing recipes and quantities; incompatible units or prepared forms stay apart | Paprika D | Adopt shopping correctness; users can see why a total exists | P3 | later |
| G03 | Aisle grouping plus a by-recipe view; several lists or stores only when needed | Paprika D; Recipe Keeper V/D | Adopt progressively; one useful list first | P3 | later |
| G04 | Manual items, multiline pasted lists, recurring staples without recipes | Paprika D; Recipe Keeper D | Adopt; staples are not recipe favourites | P3 | later |
| G05 | Add one ingredient from cooking to groceries via overflow, with feedback | Crouton V | Adopt once shopping exists | P3 | later |
| G06 | Checked items stay understandable and recoverable; undo before hiding or reordering | Recipe Keeper help topic V; Fork proposal | Refine interaction; no disappearing rows | P3 | later |
| G07 | Optional pantry or on-hand suggestions; review omissions rather than trust stale inventory; expiry, locations, depletion later | Paprika D; roadmap direction | Later P3 experiment; bookkeeping optional | P3 | later |
| G08 | Deliberate grocery sharing, export or OS-list integration; explain sync, permissions, which list is authoritative | Crouton D; Recipe Keeper D | Later household and platform work; do not replace an existing shopping habit by force | P3 (household) | later |
| M01 | Meal queue or calendar accepting recipes, leftovers, notes, simple items; a meal need not be a saved recipe | Paprika D; Recipe Keeper V/D | Adopt P3 planning; no calendar-first home page | P3 | later |
| M02 | Each planned meal keeps its own scale and passes it to shopping | Paprika D | Adopt; Friday's batch for six never changes Saturday's for two | P3 | later |
| M03 | Small date picker, today and tomorrow shortcuts, explicit move and copy; drag as an extra; current date stable | Paprika D; Recipe Keeper V/D | Adopt planning polish; keyboard and touch equivalents | P3 | later |
| M04 | Plan-to-shopping transfer reviews meals and quantities first | Paprika D; Recipe Keeper V/D | Adopt; handle leftovers and already-made components deliberately | P3 | later |
| M05 | Reusable menus and event templates with recipe choices, scales, prep notes | Paprika D | Later Party mode and planning; templates need not auto-schedule | P3 | later |
| M06 | Make-ahead and rest indicators, suggestions from the user's collection, calendar export | Crouton D; Paprika D; Recipe Keeper D | Later refinements; show overnight work honestly; no AI required | Later | later |

## Advanced, household, creator, assistance and platform (A01 to A08)

| ID | Entry | Evidence | Disposition | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| A01 | Linked subrecipes for stocks, sauces, doughs: stable references, pinned versions, intentional shopping expansion | Crouton V; Paprika D; Recipe Keeper V | Later P4; reuse is not forking; respect source access and real yield | P4 | later |
| A02 | Household collections and lists, optional shared cooking state, explicit roles and revocation | All three V/D | Later P3 household; separate from friends and public publishing | P3 | later |
| A03 | Creator feeds and read-only links keep attribution and access rules | Crouton D; Paprika sharing V/D | Later discovery and creator work; supplements the friends loop; no automatic publication | P5 | later |
| A04 | Reviewable substitutions, translation and capture assistance preserve the source and explain changes. **Named in the Paprika follow-up (with C12).** | Crouton V/D; Paprika V/D | Later assistance; charge for and test ongoing service value; never silent rewrites | P5 | later |
| A05 | Optional nutrition with correctable food and quantity matches and visible omissions | Paprika D; Recipe Keeper V/D | Later estimates; unquantified ingredients and uncertainty stay visible | P4 (gated) | later |
| A06 | Saved recipes and session state readable offline; clear persistence and sync status; recovery after interruption | Paprika D; Recipe Keeper D; Crouton D | Adopt reliability work; offline reading, offline editing and cross-device conflicts are separate promises | P2 | later |
| A07 | Shortcuts, share-sheet capture, deep links; interactive meal and grocery widgets, an Apple Watch companion (steps, groceries, timers), Alexa and Echo Show (meal, shopping, cooking). **Named in the Paprika follow-up.** | All three D, platform-dependent; Paprika's homepage names the integrations | Later platform work on stable cooking, timer, shopping and planning behaviour; fewer capture and resume steps over decorative integrations; same permissions and session state | P5 | later |
| A08 | Connected scales and thermometers for guided weighing and temperature | Crouton D | Optional long-term precision feature; needs real hardware and a concrete benefit | Later | later |

## Additional leads from the coverage audit (Q01 to Q09)

| ID | Entry | Evidence | Treatment | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| Q01 | Quantity-after-name parsing ("flour 250g") when unambiguous | Crouton release history D | Explore with E05, I02, S05; ambiguous lines stay editable, never rearranged silently | P2 | later |
| Q02 | Contextual ingredient lookup; whether it is quantity lookup or a reference glossary is not established | Crouton walkthrough D | Verify first; quantity lookup belongs to C09; a glossary would be a separate candidate | P4 (with C09) | later |
| Q03 | Repeating meal schedules; rules untested | Recipe Keeper help topic V | Explore with M05; a template and a repeating schedule are different jobs; easy one-off override | P3 | later |
| Q04 | Private recipe ratings and difficulty metadata, rating-based retrieval | Paprika V/D; Spencer's screenshot | Explore with E02 and L03; private preference, author difficulty and public ratings stay separate; no-rating MVP and Journal decisions unchanged | Later | later |
| Q05 | Nutrition-based search; behaviour and data completeness untested | Recipe Keeper V | With A05 and L03 once nutrition data exists; missing data is never zero; no health or allergy guarantee | P4 | later |
| Q06 | Workspace focus controls: collapsible navigation, separate recipe windows, keyboard photo navigation | Recipe Keeper help V; Paprika D | Explore as C07 and L01 refinements; prefer browser tabs; no window manager | Later | later |
| Q07 | Optional category and tag suggestions during capture | Paprika D | Retain as import and organization help; reviewable; no new taxonomy; deterministic baseline before paid AI | P2 | later |
| Q08 | Barcode-assisted pantry capture; no Mac behaviour or accuracy tested | Paprika D | Later G07 and A07 experiment; a product code does not give quantity, expiry or reliable matching | Later | later |
| Q09 | Direct recipe or cookbook sending | Paprika D | Retain as an A03 convenience; start with "send this recipe to a friend" under access checks; general messaging needs separate justification | Later | later |

## Counts by phase

| Phase | Count | IDs |
| --- | --: | --- |
| Shipped in the MVP | 2 | E03, E05 |
| P0 | 1 | E06 |
| P1 | 14 | E01, E02, E07, E08, L01, L02, L04, L05, L06, L07, L11, X01, X02, X03 |
| P2 | 28 | E04, E09, S01 to S08, C01 to C06, C08, C10, C11, L03, I01, I02, I03, I06, I07, A06, Q01, Q07 |
| P3 | 16 | C07, G01 to G08, M01 to M05, A02, Q03 |
| P4 | 6 | E10, C09, A01, A05, Q02, Q05 |
| P5 | 7 | C12, C13, I04, I05, A03, A04, A07 |
| Later, no phase named | 13 | E11, L08, L09, L10, I08, X04, X05, M06, A08, Q04, Q06, Q08, Q09 |
| **Total** | **87** |  |

E04's read-back part and C10's baseline ticks shipped; both are counted where their remaining work sits.

## Notes the review recorded beside the inventory

- Already covered rather than new: timer presets and editable durations (C04), smart folders (L10), clipboard suggestions (design choices in [DESIGN-DIRECTION.md](DESIGN-DIRECTION.md)), hardware (A08), widgets and shortcuts (A07), contextual quantities (C09). List continuation and similar shortcuts are acceptance details inside E03 and E06.
- Not established by the notes, kept as follow-up questions, not commitments: a general ingredient glossary, interval or multi-stage timer sequences, the exact behaviour of weather-aware meal planning.
- The inventory is comprehensive for the surfaces researched, not exhaustive: uninspected paid flows, mobile-only surfaces, deeper settings and integrations may hold more. A pending reliability test (for example timer relaunch) is not itself a missing feature.

## Changelog

- 2026-11-11: created from the deep dive's inventory and the product roadmap's retained-scope decision; phases derived from each entry's disposition.
- 2026-11-11: I06 moved from P1 to P2 with the other importers (RM §14, 11 Nov).
