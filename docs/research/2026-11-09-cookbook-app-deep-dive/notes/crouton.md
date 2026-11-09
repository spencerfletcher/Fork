# Crouton deep dive for Fork — 9 November 2026

## Which features and details are worth adopting?

### Takeaway

Crouton's strongest lesson is reducing interruptions while cooking: ingredient quantities in context, adjustable scaling, a cooking workspace, and accessible preparation information. Adopt those interaction benefits with Fork's quieter visual language. Treat the inventory below as candidates, not authorization to expand the MVP.

### Cited Findings

Evidence labels: **T** directly exercised on the installed Mac app; **V** visible menu/control only; **D** official documentation, with platform support and behavior unverified locally. Native observations below are first-party session evidence, not claims sourced from marketing. The previous review and this follow-up used the clearly labeled synthetic Lemon buns recipe and the bundled cookie sample; no private recipes were edited.

Source provenance: Combustion publishes a dedicated Crouton product overview and the cited help center uses Combustion branding and links back to its shop. The acquisition is independently reported by [The Spoon, 29 April 2025](https://thespoon.tech/combustion-acquires-award-winning-recipe-app-crouton-appoints-crouton-developer-as/). Treat these as Combustion's Crouton support documentation; first-party product and App Store evidence also corroborate the relationship. The linked developer announcement did not expose article text to this research tool.

**Native observations (T/V):**

- **T:** Scale modes are multiplier, serving count, and selected ingredient. Slider plus editable exact value. Previous test selected 375g flour against a 250g base and displayed 1.5× with other quantities adjusted. Fractions are human-readable; ingredient range `1–2 tbsp` doubled correctly in the preceding review.
- **T:** In ingredient-scale mode, pressing the xmark control exposed as “Done” cleared the selected ingredient and returned the recipe to its base quantities. This is one bounded interaction observation, not a conclusion about every close/reset control. A plainly labeled Reset would be preferable in Fork.
- **T:** Cooking opens a separate window, puts ingredients beside the current step, and offers All Ingredients / Current Step. Step navigation has buttons, progress dots, and a page slider. Current Step preference was retained from the prior session.
- **T:** Ingredient quantities and names are accented blue, temperatures orange. Clicking a time in this synthetic single-step recipe produced no visible timer. This does not establish that timers are absent on Mac; documented support is broader than the locally reproduced behavior.
- **V:** An ingredient's cooking-mode overflow menu offers Suggest Substitutes, Check Substitute, and Add to Groceries. No AI action or grocery mutation was executed.
- **T:** Shopping preview lets users select individual ingredients, Deselect All, and confirm with an explicit Add N Items count. A recognized section was excluded from shopping items.
- **T:** Bulk entry has a paragraph-based section convention. In our input, the first `Dough` line remained an ordinary ingredient while the later `Glaze` became a real section. Consequently Dough appeared in both the shopping preview and Current Step matching because its text appeared in the method. This is an input-interpretation failure in this fixture, not proof all sections fail. A preview/repair mechanism would prevent the mistake propagating.
- **V:** Ingredient editor exposes Bulk Add, Add Section, and Link Recipe. Rows have Remove and Reorder handles. Primary editing is structured rows with a bulk-text escape hatch.
- **V:** Capture menu: manual, link, image, text, PDF. Settings include import/export. Recipe menu: add to meal plan, duplicate, edit, tags/folders, delete. Organization picker shows folders with recipe counts and previews.
- **T:** A clipboard URL availability card appeared without us pasting into a field. We did not follow it; its source was not part of this review. This is a convenience pattern with privacy implications.
- **T:** Photo-free recipe detail uses a title-led layout rather than a giant empty photo block. Photos lead the sample recipe; the title is overlaid on the hero. Large rounded step cards and multiple accent colors create a more decorated surface than Fork's approved direction.

**Official inventory, distilled:**

- **D:** Two recent recipes, tag filters inside search, result quick actions, ingredient quantity placement/color preferences, step/section progress, ingredient lookup, hands-free navigation, responsive ingredient/method columns, and a timer tray on large screens. Phone timers float and can be repositioned; a manual timer button is documented. Grocery lists integrate with Reminders. [Official feature walkthrough](https://combustioninc.gorgias.help/en-US/crouton-organize-recipes-plan-meals-and-cook-smarter-2143474)
- **D:** Website capture and field-level OCR are available without Discover; whole-recipe photo/PDF/text AI import requires Discover. Repair tools move lines between ingredients/method and convert an ordinary line to a section. Support identifies duplicated lines, character loss, section misclassification, unsupported app formats, and stalled bulk imports as real failure modes. [Import troubleshooting](https://combustioninc.gorgias.help/en-US/crouton-recipe-import-troubleshooting-guide-7701731)
- **D:** Release notes document recipe switching with independent scales, contextual substitutions that leave saved originals intact, make-ahead indicators, calendar widgets, Shortcuts, JSON-LD import, bulk export to native/PDF/text/Markdown, configurable navigation, accent-insensitive search and quoted phrases, quantity-after-name parsing, tag-preserving export, self-named timers, linked subrecipes, translation, smart folders, and shared cooking. Latest displayed Mac release is 2026.5.1, October 26. [Mac App Store release history](https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987?platform=mac)
- **D:** Recipe storage can be partial—website, image, or simply a title—and meal plans can be generated from the stored collection. [Official product site](https://crouton.app/)
- **D:** Hardware extensions include guided Bluetooth-scale weighing and live Combustion thermometer information. [Official product overview](https://combustion.inc/pages/apps-combustion-plus-crouton)

### Inferences

Recommended transfers below are product judgments, not claims that Crouton implements every proposed detail.

| Candidate | Benefit for Fork | Fit and essential behavior |
|---|---|---|
| Exact scale input plus slider | Fast exploration and precision in the same control | Existing scaler refinement. Accept `50%`, `1/2`, `0.5` as equivalent, following the user's Paprika preference. Show normalized multiplier and resulting servings together. |
| Scale by available ingredient | “I have 375g flour” without manual arithmetic | Scaler backlog; one selected ingredient establishes the ratio. Reject zero/unknown base quantities and incompatible units; make density assumptions explicit. |
| Explicit Reset to original | Recover quickly after experimenting | Scaler refinement. Separate closing the panel from resetting values. Changes remain cooking-session state until an explicit recipe edit/version. |
| Cooking-state persistence | Switching recipes does not lose progress | Core cooking refinement. Persist recipe version, scaling, checked ingredients, current step, and timers per session/recipe; do not attach transient state to shared recipe content. |
| Persistent multi-timer dashboard | Coordinate oven, rest, rice, and sauce | Requested cooking feature. Timer cards identify recipe and step, show remaining/overdue time, and jump back to context. Keep all running timers visible while switching recipes. |
| Inline duration actions plus manual timer | Covers detected durations and ad hoc kitchen needs | Cooking refinement. One deliberate action starts a timer with feedback; clicking again must reveal the running timer, not create silent duplicates. Manual entry must remain available. |
| Editable contextual timer names | Distinguishes multiple identical durations | Timer refinement. Default from explicit step/recipe metadata before requiring AI. Name, duration, start/pause/resume, add-time and dismiss should be obvious. |
| Ingredients beside the active step | Less scrolling and working-memory load | Keep full recipe view too. Desktop/tablet split, narrow-screen drawer or compact inline lookup. Preserve easy read-ahead. |
| Current-step ingredient filtering | Reduces clutter in long recipes | Keep agreed later ingredient-reference phase. Explicit references are more trustworthy than substring guessing. Always provide All Ingredients and correctable links. |
| Quantities in step context | Avoid back-and-forth lookup | Later structured references. Respect session scale and split quantities such as butter used in two steps; don't imply the full amount belongs in each step. |
| Section-aware step progress | Makes a long recipe understandable | Cooking refinement: “Dough · 2 of 6”, plus jump-to-section. Progress can remain small and secondary. |
| Input repair actions | Fix imports without retyping | Editor/import refinement: Convert to section, Move to ingredients/method, split/merge steps. Visible preview before commit. Keep text selection, undo, keyboard operation. |
| Plain text plus optional structured helpers | Serves novices and experienced writers | Reinforces Fork's current direction. Don't force per-line form editing; keep `#` visible and optional insert controls. |
| Linked subrecipes | Reuse sauces, stocks, doughs | Later; establish version, scaling, privacy and missing-source semantics. A linked recipe is distinct from a fork and from pasted ingredients. |
| Shopping confirmation preview | Avoid buying pantry staples twice | Shopping phase. Checkable items, count, quantities, source recipe and scale; exclude section headers; do not silently merge incompatible units. |
| Add one ingredient while cooking | Record a missing/replenishment item immediately | Shopping refinement; a small overflow action rather than another permanent button. |
| Resume recently opened recipes | Recovers an interrupted task | Small library refinement. Prefer a modest recent section or “Continue cooking” when sessions exist. Distinguish viewed from cooked in Journal. |
| Search ingredients, notes and source | Finds forgotten recipes from partial memory | Search phase. Support accents and exact phrases as useful refinements, clearly distinguish collection/tag filters from search text. |
| Results/card quick actions | Organize or edit without extra navigation | Library refinement. Offer an ordinary accessible menu; don't require long press or right click. |
| Simple make-ahead indicators | Prevent surprises such as overnight proofing | Meal-plan phase. Prefer explicit recipe metadata/confirmed extraction; “25 minutes” should not conceal a 12-hour wait. |
| Meal-plan generation from your collection | Reduces repeated meal-choice effort | Later optional workflow. Start with user-selected filters and simple selection before AI. Preserve deliberate scheduling and leftovers. |
| Bulk import/export with open formats | Lower switching cost and preserve ownership | Import/export phase. Build round-trip checks for tags, source, photo, sections and quantities; report skipped/failed records individually. |
| Partial recipe capture | Lets people save an idea immediately | Later capture/drafts decision. Could be a private inbox/reference rather than pretending an incomplete entry is cook-ready. Do not reopen deferred drafts for MVP. |
| Shareable read-only recipe links | Lets friends view without installation | Fork already has a web advantage. Require deliberate audience selection and preserve attribution; no clipboard-triggered public publishing. |
| Household workflow | Makes meal choice and shopping collaborative | Later. Keep separate from friend feed and shared ownership; roles and revocation need explicit rules. |
| Recipe feeds | Lets users follow trusted creators | Later discovery candidate; complements Fork friends/creators, not a substitute. Preserve source, avoid presenting imported text as user-authored. |
| Temporary substitutions | Try an adaptation while preserving the original | Later. Journal the actual substitution; offer “save as my version” after review. Do not auto-rewrite a canonical recipe. |
| Hardware weighing/temperature integrations | Serious-cook precision | Long-term candidate. Strong demo potential, but require hardware reliability and clear compatibility; no MVP dependency. |
| Hands-free controls | Flour/wet hands need fewer touches | Later accessibility/convenience option. Evaluate voice and large tap targets before camera gestures requiring permissions. |
| Shortcuts/deep links | Opens a recipe or cooking session quickly | Later platform integration. Permission-checked identifiers and stable links first; private content must remain private. |

### Gaps

- No estimate of adoption or revenue impact is supported by this review. Feature presence is a strong investigation signal, not a measured usage rate.
- The exact compatibility of each documented feature with the installed Mac version remains partly unknown. App Store release history covers a product family; hands-free, widgets, alarms and device integrations can vary by OS.

## Which design choices should Fork settle?

### Takeaway

Borrow operational clarity, not every visible control or styling option. The user prefers Paprika's editor composition and Crouton's slider; they can coexist in Fork without importing either app's complete design language.

### Cited Findings

- **T:** Crouton exposes scaling in a compact control near the ingredient heading and visually emphasizes quantities. This keeps a frequent action close to the thing it changes.
- **T:** Crouton's large separate cook window makes one step prominent, but our single-step fixture left substantial unused space and little overview. The source text had been pasted into one step; this is not evidence that correctly split recipes behave identically.
- **D:** Multiple ingredient presentation preferences and adaptive cooking layouts are documented. These are available options, not proof Fork needs the same settings surface. [Official feature walkthrough](https://combustioninc.gorgias.help/en-US/crouton-organize-recipes-plan-meals-and-cook-smarter-2143474)

### Inferences

1. **Slider with exact input, not slider alone.** Keep keyboard controls and a properly named numeric value. Do not change scale on incidental page scrolling. Use practical step sizes for dragging while accepting valid exact fractional input. Don't silently clamp out-of-range values: state supported limits and preserve the user's edit for correction. Reject negative/zero values, zero denominators, NaN and malformed percentages. Show a preview, reset and undo. Slider bounds are a usability range, not necessarily the maximum supported exact entry.
2. **Editing mirrors reading.** Follow the user's Paprika reference: title and metadata at top left; photo right spanning those subrows; ingredient and method columns below. Small screens stack naturally. Empty photography should not reserve a huge blank area. Description and rare metadata can be disclosed progressively without hiding core ingredients/method.
3. **One accent does the primary work.** Preserve Fork's marigold actions and subdued palette. Quantity emphasis can use weight and alignment; different semantic colors are optional when they communicate something indispensable. Do not copy simultaneous green Cook, yellow shopping, purple share, blue ingredients and orange temperatures simply because it looks lively.
4. **No mandatory personalization maze.** Choose sensible typography, quantity placement and contrast defaults. Adjustable text size is functional; half a dozen quantity-color modes or custom icons are later taste options.
5. **Choose dashboard over free-floating timers by default.** A predictable persistent tray is easier to rediscover and less likely to cover text. On mobile, compact timer summary expands to a sheet; avoid draggable overlays as the only access route. A dashboard can show several recipes without turning the main cooking screen into a control panel. A full dedicated timer page is a separate taste decision: useful with many simultaneous dishes, but the compact persistent tray should still keep timers available when that page is closed.
6. **Keep persistence and collaboration distinct.** A personal cooking session resuming is different from synchronized shared cooking. First deliver reliable local/session recovery; later decide whether household members share timer ownership or merely see status.
7. **Camera gestures are optional.** They can be playful and useful, but reliable touch/keyboard navigation remains the default. Don't make novelty a prerequisite for a simple cook session.
8. **Clipboard convenience should be deliberate.** Prefer a clear Paste link action or a user-invoked suggestion; never import, upload or publish merely because content happens to be on the clipboard.
9. **No automatic disappearance without recovery.** A later grocery feature may group completed items separately, but accidental checks should be easy to undo. Delayed removal needs feedback rather than mysterious vanishing rows.

### Gaps

- Slider keyboard semantics, screen-reader announcements, contrast ratios, focus order, dynamic type and reduced-motion behavior were not audited. These are implementation acceptance criteria for Fork, not certified Crouton strengths or defects.
- Timer persistence across window close, quit/relaunch, sleep, network loss and multiple devices was not exercised. Browser background timing and alarm permissions require explicit testing in Fork; reproducing a native alarm UI does not reproduce native reliability.

## What remains to make the inventory exhaustive, and what does pricing imply?

### Takeaway

The feature inventory is broad enough to inform roadmap decisions now. Exhaustive behavioral coverage would require paid access, mobile devices, a household account, import/export fixtures and hardware—not more menu browsing alone.

### Cited Findings

- Crouton's free tier has a five-recipe cap; Plus is a one-time unlimited-library/household upgrade; Discover adds ongoing features including AI capture and RSS feeds. [Official plan comparison](https://combustioninc.gorgias.help/en-US/crouton-plans-features-and-benefits-2142748)
- In the preceding installed-app review, Plus displayed $19.99 reduced to $14.99, and Discover $12.99/year. These are observed storefront dollars with currency unverified, not US price assertions. No purchase was made.
- Local and private iCloud storage underpin Crouton's sync. Its support team cannot recover a server-side copy of a deleted personal recipe. Support also acknowledges Mac sync/crash cases under investigation. [Official sync and recovery guidance](https://combustioninc.gorgias.help/en-US/crouton-troubleshooting-icloud-sync-and-missing-recipes-7703524)

### Inferences

- Hybrid purchase/subscription is a credible market model. It does not establish Fork's unit economics: a hosted web service and social system has different costs from personal iCloud storage. Tie recurring payment to recurring benefit/cost; keep recipe access and export trustworthy after cancellation.
- A bounded follow-up test matrix would close the meaningful gaps:

| Area | Current evidence | Further work |
|---|---|---|
| Manual writing, grouping | Tested with synthetic fixture | Correctly split multiple steps; copy/paste, undo, keyboard reorder, large recipes |
| Scaling | Ingredient ratio and range tested; slider seen | Percent/fraction grammar, limits, locale, reset, cook-entry persistence, per-recipe isolation |
| Timers/cooking | Cook window and contextual actions tested; timer architecture documented | Start two named timers in different recipes, switch/reload/quit/sleep, notifications and overdue behavior |
| Website import | Menu and official support | Representative simple, multi-section, non-English, JS-heavy and unsupported URLs; verify retained source |
| OCR/AI/PDF | Menu and documentation | Paid entitlement if needed; clean print, handwriting, multiple pages, duplicate recipe detection, review/correction |
| Search/organization | Folder picker seen; current docs | Many recipes, multi-tag logic, accent/phrase matching, recipe counts, batch movement and undo |
| Meal planning | Prior empty view; documentation | Multiple recipes/day, leftovers, preparation lead times, move/copy dates, groceries from plan |
| Groceries | Preview tested, nothing added | Unit-safe merging, source traceability, checked-item recovery, Reminders permission/sync |
| Import/export | Documented formats | Export test recipe, round-trip it, compare all fields/photos/groups/tags; test partial failure |
| Household/shared cook | Documentation | Second authorized Apple ID/device, concurrent changes, leaving household, loss of access |
| Offline/sync | Documentation | Controlled connectivity test with only fixtures; recovery and conflicts |
| Accessibility/mobile | Desktop visual inspection only | VoiceOver, keyboard-only, text enlargement, touch targets, orientation, small devices |
| Devices/automation | Documentation | Actual supported scale/probe/watch and Shortcuts scenarios |

### Gaps

- No purchases, trials, sends, shared links, app-setting changes, hardware pairing or permission grants were performed. Shopping preview was canceled without additions. Existing personal content was preserved.
- A transient stale accessibility-menu target failed during inspection; a fresh screenshot/tree resolved navigation. This was an automation issue, not recorded as a product defect.
- Full current feature parity and every edge case cannot be claimed from this bounded pass. The next highest-value work is timer persistence and import/export round-trips, followed by mobile/keyboard accessibility—not buying hardware merely to complete a checklist.
