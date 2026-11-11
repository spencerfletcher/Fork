# Design direction

The identity Fork keeps, what "excellent" means for it, and the refinements still open. Rules live in [DESIGN.md](../../DESIGN.md); the approved MVP direction and its build record in [DESIGN-SUMMARY.md](../design/2026-11-10-decision-pack/DESIGN-SUMMARY.md); references in [INSPIRATION.md](../design/INSPIRATION.md). Edited in place; changelog at the bottom.

## Identity to preserve

A warm annotated cookbook with the precision of a great productivity app: cream paper, espresso structure, clay as the only text accent, marigold as the single fill, Bitter for titles and dish names, Source Sans 3 for reading, forms and explanations, JetBrains Mono only for identifiers (handles, version ids, diffs). No shadows at rest, no gradients or glass. Photography leads Cookbook and Discover; the working recipe leads Cook. Saved state and audience are always said in words. No wholesale rebrand or replacement font; recipe detail is the strongest expression of the direction. Font or palette replacement would be a separate decision (S1, S2, Z, DS).

Preserved decisions: desktop ingredient and method columns; the editable servings control near Ingredients without ×2 and ÷2 clutter; phone Ingredients and Method switching; progressively disclosed history; no equal-weight Recipe, History and Forks tabs (R).

## Quality ambition

Fork aims for the care of excellent independent apps and leading consumer products, with Apple and NYT Cooking as quality references, not templates or scores to match. Excellent is judged by observed behaviour, not screenshots: real-device cooking on phone and tablet; keyboard and screen-reader use; enlarged text; large and imperfect libraries; long titles, missing photos, grouped recipes and odd yields; imports; interruptions and return visits; account and audience boundaries; complete error and recovery states. An elegant screen with fragile behaviour does not meet it. Finishing this list does not establish product-market fit, and the pilot does not wait for polish. Prioritize trust, capture, reading and cooking, and retrieval before decoration; the strongest cross-page improvement is continuity, so a source, group, scale or private note keeps its meaning from entry through cooking and recall (S1).

## System-level refinements

Status against the app published on 11 Nov 2026 and the git log. Items from the earlier live review (S1) are marked "reproduce" where the redesign may already have fixed them: reproduce before fixing.

| System | Refinement | Status |
| --- | --- | --- |
| Accent roles | Each accent has one job: marigold the primary action, clay text and reader-changed values, semantic colours for feedback and diffs; colour is never the only signal (S1, Z 3) | done (closed control set, hover rules); keep checking per screen |
| Palette | Explore a slightly brassier, less saturated yellow by full-screen comparison; no hex chosen; contrast verified on real pairs in default, hover, focus and disabled states (S1, S2) | backlog |
| Hovers | One step of colour; text buttons, arrow links, handles and the back link also underline; an action inside a sentence is underlined at rest; one 1px underline, 3px below the words; boxes fill with the band (the Hover Rule, decided 11 Nov) | done |
| Typography roles | Type carries hierarchy before containers; one title, readable body, quieter supporting line; remove redundant eyebrows and labels; mono only for identifiers; review long comparison prose for needless mono (S1, Z 1) | partly done (editor hints sans, one `.vid` chip); diff page head still mono throughout: backlog |
| Grid and alignment | Shared left edges and baselines; group times, Serves and Makes, source and audience coherently; room for long titles (Z 2) | backlog (with the editor composition, E01) |
| Layout and spacing | Standard page headers, widths, section spacing, action alignment; smaller heroes and empty upload areas (S1) | partly done (one page width, shared `.page-head`); heroes: reproduce |
| Grouping | Whitespace and fine rules first; a filled panel only for distinct content such as the private note (Z 4) | backlog |
| Density | Generous reading, compact controls; never shrink everything to look tidy (Z 5) | backlog |
| Controls | Reuse buttons, menus, fields, cards, pills; the same action looks and behaves the same everywhere; secondary actions quiet but labelled (S1, Z 6) | done (shared components, closed control set, a test holds every button to it) |
| Continuity | Title, groups and method keep their relationship from editor to recipe to Cook (Z 7) | backlog |
| Metadata | Quiet but legible; dish names and photos dominant; explicit audience and version words (Z 8) | partly done (header calm rules) |
| Phones | Change structure, do not miniaturize; stack dense controls; long names wrap; no horizontal scroll (Z 9) | in flight (phone fixes) |
| Feedback and states | Consistent pending, success, error, empty, focus and recovery states; context kept across navigation; motion only to explain a change (S1, Z 10) | partly done (shared pending and toggle helpers, session-ended wording); empty-state wording differs ("No recipes found" versus "No recipes match"): backlog |
| Photography | Real food photos add warmth; standard crops; intentional image-free layouts (S1) | no-photo layouts done; crops: reproduce |
| Personalization | Text size, contrast and eventual dark mode before themes, icons or accent choices (DD) | later |

## Page-level refinements

| Page | Refinement | Status |
| --- | --- | --- |
| Cookbook | Clear owned, saved and filtered states; consistent cards; an evident next action; a specific first-use Saved message instead of "No recipes match these filters"; test zero, few, many and photo-free; an empty library is not zero results (S1) | All, Mine, Saved and empty-library copy done; Saved first use: reproduce |
| Discover | Recipes in focus sooner; deliberate lead versus ordinary card hierarchy; no implied populated community or curated authority (S1) | redesigned with lead card and Recent changes; oversized hero: reproduce |
| Search | Same card, filter and empty-state language; scope and active filters legible; query and return position kept; tag suggestions by a small deterministic scorer first, taxonomy only if a flat list impedes retrieval (S1, R) | shared filters done; kept position (L05) and scopes: backlog (P1, P2) |
| Recipe detail | Keep the editorial composition; clear Cook, Save, Fork priority; prior cooking knowledge when that work lands; test whether Cook or a jump affordance gets returning cooks to content fast (the old hero took about 550px at 1280×720) (S1, R) | action row done; prior knowledge P1 and P2; hero height: reproduce |
| Cooking | The approved focused treatment, legibility, ingredient access, scale, progress; quantities strongly ranked; ingredient access never loses the current step; ticks not by colour alone; predictable undo and clear (S1, R) | Cook shipped; cook-mode distinction in the design backlog |
| History and comparison | Explain the two versions and direction of change in plain words; strong column labels and added and removed semantics (S1) | backlog |
| New and edit | Recipe-shaped composition with a bounded photo; writing prominent; optional fields disclosed; durable drafts in P1; keyboard reordering alternatives; save errors focus useful feedback without losing content (S1, R) | the earlier review lost an unsaved new-recipe draft on reload (expected until P1 drafts; reproduce); required marks done; composition backlog |
| Journal | Logging stays light for linked, external and improvised dishes; private next-time note distinct from the shared caption (S1) | done; populated layouts need review |
| Friends | Useful first-use invitation and discovery; real cooking central; quieter metadata (S1) | empty state leads with requests and Invite: done; sparse feed and inactive friends: test |
| Profile and account | Identity, cookbook and activity navigation and settings without empty-metric dashboards; long handles, absent photos, self versus other (S1) | owner's private-count line removed; redesign P2, settings P1 |

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
