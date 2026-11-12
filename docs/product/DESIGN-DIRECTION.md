# Design direction

The identity Fork keeps, what "excellent" means for it, and the refinements still open. Rules live in [DESIGN.md](../../DESIGN.md); the approved MVP direction and its build record in [DESIGN-SUMMARY.md](../design/2026-11-10-decision-pack/DESIGN-SUMMARY.md); references in [INSPIRATION.md](../design/INSPIRATION.md). Edited in place; changelog at the bottom.

## Identity to preserve

A warm annotated cookbook with the precision of a great productivity app: cream paper, espresso structure, clay as the only text accent, marigold as the single fill, Bitter for titles and dish names, Source Sans 3 for reading, forms and explanations, JetBrains Mono only for identifiers (handles, version ids, diffs). No shadows at rest, no gradients or glass. Photography leads Cookbook and Discover; the working recipe leads Cook. Saved state and audience are always said in words. No wholesale rebrand or replacement font; recipe detail is the strongest expression of the direction. Font or palette replacement would be a separate decision (S1, S2, Z, DS).

Working contract (CD): food leads discovery; the working recipe leads Cook; controls stay predictable; emphasis has consistent meaning; quantities and source survive every view; saved state is truthful; recovery limits are clear; audience is explicit. A proposal to change the baseline names the observed problem, compares alternatives with equal content and shows the improvement.

Preserved decisions: desktop ingredient and method columns; the editable servings control near Ingredients without ×2 and ÷2 clutter; phone Ingredients and Method switching; progressively disclosed history; no equal-weight Recipe, History and Forks tabs (R).

## Quality ambition

Fork aims for the care of excellent independent apps and leading consumer products, with Apple and NYT Cooking as quality references, not templates or scores to match. Excellent is judged by observed behaviour, not screenshots: real-device cooking on phone and tablet; keyboard and screen-reader use; enlarged text; large and imperfect libraries; long titles, missing photos, grouped recipes and odd yields; imports; interruptions and return visits; account and audience boundaries; complete error and recovery states. An elegant screen with fragile behaviour does not meet it. Finishing this list does not establish product-market fit, and the pilot does not wait for polish. Prioritize trust, capture, reading and cooking, and retrieval before decoration; the strongest cross-page improvement is continuity, so a source, group, scale or private note keeps its meaning from entry through cooking and recall (S1).

**The design quality pass** (ROADMAP P1, build order 2, after varied seed data and before Journal recall; Spencer, 12 Nov 2026) works through this file on the varied seed, phone and desktop: this section is its bar, and every row below whose status is backlog, partly done, reproduce or test is rechecked in that pass and given a current status. Each row's "Check" is the behaviour that proves it. Read first: the [design and solo-business review](../research/2026-11-10-design-and-solo-business.md) (S1), the [Zed reference](../research/2026-11-09-zed-design-reference/README.md) (Z), the [cookbook design research](../research/2026-11-08-cookbook-design-research/README.md) with its notes on [design principles](../research/2026-11-08-cookbook-design-research/design_principles.md), [product references](../research/2026-11-08-cookbook-design-research/product_references.md) and [cooking workflows](../research/2026-11-08-cookbook-design-research/cooking_workflows.md) (CD), the [UX review](../research/2026-11-12-ux-review.md) (UX) and [INSPIRATION.md](../design/INSPIRATION.md). The still-open list at the end of the [29 Oct site sweeps](../research/2026-10-29-site-sweeps.md) (SW) is a checklist for the surfaces that survive. Directions explored and rejected in October (the parchment-and-herb palette, the tomato, verdigris, bay-leaf, enamel and oxblood accents, the espresso hero, the outlined Fork and Star pair) are not part of this direction.

## System-level refinements

Status against the app published on 11 Nov 2026 and the git log. Items from the earlier live review (S1) are marked "reproduce" where the redesign may already have fixed them: reproduce before fixing.

| System | Refinement | Status |
| --- | --- | --- |
| Accent roles | Each accent has one job: marigold the primary action, clay text and reader-changed values, semantic colours for feedback and diffs; colour is never the only signal (S1, Z 3). Marigold never means selection, warning and success at once; a status also carries words or an icon (CD) | done (closed control set, hover rules); keep checking per screen |
| Palette | Explore a slightly brassier, less saturated yellow by full-screen comparison; no hex chosen; contrast verified on real pairs in default, hover, focus and disabled states (S1, S2) | backlog |
| Hovers | One step of colour; text buttons, arrow links, handles and the back link also underline; an action inside a sentence is underlined at rest; one 1px underline, 3px below the words; boxes fill with the band (the Hover Rule, decided 11 Nov) | done |
| Typography roles | Type carries hierarchy before containers; one title, readable body, quieter supporting line; remove redundant eyebrows and labels; mono only for identifiers; review long comparison prose for needless mono (S1, Z 1). Check at rendered size: `1` against `l`, fractions, ranges, degree signs, long ingredient names and wrapped steps; a comfortable measure; enlarged text; no blanket removal of the approved mono (S1, CD) | partly done (editor hints sans, one `.vid` chip); diff page head still mono throughout: backlog |
| Grid and alignment | Shared left edges and baselines; group times, Serves and Makes, source and audience coherently; room for long titles (Z 2) | backlog (with the editor composition, E01) |
| Layout and spacing | Standard page headers, widths, section spacing, action alignment; smaller heroes and empty upload areas (S1). Check: a clear first task on each page, comparable pages that feel related, essential recipe content never pushed down by decoration (S1) | partly done (one page width, shared `.page-head`); heroes: reproduce |
| Grouping | Whitespace and fine rules first; a filled panel only for distinct content such as the private note (Z 4) | backlog |
| Density | Generous reading, compact controls; never shrink everything to look tidy (Z 5) | backlog |
| Controls | Reuse buttons, menus, fields, cards, pills; the same action looks and behaves the same everywhere; secondary actions quiet but labelled (S1, Z 6) | done (shared components, closed control set, a test holds every button to it) |
| Continuity | Title, groups and method keep their relationship from editor to recipe to Cook (Z 7) | backlog |
| Metadata | Quiet but legible; dish names and photos dominant; explicit audience and version words (Z 8). The food, the time it needs and the cook's own experience lead author handles and version numbers (UX) | partly done (header calm rules); UX part proposed (ROADMAP §6, First-scan emphasis) |
| Phones | Change structure, do not miniaturize; stack dense controls; long names wrap; no horizontal scroll (Z 9) | phone fixes landed in git 11 Nov (ROADMAP §2); keep checking per screen |
| Feedback and states | Consistent pending, success, error, empty, focus and recovery states; context kept across navigation; motion only to explain a change (S1, Z 10). Check: no lost writing, reversible progress, keyboard and touch use without surprise (S1) | partly done (shared pending and toggle helpers, session-ended wording); empty-state wording differs ("No recipes found" versus "No recipes match"): backlog |
| Photography | Real food photos add warmth; standard crops; intentional image-free layouts (S1). Check: a richly coloured and a pale dish, an imperfect phone photo and no photo; ordinary user photos and long titles stay attractive (S1, CD). Proposed (SW): responsive images (`srcset`) on cards, none today | no-photo layouts done; crops: reproduce |
| Personalization | Text size, contrast and eventual dark mode before themes, icons or accent choices (DD) | later |

## Page-level refinements

| Page | Refinement | Status |
| --- | --- | --- |
| Cookbook | Clear owned, saved and filtered states; consistent cards; an evident next action; a specific first-use Saved message instead of "No recipes match these filters"; test zero, few, many and photo-free; an empty library is not zero results (S1). Keep the dense phone grid and list option; check long titles, missing photos and similar dishes at realistic volume; device-local drafts said near Continue (UX) | All, Mine, Saved and empty-library copy done; Saved first use: reproduce |
| Discover | Recipes in focus sooner; deliberate lead versus ordinary card hierarchy; no implied populated community or curated authority (S1). Feature one original and a genuinely different adaptation, saying what changed in cooking terms, so a reader sees why to choose a version (UX) | redesigned with lead card and Recent changes; oversized hero: reproduce |
| Search | Same card, filter and empty-state language; scope and active filters legible; query and return position kept; tag suggestions by a small deterministic scorer first, taxonomy only if a flat list impedes retrieval (S1, R) | shared filters done; kept queries and scroll (L05) built 11 Nov; scopes: backlog (P2) |
| Recipe detail | Keep the editorial composition; clear Cook, Save, Fork priority; prior cooking knowledge when that work lands; test whether Cook or a jump affordance gets returning cooks to content fast (the old hero took about 550px at 1280×720) (S1, R). Yield, elapsed time and Cook in the first scan; version information weighted up when the cook has a decision to make, such as whether to use an update (UX). Check: long titles, grouped recipes, sources, yields and missing images stay coherent (S1) | action row done; prior knowledge P1 and P2; hero height: reproduce |
| Cooking | The approved focused treatment, legibility, ingredient access, scale, progress; quantities strongly ranked; ingredient access never loses the current step; ticks not by colour alone; predictable undo and clear (S1, R). Check: real phones and tablets, enlarged text, interruptions and return visits (S1); viewing a step never marks earlier ones done, a fresh cook is explicit, and place survives switching recipes and backgrounding (CD). Open since 29 Oct, Spencer's calls (SW, recommended: accept): Clear ticks has no undo; ticks are kept 12 hours with nothing saying so | Cook shipped; cook-mode distinction closed 11 Nov (ROADMAP §6) |
| History and comparison | Explain the two versions and direction of change in plain words; strong column labels and added and removed semantics (S1). Check: narrow layouts keep both the context and readable recipe text (S1). Proposed (SW): a key for `~`, strike and underline; decide whether a change of case alone ("Cool" to "cool") is marked | backlog |
| New and edit | Recipe-shaped composition with a bounded photo; writing prominent; optional fields disclosed; durable drafts in P1; keyboard reordering alternatives; save errors focus useful feedback without losing content (S1, R) | the earlier review lost an unsaved new-recipe draft on reload (P1 drafts now built, ROADMAP P1; reproduce); required marks done; composition backlog |
| Journal | Logging stays light for linked, external and improvised dishes; private next-time note distinct from the shared caption (S1). The optional private observation first in the completion form, photo and sharing below, saving with no writing; the observation back beside Cook when it can inform the next meal (UX) | done; populated layouts need review; UX part proposed (ROADMAP P2, Journal recall) |
| Friends | Useful first-use invitation and discovery; real cooking central; quieter metadata (S1). Check: personal usefulness survives an empty network (S1) | empty state leads with requests and Invite: done; sparse feed and inactive friends: test |
| Profile and account | Identity, cookbook and activity navigation and settings without empty-metric dashboards; long handles, absent photos, self versus other (S1). Proposed (SW, Spencer's call since 29 Oct): a show-password toggle on Log in and Reset password | owner's private-count line removed; redesign P2; settings built (ROADMAP P1) |

## Interaction choices to carry into builds

From the deep dive; recommendations to tune in the working app, not another mockup round (DD).

| Choice | Direction |
| --- | --- |
| Editor proportions | A bounded photo column spanning the metadata rows; ingredients and method below; stack in reading order on phones |
| Empty photo | A compact add-photo affordance, expanding once an image exists |
| Optional metadata | Collapse rare fields, show when filled, keep source and audience discoverable; no rating or difficulty just to fill a grid |
| Scaler slider | A practical drag range with keyboard support; typed values beyond it where supported; test increments |
| Fraction and unit display | Stable units while adjusting; faithful fractions, decimal fallback |
| Timer navigation | A dedicated overview route plus a compact persistent indicator; optional drawer on wide screens; no fifth main destination |
| Timer completion and ranges | Completed or overdue stays until acknowledged; an existing inline timer reopens; for `20-25 minutes`, show the chosen endpoint and offer an earliest-check alert |
| Current step | Keep the MVP without a marker; evaluate an optional marker or focused view later |
| Library density | Photo grid by default, a compact list option later; not three equal modes |
| Advanced search | Visible scopes and useful filters; Boolean rules in later smart collections |
| Shopping checks | Stable rows, immediate feedback and undo |
| Clipboard | User-invoked paste; never automatic clipboard inspection |

## From the Zed reference

Settle during implementation (Z): keep Bitter, improving scale, weight and spacing; upright recipe titles (italic at most for an occasional editorial introduction); keep the three-part label, heading and body stack only where each part adds information; a coherent editor header grid with quiet rules and obvious fields; cooking essentials and audience visible, optional detail disclosed; keep the approved accent tokens and judge their prominence in the finished layout. Do not copy: a dark blue technology palette, monospaced body copy or tiny metadata, grid decoration, textures, glows or bevels, marketing-hero whitespace in working screens, or a mega-menu or hamburger as primary navigation. Before calling the refinement done, check long titles, missing photos, keyboard focus, contrast, mobile reflow and cooking readability. The reference is a bounded visual study of Zed's website, not an accessibility audit; font identities and contrast were not verified.

## Changelog

- 2026-11-11: created from the 10 Nov design review, the finished-product synthesis, the Zed reference and the deep dive's design choices, with status checked against the build record and git log.
- 2026-11-11: removed the numeric quality score; quality stays described as observed behaviour (RM §16.25).
- 2026-11-12: the 12 Nov UX review's page refinements added to Metadata, Discover, Cookbook, Recipe detail and Journal, marked UX and proposed.
- 2026-11-12: statuses rechecked against git: phone fixes landed, cook-mode distinction closed, L05 kept position and settings built, drafts built.
- 2026-11-12: the 8 Nov cookbook design research's working contract added under Identity (CD).
- 2026-11-12: the design quality pass is scheduled (ROADMAP P1, build order 2) with this file as its bar and checklist.
- 2026-11-12: research sweep: the S1 acceptance intents as each row's Check; CD's note-level checks (marigold's one meaning, rendered legibility, pale and imperfect photos, step versus completion); the 29 Oct site sweeps' open items (srcset, comparison key, show-password, tick calls) as proposed; read-first list and the rejected October directions under the design quality pass.
