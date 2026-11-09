# Make Fork better through everyday details

**Mac competitor review · 9 November 2026 · Crouton, Paprika 4 and Recipe Keeper**

**Adopt the competitors’ useful cooking mechanics while preserving Fork’s recipe-shaped editor, restrained design and version-aware social experience.** The strongest additions are forgiving scaling, contextual editing, persistent cooking state, inline timers connected to a multi-recipe overview, reliable capture and useful retrieval. Small details matter: keeping the selected text after inserting a heading, accepting `50%` and `1/2`, retaining a search when returning from a recipe, and explaining what a shopping quantity includes all reduce friction. The three apps also supplied concrete failure cases worth preventing: inconsistent group handling, an incorrectly scaled range, a partially scaled yield and an imported title losing a qualification. This report provides a broad deduplicated transfer inventory from the researched surfaces, not a claim that every feature was discovered or exercised. **It is a research backlog, not authorization to expand the MVP or change the roadmap’s phases.**

## The evidence supports the direction, with specific corrections

The review combined native Mac inspection, synthetic recipe creation, focused follow-up tests and official documentation. **T** means directly tested, **V** means a visible control or menu whose operation was not tested, and **D** means documented by the developer. **Proposal** means the recommended Fork behavior; it must not be mistaken for an observed competitor implementation. The detailed evidence lives in [Crouton notes](notes/crouton.md), [Paprika notes](notes/paprika.md) and [Recipe Keeper notes](notes/recipe-keeper.md). Evidence labels in the inventory refer to those notes unless a specific guide is linked.

The current [product roadmap](../2026-11-08-product-roadmap/README.md), including its final 9 November overrides, and [approved design summary](../../design/2026-11-10-decision-pack/DESIGN-SUMMARY.md) remain authoritative. The broader [cookbook design research](../2026-11-08-cookbook-design-research/README.md) supplies the design rationale. In particular: manual collections are P1; the scaler redesign and easy imports are P2; multi-recipe Party Mode is P3; ingredient-step references, subrecipes and the graphical cooking view remain P4. Drafts and Trash are P1, outside the MVP. Nothing below changes those decisions implicitly.

| Focused test | Observed result | What Fork should take from it |
|---|---|---|
| Paprika multiplier syntax | `50%`, `0.5` and `1/2` all produced the same half batch; reopening normalized the field to `1/2`. | Accept the three forms in one control. Preserve the user’s text while editing; normalize after commitment. |
| Crouton ingredient-based scale | Selecting 375g flour against a 250g baseline produced 1.5×. | Offer “scale to the amount I have” later within the scaler workstream. |
| Quantity range at 2× | Crouton and Paprika produced `2–4 tbsp`; Recipe Keeper produced `2–2 tbsp` for the tested `1–2 tbsp` line. | Test ranges explicitly; a plausible-looking wrong quantity is worse than an honest unparsed line. |
| Paprika free-text servings/yield | `3 servings; makes 6 buns` became `6 servings; makes 6 buns`. | Preserve Fork’s separate Serves and Makes semantics. Do not reproduce this overloaded field. |
| Groups carried into shopping | **Paprika and Recipe Keeper both included Dough/Glaze as selected shopping items** for the pasted fixture. Paprika had displayed them as proper headings in the recipe. | One structured grouping model must drive reading, shopping, print and later nutrition. Visual heading support alone is insufficient. |
| Crouton paragraph-based groups | Later Glaze was recognized and excluded from shopping; first Dough remained an ingredient and appeared in contextual matching. | Show the interpreted groups and provide a direct repair action before saving. This is a fixture-specific result, not a claim that all Crouton groups fail. |
| Paprika timers | Two independent timers remained paused while navigating elsewhere. Clicking the same inline duration again opened a new preview, rather than the existing renamed timer. | Keep timer identity attached to its cooking context; explicit “another timer” should create a duplicate. |
| Recipe Keeper text import | Clean text populated servings, times, ingredients and method, but shortened the title to “Lemon buns,” losing the test qualification. The reviewer restored it before saving. | Reviewable capture must preserve qualifications and source wording; cleanup should be suggested rather than silently applied. |
| Recipe Keeper cooking/search | Clicking ingredients dimmed them; clicking a direction emphasized it. Searching `180°C` found recipes where it appeared in the method. | Make cooking progress reversible and accessible; search the working recipe, not just its title. |

These are bounded tests on a small synthetic library. They establish particular behaviors and useful acceptance fixtures, not comparative defect rates. The native evidence and limitations are recorded in the linked notes.

## Adopt a complete set of conveniences in the right workstreams

The inventory uses **Refine** for an existing or explicitly selected direction, **Adopt** for a recommended capability, **Later** for a worthwhile capability with a later dependency, and **Optional** for a specific experiment or preference. These dispositions express product judgment. They do not imply that every row needs its own button, data model or release. Closely related rows should ship together as small coherent slices.

### Make editing resemble the recipe people will read

| ID | Feature and small interaction to carry into Fork | Evidence | Disposition |
|---|---|---|---|
| E01 | **Recipe-shaped editor:** title and metadata rows on the left, photo on the right spanning those rows, ingredients and method below. Bound the photo height so it cannot push writing far down the page. | Paprika T; user screenshot and preference | **Refine current design.** Mirror Paprika’s composition, not its left-hand photo placement. |
| E02 | Collapse optional description, notes and advanced metadata; indicate when a collapsed section contains content. Core ingredients/method stay open by default. | Paprika T/V | **Refine.** Progressive disclosure, not another mandatory form. |
| E03 | Contextual Insert tools plus normal text entry. Insert a section, select its name, return focus to the text and preserve undo. Typing/pasting the same `#` line has the same result. | Paprika T; Crouton V | **Refine accepted editor.** No compulsory Markdown or Cooklang. |
| E04 | Read back the interpreted groups; offer Convert to section, move a misplaced line and split/merge steps when correcting capture. | Crouton T/D | **Refine groups; adopt repair tools with imports.** Preserve the original text and undo. |
| E05 | Keep bulk text entry fast even if optional structured controls exist. Avoid forcing each pasted ingredient through a separate form. | All three T/V | **Refine.** Do not copy Crouton’s row editor as the only writing path. |
| E06 | Predictable Save, undo/redo, tab order and keyboard-accessible insertion/reordering. Unsaved-change warnings preserve the current edit. | Paprika D; Crouton V | **Refine quality.** Do not override browser shortcuts indiscriminately. |
| E07 | Source name and URL are separate: a cookbook, family member or chef is still a meaningful source without a web address. | Paprika T | **Refine metadata/import.** Keep source attribution distinct from Fork authorship. |
| E08 | Time entry tolerates practical language and offers an optional picker. Keep rest/make-ahead information visible; do not manufacture total time by adding overlapping durations. | Paprika D; Crouton D | **Adopt within time metadata.** Picker versus text presentation remains a choice. |
| E09 | Paste cleanup preview for bullets and line breaks; preserve qualifiers and warnings. Show proposed changes before replacing instructions. | Paprika D; Recipe Keeper T | **Adopt with import polish.** Deterministic cleanup first. |
| E10 | Optional step photos, related recipe links and video/source links. References survive renaming; images do not interrupt every ordinary step. | Paprika D; Crouton V; Recipe Keeper V/D | **Later.** Separate simple media links from version-pinned subrecipe semantics. |
| E11 | Start from an existing owned recipe without retyping. Explain whether this creates an independent recipe, a fork or a new version. | All three V | **Later, already deferred.** Avoid two actions that create indistinguishable copies. |

Paprika’s [editing guide](https://www.paprikaapp.com/help/v4/mac/editingrecipes/) documents its optional tools and text conventions; Crouton’s [import guidance](https://combustioninc.gorgias.help/en-US/crouton-recipe-import-troubleshooting-guide-7701731) documents repair paths. Fork should support a small clear authoring language rather than copying all formatting commands. An empty photo should be a compact invitation to add one, not a large decorative placeholder.

### Combine exact scaling with quick exploration

| ID | Feature and small interaction to carry into Fork | Evidence | Disposition |
|---|---|---|---|
| S01 | **One multiplier field accepts `50%`, `1/2`, `0.5`.** Give a useful error for zero, negative, malformed or non-finite values and zero denominators. | Paprika T; user preference | **Refine P2 scaler.** All forms produce the same factor. |
| S02 | **Slider and exact entry control the same scale.** Show the resulting multiplier, servings and supported Makes together. Keyboard entry remains available. | Crouton V/T; user preference | **Refine P2 scaler.** Slider bounds need not restrict valid typed values. |
| S03 | Scale to servings or an available ingredient amount. Selecting the ingredient precedes entering its target quantity; explain unavailable or incompatible units. | Crouton T | **Adopt within scaler backlog.** Unknown base quantity cannot establish a ratio. |
| S04 | Persistent “Scaled ×…” state and explicit Reset to recipe amounts. Closing the control never unexpectedly resets it. | Crouton T; Paprika T; Recipe Keeper T/V | **Refine.** Temporary scaling does not create a version. |
| S05 | Range-, fraction- and count-aware display. Keep “to taste,” “divided,” optional items and package descriptions intact; do not silently round half an egg to one. | All three T | **Refine correctness.** Retain precision internally; round only for readable presentation. |
| S06 | Serves and Makes remain separate. Scale supported yields while preserving pan dimensions, temperatures and method wording, with the agreed adjustment notice. | Paprika T; all three T | **Refine accepted behavior.** A generic multiply-all-numbers rule is unsuitable. |
| S07 | Unit conversion sits near scaling but is a distinct operation. Preserve authored units; distinguish US measures and mass/volume conversions requiring density. | Paprika V/D; Recipe Keeper V | **Adopt P2 conversion.** Avoid unit names changing unpredictably during slider dragging. |
| S08 | “Use for this cook” versus explicit lasting revision. A permanent serving change previews the authored changes and creates a version. | Recipe Keeper T/V; Fork proposal | **Refine version semantics.** Keep scale, unit display and content edits separate. |

No additional preference decision is needed to combine the two requested scaler interactions. What remains is a small interaction test for drag increments, supported bounds, fraction display and error copy. That is refinement against the working control, not another full visual mockup round.

### Keep cooking state available across recipes

| ID | Feature and small interaction to carry into Fork | Evidence | Disposition |
|---|---|---|---|
| C01 | Inline duration opens a named timer; manual timer entry covers unmarked or ad hoc tasks. Show the chosen duration before starting, especially for `20–25 minutes`. | Paprika T; Crouton D | **Adopt P2 timers.** No automatic start from advancing a step. |
| C02 | **Dedicated multi-timer overview across recipes**, reachable from a compact persistent indicator. Show recipe, step/task, remaining or overdue time and a jump back to the recipe. | Paprika T/D; Crouton D; user preference | **Adopt requested direction.** The page complements inline controls. |
| C03 | Timer state belongs to the active cook, recipe version and individual task. Reopening its inline control finds the existing timer; creating another is explicit. | Paprika T exposed the need; Fork proposal | **Adopt.** A second simultaneous cook of the same recipe must not overwrite the first. |
| C04 | Editable timer labels, quick duration choices, pause/resume, add time, reset and cancel. Default to a useful step/task name, not several identical recipe titles. | Paprika T/V; Crouton D | **Adopt.** Ended timers stay visible until acknowledged. |
| C05 | Recover deadlines and paused remaining time after navigation/reload. Display save/recovery state honestly; do not rely on a decrementing UI counter alone. | Paprika navigation T; persistence is Fork proposal | **Adopt timer quality requirement.** Restart and background behavior require separate validation. |
| C06 | Preserve each recipe’s version, scale, ticks, reading position and later current step when switching. Offer Continue cooking when useful. | Paprika T/D; Crouton T/D | **Refine session recovery; extend in P3 Party Mode.** Viewed is not cooked. |
| C07 | Quick switching among active recipes, using session tabs/pins or a compact list. A cooking pin is different from Keep this version or a collection. | Paprika V/D; Crouton D | **Adopt P3 foundation.** No automatic multi-dish schedule required. |
| C08 | Ingredients alongside method, easy full-recipe read-ahead and optional focused-step presentation. Section progress can say “Dough · 2 of 6.” | Crouton T/D | **Refine existing columns; later optional focus.** Do not force one-step-at-a-time reading. |
| C09 | All Ingredients / Current Step and scaled quantities near their references. Keep allocations of divided ingredients explicit. | Crouton T | **Later P4**, as agreed. Plain substring matching is insufficient for reliable allocation. |
| C10 | Stable ingredient ticks with generous hit areas, readable checked/current states and an intentional reset. Expose state to assistive technology. | Recipe Keeper T; existing Fork decision | **Refine ticks.** A current-step marker is a later choice; the MVP design currently omits it. |
| C11 | Adjustable cooking type size and deliberate keep-awake behavior with a fallback when unavailable. Preserve reflow and ingredient access. | Paprika V/D; Recipe Keeper V/D | **Adopt cooking polish.** Avoid a large appearance-settings project. |
| C12 | Temporary substitutions remain tied to the cook; review them when adding to Journal or saving a new version. | Crouton V/D; Paprika V | **Later assistance.** Never silently replace the authored recipe. |
| C13 | Optional hands-free navigation and platform quick actions. Ordinary touch/keyboard operation remains complete. | Crouton D; Paprika D | **Later platform/accessibility experiments.** Test actual need before camera gestures. |

Paprika documents global timers and retained pinned-recipe progress in its [viewing guide](https://www.paprikaapp.com/help/v4/mac/viewingrecipes/). Crouton documents contextual cooking and timer presentation in its [feature walkthrough](https://combustioninc.gorgias.help/en-US/crouton-organize-recipes-plan-meals-and-cook-smarter-2143474). **Per-session, version-aware timer identity is Fork’s proposed adaptation**, not a claim about either app’s internal data model.

### Make a growing cookbook easy to retrieve and organize

| ID | Feature and small interaction to carry into Fork | Evidence | Disposition |
|---|---|---|---|
| L01 | Optional compact list alongside the photo grid, particularly for photo-free or large libraries. Remember the chosen view. | Paprika V | **Adopt library refinement.** Two useful modes are enough initially. |
| L02 | Search title, ingredients, method, notes and source; show the matched field and text. Keep person/ownership/collection scope visible. | Recipe Keeper method T; Paprika D; Crouton D | **Adopt search work.** P1 relevance; global scoping P2. |
| L03 | Ingredient include/exclude, time ranges, sensible sorting, partial and accent-insensitive search. Exact phrase and advanced any/all rules follow demand. | Recipe Keeper V; Paprika D; Crouton D | **Adopt progressively.** Exclusion filters are not allergy guarantees. |
| L04 | Never cooked, not cooked recently, most cooked and saved-but-not-cooked views derived from Journal. Planned history remains separate. | Recipe Keeper planner filter V; Fork adaptation | **Adopt retrieval refinement.** Existing last/times-cooked work is P1. |
| L05 | Recent queries and recent recipes; reopening a result preserves query, filters and scroll. Next/previous result navigation is optional. | Crouton D; Recipe Keeper D | **Adopt small retrieval details.** Do not call opening a page a Journal event. |
| L06 | Create a collection while filing, keep the selected recipes, support multiple membership and provide the same picker on owned and saved recipes. | Recipe Keeper D; existing Fork decision | **Refine P1 collections.** Save still completes immediately. |
| L07 | Consistent card/result overflow actions with keyboard and ordinary-click access. Right-click or long press can supplement discovery. | Crouton D; Recipe Keeper D | **Adopt library polish.** Avoid a toolbar of every action on every card. |
| L08 | Multi-select filing/tagging with clear scope and reversible membership changes. | Recipe Keeper D | **Later within library growth.** Destructive bulk actions need separate design. |
| L09 | Find unassigned/untagged recipes or missing photos. Treat these as optional maintenance filters, not incomplete-recipe warnings. | Paprika D; Recipe Keeper D | **Optional power-library views.** Photo-free recipes are valid. |
| L10 | Rule-based collections unify saved searches and automatic shelves later. Manual collections remain understandable and independent. | Paprika D; Crouton D; existing Fork direction | **Later**, already accepted. No additional saved-search storage concept by default. |
| L11 | Explain current-source Save, Keep this version, an owned Fork and an exported snapshot consistently. | Paprika D; existing Fork direction | **Refine core language.** None of these bypasses permissions. |

Paprika’s [browsing guide](https://www.paprikaapp.com/help/v4/mac/recipes/) and [cookbook guide](https://www.paprikaapp.com/help/v4/mac/cookbooks/) support the retrieval and snapshot observations. Fork should keep its chosen Save → Cookbook → Collections model, including starter To cook and Favorites collections. The review does not justify adding a separate Favorite system or another category hierarchy.

### Let people bring recipes in and take their work out

| ID | Feature and small interaction to carry into Fork | Evidence | Disposition |
|---|---|---|---|
| I01 | Website, pasted text and text/Markdown file capture through a shared review path. Retain source and show missing fields rather than failing without recovery. | All three V/D; Recipe Keeper text T | **Adopt P2 easy import.** Ordinary paste-first editing remains MVP. |
| I02 | Source beside editable parsed fields; selecting source text can assign it to a field when extraction is wrong. | Recipe Keeper T/V; Paprika D | **Adopt import correction.** Preserve title qualifications, sections, yields and unusual text. |
| I03 | Manual website-capture fallback after automatic extraction fails. Keep already captured material and source URL. | Paprika D | **Adopt import recovery.** Avoid an unsupported-site dead end. |
| I04 | Multi-image or multi-page photo/PDF capture, crop/rotate and correction before saving. Append versus replace is explicit. | Paprika D; Crouton V/D; Recipe Keeper V/D | **Later OCR capture.** Evaluate fractional and multi-column accuracy. |
| I05 | Social-post capture with source retention and review; distinguish available captions/text from video understanding. | Paprika D; Recipe Keeper D | **Later capture.** Availability does not grant publication rights. |
| I06 | Migration from existing cookbook exports with previewed counts, field-loss warnings and per-record failures. | All three V/D | **Adopt switching work.** Choose the first format from real pilot libraries. |
| I07 | Duplicate warnings compare source/content, show candidate matches and allow deliberate keep/update/fork. | Paprika D | **Adopt import quality.** Same title is not proof of duplication; no automatic bulk removal. |
| I08 | Private partial capture of an idea, source link or photo, visibly distinct from a cook-ready recipe. | Crouton D | **Later capture/drafts.** Do not reopen MVP scope. |
| X01 | Readable single-recipe print with photo/notes options and clear version/scale/source. Offer an ink-saving form before many templates. | Paprika V/D; Recipe Keeper V | **Adopt P1 print.** Print should match the selected content. |
| X02 | Human-readable export plus a structured archive that preserves supported history, provenance, photos, groups and organization. | All three V/D; Fork adaptation | **Adopt P1 portability.** Logs join their P2 export work. |
| X03 | Export selected recipes or a collection as well as the whole library; clear progress and failure reporting. | Recipe Keeper D; Crouton D | **Adopt export refinement.** Test round-trips before claiming fidelity. |
| X04 | Polished cookbook PDF with cover, chapters, contents and controlled typography. | Recipe Keeper V/D | **Later paid-value candidate.** Strong fit with Fork’s visual identity. |
| X05 | Recipe-card and layout presets for different physical uses. | Paprika D | **Optional print expansion.** Start with one excellent ordinary print layout. |

The [Paprika browser guide](https://www.paprikaapp.com/help/v4/mac/browser/), [scanning guide](https://www.paprikaapp.com/help/v4/mac/scanningrecipes/) and [settings/import-export guide](https://www.paprikaapp.com/help/v4/mac/settings/) describe recovery and portability tools. Recipe Keeper’s [product overview](https://recipekeeperonline.com/) documents its capture and cookbook output. These features were not all exercised; menu availability should not be advertised as verified import compatibility.

### Connect shopping and planning without creating administrative work

| ID | Feature and small interaction to carry into Fork | Evidence | Disposition |
|---|---|---|---|
| G01 | Shopping preview with ingredient selection, current scale, editable lines, destination list and an explicit “Add N items” confirmation. | All three T/V | **Adopt P3 shopping.** Exclude actual section headings everywhere. |
| G02 | Conservative consolidation with visible contributing recipes and quantities. Keep incompatible units or prepared forms separate. | Paprika D | **Adopt shopping correctness.** Let users inspect why a total exists. |
| G03 | Aisle grouping plus a by-recipe view; multiple lists/stores only when needed. | Paprika D; Recipe Keeper V/D | **Adopt progressively.** Start with one useful list. |
| G04 | Add manual items, multiline pasted lists and recurring staples without creating recipes. | Paprika D; Recipe Keeper D | **Adopt shopping convenience.** Grocery staples are not recipe Favorites. |
| G05 | Add one ingredient from cooking to groceries via overflow, with feedback. | Crouton V | **Adopt once shopping exists.** Useful for replenishment without leaving the recipe. |
| G06 | Checked items stay understandable and recoverable; undo an accidental check before hiding/reordering. | Recipe Keeper help topic V; Fork proposal | **Refine interaction.** No mysterious disappearing rows. |
| G07 | Optional pantry/on-hand suggestions; review omissions instead of trusting stale inventory. Expiry, locations and exact depletion can follow. | Paprika D; roadmap direction | **Later P3 experiment.** Manual bookkeeping is optional. |
| G08 | Deliberate grocery sharing/export or OS-list integration. Explain synchronization, permissions and the authoritative list. | Crouton D; Recipe Keeper D | **Later household/platform work.** Do not force a replacement for an existing shopping habit. |
| M01 | A meal queue/calendar accepts recipes, leftovers, notes and simple items. A meal is not necessarily a saved recipe. | Paprika D; Recipe Keeper V/D | **Adopt P3 planning.** Avoid a calendar-first homepage. |
| M02 | Each planned meal keeps its own scale and passes it into shopping. | Paprika D | **Adopt.** Friday’s batch for six cannot change Saturday’s batch for two. |
| M03 | Small date picker, today/tomorrow shortcuts and explicit move/copy controls; drag is an additional shortcut. Keep the current date/view stable. | Paprika D; Recipe Keeper V/D | **Adopt planning polish.** Keyboard/touch equivalents are necessary. |
| M04 | Plan-to-shopping transfer reviews selected meals and quantities before adding. | Paprika D; Recipe Keeper V/D | **Adopt.** Handle leftovers and already-made components deliberately. |
| M05 | Reusable menus/event templates carry recipe choices, scales and preparation notes. | Paprika D | **Later Party Mode/planning.** Templates need not auto-schedule every cooking step. |
| M06 | Make-ahead/rest indicators, optional suggestions from the user’s collection, and calendar export. | Crouton D; Paprika D; Recipe Keeper D | **Later refinements.** Show overnight work honestly; generation need not require AI. |

Paprika’s separate [groceries](https://www.paprikaapp.com/help/v4/mac/groceries/), [pantry](https://www.paprikaapp.com/help/v4/mac/pantry/), [meals](https://www.paprikaapp.com/help/v4/mac/meals/) and [menus](https://www.paprikaapp.com/help/v4/mac/menus/) guides establish these documented workflow connections. They do not prove household synchronization or every consolidation rule works correctly.

### Retain advanced opportunities with clear reasons and limits

| ID | Feature and small interaction to carry into Fork | Evidence | Disposition |
|---|---|---|---|
| A01 | Linked subrecipes for stocks, sauces and doughs, with stable references, pinned versions and intentional shopping expansion. | Crouton V; Paprika D; Recipe Keeper V | **Later P4.** Reuse is distinct from forking; respect source access and actual yield. |
| A02 | Household collections/lists and optional shared cooking state, with explicit roles and revocation. | All three V/D | **Later P3 household.** Separate from friends and public publishing. |
| A03 | Creator feeds and read-only links retain attribution and access rules. | Crouton D; Paprika sharing V/D | **Later discovery/creator work.** Supplement the friends loop; no automatic publication. |
| A04 | Reviewable substitutions, translation and capture assistance preserve the source and explain changes. | Crouton V/D; Paprika V/D | **Later assistance.** Charge/test ongoing service value; do not silently rewrite recipes. |
| A05 | Optional nutrition with correctable food/quantity matches and visible omissions. | Paprika D; Recipe Keeper V/D | **Later estimates.** Unquantified ingredients and uncertainty stay apparent. |
| A06 | Readable saved recipes/session state offline, clear persistence/sync status and recovery after interruption. | Paprika D; Recipe Keeper D; Crouton D | **Adopt reliability work.** Offline reading, offline editing and cross-device conflict handling are separate promises. |
| A07 | Shortcuts, share-sheet capture, widgets and deep links where the platform supports them. | All three D, platform-dependent | **Later platform work.** Prioritize fewer capture/resume steps over decorative integrations. |
| A08 | Connected scales and thermometers for guided weighing/temperature. | Crouton D | **Optional long-term precision feature.** Needs real hardware and a concrete cooking benefit. |

Crouton’s [Mac release history](https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987?platform=mac) documents several advanced capabilities; its [hardware overview](https://combustion.inc/pages/apps-combustion-plus-crouton) describes device integration. Paprika documents [new platform capabilities](https://www.paprikaapp.com/help/v4/mac/whatsnew/) and [nutrition correction](https://www.paprikaapp.com/help/v4/mac/nutrition/). Recipe Keeper’s [Mac release history](https://apps.apple.com/us/app/recipe-keeper/id1315583175?mt=12) and separate [iOS listing](https://apps.apple.com/us/app/recipe-keeper/id974683711) cover different platform surfaces; mobile claims are not Mac test results.

## Settle the remaining interaction choices without reopening the visual direction

**Three preferences are already settled by this conversation:** Paprika’s editor composition with Fork’s photo on the right; equivalent fractional/percentage/decimal scaling combined with a slider; and inline timers connected to a separate multi-recipe overview with persistent recipe-specific state. These should be carried into their implementation specifications. Fork’s paper, ink, clay and marigold palette and established type remain the visual foundation.

| Choice | Recommended direction | Reason and trade-off |
|---|---|---|
| Editor proportions | A bounded photo column spanning metadata rows; ingredients/method align below. On phones, stack in reading order. | Keeps the finished-recipe resemblance without letting image height dominate writing. Exact widths should be tuned in the app. |
| Empty photo | Compact add-photo affordance; expand when an image exists. | Avoid Recipe Keeper’s large empty placeholder. A stable image area can reduce layout shift, but should not waste the initial editing screen. |
| Optional metadata | Collapse rare fields, indicate existing content, keep source and audience discoverable. | Reduces form weight without making important provenance/privacy invisible. Do not copy rating/difficulty just to fill Paprika’s grid. |
| Scaler slider | A practical drag range with keyboard support and exact typed values beyond it where supported. | Fast adjustment and precise large batches serve different needs. Test increments; no unsupported default bounds are asserted here. |
| Fraction/unit display | Stable units while adjusting; readable fractions where faithful, decimal fallback otherwise. | Auto-converting 3tsp to 1tbsp is convenient, but repeated unit changes during dragging can be distracting. |
| Timer navigation | A dedicated overview route plus a compact persistent count/status indicator; optional drawer access on wide screens. | Honors the requested separate page without adding a fifth permanent main-navigation destination. |
| Timer completion | Keep completed/overdue state until acknowledged. Clicking an existing inline timer reopens it. | Avoid silent duplicates and disappearing completion evidence. “Another timer” remains available explicitly. |
| Timer duration range | Show the chosen endpoint; offer an earliest-check alert rather than implying the food is done. | Paprika chose 20 minutes from 20–25. That is useful only when its meaning is visible. |
| Current-step emphasis | Keep the agreed MVP as is; evaluate an optional marker/focused view in cooking refinement. | Recipe Keeper’s bold step is useful evidence, but it does not supersede the approved “no current-step marker” MVP decision. |
| Library density | Photo grid by default with a compact list option later. | Small libraries benefit from images; large/photo-free ones benefit from density. Avoid three equally prominent modes initially. |
| Advanced search | Start with visible scopes and useful filters; put Boolean rules in later smart collections. | Preserves power without making ordinary retrieval look like a query builder. |
| Shopping checked state | Stable rows with immediate feedback and undo; completed grouping can follow deliberate action. | Automatic sorting can be efficient but makes accidental taps harder to understand. |
| Clipboard import | User-invoked Paste link/text, optionally a clear suggestion after a relevant action. | Do not copy automatic clipboard inspection/upload as a default convenience. |
| Personalization | Functional text size, contrast and eventual dark mode before themes, icons or many accent choices. | Consistent design and kitchen legibility are the goal; extensive skins do not solve the observed tasks. |

For timers, “per recipe” must be a user-facing simplification of **per cooking session, pinned recipe version and individual timer**. Multiple timers can come from one step, and two simultaneous batches can use the same recipe. Returning to a session recovers that session’s scale and progress; starting another is explicit. First validate local navigation/reload recovery. Cross-device control and shared household timers are separate later scopes.

The highest-value next work is the editor composition and insertion details within the current design build, followed by the combined scaler and timer specification in P2. Collections should receive the create-while-filing and quick-action details when P1 is built. Import work should include source-side correction and the newly observed fidelity cases from the start. Shopping and Party Mode can reuse this stable recipe/session model when their phases arrive.

## Retain additional leads without pretending the sweep is exhaustive

**Coverage audit and subsequent approval, 9 November 2026:** the original 78 IDs remain stable. Comparing the synthesis against all three app notes identified Q01–Q09, and Spencer subsequently approved retaining **all 87 entries in the [roadmap](../2026-11-08-product-roadmap/README.md#retain-the-cookbook-app-inventory-as-a-sourced-candidate-backlog)**. Some additions will become acceptance details within an existing item; unresolved semantics still need a focused implementation decision. The exploratory wording below describes evidence and scope uncertainty, not exclusion from the roadmap. The presence of a feature in a competitor is a reason to consider it, not a reason to discard it.

**Build before another broad discovery sweep:** Spencer prefers to implement most of the retained scope, use it and then look for gaps. Keep targeted implementation research and real-user feedback active, but do not commission another general feature hunt now. Existing phase boundaries remain in force; the usable core should reach the friend-group pilot while later features are still pending.

| ID | Additional lead and evidence | Recommended treatment |
|---|---|---|
| Q01 | **Quantity-after-name parsing.** Crouton’s release history documents this input form. [Crouton notes](notes/crouton.md), [release history](https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987?platform=mac) | Add to E05/I02/S05 parsing exploration: preserve and interpret forms such as “flour 250g” when unambiguous. Ambiguous lines stay editable, not silently rearranged. |
| Q02 | **Contextual ingredient lookup.** The Crouton walkthrough names ingredient lookup, but this review did not establish whether it is simply recipe-quantity lookup or a broader reference feature. [Crouton notes](notes/crouton.md), [walkthrough](https://combustioninc.gorgias.help/en-US/crouton-organize-recipes-plan-meals-and-cook-smarter-2143474) | Verify behavior first. Quantity lookup belongs to C09; a glossary/technique reference would be a separate candidate and is not established by this evidence. |
| Q03 | **Repeating meal schedules.** Recipe Keeper’s inspected Help contains a repeating-plans topic; execution and exact rules were not tested. [Recipe Keeper native notes](notes/recipe-keeper.md) | Explore recurring schedules alongside M05 reusable menus. Reusing a template and automatically repeating a schedule are different jobs; preserve an easy one-off override. |
| Q04 | **Private recipe ratings and difficulty metadata.** Paprika exposes these fields and rating-based retrieval; the screenshot supplied by Spencer shows both fields. [Paprika notes](notes/paprika.md), [browsing guide](https://www.paprikaapp.com/help/v4/mac/recipes/) | Retain optional metadata/retrieval exploration with E02/L03. Separate private preference, author-described difficulty and public community ratings. Existing no-rating MVP/Journal decisions remain unchanged. |
| Q05 | **Nutrition-based search.** Recipe Keeper exposes nutrition filters; behavior and data completeness were not tested. [Recipe Keeper notes](notes/recipe-keeper.md), [Mac listing](https://apps.apple.com/us/app/recipe-keeper/id1315583175?mt=12) | Retain alongside A05/L03 after useful nutrition data exists. Missing data must not masquerade as zero; filtering is not a health or allergy guarantee. |
| Q06 | **Workspace focus controls.** Recipe Keeper has a shrinking-sidebar help topic; Paprika documents separate recipe windows and keyboard photo navigation. [Recipe Keeper notes](notes/recipe-keeper.md), [Paprika viewing guide](https://www.paprikaapp.com/help/v4/mac/viewingrecipes/) | Explore collapsible navigation, independent recipe windows and accessible photo navigation as C07/L01 refinements. Prefer normal browser tabs where sufficient; avoid building a window manager. |
| Q07 | **Optional category/tag suggestions during capture.** Paprika documents category suggestions. [Paprika notes](notes/paprika.md), [new features](https://www.paprikaapp.com/help/v4/mac/whatsnew/) | Retain import/organization assistance. Suggestions should be reviewable and should not create a new taxonomy requirement; test a deterministic baseline before paid AI. |
| Q08 | **Barcode-assisted pantry capture.** Paprika documents mobile barcode capture; no Mac behavior or matching accuracy was tested. [Paprika notes](notes/paprika.md), [new features](https://www.paprikaapp.com/help/v4/mac/whatsnew/) | Retain a later G07/A07 experiment. Product identity can reduce entry work but does not establish remaining quantity, expiry or reliable food-database matching. |
| Q09 | **Direct recipe/cookbook sending.** Paprika documents direct messages and snapshot cookbook sharing. [Paprika notes](notes/paprika.md), [new features](https://www.paprikaapp.com/help/v4/mac/whatsnew/), [cookbook guide](https://www.paprikaapp.com/help/v4/mac/cookbooks/) | Retain as an A03 social convenience. Start by assessing “send this recipe to a friend” with access checks; a general messaging system adds moderation and notification work and needs a separate justification. |

Several apparent omissions were already covered: timer presets and editable durations by C04, smart folders by L10, clipboard suggestions in the design-choice table, hardware by A08, platform widgets/shortcuts by A07 and ordinary contextual quantities by C09. Automatic list continuation and similar formatting shortcuts can be acceptance details within E03/E06 rather than new top-level features. The current notes do **not** establish a general ingredient glossary, interval/multi-stage timer sequences or the exact behavior of weather-aware meal planning; these remain follow-up questions rather than verified competitor capabilities or invented commitments.

### Follow the source chain by workstream

Each row’s app/evidence label maps to the native observations or documentary findings in the app notes. Those notes distinguish direct tests from visible controls and link the relevant developer material. The index below provides shorter routes to the principal sources; Fork-specific recommendations and edge-case handling are our proposed adaptations.

| Inventory IDs | Primary evidence routes |
|---|---|
| E01–E11 | [Paprika native/editor notes](notes/paprika.md), [editing guide](https://www.paprikaapp.com/help/v4/mac/editingrecipes/), [Crouton import repair](https://combustioninc.gorgias.help/en-US/crouton-recipe-import-troubleshooting-guide-7701731), [Recipe Keeper capture test](notes/recipe-keeper.md) |
| S01–S08 | [Paprika numeric tests](notes/paprika.md), [Crouton ingredient-ratio test](notes/crouton.md), [Recipe Keeper range/yield test](notes/recipe-keeper.md) |
| C01–C13 | [Paprika timer follow-up](notes/paprika.md), [viewing guide](https://www.paprikaapp.com/help/v4/mac/viewingrecipes/), [Crouton cooking notes](notes/crouton.md), [Recipe Keeper progress test](notes/recipe-keeper.md) |
| L01–L11 | [Paprika browsing guide](https://www.paprikaapp.com/help/v4/mac/recipes/), [Recipe Keeper search evidence](notes/recipe-keeper.md), [Crouton retrieval notes](notes/crouton.md) |
| I01–I08 | [Paprika browser](https://www.paprikaapp.com/help/v4/mac/browser/) and [scanning](https://www.paprikaapp.com/help/v4/mac/scanningrecipes/) guides, [Recipe Keeper text test](notes/recipe-keeper.md), [Crouton capture/portability notes](notes/crouton.md) |
| X01–X05 | [Paprika export/settings](https://www.paprikaapp.com/help/v4/mac/settings/) and [print/viewing](https://www.paprikaapp.com/help/v4/mac/viewingrecipes/) guides, [Recipe Keeper cookbook/export notes](notes/recipe-keeper.md), [Crouton export notes](notes/crouton.md) |
| G01–G08 | All three native shopping previews in their notes; Paprika [groceries](https://www.paprikaapp.com/help/v4/mac/groceries/) and [pantry](https://www.paprikaapp.com/help/v4/mac/pantry/) guides |
| M01–M06 | Paprika [meals](https://www.paprikaapp.com/help/v4/mac/meals/) and [menus](https://www.paprikaapp.com/help/v4/mac/menus/) guides; [Recipe Keeper planning controls/topics](notes/recipe-keeper.md) and [Crouton planning notes](notes/crouton.md) |
| A01–A08 | [Crouton advanced-feature notes](notes/crouton.md), [Paprika integrations/nutrition notes](notes/paprika.md), [Recipe Keeper platform notes](notes/recipe-keeper.md) |
| Q01–Q09 | Individual source links in the additional-leads table above; unresolved semantics are identified explicitly. |

This is a **comprehensive inventory of the promising surface researched so far**, not proof that nothing else remains in these apps. Uninspected paid flows, mobile-only surfaces, deeper settings and integrations can reveal additional features. Reliability tests of already-known features answer a different question: a pending timer-relaunch test does not itself imply a missing feature in the inventory. Retain candidates until there is a recorded reason to combine, defer or reject them; keep settled design preferences distinct from untested ideas. The original 78 plus these nine exploration leads make **87 tracked entries**, not 87 required standalone features.

## Close the quality gaps with targeted tests, not more feature counting

The accessible feature surface is now broadly inventoried. **An exhaustive quality assessment is not complete**, and further menu browsing alone would not make it complete. The remaining work needs representative files, repeated cooking workflows, larger libraries and some additional devices or paid entitlements. No additional user input is needed to use this inventory for planning.

| Area | Current coverage | Most useful remaining test |
|---|---|---|
| Editor and grouping | Created fixtures; inspected layout/tools; tested several group interpretations | Keyboard, undo, multiline paste, section repair and long recipes across all downstream views |
| Scaling and conversion | Equivalent Paprika inputs; Crouton ingredient ratio; ranges and simple fractions | Invalid inputs, limits, decimal commas, package/count cases, conversion accuracy and independent recipe scales |
| Cooking and timers | Crouton focus/current-step filter; Recipe Keeper ticks/highlighting; Paprika two timers and navigation | Expiry, sleep/relaunch, different recipes, repeated cooks and accessible state announcements |
| Organization/search | Menus/scopes; Recipe Keeper method search; official inventory | Realistic 100–500 recipe library, multi-filter combinations, return position and bulk filing |
| Capture/import | Menus and documentation; one clean Recipe Keeper text extraction | Difficult sites, OCR/multiple pages, title/source fidelity, recovery and migration losses |
| Shopping/planning | Shopping previews; grouping and scale propagation; documented planner features | Actual list additions on fixtures, merging, undo, planned scales and leftovers |
| Portability | Export/print controls and documentation | Generate outputs, reopen/round-trip them and compare content, photos, groups and source |
| Social/household | Visible controls and developer descriptions | Invitations, revocation, simultaneous edits and permission behavior with authorized test accounts |
| Accessibility/mobile | Desktop visual/AX inspection, not an accessibility audit | VoiceOver/keyboard journeys, large type, narrow layouts, touch ergonomics and orientation |
| Offline/platform/premium | Official claims and upgrade screens | Controlled offline recovery, paid workflows, cross-device synchronization and device integrations |

The next bounded validation batch should contain the following tests. “Can do” means technically feasible with existing tools and synthetic data; it does not authorize purchases, sends, deletion or account/system changes.

| Test | Access needed | What it resolves |
|---|---|---|
| 1. Print/export each synthetic recipe and reimport copies | Can do locally where available; keep originals | Actual fidelity, including group headers, sources, ranges and photos |
| 2. Structured website, awkward page and manual-capture fallback | Can do with public test sources | Import coverage and recovery, rather than menu presence |
| 3. Clean scan, two pages, columns, handwriting and difficult fractions | Local test files; paid capture entitlement if required | OCR reliability and correction effort |
| 4. Group repair and keyboard-only editor pass | Can do with current fixtures | Cursor/undo/focus behavior and one consistent content structure |
| 5. Numeric and conversion edge cases | Can do with current fixtures | Bounds, malformed values, fractions, units and package semantics |
| 6. Two recipes, several timers, repeat inline click, expiry and reopening | Can do with synthetic recipes; arrange audible alarms deliberately | Timer identity, completion, context and duplicate behavior |
| 7. Quit/relaunch, lock/sleep and prolonged backgrounding | Controlled window/device session | Persistent state and whether alarms survive interruptions |
| 8. Shopping additions/merges/checks and plan-to-list transfer | Synthetic lists; avoid user lists | Consolidation, source attribution, undo and scale isolation |
| 9. Larger library search and bulk organization | Approved fixture library or migration export | Performance and retrieval beyond a handful of recipes |
| 10. Phone/tablet cooking and share capture | Relevant device/app access | Wet-hand-sized targets, large text, rotation and real kitchen navigation |
| 11. Offline edits/reconnection and two-device conflict | Controlled connectivity and authorized second device/account | Data loss, conflict behavior and honest sync status |
| 12. Household invite/revoke and subscription access changes | Explicit account/entitlement access; no purchase assumed | Sharing boundaries and downgrade behavior |
| 13. Connected scale/probe, widgets and platform shortcuts | Relevant hardware/platform access | Whether integrations merit their implementation/support cost |
| 14. Fork browser timer and offline acceptance suite | Fork implementation on target browsers | Deadline recovery, duplicate-tab behavior, denied permissions and actual background limits |

Tests 1, 4, 5 and 6 are the best next desktop checks. Mobile cooking and timer/background behavior are more valuable after that than exhaustively opening every setting. For Fork, browser timer behavior requires its own evidence: persistent deadlines recover elapsed time, but do not guarantee an audible alarm while a browser is suspended or closed. The earlier roadmap links [browser timer guidance](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout), [screen wake lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) and [offline/background operations](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation); implementation must be tested on the actual target devices.

## Preserve ownership and keep the research boundaries visible

The pricing evidence supports considering a hybrid purchase/subscription model, **not treating it as settled**. Crouton separates one-time Plus from ongoing Discover; Recipe Keeper’s installed Mac screen explicitly offered a one-time purchase; Paprika 4 offers a subscription with retained Standard access for existing owners. Their differences are more informative than calling the category subscription-only. ([Crouton plans](https://combustioninc.gorgias.help/en-US/crouton-plans-features-and-benefits-2142748), [Paprika release](https://www.paprikaapp.com/news/2026/11/06/paprika-4-is-now-available-for-all-users/), [Recipe Keeper native notes](notes/recipe-keeper.md))

Fork can evaluate a purchased core alongside recurring services, while keeping entry into the friends loop easy and access/export trustworthy. A feature is not inherently subscription-worthy because it is advanced: a graphical view or cookbook export could belong to the purchased product, whereas hosted collaboration, storage and metered AI create ongoing obligations. Crouton’s personal iCloud model is not a direct cost analogue for Fork’s hosted social service. ([Crouton storage guidance](https://combustioninc.gorgias.help/en-US/crouton-troubleshooting-icloud-sync-and-missing-recipes-7703524)) No conversion rate, revenue uplift or willingness to pay was measured in this review.

The research left synthetic artifacts intentionally: one “Fork review test — Lemon buns (not kitchen-tested)” recipe in each app; a second “Fork capture test — Lemon buns (not kitchen-tested)” in Recipe Keeper; two **paused** Paprika timers, last observed at 59:54 and 19:55; and the text fixture `/private/tmp/fork-recipe-keeper-capture-test.txt`. The second Paprika timer is named “Fork review — bake (paused test).” No timer remains running. Temporary scaling/progress may remain on fixtures. No original personal recipe was edited, no groceries were added, no purchase/trial was started and nothing was deleted or sent.

This review retains **78 original candidates and refinements, plus nine additional exploration leads** across the existing workstreams. It does not recommend building 87 standalone features or copying three complete products. The useful competitive advantage is continuity: an ingredient remains correctly interpreted from capture through editing, scaling, cooking, shopping and export, while Fork remembers the exact version and the cook’s experience. The next implementation decisions should strengthen that continuity before adding more destinations or required concepts.
