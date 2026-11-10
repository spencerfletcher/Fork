# Zed design reference for Fork

Reviewed 9 November 2026. Design reference only: no feature discovery, roadmap rephasing, implementation, or replacement of Fork's approved visual direction.

## Recommendation

Borrow Zed's typographic contrast, careful alignment, restrained emphasis, and separation of content from supporting controls. Keep Fork's warm paper, photography, Bitter titles, Source Sans reading text, and clay/marigold roles. The strongest opportunity is refinement of hierarchy and layout, not a new palette or a font replacement.

This review uses the live website, not the installed Zed editor. Zed's website is not uniformly minimal: the fuller product page has decorative technical grids, texture, demonstrations, and substantial marketing content. Its restraint is most useful at the level of individual sections and text hierarchy.

## Evidence and coverage

Screenshots and accessibility/DOM state were inspected in the in-app browser. Selected computed styles were read from the rendered DOM. Sources:

| Source | States visually inspected |
|---|---|
| [Zed homepage](https://zed.dev/) | Initial Zed Industries portfolio at 1280×720; Zed's **Learn More** reveals the full product page at the same URL; product hero and Resources menu at 1280×720; product hero and open mobile navigation at 390×844. |
| [Blog index](https://zed.dev/blog) | Desktop title, three featured cards, and beginning of the category/list section at 1280×720. |
| [How We Rebuilt Settings in Zed](https://zed.dev/blog/settings-ui) | Desktop article header, introductory paragraphs, section heading, and contents rail at 1280×720; same reading area at 390×844. |

The initial portfolio and full product page differ, so a fresh visitor may not immediately see the same reference. Mobile viewport overrides were reset after inspection. No sign-up, purchase, download, form submission, or account action occurred. A Resources-menu Blog click produced a highlighted item without navigation; direct navigation to its observed URL worked. This is an observation of this session, not a diagnosed site bug.

### Verified measurements, not guessed font identities

The following are computed CSS values in the inspected state. `plexSerif`, `writer`, and `zedMono` are **the site's family aliases**; the underlying font-file identity and licensing were not established. Do not specify a new Fork font from those names alone.

| Element | Verified rendered CSS |
|---|---|
| Product hero heading | `plexSerif`, 48px / 57.6px, weight 320, italic at desktop. |
| Product introduction | `writer`, 16px / 24px, weight 400; 512px-wide container at desktop. |
| Product navigation | `writer`, 14px / 20px, weight 400. |
| Article title | `plexSerif`, 32px / 38.4px, weight 320 at desktop. |
| Article section heading | `plexSerif`, 25.6px / 32px, weight 360. |
| Article paragraphs | `writer`, 16px / 26px; 704px-wide desktop column, 326px phone column. Body size/leading remain unchanged on phone. |
| Article contents eyebrow | `zedMono`, 12px / 16px, weight 400. |
| Product page background | `rgb(17, 18, 22)`, equivalent to `#111216`. |
| Product hero heading color | `lab(77.5052 -6.4629 -36.42)`, visually pale blue. |
| Product body color | `oklch(0.747396 0.0150116 262.882)`, visually cool muted gray. |

Visual observations: saturated blue primary action, subdued secondary action, fine rules, restrained outline icons, and a strong serif/body distinction. The portfolio adds a separate red-orange Delta accent. These are reference roles, not proposed Fork tokens. The inspected pages rendered dark; other theme states were not inspected. No contrast compliance claim is made.

## Ranked adaptations for existing Fork work

These are design refinements to existing surfaces, not ten additional product features. Recommendations are our interpretation of the references, not claims that Zed proves better usability.

| Rank | Adaptation | Apply to Fork | Why and guardrail |
|---|---|---|---|
| 1 | **Make typography carry hierarchy before adding containers.** Use a clear title, readable body, and quieter supporting line. | Recipe header, editor, Journal, collection headings. | Preserve Bitter/Source Sans/identifier-only mono. Use spacing and weight to distinguish importance; avoid adding an eyebrow, badge, and panel title that all repeat the same meaning. Zed's serif/body contrast is a useful precedent, not a reason to use mono for recipes. |
| 2 | **Align information into a deliberate grid.** Shared left edges and row baselines make sparse layouts feel precise. | The approved Paprika-shaped editor: title and metadata at top left, photo spanning those rows at right, ingredients and method below. | Reuse the finished recipe's hierarchy. Group times together, Serves/Makes together, and source/audience coherently. Give long titles and source names room instead of making every field equal width. At small widths, stack without horizontal scrolling. |
| 3 | **Give each accent a consistent job.** Most of the page should remain neutral. | Recipe actions, Save states, active filters, scaler output, timers. | Keep marigold for the primary action and clay for the existing text/dynamic-value roles. Prefer text and a small state indicator to filling every active surface. Do not introduce Zed blue or another accent per feature. Pair meaning with words/icons, not color alone. |
| 4 | **Use whitespace and thin rules as the default grouping tools.** | Ingredient sections, method groups, metadata, Journal chronology, settings rows. | Zed's aligned section divisions show how structure can be visible without every section becoming a raised card. Preserve Fork's no-shadow-at-rest rule; reserve a filled panel for something genuinely distinct, such as a private note or active form. Do not add decorative lines around every ingredient. |
| 5 | **Separate content density from control density.** Reading can be generous while controls remain compact. | Recipe overview versus Cook, timer overview, editor optional fields. | Keep recipe instructions large and comfortable; compact metadata and toolbar rows independently. Do not shrink everything together to make a desktop screen look tidy. Mobile Zed article text keeps its size while the layout changes—good precedent for Fork. |
| 6 | **Keep secondary actions visibly secondary and plainly named.** | Cook / Edit / Save / Fork, editor Section heading and Help, timer actions. | Primary fill plus quiet labeled alternatives is already compatible with Fork. Favor labels over a row of unexplained glyphs. Use the existing hover and focus treatments rather than borrowing tiny low-contrast controls from a marketing header. |
| 7 | **Let content remain recognizable across layouts.** | Editor → saved recipe → Cook. | The title, ingredient groups, and method should keep their relationship even as photo size and controls change. The user should feel they are working on one recipe. Zed's repeated type and grid across product and editorial pages is a useful consistency reference. This supports the accepted editor layout, not a new WYSIWYG engine. |
| 8 | **Make metadata quiet but legible.** | Prep/cook time, attribution, audience, version line, card details. | Keep dish names and photos dominant. Align small supporting information consistently, but preserve readable contrast and explicit audience/version words. Do not copy the very small dates or subdued secondary text of the blog cards. |
| 9 | **Change structure for phones instead of miniaturizing desktop.** | Editor metadata/photo, action rows, navigation, multi-timer overview. | The inspected product page stacks its actions and the article drops the desktop contents rail. For Fork, keep its already-approved bottom navigation; stack dense controls and let long names wrap. The checked mobile article had 390px document width at a 390px viewport, but this was not a whole-site overflow audit. |
| 10 | **Use consistent, restrained interaction feedback.** | Menus, links, collection picker, inline timers, scaler. | The inspected Resources item gains a bounded tinted highlight and arrow. Fork can communicate selection with its existing band/clay-tint and visible focus ring. Keep hit areas generous even if the visible mark is small. Specific animation timings, hover curves, keyboard traversal, and reduced-motion behavior were not measured. |

## Things not to copy

1. **The dark blue technology palette as Fork's default.** It suits a developer tool. Fork already has a warm identity and needs varied food photography to lead. Dark mode, if implemented later, needs its own reading and cooking tests.
2. **Monospaced-looking body copy and very small metadata everywhere.** A technical personality can tolerate a mechanical rhythm that would make long recipes feel less inviting. Keep Fork's identifier-only mono rule and readable recipe text.
3. **Technical grid decoration, registration marks, textures, glows, or beveled buttons.** Zed's marketing decoration is part of its identity. Fork's structure should come from actual recipe content and layout; decoration would compete with photographs and contradict several approved rules.
4. **Large marketing hero whitespace inside working screens.** The product hero creates a deliberate introduction, but cooks should reach ingredients, instructions, and active timers quickly. The accepted compact Cook header remains appropriate.
5. **The mega-menu or hamburger as Fork's primary navigation.** Zed has a large marketing information architecture. Fork's four recurring tasks should stay directly accessible; additional navigation complexity would not make it more precise.

## Taste choices to settle during implementation

These are recommendations for the working app, not a request for another mockup round. No accepted choice has been silently replaced.

| Choice | Recommendation | Alternative and trade-off |
|---|---|---|
| Keep Bitter or explore a lighter serif? | **Keep Bitter for this build.** Improve scale, weight consistency, and spacing first. | A lighter serif like the visual direction on Zed can feel more delicate, but changes the cookbook's character and needs real recipe, long-title, and small-screen evaluation. Font aliases above are not a ready-to-use specification. |
| Add italic display titles? | **Use upright recipe titles.** At most consider an occasional editorial/collection introduction later. | Italic can give a handcrafted editorial voice, but routine title italics reduce contrast between headings and quotations/emphasis and may feel overly styled. |
| Keep the current three-part label/heading/body stack everywhere? | **Keep it where each part adds information; omit redundant eyebrows.** | Repeating all three on every small block gives consistency but adds visual chatter. This is already an approved revisit candidate in the design summary. |
| How much visible structure in the editor? | **Use a coherent header grid, quiet section rules, and obvious editable fields.** | An almost borderless document editor looks closer to the final recipe, but can obscure what is editable. Preserve input affordances and error locations. |
| How much metadata is always visible? | **Keep cooking essentials and audience clear; disclose optional detail.** | Showing all fields creates a powerful desktop form but makes novice entry look like administration. The accepted collapsible optional sections are the right starting point. |
| Increase accent saturation because Zed's blue is vivid? | **Keep the approved Fork tokens initially; judge their relative prominence in the completed layout.** | More chroma can enliven a control, but a restrained page often gains more from reducing competing accents than from increasing saturation. Any later color change needs contrast and state testing. |

## Relationship to Fork's approved direction

Read against [DESIGN.md](../../../DESIGN.md), the [MVP design summary](../../design/2026-11-10-decision-pack/DESIGN-SUMMARY.md), and Spencer's subsequent editor preference: title/metadata beside a right-hand photo, ingredients/method below, optional fields collapsible. The newer preference guides the editor recommendations here.

The useful outcome is **more disciplined application of Fork's current language**: deliberate alignment, fewer competing labels, readable supporting information, and neutral space around the food. No evidence from this sweep calls for replacing its palette, switching to an IDE aesthetic, adding a landing page, or reopening feature discovery.

## Limits

This was a bounded visual reference sweep, not a full accessibility, responsiveness, performance, or interaction audit. Pricing, docs, every product subpage, alternate color themes, browser/device combinations, and screen readers were not inspected. Screenshots were inspected in the tool session but are not archived in this report. Exact font-file identities, loading behavior, contrast ratios, hover timing, and motion preferences remain unverified. No website-copy or asset reuse is proposed.
