---
target: Fork overall UI/UX, palette, layout and Apple-level design quality
total_score: 25
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte"
target_fingerprint: "sha256:361f4894bbe1d633eaf03f58ec03576a31507c691691522d8396cfe1ccb7c227"
target_path: /Users/spfle/Dev/Fork/src/routes/recipes/[slug]/+page.svelte
timestamp: 2026-11-08T05-48-56Z
slug: src-routes-recipes-slug-page-svelte
---
# Fork UI/UX assessment — 8 November 2026

Fork has a good visual foundation and a recognisable cookbook identity. It is not yet at the requested Apple-level execution bar. The largest gap is task hierarchy and state transitions, rather than the basic palette.

## Scope and method

Independent visual/design assessment A completed before synthesis with detector/evidence assessment B. Live desktop inspection at 1280×720 covered home, recipe detail, Cook, browse, search, and login. Local DESIGN.md, PRODUCT.md and relevant components informed the review. The current roadmap's serious-home-cook audience supersedes older technical positioning in PRODUCT.md. Editor and responsive observations are source-only. Scores below are provisional heuristic judgments, not usability-test results or an Apple comparison metric.

## Design specificity and palette

Warm paper, espresso, clay, marigold, Bitter headings, and Source Sans reading text form a coherent editorial identity. This is worth refining. Photography should carry much of the visual richness, with color giving useful emphasis. Apple’s guidance supports consistent color meanings, deliberate hierarchy and adaptable layouts; it does not require Fork to adopt an Apple-like monochrome aesthetic. Sources: [Apple Color](https://developer.apple.com/design/human-interface-guidelines/color) and [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout).

| Element | Judgment | Direction |
|---|---|---|
| Warm paper surfaces | Good fit for food and long-form reading | Keep; compare a slightly quieter neutral in a comp before changing tokens globally. |
| Espresso text/navigation | Strong contrast and grounding | Keep; test the header's visual weight in mobile layouts. |
| Clay titles and links | Distinctive, warm, readable | Keep with consistent roles; make interactivity clear beyond color. |
| Marigold actions | Memorable accent with legible dark text | Reserve strongest emphasis for the primary task in each context. |
| Bitter and Source Sans | Strong title/reading partnership | Refine functional labels and optical hierarchy before changing families. |

Source-token calculations: ink on paper 16.14:1; clay on paper 5.36:1; ink on marigold 8.53:1. Secondary ink on the deeper hero band is 4.46:1, narrowly below the usual normal-text AA threshold. This affects a conditional unsupported wake-lock note in source and needs tightening; it was not observed rendered live. Border contrast needs contextual inspection before any accessibility conclusion. These are token calculations, not a comprehensive rendered accessibility audit.

## What works

1. The recipe's photo and title establish the dish clearly, and the desktop ingredients/method columns are a strong working layout.
2. Plain-language version notes explain useful cooking knowledge rather than merely showing a revision count.
3. Browse/search put photos and titles directly on the page with little card decoration. The result feels calmer and more authored than a generic dashboard.

## Priority issues

1. **P1 — Cook mode does not sufficiently transition into cooking.** The roughly 426px introductory hero remains; at a 720px viewport, ingredients begin around y510 in Cook. Bring the working recipe into view on entry, retain an obvious exit and preserve place. Explore a compact cooking header only if the simple transition is insufficient. Keep the desktop columns and intentional mobile ingredients/method switch. Suggested command: `$impeccable distill`.
2. **P1 — Live homepage explains version control before showing cooking value.** Technical vocabulary and a full diff precede food imagery. Lead with useful recipes and a plain-language benefit, then show a concise improvement example. **Local code already addresses much of this:** reconcile deployment before implementing it again. Suggested command: `$impeccable clarify`.
3. **P2 — Action emphasis favors Fork over Cook.** Fork gets solid marigold; Cook is the third outlined pill. Counts also precede practical cooking details. Give the primary cooking/saving task appropriate emphasis and let adaptation/history support it. This does not diminish the social pillar; social activity should follow naturally from cooking. Suggested command: `$impeccable layout`.
4. **P2 — A Cook-state history link points to a removed target.** The header retains the versions link while Cook removes the `#versions` section. Make it plain text in that state or explicitly leave Cook and open history. This was observed live and corroborated in source. Suggested command: `$impeccable harden`.
5. **P3 — Functional typography needs stronger optical hierarchy.** Small uppercase navigation and section labels look slight alongside large titles and photos. Trial a modest size/weight increase or normal case at normal viewing distance. Avoid indiscriminately enlarging all metadata. Suggested command: `$impeccable typeset`.

## Heuristic assessment

Scale: 0–4, higher is better. This bounded inspection does not establish overall usability or product quality.

| Heuristic | Score | Evidence/limit |
|---|---:|---|
| System status | 3 | Cook state visible; save/error handling inspected in source only. |
| Match to real world | 2 | Recipe language works; live landing requires technical translation. |
| User control | 3 | Done cooking visible; dirty-form guard source-only. |
| Consistency | 3 | Coherent system, but Cook history affordance breaks. |
| Error prevention | 3 | Source validation and unsaved-change handling; not exercised end to end. |
| Recognition over recall | 3 | Explicit labels and quantities; priorities compete. |
| Efficiency | 3 | Scaling and working columns; mobile untested. |
| Aesthetic restraint | 3 | Calm surfaces; introduction persists too far into Cook. |
| Error recovery | n/a | No failed save/auth/network flow exercised. |
| Help/documentation | 2 | Helpful local hints; live first encounter remains technical. |
| **Total** | **25/36** | **Provisional; nine scored heuristics.** |

## Persona concerns

- A first-time serious home cook meets technical mechanisms before practical value on the live landing.
- A returning cook at the counter enters Cook but initially sees mostly introduction. Actual phone ergonomics still need inspection.
- A recipe developer needs confidence in long-form editing and recovery. Source suggests thoughtful safeguards, but an authenticated walkthrough is required before calling authoring polished.

## Detector interpretation and smaller observations

The static detector returned 35 advisories in src/routes and src/lib/components: 34 font-size advisories and one color advisory. They are not 35 design defects. The type sizes are explicitly covered in DESIGN.md prose but absent from the narrower structured ramp, and one result duplicates a test assertion. The color is a black alpha-mask stop at recipe page line 255, not rendered palette drift. No substantive automated finding warrants a visual reset.

Keep the visible browse filters: the available six alternatives are useful, not evidence of overload. Preserve prior deliberate desktop method width and mobile section-switch choices until task testing shows a problem. The empty space in a three-recipe seed collection is not evidence that the production browse layout is broken.

## Design decisions for a subsequent pass

- Can a cook who never opens a diff still experience Fork as an excellent cookbook? The current foundation can support that.
- Compare the current warm editorial identity with a quieter variant using the same recipe, images and controls. Make the decision from complete screens rather than isolated swatches.
- Evaluate the food-first promise and cooking transition before extending the same visual language to the social journal.

Recommended sequence: reconcile the live/local homepage difference; refine recipe action hierarchy and Cook transition; compare two visual treatments; then test mobile and authenticated editing with realistic recipe content. No application edits are included in this assessment.

## Limits

No live mobile/tablet, authenticated editor, real assistive-technology use, interruption/error injection, or motion/performance measurements. Live deployment was not matched to a commit. The design sidecar is older than DESIGN.md, so automated documentation comparisons require care. A desktop/source review cannot certify the whole product's polish or accessibility.
