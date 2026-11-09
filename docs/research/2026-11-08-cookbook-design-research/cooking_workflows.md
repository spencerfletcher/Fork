# Cooking workflows: an edited cookbook with dependable working tools

Research date: 8 November 2026. Scope: cooking, recipe correction, and the connection to a cooking journal. No live Fork audit, authenticated editor test, or mobile usability test was performed by this researcher. The coordinator's desktop observations are context, not independently verified findings. Recommendations below are design hypotheses, not claims that Fork lacks these capabilities.

Evidence labels: **Empirical—bounded** means original research with an explicit sample and limited generalizability. **Product—documented** means the vendor documents the behavior; this establishes a reference pattern, not effectiveness. **Inference** means a proposed Fork decision requiring validation. Four reference products were selected: Mela, Paprika, Crouton, and Cookpad. Eleven primary documents support these notes.

## 1. What should the cooking surface make easy under interruption?

### Takeaway

**Inference:** Let cooks see what they need now, look ahead freely, and recover their place. A cooking view should change the information hierarchy materially: method, relevant quantities, progress, and timers take precedence over the finished-dish hero and social actions.

### Cited Findings

- **Empirical—bounded:** Buykx's 2013 York thesis contains two cooking studies, each with 24 university students. RECIPE1 participants were 18–24; RECIPE2 participants were 18–25. Conditions and recipes were counterbalanced using Latin squares. RECIPE1 compared conventional, segmented, and ingredient-integrated instructions across 72 sessions. Integrated instructions scored better on perceived ease than control; recipe presentation did not significantly change total reading time. RECIPE2 compared control, segmented-with-pictures, and structural-overview presentations. Overall problem counts did not differ significantly by presentation; the thesis reports that pictures were liked without reducing errors/problems. These are grounds for testing contextual quantities and overview navigation, not claiming that either makes serious cooks faster or safer. Relevant printed pages: 121–122, 142–147, 200–201, 245–246. — [Buykx thesis, full primary PDF](https://etheses.whiterose.ac.uk/id/eprint/5158/1/Lucy%20Buykx%20accepted%20thesis.pdf)
- **Empirical—bounded:** DIS 2024 contextual inquiry observed eight participants cooking coq au vin in their own kitchens, using observation and think-aloud, analyzed with affinity diagramming. Participants looked ahead to coordinate parallel work and check their progress. The authors acknowledge one recipe, one participant at a time, and possible observer effects. This is ecologically useful qualitative evidence, not a population estimate or comparison of interface layouts. See §4.4.4 and §5.3. — [Barquero et al., Understanding User Needs for Task Guidance Systems Through the Lens of Cooking](https://www.ruizlab.org/wp-content/uploads/2024/10/3643834.3661611.pdf)
- **Empirical—bounded:** A study interviewing 20 legally/totally blind experienced cooks and four adaptive-cooking instructors reports difficulty touching devices with dirty hands, losing place, and hearing repeated irrelevant information. Participants wanted varied interaction methods; voice systems could also forget recipe state or make navigation difficult. This is strong evidence of these participants' accessibility needs, not a hands-free versus touch trial or a representative survey of all cooks. — [A Recipe for Success? Exploring Strategies for Improving Non-Visual Access to Cooking Instructions, §§3, 4.3, 6.3.3](https://arxiv.org/html/2407.19065v1)
- **Empirical—bounded:** The Cook's Collage prototype study involved 12 undergraduates, five without the display, a deliberately complicated cookie task, and scripted interruptions. Measurement mistakes occurred despite participants' confidence. Performance findings were inconclusive, with no significant resumption-time difference. This supports investigating memory failures, not a claim that automatic progress tracking works. — [Tran and Mynatt, What Was I Cooking? Towards Déjà Vu Displays of Everyday Memory](https://sites.cc.gatech.edu/fce/ahri/publications/dj.pdf)
- **Product—documented:** Mela's fullscreen cooking view concentrates on steps and ingredients, increases type size, offers keyboard step navigation, and supports checking ingredients. Its help also documents grouped ingredients/instructions and an import preview with text-block correction. — [Mela Help](https://mela.recipes/help/)
- **Product—documented:** Crouton's developer listing describes tapping an ingredient mentioned in a step to reveal its quantity, hands-free step navigation, and timers initiated from detected times with a persistent timer display. This is a particularly relevant alternative to making users switch entire ingredient/method tabs. The claim that this saves navigation is the vendor's rationale, not independently measured here. — [Crouton developer App Store listing](https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987)
- **Product—documented:** Paprika 4 highlights the current step, allows direct jumping, resumes from a previously highlighted step, and retains highlighted/crossed-off state after leaving Cook mode. Voice interaction is optional and platform/language constrained. — [Paprika 4 Cook Mode](https://www.paprikaapp.com/help/v4/ios/cookmode/)
- **Product—documented:** Paprika provides adjustable recipe type size and a Keep Screen On setting scoped to recipe viewing. — [Paprika 4 Settings](https://www.paprikaapp.com/help/v4/ios/settings/)

### Inferences

- **Priority: working hierarchy.** In Cook, replace the large hero with a compact recipe identity and expose the current method immediately. Preserve photographic richness in discovery/reading. Use the accent for the current step and a small number of actions; keep the reading surface quiet. This interprets the user's visual direction, not an empirical color recommendation.
- **Context without a tunnel.** Keep the desktop ingredients-and-method relationship. On mobile, test contextual quantities or an ingredient drawer that preserves method position against full-view tabs. Do not impose a next-only wizard: current, previous, future, and completed work need to remain understandable. Trade-off: showing every detail increases length; hiding everything increases navigation and memory demands.
- **Readability at counter distance.** Offer a cooking type size that can be increased without hiding quantities, preparation qualifiers, or units. Use weight/spacing to distinguish quantity from ingredient, while keeping them a single readable phrase. Avoid dense decorative cards around every step.
- **State is a promise.** Make current step and completion distinct. Viewing step 6 must not mark steps 1–5 done. Preserve progress when inspecting another recipe or switching apps. Provide an explicit way to start a fresh cook; do not silently reset or carry stale checks into a new session.
- **Hands-free is an enhancement.** Prioritize low-interaction reading, obvious touch targets, and keyboard/screen-reader operation before voice or gestures. Do not require voice to complete cooking. Keep permissions, listening state, and undo understandable if added.
- **Acceptance checks:** In a two-component recipe, a participant can look ahead, return to the active step, find its quantity, and check the other component without losing place. Repeat after a 60-second interruption and app/background switch. Record wrong quantities, lost-place events, touches to retrieve information, and recovery time. Test large text and screen-reader navigation. Test on an actual phone propped at a counter, not only desktop emulation.

### Gaps

- No study found establishes a universal winner between mobile ingredient tabs, inline quantities, and a drawer for serious home cooks. Test the competing designs with Fork's audience.
- No native-app documentation establishes that Fork's web timers or keep-awake behavior will work when locked/backgrounded. Verify the supported browsers/devices before promising dependable alarms. Inspect existing behavior first.
- No evidence here establishes a precise ideal font size, distance, tap target, or hero height. Choose accessible initial values and test; do not label invented thresholds “research-backed.”

## 2. How should precision survive scaling, subrecipes, and import correction?

### Takeaway

**Inference:** Keep one authoritative recipe and make its quantities visible wherever needed. Preparation state, serving scale, source corrections, and permanent recipe revisions should be understandable as different actions.

### Cited Findings

- **Product—documented:** Paprika documents visible scaling, fractional scale inputs, scaled grocery quantities, multiple named timers with pause/resume, and pinning recipes while preserving ingredient/step state. Its main iPad layout separates ingredients and directions spatially; iPhone uses a persistent switch. These are candidate patterns with different space/navigation trade-offs. Its documented native timer alarms depend on notification permission, mute, and volume. — [Paprika 4 Viewing Recipes](https://www.paprikaapp.com/help/v4/ios/viewingrecipes/)
- **Product—documented:** Paprika's scan flow shows recognized text in editable recipe fields for comparison against the original before saving. Existing-photo scans distinguish adding text from replacing it and provide discard. It explicitly asks users to check fractions, quantities, and multicolumn layouts when a simpler recognition fallback is used. — [Paprika 4 Scanning Recipes](https://www.paprikaapp.com/help/v4/ios/scanningrecipes/)
- **Product—documented:** Mela asks users to verify the inferred type of scanned text blocks. Ingredient parsing and section headings are supported; its documentation also identifies import limitations, including unsupported links to other recipes in Paprika files. — [Mela Help](https://mela.recipes/help/)

### Inferences

- **Canonical quantity, contextual reference.** A step should reference the structured ingredient quantity, optionally annotated with the portion used there. Do not create separately editable copies of the same quantity in the ingredient list and step. Trade-off: linked references improve consistency but require deliberate treatment of divided ingredients and free prose. Do not pretend arbitrary imported text is linked when it is not.
- **Make scaling inspectable.** Show the active yield/scale beside the ingredient heading and keep it visible in cooking. Distinguish changing servings for this session from saving a revised recipe. A sauce made separately may have a different useful batch size; do not silently imply every component has been scaled identically.
- **Subrecipe clarity before elaborate orchestration.** Start with named component sections and a reliable return to the parent recipe. If existing linked subrecipes are supported, preserve their identity and explain which yield is being used. Avoid inventing a meal-scheduling engine for this design pass.
- **Arithmetic is not recipe authorship.** Do not silently rewrite all numbers in prose when scaling: timings, oven temperatures, pan sizes, and ingredient portions are different concepts. Show unresolved textual quantities as needing review rather than pretending they were safely converted.
- **Timers belong to work.** Label concurrent timers with recipe/component and step. Keep elapsed timers understandable until acknowledged rather than letting the UI erase the only indication of what completed. A displayed countdown must recover correctly after returning to the app; test background behavior separately from foreground display.
- **Correction is core UX.** Keep source material reachable while correcting imported ingredients and method, preserve provenance, and distinguish uncertain parsing from confirmed fields. Save a draft/revision only through clear existing semantics. Do not silently publish an import or overwrite a prior version.
- **Acceptance checks:** Import a recipe with `1½`, `½`, a range, “to taste,” a divided ingredient, two sections, and an ingredient mentioned in several steps. Correct it once; all dependent displays must agree. Scale down and up, then return to original. Verify source text, ingredient references, subrecipe yields, and revision comparison remain intelligible. Leave and return during correction and during two simultaneous timers.

### Gaps

- This sweep found product precedent for scaling and multiple active recipes, not controlled evidence of the best subrecipe editor or automatic scaling policy.
- Fork's authenticated editing/import flows and current stored reference semantics were not tested. These are acceptance questions and design constraints, not reports of bugs or absent functionality.
- Unit conversion, ambiguous ingredient parsing, ingredient portions, and mathematical versus practical cooking scale require separate domain validation if behavior changes. No such algorithm is specified here.

## 3. How should cooking connect to revision history and a social journal?

### Takeaway

**Inference:** A finished cook is the useful bridge between a cookbook and a social product: what was made, which recipe version was used, how it turned out, and what to try next. Preserve the difference between documenting an attempt and changing the recipe.

### Cited Findings

- **Product—documented:** Cookpad defines a Cooksnap as a photograph reporting that someone tried a recipe. Cooksnaps appear both in the contributor's kitchen and on the recipe, where other people can see them. This is a clear documented model for recipe-attached social evidence; it does not prove increased retention or recipe reliability. — [Cookpad Community Guidelines](https://cookpad.com/us/community.html)

### Inferences

- **Finish into a useful record.** Offer a short post-cook entry: photo, result, changes made, next-time note. Avoid requiring a public post to finish cooking. Keep social exploration valuable but outside the immediate cooking path.
- **Name the user's intent.** “Cooked this,” “Note for next time,” and “Save a new version” are different outcomes. A temporary substitution can remain in the cooking record; a deliberate enduring improvement can become a revision. Do not make every attempt a fork.
- **History should answer cooking questions.** Expose what changed in ingredients/method and why it was changed, alongside the version actually cooked. User-facing language can describe revisions and variations without requiring knowledge of Git.
- **Audience should be explicit.** Separate a personal cooking note from sharing the result. Let the user understand the audience before publishing; do not treat adding a photo as implicit consent to publish.
- **Acceptance checks:** A cook can retrieve the exact version used for an earlier attempt, compare its changed quantity with the current recipe, and keep a private next-time note without publishing it. A shared result retains its recipe/version relationship after later recipe edits. Test comprehension of “attempt,” “note,” and “revision” with the intended audience.

### Gaps

- No validated study here establishes the ideal version-history model for home cooks or the retention value of a cooking journal. This is a strong fit hypothesis from Fork's stated positioning, not a competitive-feature mandate.
- No visual ranking of the four products was attempted. Their documented interaction patterns are useful references; aesthetics and live behavior still need direct review where the coordinator judges it worthwhile.
- Skipped broader meal planning, shopping, nutrition, AI suggestions, and Samsung Food to keep the sweep focused. NYT's canonical notes-help page could not be fetched directly, so its search-indexed proxy content was not used as primary evidence.
