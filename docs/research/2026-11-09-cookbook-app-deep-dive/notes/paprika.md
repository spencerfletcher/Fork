# Paprika 4 for Mac — feature and interaction review

Research date: 9 November 2026. Evidence labels: **TEST** = exercised in installed Mac app; **UI** = observed control/menu only; **DOC** = official Mac4 guide; **PROPOSAL** = recommendation for Fork. Documentary availability is not proof of accuracy or reliability. Some guide pages still carry a beta banner despite the November 6 general release. No purchase, trial, existing-user recipe edits, sharing, or deletion authorized in this review.

## 1. Which capabilities and details should Fork borrow?

### Takeaway

Borrow Paprika's recipe-shaped editing workspace, forgiving numeric input, contextual tools, and operational connections between cooking, shopping, and planning. Preserve Fork's version model, quiet visual language, and simpler organization semantics.

### Cited findings

#### Editor and recipe representation

- **TEST, prior session + user screenshot:** the editor places an image beside title/metadata, ingredients and directions below. Optional Description, Notes, and Nutrition panels collapse. User explicitly prefers this arrangement with **Fork's photo on the right**, spanning the metadata rows. Screenshot supplied in this chat is the primary visual evidence.
- **TEST, prior session:** `# Dough` and `# Glaze` rendered as headings; formatting controls appeared on field focus. Separate source name and URL fields exist. The fixture's free-text `3 servings; makes 6 buns` scaled only its first number to `6 servings; makes 6 buns` at 2×.
- **DOC:** clock buttons supplement free-text time fields; times can say overnight. Toolbar/context-menu commands cover emphasis, headings, lists, links, photos, and recipe references. Lists continue on Enter and end on an empty item. Cleanup commands include removing leading bullets; AI-dependent commands can split steps or summarize. Photo/recipe references depend on names and need updating after renaming. Unsaved changes get a discard confirmation. [Editing guide](https://www.paprikaapp.com/help/v4/mac/editingrecipes/)

#### Cooking, scaling, print, and keyboard detail

- **TEST, prior session:** scaling accepted 2×; 1–2 tablespoons became 2–4, 1½ teaspoons became 1 tablespoon. Temperatures, pan dimensions, and method text stayed unchanged. The scaler placeholder advertised `1/2, 50%, 0.5`. Clicking the synthetic 20–25 minute duration opened a paused 20-minute timer; it was not started.
- **DOC:** timers occupy a global sidebar, can be named/edited/paused/resumed, and disappear when elapsed. Pins preserve ingredient ticks and highlighted directions when switching recipes. Pins sync. Printing can use index cards or full pages, one/two columns, hide photos or notes, and reflect scaled quantities. Separate recipe windows, photo-gallery keyboard navigation, and Command-E/Command-S are supported. [Viewing guide](https://www.paprikaapp.com/help/v4/mac/viewingrecipes/)
- **UI, prior session:** More includes Duplicate, Pin, Print, Export, substitutions, and sharing formats. No explicit step-by-step Mac Cook mode was located; the launch announcement describes Cook mode generally, so absence is not established. [Release announcement](https://www.paprikaapp.com/news/2026/11/06/paprika-4-is-now-available-for-all-users/)

#### Retrieval and organization

- **TEST/UI, prior session:** condensed/list-table/photo modes; categories, Favorites, Most Recent, Top Rated, Trash; cookbook picker.
- **DOC:** live search has explicit field, category, and cookbook scopes. Search is case/accent-insensitive and supports partial words. Advanced rules cover text inclusion/exclusion/emptiness, time and serving ranges, ratings, categories, missing photos, and pin state; nested all/any groups and saved searches are supported. Sorting includes time/servings. Search starts in the current collection; an indexing notice warns of temporarily incomplete numeric results. [Browsing guide](https://www.paprikaapp.com/help/v4/mac/recipes/)
- **DOC:** each cookbook has its own recipes/categories. Moving recipes may prompt about moving category definitions. Sending a cookbook sends a snapshot; later changes do not propagate. [Cookbooks guide](https://www.paprikaapp.com/help/v4/mac/cookbooks/)

#### Capture and portability

- **DOC:** web import previews before saving and warns on duplicate name/source. Manual fallback lets selected source text append to a chosen recipe field. Social import reads post text/captions; it is not a promise of understanding all video contents. [Browser guide](https://www.paprikaapp.com/help/v4/mac/browser/)
- **DOC:** photo/PDF capture supports multiple images for one recipe, crop/rotation, source beside parsed fields, correction before saving, and append-versus-replace for existing recipes. Offline OCR fallback warns to check fractions and columns. [Scanning guide](https://www.paprikaapp.com/help/v4/mac/scanningrecipes/)
- **DOC:** bulk migration accepts multiple competitor formats and YAML. Export offers readable HTML with an index and Paprika's own format; cookbook membership round-trips. Duplicate finder compares selected fields, groups matches, marks the oldest to keep, and warns before eliminating all copies. Settings include reading size, image-placeholder visibility, list details, start screen, and visible sync status. [Settings guide](https://www.paprikaapp.com/help/v4/mac/settings/)

#### Shopping and pantry

- **DOC:** preview selects ingredients before adding, respects scale, and considers pantry quantity/expiry. Equivalent grocery lines consolidate with a visible indicator. Lists can filter/sort by originating recipe or aisle; custom multiline paste and notes are supported. [Groceries guide](https://www.paprikaapp.com/help/v4/mac/groceries/)
- **DOC:** pantry tracks quantity, purchase/expiry dates, stock, notes, and location. Zero quantity changes stock status. Expired/out-of-stock subsets can transfer to shopping. [Pantry guide](https://www.paprikaapp.com/help/v4/mac/pantry/)

#### Planning and household workflows

- **DOC:** day/week/month planning accepts recipes, notes, and standalone ingredients. Each planned meal has its own scale, carried into shopping. Drag moves; Option-drag copies. Views preserve dates. A planned recipe cannot simply be swapped: documentation requires delete/add. [Meals guide](https://www.paprikaapp.com/help/v4/mac/meals/)
- **DOC:** reusable menus can span multiple days, include notes/plain ingredients, carry scales, and populate a calendar from a selected start date. Menus can duplicate. [Menus guide](https://www.paprikaapp.com/help/v4/mac/menus/)
- **DOC:** optional paid capabilities include family accounts, direct recipe/cookbook messages, calendar feeds, text/photo/social capture, nutrition, category suggestions, and mobile barcode capture. Mac integrations include Shortcuts and Spotlight. [What's new](https://www.paprikaapp.com/help/v4/mac/whatsnew/)
- **DOC:** nutritional analysis exposes matched foods and quantities for correction, permits exclusion, flags unmatched items, and distinguishes estimates and omitted unquantified ingredients. [Nutrition guide](https://www.paprikaapp.com/help/v4/mac/nutrition/)

### Inferences — transfer list with placement and edge cases

The phase labels below are recommendations within existing workstreams, not changes to the approved roadmap.

| ID | Transfer to Fork | Placement / why / edge condition |
|---|---|---|
| P01 | Recipe-shaped editor: title + metadata left, photo right, ingredients + method below | Current design refinement; user preference. Stack in logical order on phone; shrink empty-photo area. |
| P02 | Collapsible optional fields | Current refinement; keep essentials visible and hide unneeded nutrition/notes. Entered content should remain discoverable. |
| P03 | Contextual Insert/format toolbar | Current editor refinement; visible `#` syntax remains learnable without mandatory Markdown knowledge. Maintain keyboard focus/selection/undo. |
| P04 | Familiar editing shortcuts | Current refinement; Save, undo/redo, predictable tab order. Avoid intercepting native browser shortcuts unnecessarily. |
| P05 | Source label plus URL | Base recipe/import work; attribution stays intelligible when source is a person/book, not a website. |
| P06 | Optional time picker beside tolerant text entry | Design choice; a numeric duration plus optional rest/overnight note may fit Fork better than unstructured time. Never infer total as prep+cook when overlapping/resting. |
| P07 | Paste cleanup preview: remove bullets/normalize line breaks | Import/editor phase; deterministic cleanup first. Never silently summarize away cooking instructions. |
| P08 | Step images and linked subrecipes | Later recipe development; use stable recipe/version references instead of rename-fragile names. Respect private sources. |
| P09 | Flexible multiplier input: 50%, 1/2, 0.5 | Scaler work; one normalized factor with forgiving parsing and helpful invalid/zero/negative handling. |
| P10 | Live scaling with persistent factor label and reset | Scaler work; separate temporary cook setting from authored recipe version. No rounding until display. |
| P11 | Unit conversion adjacent to scaling | Scaler work; distinguish conversion from scaling, US measures from other cups, mass from volume. Do not guess density. |
| P12 | Range/fraction-safe scaling | Scaler quality requirement; preserve 'to taste', 'divided', package sizes and count semantics. Separate Makes/Servings fixes the observed free-text yield failure. |
| P13 | Inline duration → named timer | Cooking work; range needs explicit choice or clearly shown earliest alert. No automatic timer start from step navigation. |
| P14 | Global multi-timer view with recipe context | Cooking work; explicit user preference, see timer design below. |
| P15 | Active recipe pins with retained cooking position | Party Mode foundation; distinguish cook-session tabs from saved-version pins or collections. |
| P16 | Adjustable cooking text size | Cooking polish; keyboard/zoom/screen reader support still required. |
| P17 | Compact list/table alternative to photo grid | Library refinement; useful when recipes lack photos or library grows. Avoid three equally prominent views by default. |
| P18 | Search scopes visible alongside results | Library/search phase; avoid hidden 'only title' state causing missing results. |
| P19 | Ingredient inclusion/exclusion, time ranges, sorting | Search phase; partial/case-insensitive matches useful, ingredient exclusions are not allergy guarantees. |
| P20 | Missing-photo/unclassified filters | Power-library maintenance; useful for migrating or completing recipes. |
| P21 | Saved rules/smart collections | Later; unify with future rule-based collections rather than a separate saved-search concept. |
| P22 | Import review with source alongside result | Import phase; especially fractions, multiple columns, missing method, and OCR uncertainty. |
| P23 | Manual capture fallback after automatic failure | Import phase; don't strand user at 'unsupported site'. Retain source and imported text. |
| P24 | Duplicate warning before import | Import phase; source/content comparison, explicit keep/update/fork. Same name alone is insufficient for Fork. |
| P25 | Bulk import from competing cookbooks | Adoption priority after MVP; validate image/source/group/unit fidelity before advertising compatibility. |
| P26 | Human-readable + structured export | Portability phase; preserve versions/provenance/collections explicitly, not only current text. |
| P27 | Print presets: screen recipe, ink-saving, recipe cards | Export refinement; scaled output must label factor/version and preserve attribution. |
| P28 | Shopping review and conservative consolidation | Shopping phase; keep traceability to recipes, don't merge incompatible prepared forms. |
| P29 | Aisle ordering + recipe view + multiline paste | Shopping polish; accommodate users shopping by meal or multiple stores. |
| P30 | Pantry-aware suggestions, quantity/expiry/location | Later; optional inventory upkeep. Don't silently hide missing shopping items based on stale stock. |
| P31 | Planned meal stores its scale | Meal planning; a batch for six on Friday must not alter Saturday's batch for two. |
| P32 | Plans accept notes, leftovers, simple items | Meal planning; users shouldn't create fake recipes to schedule takeaway or fruit. |
| P33 | Drag move/copy plus explicit accessible controls | Planning polish; keyboard and touch equivalents necessary. |
| P34 | Reusable menus/event templates | Later Party Mode/planning; preserve per-recipe quantities and prep notes. |
| P35 | Calendar feed/household collaboration | Later service features; define timezone, private access, refresh and revocation. |
| P36 | Transparent nutrition mappings | Later optional nutrition; estimates and uncounted ingredients must remain obvious. |
| P37 | Share snapshot versus follow changes distinction | Fork core version language; distinguish saved latest, fixed version, owned fork, and copied export. |
| P38 | Visible sync/save state and local read resilience | Quality work; don't show success before persistence; migration/export is safety net. |
| P39 | OS quick actions and integrations | Native/PWA maturity, not MVP; start with share/import where it reduces steps. |

### Gaps

No end-to-end migration, OCR, social-import, nutrition, calendar-feed, paid family sharing, offline, or cross-device reliability tests. Current library is tiny; search speed at scale is unmeasured. Not all advertised integrations exist on Mac (barcode capture is mobile). No full accessibility audit.

## 2. Which design choices should be settled, and what should Fork avoid?

### Takeaway

The user's editor and scaler preferences fit together. Adopt the structure and precision without importing Paprika's full density or overlapping concepts.

### Cited findings

- **User decision / screenshot:** Paprika-like metadata header and two-column editing, with photo mirrored to the right for Fork. This settles basic desktop arrangement, not typography, spacing, or exact field count.
- **User decision:** accept fractional, percentage, and decimal scaler input; combine with the preferred Crouton slider.
- **User decision:** multiple timers connected to inline times, with a separate overview and recipe-specific state.
- **TEST/UI, prior review:** many global feature sections, icon-only toolbar items, and additional category column occupy the desktop simultaneously. This is a density observation, not a measured usability or accessibility defect.

### Inferences — recommended resolutions

1. **Editor proportions:** photo occupies a bounded secondary column across metadata, not half the full page. Title should retain a long readable width. Ingredients/method align directly beneath; photo cannot push them several screens down. Source/collections and optional fields need not copy Paprika's exact grid.
2. **Separate yield:** numeric Serves plus Makes quantity/unit. Avoid reproducing one free-text box containing unrelated numbers.
3. **One scaler, multiple input methods:** multiplier field accepts `50%`, `1/2`, `0.5`; slider and presets adjust the same factor; servings and ingredient-based modes convert into it. Display a stable normalized value and preserve typed text while editing. Slider is optional convenience, not the only accessible control. Its range/step needs a product choice; large recipes must remain possible by typing.
4. **Keep magnitude stable:** avoid surprising unit changes while dragging. Choose readable fractions only when exact enough; preserve precision internally. Show reset to recipe baseline, and no automatic save-as-new-version.
5. **Timer overview:** recommend a persistent compact timer indicator opening a drawer on desktop and a full-height sheet/page on mobile, with an optional dedicated overview route for Party Mode. User wants a dashboard; this supplies it without adding an always-visible primary nav item.
6. **Timer association:** recipe + immutable version + cook-session + step + individual timer identity. Multiple timers can belong to one step, and the same recipe can be cooked twice concurrently. This is a Fork proposal, not a claim about Paprika internals.
7. **Timer behavior:** inline control opens existing timer for that session; explicit 'another timer' creates another. Show label, recipe, step, original duration, remaining/overdue, pause/resume/reset/cancel. Navigating recipes does not reset. Ended state stays visible until acknowledged; don't copy automatic disappearance if it obscures what finished.
8. **Persistence:** reload recovers deadlines/paused remainder, not just decrementing text. Session-specific tick/step/scale state survives navigation. App restart, another browser tab, another device, and editing recipe during cook require explicit behavior; start local-session recovery before cross-device control. Background browser notifications and alarms need platform testing before reliability promises.
9. **Keep organization simpler:** recipes can belong to multiple Fork collections; don't copy mutually exclusive cookbook containers plus separate category trees unless a concrete household/pro workspace need appears.
10. **Use stable references:** renaming a recipe or photo must not break embedded links. Recipe links should name the referenced version when required during cooking.
11. **No automatic content substitution:** ingredient substitutions and AI cleanup are reviewed suggestions; don't mutate the authored recipe or cooking quantities silently.
12. **Duplicate logic must respect versioning:** an intentional fork or different version isn't a duplicate just because name/source match. Never bulk-remove automatically.

### Gaps

Exact slider bounds, keyboard increments, fraction presentation, and timeline/notification delivery require interaction prototyping and device testing. A user preference for an overview does not settle whether it should be a permanent page, responsive drawer, or both.

## 3. Coverage, native-test follow-up, and evidence limits

### Takeaway

The official guide covers the feature surface broadly. Native follow-up should target behaviors documentation cannot prove: numeric equivalence, timer state, scaling propagation, editor focus, and dialog defaults.

### Cited findings

- **Prior native tests:** recipe creation/saving, group rendering, contextual tools, 2× ranges/fractions, unchanged method numbers, one paused inline timer, category/library navigation, upgrade screen.
- **Prior menus only:** imports/exports, recipe actions, view modes, settings, pins; no claim of their successful execution.
- **Documentation coverage:** editor, browsing/search, cooking/scaling/timers/printing, capture/browser/scanning, cookbook sharing, grocery/pantry, meal/menu, nutrition, settings/migration/duplicates, release/monetization. Sources linked at each finding above.

### Inferences

A complete product surface inventory is feasible from UI plus official guides; an exhaustive quality review additionally needs representative data, repeated workflows, multiple devices, paid entitlements, and network interruptions. More features in a menu do not establish their implementation quality.

### Gaps / next validation

- Test each scaler notation on the same fixture; inspect unit menu/default and invalid inputs.
- Test simultaneous timers without running alarms; verify switching recipes and reopening controls. Restart persistence remains separate.
- Inspect shopping preview to verify scale/group propagation and cancellation.
- Inspect print options; generating a file and round-tripping imports still needs a separate fixture exercise.
- Check keyboard editing, optional field collapse, and time picker without changing user recipes.
- Native follow-up results to be appended below by the assigned reviewer once exclusive UI control is available.

### Native follow-up results — 9 November 2026

Primary evidence is the installed Paprika Recipe Manager 4 UI, read through accessibility state and screenshots in this review. These observations are independent of the web guide summaries above.

| Test | Observed result | Implication |
|---|---|---|
| Enter `50%`, `0.5`, then `1/2` into the same Scale field | All produced 1/2×; reopened field normalized to `1/2`. Flour125g, milk75ml, yeast3/4tsp, egg1/2, butter12.5g, lemon1/2–1tbsp. | Confirms numeric equivalence, not merely placeholder advertising. Fractional count needs usable guidance; half an egg should not round silently. |
| Inspect unit menu | Default / Standard (US) / Metric | Useful alongside scale; conversion correctness was not tested. |
| Click 1hour inline time, briefly start then pause | Sidebar entry appeared, paused at59:54. Default label was whole recipe title. | Timers become global on Start; preview alone wasn't a sidebar timer. |
| Click20–25minutes inline time, briefly start then pause | Second independent sidebar timer appeared, paused at19:55. Range selected20min. | Multiple timers per recipe work; range meaning should be explicit. |
| Edit second timer | Name field, hour/minute/second pickers,5/10/30minute presets. Renamed to 'Fork review — bake (paused test)'; saved without resuming. | Good quick presets; step-derived default names would be better than duplicated recipe titles. |
| Click same20–25min inline text after renaming | Opened NEW20:00 paused preview bearing original recipe title, instead of existing19:55 renamed timer. Did not start it. | Fork should bind inline controls to timer/session state and require explicit creation of an additional timer. |
| Navigate to Menus and reopen timer from sidebar | Existing19:55 timer remained paused with edited name; first59:54 remained. Returned to recipe and factor stayed1/2. | State survives section navigation. No claim about restart, another device, or exact timer-to-step identity. |
| Add to grocery preview at1/2 | Scaled ranges and quantities preserved; `divided` / `to taste` separated into Notes. **Dough and Glaze became checked grocery items**, despite displaying as noncheckbox headings on recipe. Screenshot confirmed Dough underBakingGoods andGlaze underSauces. | Heading formatting and shopping semantics diverge. Fork needs one structured group model across display, scaling, shopping, print, and nutrition. This qualifies the prior positive grouping assessment. |
| Cancel grocery preview | Returned to recipe; no items added. | No mutation to grocery list. |
| TryCommand-E immediately after preview close | No visible editor appeared; focus/automation uncertain. | Shortcut remains documented, not newly verified; don't claim app defect. |

**Remaining app state:** two paused test timers,59:54 and19:55, associated with the synthetic review activity; recipe temporarily scaled1/2. No running timer, no alarm triggered, no subscription, no deletion, no existing user recipe changed. The synthetic recipe content was unchanged during this follow-up.

**Still untested:** timer expiry/acknowledgment, restart persistence, multiple recipes concurrently, pins' cooking-state restoration, invalid scale values, unit conversion accuracy, reading-size interaction, print-output generation, full keyboard pass. These are coverage gaps rather than reasons to defer the useful features identified.
