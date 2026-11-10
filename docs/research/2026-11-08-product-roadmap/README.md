# Make Fork the Cookbook That Improves

**Authoritative product direction · revised 8 November 2026 · serious home cooks · US and Canada**

**Build Fork around three defining pillars: Cookbook, Cooking Journal and Community.** A dependable recipe editor and cooking experience remain the foundation, while an early friends pilot makes social cooking part of the product from the outset. The central social object is a real cook: what someone made, their own optional photo or note, and a recipe version/scale or external source when available—not a requirement to write a complete recipe. The intended loop is **see a friend’s cook → save the source → cook → remember → improve → share**. Ship that minimum loop once writing, privacy, basic retrieval/cooking and rights handling are trustworthy; do not wait for full migration parity, offline timers, meal planning or subrecipes. Keep those cookbook commitments, then expand into deeper recipe development and evaluated AI assistance. Start with Spencer’s own friend group in the US/Canada target market, distinguish personal libraries from rights-cleared public recipes, and validate usefulness before assuming social growth or revenue.

## 1. Unite a useful cookbook, journal and community

### The audience decision makes the scope clearer

The primary customer is a serious home cook: someone collecting useful recipes, adapting them to their household, cooking repeatedly, and wanting their accumulated knowledge to survive. Include weeknight cooks, enthusiastic bakers, family-recipe keepers and mixed-device households in discovery. Chefs matter as adjacent recipe developers: precise yields, batch scaling, reusable sauces or doughs, testing notes and clear printouts help both groups. Restaurant procurement, stock valuation, payroll, POS and multi-location kitchen operations require a different buyer and operating model. Professional platforms such as meez illustrate that broader surface; Fork should not inherit it simply because chefs use recipes. ([meez plans](https://www.getmeez.com/pricing))

The main pushback is against breadth without dependable everyday use. A beautiful recipe page is insufficient if a cook loses an edit, cannot import an existing collection, or keeps scrolling to recover an ingredient quantity. Conversely, a feature does not need a version-control angle to deserve inclusion. Competitive convergence and repeated forum requests are strong positive evidence of useful jobs; sequence them by dependencies, correctness and operating burden. Do not reject them because of their provenance. This roadmap recommends **a complete cookbook, a low-friction cooking journal and a community that helps people decide what to cook and improve it**. Basic social participation is an approved defining pillar; mass discovery, recommendation algorithms and AI remain later expansions.

### Today’s implementation is substantial, but not yet the quality target

The repository audit found implemented functionality, not a blank slate. “Built locally” below means inspected source, not a passing runtime test. “Observed live” means logged-out browser observation on 8 November at 1280×720. “Unverified” means no result was established, not that something fails. The public deployment was updated during research, and the modern recipe controls appeared on recheck; the earlier mismatch is superseded for that surface. A remaining homepage copy/order difference needs an ordinary release check, not a new deployment-centered roadmap. ([Current product audit](current_product_audit.md))

| Area | Current evidence | Roadmap implication |
|---|---|---|
| Editor and history | **Built locally:** paste-friendly ingredient/method editors, retained unparsed lines, one save, snapshot history, versioned photos, comparisons, failed-save text recovery and transactional stale-write protection | Extend and preserve these strengths. Durable recovery after closing/reloading the tab was not found; history cannot recover unsaved text. |
| Cooking and scaling | **Built locally; controls observed live:** servings, Cook mode, wake-lock handling, independently tickable ingredients/steps and 12-hour version-scoped tick persistence | Refine existing behavior, then add units, timers and explicit offline reading. Do not list cook mode/scaling as unbuilt. |
| Organization | **Built locally:** own recipes, favorites, tags, public browse and title/description/ingredient search | Add collections and clearer Cookbook/Discover navigation. Ingredient search currently considers historical versions; decide and test the intended current-content contract. |
| Visibility and lineage | **Built locally:** owner checks, public/private recipes, parent recipe attribution and fork list. New recipes default public; forks inherit source visibility; no structured copied-version reference found | Fulfil the prior private-first decision; pin source versions and explain bookmark versus editable adaptation. Audit media access before promising private cookbooks. |
| Missing cookbook breadth | No collections, durable drafts, import/export routes, print styling, cook logs, shopping/planning, household grants or AI found in the bounded inspection | These are proposed additions. Existing free text supports notes informally but not structured groups, yield, sources or ingredient-step references. |
| Quality | Existing tests and accessibility provisions are visible in source | Current test results, authenticated journeys, actual phones, screen readers, production mail, private-media policy and field performance remain **unverified**. |

This source audit is bounded and linked to the relevant implementation in its evidence note. The current uploader obtains a public Storage URL; that warrants a policy/access check, not an unsupported claim of a demonstrated leak. Likewise, public-by-default behavior is a product-default issue, not proof of an authorization bypass. ([Audit evidence and limits](current_product_audit.md))

### Design around a complete loop, including the inconvenient cases

| Moment | What the cook should be able to do | What “good” means |
|---|---|---|
| Capture | Type, paste a whole recipe, import a URL, then migrate existing recipes or scan a card | One reviewable editor; original source preserved; uncertain or omitted data visible; never auto-publish. |
| Organize and find | Put owned, adapted and saved recipes in a personal cookbook; use collections, tags, search and predictable sorting | Find a known recipe or an ingredient-based option without understanding site architecture. |
| Prepare | Choose servings/yield, check equipment, select optional ingredients, build a grocery list and a flexible meal queue | Accurate quantities and clear exceptions; no demand to maintain a perfect pantry or calendar. |
| Cook | Read ingredients and method comfortably, track progress, run named timers, switch between recipes, print or open a saved offline copy | No lost place, unexplained unit changes, tiny targets or false promise of locked-screen alarms. |
| Remember and improve | Record “Made it” with a dish name/date; attach the exact recipe version/scale when available, or an external source; add an optional own note/photo | Logging dinner never requires authoring a full recipe. A one-off substitution remains an observation until deliberately promoted into a revision. |
| Connect and inspire | Follow approved friends, see a chronological feed, appreciate/comment, save a source and cook something it inspired | Audience is understandable; private recipe text stays private; real cooking matters more than engagement counts. |
| Share and leave | Share deliberately, collaborate with a household, export useful files and a complete archive | Privacy and attribution survive; cancelling payment never traps a person’s cooking history. |

Use a deliberately awkward acceptance library: dough plus filling, overnight fermentation, sauce yielding 500 ml, divided butter, “2 × 400 g cans,” quantity ranges, “to taste,” optional garnish, alternatives, Unicode fractions, decimal commas, non-Latin tags, a photo-only family card and a page containing two recipes. Schema.org permits sectioned instructions and textual yield; assuming every recipe is flat ingredients plus numeric servings would discard legitimate source structure. ([Schema.org Recipe](https://schema.org/Recipe))

## 2. Compete on useful memory while meeting a strong baseline

### Established products make everyday completeness the entry price

The matrix summarizes documented capabilities, not independent quality rankings. Prices were checked **8 November 2026**. US App Store figures are USD; dollar prices on vendor sites are reported as displayed and can vary by region, tax, promotion and platform. “Unverified” does not mean absent. Features can belong to paid tiers; the table does not imply every capability is included in the quoted entry price.

| Product | Documented strengths and overlap | Price/tier observation | Implication for Fork |
|---|---|---|---|
| **Paprika 4** | Web capture, editing, cookbooks, advanced search, scaling/conversion, cooking tools, offline, groceries, pantry, planning and export; premium adds scanning/social capture and family sharing | Launched **6 Nov 2026**; premium introductory **US$14.99/year**, **$9.99/year** for prior owners; new free tier limited to 50 recipes. [Release](https://www.paprikaapp.com/news/2026/11/06/paprika-4-is-now-available-for-all-users/), [features](https://www.paprikaapp.com/) | Strong cross-platform value anchor. Old claims about missing collections/family features or separate new purchases are obsolete. Faithful migration and a compelling repeat-cooking benefit are essential. |
| **Recipe Keeper** | Web/social/photo/PDF capture, migration, collections/search, scaling, offline cooking, shopping/planning and printable cookbooks | US iOS Pro **$19.99**; other platforms separately purchased. [Product](https://recipekeeperonline.com/), [US listing](https://apps.apple.com/us/app/recipe-keeper/id974683711) | Existing libraries and family archives create switching costs. Preserve organization, photos and source details. |
| **Crouton** | Web/book/photo capture, scaling, step view with ingredient quantities, timers, meal planning, Reminders groceries and iCloud household sharing | US listing: Plus **$24.99**; Discover **$14.99/year or $1.99/month**. Exact entitlement split and older purchases not fully resolved. [Product](https://crouton.app/), [listing](https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987) | Native cooking and OS integration are a quality benchmark. Export and full offline behavior were not verified. |
| **Mela** | Web/share-extension/scan capture, categories, favorites/want-to-cook, focused cooking, multiple recipes/timers, print/PDF, shared library and OS integrations | iOS/iPadOS unlock **$6.99** once; Mac separate. [Product](https://mela.recipes/), [help](https://mela.recipes/help/), [listing](https://apps.apple.com/us/app/mela-recipe-manager/id1548466041) | Attractive reading alone has a low price ceiling. Local storage is documented; every offline workflow was not tested. |
| **AnyList** | Strong shared groceries, recipe capture/collections/search, scaling/cooking and meal planning | Complete **$9.99/year individual; $14.99/year household**. [Features](https://www.anylist.com/features), [Complete](https://www.anylist.com/complete) | Household utility is a formidable retention advantage. List export/integration can help cooks retain an existing shopping habit. |
| **Samsung Food** | Saved/personal recipes, communities, planning and shopping; Food+ adds AI/personalization/nutrition capabilities | Food+ **$59.99/year or $6.99/month**, seven-day trial; regional variation and mobile-only features stated. [Product](https://samsungfood.com/), [Food+](https://samsungfood.com/food-plus/) | Higher AI pricing exists, but does not establish Fork demand or justify diet coaching. Detailed offline/conversion/export behavior unverified. |
| **Mealie** | Self-hosted import/migration, cookbooks/tags, shopping/planning, households, linked ingredients/steps and subrecipes | Open-source self-hosting; no official hosted price verified. [Features](https://mealie.io/documentation/getting-started/features/), [subrecipe implementation](https://github.com/mealie-recipes/mealie/pull/4800) | Hosted ease and approachable history can matter; subrecipes and cooking logs are not vacant categories. |
| **Tandoor** | Structured recipes, imports, cookbooks/tags, powerful search, scaling, shopping/planning, collaboration and archive export | Self-hosting documented; hosted price not reliably verified. [Docs](https://docs.tandoor.dev/), [import/export](https://docs.tandoor.dev/features/import_export/) | Match useful library jobs without copying every power-user setting. Document export fidelity explicitly. |
| **Cooklang ecosystem** | Portable recipes/files, sections, ingredients in steps, named timers, subrecipes, shopping/menu tooling and Git workflows | Free tooling plus optional cloud; advertised Cook Pro **€12.99/month** with CookBot; lower tiers not checked. [Home](https://cooklang.org/), [spec](https://cooklang.org/docs/spec/) | Portability and version control already exist. Fork must make their cooking benefit accessible; spec support varies by client. |

**The differentiation claim must be narrower than “only Fork has versions/logs.”** Cooklang advertises Git workflows, and Mealie’s merged subrecipe implementation references “I Made This” and a timeline. Fork’s opportunity is the integrated experience: capture faithfully, cook comfortably, learn from an exact iteration and be inspired by people one knows. Samsung Food already supports public/private communities and community recipe saving, so social cooking itself is not exclusive either. ([Samsung Food communities](https://support.samsungfood.com/hc/en-us/articles/18365296571412-Getting-Started-with-Samsung-Food-Communities)) That is a positioning hypothesis to prove with users, not a discovered monopoly. ([Cooklang](https://cooklang.org/), [Mealie implementation](https://github.com/mealie-recipes/mealie/pull/4800))

### Public requests reveal concrete jobs worth building

| Evidence of a recurring problem | Decision for Fork |
|---|---|
| Mealie users describe repetitive US/metric conversion and separate temperature preferences, including 2026 discussion. [#3881](https://github.com/mealie-recipes/mealie/discussions/3881) | Include reversible unit and temperature display in the base cooking phase; distinguish dimensional conversion from density estimates. |
| Range quantities and alternatives appear in specific requests. [#2989](https://github.com/mealie-recipes/mealie/discussions/2989), [#3717](https://github.com/mealie-recipes/mealie/discussions/3717) | Preserve ranges and free text; make optional/alternative selections explicit when generating shopping lists. |
| Concurrent timers and whole-recipe totals versus step allocations are documented needs. [Mealie #1573](https://github.com/mealie-recipes/mealie/discussions/1573), [Tandoor #1325](https://github.com/TandoorRecipes/recipes/issues/1325) | Include named simultaneous timers and ingredient-step references. The Tandoor issue is now Done; the need remains relevant. |
| Users describe variant clutter and reusable crust/stock components. [Mealie #880](https://github.com/mealie-recipes/mealie/discussions/880), [#1761](https://github.com/mealie-recipes/mealie/discussions/1761) | Group adaptations and build version-pinned subrecipes after reliable yield/scaling. The latter has implemented competitor work, strengthening category evidence. |

These are self-selected accounts, useful for identifying real friction and supporting inclusion. They do not estimate population prevalence. Interviews and observed cooking should determine defaults, usability and release order; they should not become a pretext for indefinitely postponing already well-supported basics. No reliable competitor market shares, paying-subscriber counts or category-wide willingness-to-pay estimates were established in this sweep. ([Market evidence note](cookbook_market.md))

## 3. Ship six phases with observable completion gates

### P0–P2 deliver the core and an early social pilot

**MVP-first decision — 8 November 2026:** ship a useful cookbook and the early friends loop before optional resilience and polish. Durable drafts/autosave across reloads, tab closure or crashes are a post-MVP nice-to-have, not a P0 requirement or pilot gate. Preserve existing failed-save input retention, unsaved-change warnings and stale-write protection. Near-term work is cleanup verification, owner-confirmed permanent recipe deletion, ingredient/method groups and clearer yields, then Journal/Friends once privacy and sharing are ready; full P1 completion is not a launch prerequisite. Revisit durable drafts if actual use involves long authoring sessions or lost unsaved work.

Sizes describe relative scope: **S** is bounded presentation or logic; **M** crosses flows/data/state; **L** introduces substantial model, platform or operational complexity. A phase contains several slices, not one giant ticket. These are not hourly estimates or delivery promises. Quality gates persist through every phase; completing P0 does not finish reliability work.

| Phase | Deliverable and dependencies | Completion gate |
|---|---|---|
| **P0 — Trust the work** | Truthful save state, existing failed-save input retention and unsaved-change warnings, private-first creation/adaptation, media/access verification, conflict recovery, auth/mail usability and backup/restore exercise. Add provenance, reporting and access-suppression foundations for the pilot. Mostly M. | Failed saves and conflicts preserve input while the editor remains open; saved versions remain intact; no silent publication; private surfaces pass owner/other-user/logged-out checks. Moderator disabling and restoration safeguards work. Existing behavior tests run successfully. |
| **P1 — Own a useful cookbook** | Groups, yield/source/notes, preview and restore-as-new-version; coherent Cookbook/Discover, collections/search/pins; print and portable archive; paste/URL capture and one migration format. M slices, after P0. | A cook brings a realistic recipe/library into Fork, corrects it, organizes and retrieves it, prints/exports it, and restores an older iteration without loss of declared content. |
| **P2 — Cook, record and connect** | **Early pilot lane:** lightweight cook events, Journal, profiles/approved following, chronological Friends feed, appreciation/comments and useful notifications. Requires P0 trust plus minimum create/save/retrieve/cook and rights handling, not full P1 completion. **Core completion lane:** refine cooking/scaling/ticks, units, timers, offline saves and ingredient access. M–L slices. | **Pilot gate:** real cook→friend source/save→later cook works with correct audiences, report/block/removal and no critical data/quantity failures. **Full phase gate:** real-device cooking, offline reopening, timer recovery and version/scale recall pass. These are distinct gates. |
| **P3 — Support the household routine** | Grocery list, simple meal queue/calendar, multi-recipe cooking sessions (working name “Party mode”), household cookbook/list permissions, optional-ingredient choices; ad hoc pantry matching and richer diary. M–L; uses P1 content and P2 quantities/logs. | Plan several meals, change a serving count, shop, cook and reschedule leftovers without duplicate or stale unexplained quantities; second household member can contribute; revocation works. |
| **P4 — Develop better recipes** | Version-pinned subrecipes, grouped variations, richer comparison/suggested changes, batch yields/baker’s percentages; optional measured nutrition and timeline prototypes. M–L; stable units, pins and permissions required. | Reproduce an earlier compound recipe, intentionally update a child version and see the diff; shared suggestions cannot overwrite newer edits; advanced calculations disclose assumptions. |
| **P5 — Add assistance and wider reach** | Evaluated OCR/import assistance, cookbook-grounded search, reviewed adaptations/attempt summaries; broader community discovery, creator tools and native decisions. Basic friends social is scheduled in P2. Separate M–L bets. | Each capability beats its non-AI/current-platform baseline; costs/failures controlled. Broad discovery follows independent social use and scalable moderation; native addresses measured platform limits. |

The pilot path is **trust/privacy/rights + useful create/save/retrieve/cook → lightweight Journal → Friends loop → observe real use**. The cookbook completion path continues through faithful content/library, dependable cooking, household routines and deeper development. **The pilot does not wait for durable drafts, all P1 grouping, bulk migration or complete archive tooling, P2 timers/offline, P3 planning/households, or P4 subrecipes.** Those remain commitments with their own gates; an interim owner-data export can protect pilot participants before the comprehensive archive lands. Evaluated photo capture can likewise follow a stable editor before every P4 experiment finishes.

### Start with safety slices and branch immediately into the pilot

| Order | Reviewable slice | Acceptance criteria and boundary |
|---|---|---|
| **1. Verify existing writing and cooking — bounded fixes** | Finish cleanup verification, including nonzero quantity formatting and deployment-compatible upload limits. Preserve clear saved/failed states, failed-save input retention, unsaved-change warnings and concurrency protection. | With the editor open, interrupt a save, expire the session, trigger validation and conflict: input remains available and stale content cannot overwrite newer work. Validate the unsaved-change warning and run the required checks. Reload/tab-close/crash recovery and autosave are explicitly outside the MVP gate. |
| **2. Private recipes and exact origins — M** | Default new recipes/adaptations private, explain publication, record the copied source version, and distinguish “Save to cookbook” from “Make my version.” | Public source → adaptation remains private until explicit publication. Fork-from-older-version records that exact source. Test direct URLs, history/diff, images, search/favorites and exports across accounts. Verify media policy rather than assuming public URLs are private. Existing public content is not silently reclassified. |
| **3. Cookbook completion lane — M–L, split into small PRs** | Add ingredient/method groups, yield separate from servings, source attribution and notes; carry them through edit/read/history/preview, print and a documented archive. | Save a dough/filling recipe yielding 12 buns; reopen, scale, compare, print and export without flattened groups or lost wording. Restore an old version by appending a new one. Export includes the supported versions, source and photos; a round-trip/restoration fixture proves fidelity. No silent “12 buns = 12 people” conversion. |

**Immediate pilot slice after slices 1–2:** add a minimal cook event and audience model, then approved friends/profiles, chronological feed, appreciation/comments, in-app notifications and report/mute/block/moderator controls. Validate one person logging a linked recipe and an improvised dinner, a friend seeing only authorized content, saving the source and later logging their cook. Give pilot users an interim readable export. Slice 3’s full grouping/archive work proceeds in the cookbook lane and is not a prerequisite to this pilot.

These are implementation recommendations, not permission to change application code during this research task. Read current callers/tests and make complete vertical changes. Follow current Drizzle migration rules; preserve append-only authored history while a recipe exists; deliberate owner-confirmed recipe deletion may remove that recipe and its history. Lawful access suppression and retention handling remain separate responsibilities. Complete collections/navigation/search, paste/URL capture and other P1 commitments alongside pilot learning.

### Give every meaningful feature an explicit disposition

| Capability | Decision and phase | Minimum useful scope; reason for sequence |
|---|---|---|
| Existing save/conflict state and unsaved-change warning | **Preserve and verify P0** | Keep input on failed saves while the editor is open; make saved/failed state clear and prevent stale overwrites. |
| Durable drafts and autosave | **Post-MVP nice-to-have; unscheduled** | Recovery across reload, tab closure and crashes is not a launch dependency. Reprioritize if observed authoring or loss warrants it; eventual local recovery and cross-device sync are separate scopes. |
| Privacy, source version, safe adaptation | **Build P0** | Honour earlier defaults and reproducibility before expanding capture/sharing. |
| Account settings, username, confirmation/resend | **Build P0–P1** | Complete access/recovery; verify actual mail setup. Username changes need stable identity and old-link behavior. |
| Recipe deletion | **MVP** | Owner-only permanent deletion with confirmation explaining that the recipe and its history cannot be restored in the app. Verify the existing endpoint, related records and media references; preserve independent forks and handle unavailable originals clearly. No Trash or undo requirement. |
| Trash and deleted-recipe restore | **Post-MVP nice-to-have; unscheduled** | Recoverable deletion is deferred. This does not defer existing recipe-version comparison or planned restore-as-new-version. |
| Account lifecycle | **Before broad onboarding** | Define account deletion and retention independently of recipe deletion. |
| Groups, yield, source, notes, preview | **Build P1; groups/yield in the MVP** | Optional Insert toolbar and visible `#` section markers with live heading styling; preserve plain-text paste and ordinary ungrouped recipes. Yield stays separate from servings; scale supported counts/volumes, flag pan/temperature adjustments without multiplying them. Carry content through all existing readers; no bloated required form. |
| Collections, want-to-cook, sorting/filtering | **Build P1** | Personal library works independently of a feed. Keep tags quick; add pagination and bulk collection/tag actions as libraries grow. |
| Search relevance and match highlighting | **Build P1** | Search current owned/pinned content by default; explicitly label history search. Prioritize exact useful matches over popularity. Fix non-Latin slug behavior. |
| Version-pinned saves and private notes | **Build P1** | Separate a moving favorite from an exact saved version; offer deliberate updates and an editable copy when desired. |
| Whole-recipe paste, URL, text/Markdown files | **Build P1** | Reviewable draft with source and missing-field feedback; files reuse the paste path. Safe bounded URL fetching is part of the feature. |
| Readable export, full archive, print | **Build P1** | Ownership and practical kitchen use; export does not wait for imports. Include future logs/groups in archive evolution. |
| First competitor migration importer | **Build P1** | Lower switching cost. Choose with pilot libraries; Paprika is a sensible candidate, not a proven market-share winner. Preview counts, duplicates and failures; never overwrite silently. |
| Mobile cooking, tick affordance, zoom | **Refine P2, obvious blockers earlier** | Preserve overview and place; test the requested tick alternatives side by side on actual cooking tasks. |
| Scaling, units, temperature | **Refine/build P2** | Exact same-dimension conversions first; preserve source units and ranges. Density estimates require ingredient/preparation context. |
| Named timers and offline reading | **Build P2** | Persist deadlines and intentionally saved versions; tell the truth about browser alarm limits. Full offline editing waits for demonstrated need. |
| Ingredient quantities beside steps | **Build P2, richer allocations P4** | Use explicit ingredient references; preserve total mise-en-place quantities and avoid double counting divided ingredients. |
| Journal / Made it log, note/photo/rating | **Committed early P2; enrich P3** | Dish/date first; optional recipe/version/scale/source, own photo/note and independent audience. No complete recipe required. Private personal ratings can follow; no public scores in the pilot. |
| Grocery list and optional alternatives | **Build P3** | Selected recipes/scales, manual items, safe combining, source links, aisle grouping and share/export; ambiguous items remain separate. |
| Meal queue/planner and calendar export | **Build P3** | Flexible dates, manual meals and leftovers, feeding groceries; optimization is unnecessary for the first useful planner. |
| Multi-recipe cooking session (“Party mode”) | **Later P3 addition; outside MVP** | Select several recipes and cook from one session, preserving each recipe’s version, scale, step progress and position. Quick switching first; shared timer overview when timers exist. Does not require Cooklang, subrecipes or a dependency graph. |
| Household cookbook and shared lists | **Build P3** | Clear owner/editor/viewer roles, invitations, revocation and attribution; personal notes stay private. |
| Pantry list and missing-ingredient search | **Include P3 experiment** | Start with ingredients on hand; show missing items. Exact stock depletion, expiry tracking and grocery pricing defer because maintenance/integration burden is much higher. |
| Subrecipes and grouped variants | **Committed P4** | Pin child versions, scale explicit batches, show updates, expand shopping intentionally; accepted user direction, not a speculative rejection. |
| User ingredient weights, baker’s percentages | **Include P4** | Known weights and visible assumptions; preferment flour/water included. User overrides do not silently reinterpret old attempts. |
| Nutrition estimates and diet filters | **Include gated P4** | Reliable identity/weights/servings first; expose missing inputs and source. Preference labels are not allergy certification. |
| Extra/step photos and richer diary | **Own cook photo P2; depth P3–P4** | Optional own photo in the pilot, instructional galleries later; explicit asset rights, privacy, metadata and storage controls. |
| Cooklang import/export | **Include P4, earlier if pilot needs it** | Supported subset with explicit loss report and original retained; never invent ingredient-step links. |
| Comments and suggested changes | **Cook comments P2; version review P4** | Simple conversation in the friends loop; formal recipe suggestions retain permission/stale-write checks. Real-time editing/automatic merge deferred. |
| Profiles, approved following, Friends feed, appreciation | **Committed early P2** | Chronological real cook events, reversible appreciation, source-linked save/cook/adapt and useful notifications. No household administration prerequisite. |
| Privacy, report/mute/block and moderation | **Pilot prerequisite P0–P2** | Clear audiences, own-content removal, monitored reports, restrictions across versions/assets and an appeal route. Manual operations initially. |
| Public ratings and algorithmic discovery | **P5 gated additions** | Keep basic social free/useful first; broader reach needs independent demand, adequate catalog and moderation capacity. |
| Graphical cooking view and timeline | **Accepted later direction; P4 prototype** | Optional power-user view of ingredients, steps, component dependencies and parallel work. Proposed initial scope: Cooklang-backed recipes with preserved ingredient/step links; add a timed layout when meaningful durations exist. Standard instructions remain available. |
| Lineage graph and discovery trends | **Retain P4 prototypes/P5 decisions** | Recipe ancestry and discovery are separate from cooking dependencies; validate their navigation/discovery benefit. |
| OCR/photo/PDF/social capture | **Include P5, eligible after P1** | Strong capture value, but evaluated extraction and rights/platform constraints first. Prioritize formats pilot cooks actually bring. |
| AI search, adaptation, notes summaries | **Include gated P5** | Must save work beyond deterministic baseline; reviewed proposals and citations, never silent rewrites. |
| Translation, read-aloud, hands-free controls | **Retain P5 experiments** | Test language/accessibility needs and device support; preserve original wording, allow correction, keep ordinary controls. |
| Dark mode, richer reading preferences | **Include after core readability** | Contrast-tested tokens and stable reflow first; prioritize actual cooking comfort rather than themes for their own sake. |
| Native iOS/Android integration | **Decision in P5; PWA earlier** | Trigger on measured capture/offline/alarm friction and commercial value, not an arbitrary user count or AI prerequisite. |
| Creator roles, permissions and partnerships | **Pilot provenance; early partner tests after pilot** | Free identity/credit and scoped permission partnership first; verification is separate from rights and paid features. |
| Creator publishing tools, embeds, analytics | **P5 commercial experiment** | Paid tools need demonstrated value; licensing/commissioning can cost money. Marketplace revenue share stays later. |
| Generic AI recipe generation | **Defer beyond assistance** | Prior idea retained; weak early differentiation, harder verification and ongoing cost. Reviewable adaptation has a clearer starting point. |
| Restaurant operations | **Outside current target** | Procurement, invoices, staff operations and compliance need a separate professional discovery decision. |
| Ads, automatic prep-time estimates, stored “grams made” field | **Remain rejected** | Preserve explicit earlier decisions; observed per-attempt outcomes and derived yield are different concepts. |

### Make the interface feel good through task-level decisions

Keep the established warm annotated-cookbook direction unless testing supports a change: cream/ink surfaces, clay/marigold emphasis, purposeful typography, and no unsolicited wholesale redesign. Preserve desktop ingredient/method columns, the editable servings control near Ingredients, mobile Ingredients/Method navigation and progressively disclosed history. Do not resurrect equal-weight Recipe/History/Forks tabs; the user explicitly rejected them. The current live hero/version area occupies roughly the first 550 pixels at the observed desktop viewport: test whether “Cook” or a concise jump affordance gets returning cooks to useful content promptly rather than treating that measurement alone as a design failure. ([Design](../../../DESIGN.md), [audit](current_product_audit.md))

Test **Cookbook / Journal / Friends** as the conceptual navigation: recipes to use, one’s cooking record, and people’s cooking activity. This is a task model to test, not a prescribed final tab bar or page layout. Keep public recipe discovery distinguishable from the friends feed; the current recipe route changing meaning on login should be resolved. Within Cookbook, use filters for mine/adaptations/saved, collections, tags and recently used; avoid competing destinations for the same mental category. Search should explain its match, preserve filters and show recoverable empty states. Tag suggestions can use a small deterministic scorer before AI; structured cuisine/diet/meal-type taxonomy waits until a flat list demonstrably impedes retrieval.

Keep the editor paste-first and forgiving. Preserve incomplete input while the editor is open; durable recovery across sessions is post-MVP. Expose optional detail progressively, keep the preview consistent with saved rendering, and preserve unparsed text visibly. Reordering requires keyboard alternatives; save errors should focus useful feedback without discarding content. In cooking, quantities need strong hierarchy, ingredient access should not lose the current step, tick state must be obvious without color alone, and undo/clear must be predictable. Do not auto-split or rewrite methods to create a simplified reading mode without review.

**Accepted editor direction — 9 November 2026:** keep recipe writing plain-text and paste-friendly, with optional visual assistance rather than a language users must learn. A collapsible **Insert** toolbar exposes supported elements by ordinary names, starting with **Section heading**. Choosing it inserts `# Section name` with the name selected for replacement; typing or pasting `# Dough` at the beginning of a line produces the same group. Ordinary ungrouped recipes require no markers or extra fields. Do not introduce `Section:` as a second required convention or expand this into general Markdown support.

Render section lines larger and heavier as they are entered. **Keep the `#` visible**, in a softer but readable color; the section name carries the main emphasis. The marker remains in copied/pasted text. Keep the interpretation visible and correctable before saving, without making a preview a second place to edit. Yield, visibility and other recipe settings remain ordinary fields; Cooklang is an optional advanced/import-export path, not a prerequisite for authoring.

Deliver this as a focused editor slice alongside groups, starting with a small live-formatting prototype. Preserve normal cursor movement, selection, undo/redo, multiline paste, mobile keyboard/composition and accessible labels. The Insert control must work by keyboard and return focus to the inserted text. Acceptance: a novice can create a section using the toolbar without knowing syntax; a typist can enter the equivalent marker; both save and reopen the same groups, and an ungrouped pasted recipe still works. Do not populate the toolbar with unsupported features or require a full document-editor rebuild. The later multi-recipe session and graphical view remain separate roadmap items.

Use familiar verbs: “Save to cookbook,” “Make my version,” “History,” “Compare changes,” “Restore as new version” and “Suggest a change.” Keep technical power available. A moving favorite follows the author’s current recipe and may disappear if access changes; a pinned save records which version was chosen but does not automatically grant permanent access or copying rights. State that access policy before release. Offer an authorized independent adaptation when the user needs an editable copy. Source recipe, source version and imported attribution are distinct records; a note saying “copied v3” is not enough to support dependable references.

| Cross-phase quality gate | Required validation |
|---|---|
| Trust | No known reproducible loss of saved work or input from failed saves in an open editor, accidental publication or cross-account exposure; reload/tab-close/crash recovery of unsaved text is an accepted MVP limitation; cover feed/comment/photo/direct-URL permissions, audience changes, blocks, upload failure, conflicts and account changes. Backup restore reapplies restrictions. |
| Accessibility | Target WCAG 2.2 AA; keyboard and screen-reader journeys, meaningful headings, visible/unobscured focus, non-drag alternatives, reduced motion, 200% zoom and narrow reflow. Automated checks supplement manual use. |
| Kitchen ergonomics | Observe a real meal on iOS Safari, Android Chrome and a tablet; test counter-distance text, long recipes, accidental ticks, switching recipes, phone locking and denied permissions. Prefer 44px main cooking targets; WCAG AA’s target criterion generally starts at 24px with exceptions. |
| Performance | Establish baseline, then target good field Core Web Vitals: p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, separately mobile/desktop. Label lab results honestly until field data exist. |
| Culinary correctness | Ranges/fractions/packages/divided ingredients, metric/US/imperial distinctions, mass versus fluid ounces, missing yield and unparsed lines. Never scale temperatures, time or pans mechanically. |
| Task completion | Test create/import → organize → retrieve → scale → cook → note → revise → compare → export with 100–500 varied recipes. An initial 4-of-5 unassisted qualitative gate can expose friction; report raw counts, never statistical certainty. |

Accessibility and performance thresholds come from current standards; the 44px cooking preference and initial task target are product recommendations. ([WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Web Vitals](https://web.dev/articles/vitals)) Wake locks and browser timers can be suspended or denied; store timer deadlines and recompute elapsed time, but do not market background web alarms as guaranteed. Offline saved reading is a separate deliverable from reliable scheduled notification or offline editing. ([MDN Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), [timers](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout), [offline operations](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation))

## 4. Let reproducible cooking guide advanced features and AI

### Version-linked observations and components create the strongest next layer

Keep three things separate: the recipe as written, what happened on one cook, and a lasting revision. A “Made it” entry records dish/date and, when available, the exact recipe version and scale, plus optional source/own note/photo. An external-source or improvised cook remains valid without a Fork recipe. Cooking a half batch with oat milk does not silently rewrite the recipe. Surface the last relevant note before the next cook, then offer “Use these changes next time” as a reviewed new version or adaptation. Restore similarly appends a new version. Past content and the meaning of earlier attempts remain unchanged.

Subrecipes make this model practical: the pie remembers which dough worked. Start with explicit “× batch” use; 200 g of a sauce requires a meaningful child yield, not an inference from “serves four.” A parent’s saved child version does not move when that child changes. An intentional update creates a parent revision and a visible comparison. Handle cycles, private/unavailable components, export inclusion and recursive shopping expansion before shipping. Let someone using already-made stock exclude stock’s ingredients from today’s groceries. Ingredient-step links and totals must agree across scaling, print and shopping.

For baking depth, percentages require total flour and water—including preferments—not merely dividing each visible line by the first flour ingredient. Volume-to-mass conversion also depends on ingredient and preparation; a source table’s flour cup is not a universal cup definition. Keep authored quantities and display assumptions visible. ([King Arthur baker’s percentage](https://www.kingarthurbaking.com/pro/reference/bakers-percentage), [ingredient weights](https://www.kingarthurbaking.com/learn/ingredient-weight-chart))

**Multi-recipe cooking sessions (“Party mode”) are a later addition, recorded 9 November 2026.** The first version brings several recipes into one cooking session with separate serving scales, progress and reading positions, so a cook can switch between a main, sides and dessert without losing their place. Timers, when available, stay labelled by recipe. This starts as coordination for one cook, not multi-user collaboration or an automatic schedule. It can work with ordinary recipes before Cooklang or the graphical view exists; later dependency/timeline work may help coordinate their steps and finish times.

**Graphical cooking view is an accepted later-stage direction for power users.** Offer an optional view showing ingredients feeding into steps, intermediate components flowing into later steps, and branches that can proceed in parallel before joining. For example, dough and filling can be prepared separately before assembly. This is a cooking dependency graph, distinct from the graph of recipe forks and ancestry. Keep the standard readable instructions available, and preserve the same recipe version, scale and progress when switching views.

Prototype in P4 with **Cooklang-backed recipes as the proposed initial scope**, after the supported importer preserves explicit ingredient/step relationships. Cooklang supplies ingredients within steps, sections, timers and recipe references; these support a first ingredient-to-step view. Paragraph order and sections do not themselves establish prerequisite edges or safe parallel execution, and timers do not describe every step’s duration. Show richer dependencies only when authored or reviewed; do not invent them from the file format. Extend across version-pinned subrecipes as that capability lands, and later consider any Fork recipe with equivalent structured relationships. ([Cooklang specification](https://cooklang.org/docs/spec/)) A basic dependency view does not require duration data. Add a timed layout later when durations are meaningful, distinguishing active work from waiting. Dependencies must be authored or reviewed, not silently inferred as certain from prose. Test whether cooks can identify what can happen in parallel, what must finish first and which ingredients a step uses, without making ordinary recipe entry burdensome. This is a substantial later build, not a prerequisite for the core Cook experience or friends pilot.

The first pantry feature should likewise answer “What can I make with these ingredients?” rather than demand inventory bookkeeping. These are scoped implementations of accepted ideas, not cancellations.

### AI should reduce clerical work without taking authorship away

| Priority | Assistance | Release evidence required |
|---|---|---|
| **1** | OCR and import repair after deterministic extraction | Compare source and draft; preserve quantities, temperatures, times, groups and steps; highlight ambiguity. Total correction time must beat manual/paste capture. |
| **2** | Search within the user’s cookbook and cooking notes | Better retrieval than ordinary search on actual failed queries; links to supporting recipes/versions/logs; no unsupported answer or permission leak. |
| **3** | Formatting/inconsistency suggestions | Reviewable proposals; reliable deterministic checks preferred; no invented missing ingredient. |
| **4** | Adapt a chosen version to an explicit goal | Proposed diff, rationale and uncertainty; accept/reject before saving a new version. No autonomous rewrite, publication or purchases. |
| **5** | Summarize the cook’s own attempts | Every substantive observation links to a real log; distinguish preference from proof that a change caused the result. |

Build a consented or rights-cleared evaluation corpus covering difficult quantity formats, multilingual text, weak OCR, groups, alternatives, multiple recipes on a page, missing yields and malicious source instructions. Report per-field failures and critical errors, correction time, latency and cost per useful result; one average “accuracy” number hides consequential omissions. Re-run the corpus on model/prompt changes, retain a manual fallback and an operational off switch. These controls follow established guidance on confabulation and indirect prompt injection; human review alone does not guarantee correctness. ([NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf), [OWASP prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/))

Process only the content needed for the chosen action and explain provider/retention settings accurately. Do not send an entire private cookbook by default. URL fetch protections, authorization, schema validation, sanitization and cost limits stay deterministic server responsibilities. A recipe importer needs no power to publish or inspect unrelated private records. ([OWASP SSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html))

Nutrition remains a later estimate with missing-data disclosure; database matching is not analysis of the prepared meal. Ingredient classifiers cannot establish allergy safety because cross-contact is separate. Exclude generative canning/preservation safety advice from early adaptation; composition and process changes can invalidate tested guidance. ([USDA FAQ](https://fdc.nal.usda.gov/faq/), [FDA allergies](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies), [NCHFP processing](https://nchfp.uga.edu/resources/entry/backgrounder-heat-processing-of-home-canned-foods))

The P2 friends loop runs before household administration or advanced collaboration. Keep a cook event’s audience distinct from its recipe’s visibility and any private note. Public discovery and structured suggestions expand that loop later; neither should make posting dinner feel like filing a technical change request. Rights and moderation requirements below apply to the early loop as well as later growth.

## 5. Launch with real friends and a trustworthy recipe supply

### Make the first community a useful circle of cooks

The committed early social product is **Journal + profiles/approved friends + a chronological feed + appreciation/comments**. Start with a dish name and cooked date; recipe/version/scale, source, own photo and note are optional. Distinguish cooked date from posting date and label the chosen feed order. Use explicit **Only me / Friends** audiences and private-note separation; public cook posting can follow. A shared event must not expose a linked private recipe, even indirectly through previews or comments. Source-only events can link out without distributing publisher text or photographs.

Let a friend save the source, ask a useful cooking question, record their own attempt and adapt an authorized recipe. Provide reversible appreciation, useful in-app reply/follow notifications, mute controls and opt-in email/push. Include remove/unfollow/block/report, own-content removal, a named moderator, response contact and basic rate limits before invitations. Strip photo location metadata; do not harvest contacts or expose emails. Chronological feeds and activity-level audiences are established patterns, not proof of a cooking retention uplift. ([Strava privacy](https://support.strava.com/en-us/articles/15401987-how-do-my-activity-privacy-controls-work-on-strava), [feed ordering](https://support.strava.com/en-us/articles/15402105-how-does-strava-order-my-activity-feed))

Use Spencer’s own friend group first. **Roughly four weeks and 8–15 willing friends** is an adjustable example, not an assumed group size or statistical sample. Friends can bring two or three real recipes/source links if convenient; one saved link or dinner log is enough. No compulsory weekly cooking, public photos or streak pressure. Before inviting anyone, test the cohort’s phones, failed saves, scaling limits, audience changes, comments/direct assets and moderator removal. Rights handling and an interim way to take personal data out must work; comprehensive archives, migration, timers and planning need not be finished.

| Period | Activity | Learn from actual behavior |
|---|---|---|
| Preparation | Spencer cooks several ordinary meals; demonstrate one real event; ask about devices/current tools; rehearse privacy/report handling | Critical blockers and assistance needed; demo activity clearly separate. |
| Week 1 | Help save something useful and log a real meal; show audience controls and connect existing friends | Invited/accepted/first-use counts, visibility comprehension, correction/help burden. |
| Week 2 | Optional recipe exchange or shared theme; observe source/save/comment paths | Whether one person’s cook inspires another person’s later cook; useful non-founder conversation. |
| Week 3 | Stop planned founder reminders and posting prompts; keep necessary support | Voluntary returns, ordinary cookbook use, non-founder content and replies. |
| Week 4 | Interview active and inactive friends separately; offer an optional genuine friend invitation | What survives without nudges, what still belongs in group chat, and whether to repair or expand. |

Count repeat cooks on distinct days, meaningful cookbook returns, notes reused, non-founder pairs, friend-inspired cooks and misunderstood audiences. Report “3 of 10,” not a misleading benchmark; readers need not post to receive value. For a roughly ten-person active group, several independent repeat users and at least two distinct friend-inspired cooking paths are reasonable discussion signals, not statistical proof. Privacy leakage or quantity corruption is a stop-and-fix gate. Friends may praise the product or post to help Spencer; record founder help separately and test **two or three independent connected clusters** before claiming wider demand.

Acquisition then proceeds from those real circles to small creator/cooking-club partnerships, consented public shares and useful source-attributed search pages. Samsung Food documents creator-led communities, supporting the channel as a practical pattern rather than a promised result. Do not buy broad traffic before measuring activation, voluntary return, costs and support. No invitations, creator outreach or campaigns have been sent. ([Samsung creator guide](https://support.samsungfood.com/hc/en-us/articles/18365153609748-The-Recipe-Creator-s-Guide-to-Samsung-Food), [pilot research](../2026-11-08-social-launch/social_launch.md))

### Build a solid database from three distinct supply lanes

| Supply lane | What belongs there | Publication behavior |
|---|---|---|
| Personal cookbook | User’s own recipes, saved references, permitted imports and private adaptations | Private by default; never auto-promoted. Private storage is not itself a legal exemption. |
| Source-linked cook | Own experience/photo plus source title/link and permitted metadata | Friends follow the source; publisher instructions/images are not automatically redistributed. |
| Public catalog | Original writing/photos, explicit permission, or a compatible reviewed license | Record rights and credit; permit hosting, adaptation and redistribution only within their scope. |

Start with Spencer’s tested recipes and willing contributors. **20–40 tested public starter recipes** is an optional coverage target, not a launch gate: quick dinners, vegetarian meals, baking, leftovers and interesting variations people will actually use. Prefer a missing photo to a falsely attributed one. Label demos and exclude fabricated cooks from real feeds/counts. For each public recipe, review ingredients/method consistency, yield/waits, mobile/print readability, source/rights, tester/date/version and image ownership. “Tested” means cooked, not successfully parsed; label uncertainty honestly.

Keep a provenance registry distinguishing **source creator, importer/compiler, adapter, cook and photographer**. Store the source URL/book/page, known author, permission evidence/license version, covered assets, import date and recipe/version lineage. Deduplicate known source URLs/identifiers conservatively while preserving private saves and variants; similar titles or ingredient lists do not establish identity. Keep original URLs and remove only known tracking parameters. Never assign authorship merely because somebody imported a recipe.

Do not bulk scrape or assume a recipe API includes public redistribution, adaptation or photo rights. Wikibooks is a candidate for per-recipe review: its text uses ShareAlike terms, while images require their own checks. CC BY permits commercial adaptations subject to conditions; BY-SA adds downstream licensing requirements; NC limits commercial use and ND excludes distributing adaptations. Confirm actual assets and terms before choosing any source; no provider is mandatory. AI paraphrasing is not a copyright-clearing workflow. ([Wikibooks](https://en.wikibooks.org/wiki/Cookbook:Table_of_Contents), [Commons reuse](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia), [CC BY](https://creativecommons.org/licenses/by/4.0/), [BY-SA](https://creativecommons.org/licenses/by-sa/4.0/), [BY-NC](https://creativecommons.org/licenses/by-nc/4.0/), [BY-ND](https://creativecommons.org/licenses/by-nd/4.0/))

### Treat creators as partners before treating them as a revenue tier

Offer a creator role to chefs, independent recipe developers and other established contributors; a degree should not be the universal entry gate. Separate **verified identity/credentials**, **creator tools**, and **per-recipe permissions**. A paid subscription must not purchase a credibility badge, and identity verification never certifies ownership of a publisher’s text or photographer’s image. State what a badge actually verifies.

Begin with a small, free permission partnership: credited profile/source links, clear cook/adaptation attribution, correction route, permission controls and respectful aggregate activity. Agree which recipes/assets Fork can host, what users can adapt/publish/export, commercial use, territories, attribution, duration and withdrawal treatment. Publishing one’s own work under Fork terms does not license third-party material that person merely imported. Later paid publishing/community tools, collection management and aggregate analytics must demonstrate creator value. Commissioned recipes or negotiated licenses are **costs**; creator subscriptions are potential **revenue**; marketplace revenue sharing adds payment, tax, rights and support work and remains later. None justifies increasing the current revenue scenarios.

Use understandable permission labels such as “Cook/log/link” and “Fork and publish permitted under this license,” with the actual grant accessible. These are interface examples, not a final legal schema. Unknown rights should default to source-link-only sharing rather than an invented clearance claim. Hosting permission is not automatically adaptation/export permission. Existing authorized forks may survive a creator’s later changes under their license; custom termination depends on terms, and compliant CC BY grants are irrevocable. Do not promise retroactive recall of downloads or universal permanent rights. ([CC BY legal code](https://creativecommons.org/licenses/by/4.0/legalcode.en))

## 6. Handle recipe rights without promising platform immunity

### A copied chef recipe creates potential claims, not automatic platform liability

**Yes, Fork can receive a complaint or face a claim when a user posts a chef’s recipe as their own; liability is not automatic merely because the user posted it.** What was copied, permissions/exceptions, Fork’s own acts and knowledge, and the applicable intermediary rules matter. Professional status does not create a general copyright monopoly over a dish’s underlying facts or method. Copying expressive directions, headnotes or photographs is materially different from cooking the dish and sharing an original note/photo. In the US, ingredient lists/basic procedures are generally unprotected while original expression can be protected. Canada distinguishes ideas/facts from original expression but this research establishes no identical recipe-specific blanket exemption. ([US Circular 33](https://www.copyright.gov/circs/circ33.pdf), [CIPO guide](https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/guide-copyright))

Plagiarism and infringement overlap but differ: passing off another person’s idea can violate Fork’s credit policy without settling copyright; credited copying can still infringe. Buying a cookbook, finding a free webpage, changing an ingredient or calling something “inspired by” does not clear copied prose/photos. Private importing is not universally exempt. Fair use/fair dealing are fact-dependent; no safe word count or percentage-change rule should appear in the product. Canada’s non-commercial user-generated-content exception also has specific conditions, not a blanket license for a paid platform’s catalog. ([US fair-use FAQ](https://www.copyright.gov/help/faq/faq-fairuse.html), [Canada s29](https://laws-lois.justice.gc.ca/eng/acts/C-42/section-29.html), [s29.21](https://laws-lois.justice.gc.ca/eng/acts/C-42/section-29.21.html))

**Forking is not an ownership reset.** A cook’s new original writing/photo can have separate rights without transferring the chef’s existing expression; a minor tweak does not automatically earn a new copyright. US §103 limits derivative-work copyright to new material and excludes unlawfully used portions, while §106 reserves derivative-work preparation subject to exceptions. Canada instead requires analysis of substantial reproduction and specified protected acts under s3, ownership/licenses under s13, and moral rights—do not transplant the US rule wholesale. Ordinary use of cooking facts differs from republication. ([US §§103/106](https://www.copyright.gov/title17/92chap1.html#103), [Canada s3](https://laws-lois.justice.gc.ca/eng/acts/C-42/section-3.html), [s13](https://laws-lois.justice.gc.ca/eng/acts/C-42/section-13.html))

### US and Canadian procedures need distinct operating paths

| Jurisdiction | Conditional protection and duties | What Fork must not assume |
|---|---|---|
| **United States** | Qualifying user-directed hosting can seek §512 safe harbor: registered/public designated agent, reasonably implemented communicated repeat-infringer policy, qualifying technical-measure accommodation, compliant notice handling, and knowledge/control/financial-benefit conditions. | Section 230 is not an IP shield; losing §512 protection does not automatically prove infringement. An email address alone is not agent registration. Universal proactive scanning is not a safe-harbor condition. |
| **Canada** | Section 31.1 protects specified intermediary acts, including qualifying digital-memory hosting, subject to exceptions. Sections 41.25–41.26 apply notice forwarding/record retention to qualifying recipients, including covered hosts. | Notice-and-notice is not automatic US-style takedown. These protections do not authorize Fork’s own infringing acts, and services primarily enabling infringement face separate rules. |

The US process calls for expeditious action on qualifying notices, uploader notification and a proper counter-notice path. Its statutory restoration window is **10–14 business days after receiving a qualifying counter-notice**, unless notice of the specified court action arrives. Agent registration and renewal, policies and actual execution matter; neither a terms checkbox nor indemnity from users substitutes for operations. ([17 USC 512](https://uscode.house.gov/us/usc/119-124/t17/s512/), [Copyright Office guide](https://www.copyright.gov/512/), [agent directory](https://www.copyright.gov/dmca-directory/), [47 USC 230(e)(2)](https://uscode.house.gov/us/usc/119-136/t47/s230/))

For covered Canadian recipients, forward compliant notices electronically as soon as feasible, tell claimants whether forwarding occurred, and retain identifying records **six months**, extended to **one year from original receipt** when timely notified of proceedings. Notices demanding settlements/money/personal information do not qualify under these sections. A notice is an allegation, not a judgment; disclosure of user identity is not automatic. **Do not transplant the US restoration clock into Canada.** Court orders and other liability questions still require action. ([Canada s31.1](https://laws-lois.justice.gc.ca/eng/acts/C-42/section-31.1.html), [s41.25](https://laws-lois.justice.gc.ca/eng/acts/C-42/section-41.25.html), [s41.26](https://laws-lois.justice.gc.ca/eng/acts/c-42/section-41.26.html))

Canadian moral rights separately address attribution/anonymity and integrity. They are not assigned with copyright, though they can be waived; not every disliked edit establishes an integrity violation, which has its own legal conditions. Creator permissions therefore need more than a source field. Targeting US/Canada does not resolve territorial application or operator status: Fork’s entity/location remain unconfirmed, and a user-country checkbox is not the legal routing rule. ([Canada s14.1](https://laws-lois.justice.gc.ca/eng/acts/C-42/section-14.1.html), [s28.2](https://laws-lois.justice.gc.ca/eng/acts/C-42/section-28.2.html))

### Operate a proportionate process and make restrictions reach history

For the pilot, use a visible rights-report route without requiring claimant signup, a monitored inbox, named backup and a small case record covering work, URLs/assets/versions, evidence, notices, actions and dates. Separate ordinary attribution complaints, statutory notices, community reports and court orders. Give uploaders a response/appeal path; counter-notices involve legal statements/contact details, not a casual “disagree” click. Do not invent a universal 24-hour legal deadline. If relying on US safe harbor, arrange the agent/policy/process before that reliance; this is not a claim hosting without registration is itself unlawful.

**Append-only history cannot mean permanently public infringing content.** Disable affected current pages, historical versions, diffs, images/variants, previews, search snippets and served exports; inspect direct asset URLs and caches. Use lineage to locate related forks for individual review, not automatic condemnation of every descendant. Keep minimal restricted evidence or tombstones under a counsel-reviewed retention policy; legal obligations can require byte deletion. Restore backups with current restrictions reapplied and prevent withdrawn material silently returning. Copies already downloaded elsewhere cannot be guaranteed retractable.

Fork’s own curated/imported/promoted catalog is distinct from passive user storage; rights-clear editorial assets independently. Before broad public launch, obtain scoped US/Canadian counsel review of the actual entity, importer, licenses, notice paths, moral rights, evidence retention and existing-fork treatment, and rehearse a dummy case end to end. This is a focused launch dependency, not a reason to halt safe product development or require universal prescreening. No specific claim or Fork’s eligibility has been adjudicated here. ([US legal detail](../2026-11-08-social-launch/us_copyright.md), [Canada legal detail](../2026-11-08-social-launch/canada_copyright.md))

## 7. Treat revenue as a testable outcome, not a forecast

### The credible first business is a small paid utility

Current competitive prices leave little room to charge merely for recipe storage. Test **US$24/year personal** and **US$36/year household or power use** as hypotheses after a working bundle exists. Start with one paid offering if a second has no distinct value; do not launch household and power tiers merely to fill a pricing table. The illustrative $30 blend below corresponds to an even account mix at $24/$36, and a household counts as one paying account. Paprika’s introductory subscription and AnyList’s low household price make the premium a burden to earn, not evidence Fork can charge it. ([Paprika launch](https://www.paprikaapp.com/news/2026/11/06/paprika-4-is-now-available-for-all-users/), [AnyList Complete](https://www.anylist.com/complete))

**Keep basic participation free as a packaging hypothesis:** friend connections, posting/reading real cooks, appreciation/comments, ordinary cookbook utility and logging. Charging before a circle works would confound the pilot. Paid candidates are shared household libraries, generous import/photo allowances, larger-library convenience, richer development/diary exploration and bounded AI credits. Determine limits from actual use and costs. Keep existing content access, recovery, privacy and full owned-data export available on downgrade. Avoid unlimited lifetime AI economics and coercive lock-in.

Social offers a plausible acquisition/retention benefit, not permission to inflate this model. Track friend-pilot hosting, photo, support, moderation and legal-review costs separately; the existing support reserve is not validated against those operations. Revise assumptions only after independent cohorts and paid behavior supply evidence.

### Transparent scenarios show how much acquisition and retention matter

**All scenario money is USD. These are arithmetic scenarios, not forecasts or probabilities.** They begin at a hypothetical paid launch with zero users, constant registrations, conversions in the signup month, annual billing at the beginning of the month, no refunds and entitlement lasting the paid year. Annual nonrenewal represents churn. Actual acquisition, activation, conversion and renewal are unknown; the opportunity cannot be estimated probabilistically from this research.

| Assumption | Conservative | Base: working niche | Upside: strong niche |
|---|---:|---:|---:|
| New registrations/month | 100 | 500 | 2,000 |
| Activation among registrations | 35% | 45% | 55% |
| Paid conversion among activated accounts | 3% | 6% | 8% |
| Implied paid conversion among all registrations | 1.05% | 2.7% | 4.4% |
| New paying accounts/month | 1.05 | 13.5 | 88 |
| Annual paid renewal | 60% | 70% | 80% |
| Annual revenue per paying account | $30 | $30 | $30 |
| Fixed infrastructure/operations budget/month | $60 | $120 | $350 |

Define activation as receiving real value—for example saving several useful recipes and returning to retrieve/cook one—not completing signup. Fractional accounts are expected-value arithmetic, not literal customer counts. Let monthly new payers be `n`, annual renewal `r`, annual price `p`. Month-12 entitlements are `12n`; month-24 entitlements are `12n(1+r)`. Year-one recognized revenue is `78np/12`; year two is `(144+78r)np/12`. Annual billings are `12np` then `12np(1+r)`. ARR here annualizes current paid entitlements; a real operating report must account for known nonrenewals.

| Output, rounded | Conservative | Base | Upside |
|---|---:|---:|---:|
| Cumulative registrations, month 24 | 2,400 | 12,000 | 48,000 |
| New paying accounts acquired, 24 months | 25 | 324 | 2,112 |
| Active paid entitlements, month 12 / month 24 | 13 / 20 | 162 / 275 | 1,056 / 1,901 |
| ARR, month 12 | $378 | $4,860 | $31,680 |
| ARR, month 24 | **$605** | **$8,262** | **$57,024** |
| Recognized subscription revenue, year 1 | $205 | $2,633 | $17,160 |
| Recognized subscription revenue, year 2 | $501 | $6,703 | $45,408 |
| Recognized subscription revenue, 24 months | **$706** | **$9,335** | **$62,568** |
| Cash subscription billings, 24 months | $983 | $13,122 | $88,704 |

The annualized stock, revenue earned during a period, and cash collected are different quantities. An annual subscription received near month 24 brings cash now while committing Fork to future service. This distinction prevents a small growing subscription product from looking more profitable than it is.

Retain **5.6% of billings as an illustrative processor/Billing allowance**, preserving the scenario arithmetic; it is not a US/Canadian quote, guaranteed ceiling or selected merchant jurisdiction. Actual entity, processor/account country, card mix, payment frequency and settlement/FX terms remain unconfirmed; customer geography does not determine them. Current US and Canadian schedules differ. Reserve **$0.70 per paid account-month**: $0.20 AI, $0.10 incremental media and $0.40 cash support/moderation allowance. These reserves and fixed budgets are assumptions, not measured token costs or sufficient staffing guarantees. ([Stripe US](https://stripe.com/pricing), [Stripe Canada](https://stripe.com/en-ca/pricing), [fee caveat](../2026-11-08-social-launch/social_launch.md))

| 24-month cost and cash view | Conservative | Base | Upside |
|---|---:|---:|---:|
| Payment/Billing fees | $55 | $735 | $4,967 |
| AI/media/support variable reserve | $198 | $2,614 | $17,519 |
| Fixed infrastructure/operations | $1,440 | $2,880 | $8,400 |
| Cash billings less these costs | **−$710** | **$6,893** | **$57,818** |
| Billings still unearned at month 24 | $277 | $3,787 | $26,136 |
| Recognized revenue less cash-period costs | **−$987** | **$3,107** | **$31,682** |

The last row is a simplified operating comparison, **not accounting profit**: payment fees are deducted when billed rather than amortized. Exclusions are founder salary/time, acquisition spend, taxes, refunds/disputes, professional advice, native-store commissions and future development. Free-user serving, email, monitoring and any trial AI must fit the fixed budget or be added. Supabase Pro starts at $25/month but usage determines fit; Netlify’s current credit-based pricing requires the actual account/usage rather than reusing an old $9 assumption. ([Supabase pricing](https://supabase.com/pricing), [Netlify pricing](https://www.netlify.com/pricing/))

At this blend, annual contribution before fixed costs is approximately `$30 × 94.4% − $8.40 = $19.92` per active paid account. About **73 paid accounts** cover $120 monthly fixed costs before acquisition or founder work. A chosen **$60,000 founder-pay target plus $4,200 annual fixed costs needs about 3,223 paid accounts** at the same economics. Month-24 annualized contribution after modeled fixed/variable costs is approximately **−$318 / $4,046 / $33,664**. Thus even the upside scenario does not automatically establish a comfortably funded full-time business.

Halving registrations or conversion roughly halves payer/revenue outputs at constant renewal. A $24 price lowers gross revenue 20% versus $30; $36 raises it 20%, before behavioral effects. Raising AI from $0.20 to $1 per paid account-month cuts month-24 annualized contribution by about **$194 / $2,644 / $18,248**. A $10 acquisition cost per new payer consumes another **$252 / $3,240 / $21,120** over 24 months. Extra currency conversion at 2% subtracts 2% of billings; native-store economics require a new channel model. Pricing, conversion and retention are not independent in reality. ([Scenario derivation and assumptions](advanced_and_quality.md))

### Build and measure the features that improve the economics

| Investment | Plausible business mechanism | Evidence required before expanding |
|---|---|---|
| Faithful import/migration and first-cook onboarding | Acquisition/activation: lower switching effort | Correction work, import-to-first-cook completion and retained cohorts versus manual setup. |
| Mobile editing/cooking, offline, print | Retention: dependable at the moment of use | Repeat purposeful sessions/cooks; device failures and abandonment. |
| Collections, groceries and planning | Habit: more useful occasions each week | Repeated planning→shopping→cooking use, not simply lists created. |
| Version-linked attempts/adaptations | Differentiated retention and paid value | Past notes reused, successful revisions revisited, willingness to pay versus cheaper alternatives. |
| Friends feed, cook comments and source-linked saves | Repeat inspiration and referral acquisition | Non-founder pairs, friend-inspired later cooks and voluntary return; separate founder reminders from independent use. |
| Household sharing | Conversion and retained shared value | Invitations accepted, another member active and renewal; count households once. |
| Readable attributed shares and creator examples | Referral acquisition | Shared visit→activation→repeat use, rather than share count or impressions. |
| Bounded AI import help | Reduced correction effort and possible premium value | Cost per accurate saved recipe, total task time and actual paid retention. |

The acquisition sequence in section 5 starts with Spencer’s actual circle and tests connected but independent clusters before creator/club partnerships or public growth. Measure attributed visit/invite → connection → useful save/log → subsequent useful session → friend-inspired cook → optional paid depth. Do not infer a viral coefficient from invitations or use technical launch traffic as a substitute for serious cooks. Measure cash acquisition cost and founder effort by channel before paid campaigns.

Test price against a working bundle with clear delivery/refund terms. Record purchases separately from interest, interview people choosing cheaper/free alternatives, and measure renewal with cohort counts. Keep save/retrieval/cooking quality metrics beside social metrics; readers who use their cookbook but rarely post still receive value. Never collect private recipe text just for analytics. The old April 2027 deadline and 200-weekly-logger threshold remain speculative historical numbers, not business laws.

For the portfolio, demonstrate one coherent story: a friend posts an actual cook with permission/source credit, another saves it and cooks their version, and a useful note improves the next attempt. Later extend it to a pinned dough inside a pie, grocery list and printout. Document transaction/concurrency invariants, migration choices, privacy tests, accessibility findings and before/after task results. Distinguish shipped behavior from planned screenshots. The engineering is already interesting; the next improvement is making its value immediately understandable to a cook.

## Decision ledger and evidence boundaries

### Preserve earlier commitments while replacing obsolete sequencing

This report supersedes the active ordering and estimates in the historical roadmap. It preserves ideas explicitly accepted by Spencer; “later” means delayed with a dependency or decision gate, not silently cancelled. The September blanket social deferral was superseded in October. Spencer’s explicit 8 November approval now establishes social as a defining pillar and an early friends pilot; cookbook quality remains a parallel commitment, not a reason to defer basic social until P5. ([Preserved historical roadmap](../../ROADMAP.md))

| Earlier milestone | Current disposition |
|---|---|
| M1 Pull requests | P4–P5 reviewed “Suggest a change”; retain concurrency/permission/attribution, rewrite old implementation sketch under current schema/content rules. |
| M2 Per-page metadata | Already built locally; verify public previews, add public Recipe structured data in P1. |
| M3 Version comments | Simple cook-event comments enter early P2; comments tied to recipe-version review remain P4. Both retain their context and privacy. |
| M4 Following/feed | Committed early P2: profiles, approved following, chronological Friends feed, appreciation/comments and useful notifications. Broader algorithmic discovery stays P5. |
| M5 Lineage visualization | P4 prototype/P5 decision; existing public fork list is built; graph must solve a navigation problem. |
| M6 Collections | P1 personal, P3 household; elevated to core organization. |
| M7 Fuzzy diff matching | P4 bounded quality work; avoid conflating distinct ingredients; simple exact comparison remains fallback. |
| M8 Search ranking | P1 known-item/current-content relevance first; popularity is a public-discovery signal, not the default personal ranking. |
| M9 Optimistic concurrency | Already built locally; preserve and validate in P0, extend to reviewed suggestions later. |
| M10 Drizzle migrations | Shipped historical infrastructure; current schema/migration rules govern every new slice. |
| M11 Timers | P2 multiple named persistent-deadline timers; supersede component-local timeout sketch. |
| M12 Gram tables | P2 carefully sourced conversion coverage; broader data P4 only with ingredient/preparation matching. |
| M13 User weights | P4 controlled explicit overrides after built-in correctness; no false certainty. |
| M14 iOS | P2 web/offline improvements, P5 native decision based on measured limits; AI is not a dependency. |
| M15 Import | P1 paste/files/URL and first migration; P5 OCR/social capture; P4 Cooklang subset. Earlier exclusion of competitor migration is superseded by switching needs. |
| M16 Export | P1, brought forward before import dependency; retain full history/provenance and later logs. |
| M17 Attempts | Early P2 Journal and social activity object; recipe/version/scale attached when available, external-source/improvised cooks valid. Retain Made it/count/last-cook concept, independent audience and optional note/photo. Placement beside Cook remains a design call. |
| M18 Cook mode | Already built and modern controls observed live; P2 validation/refinement, not a replacement feature. |
| M19 Match highlighting | P1, preserved explicit request. |
| M20 Tick affordance | P2 side-by-side cooking-task evaluation, preserved explicit request. |
| M21 Pantry matching | P3 bounded on-hand/missing-ingredient experiment; accepted idea retained. |
| M22 Subrecipes | P4 committed version-pinned component capability, preserving the explicit acceptance. |
| M23 Graphical cooking view and timeline | Accepted later direction: P4 optional ingredient/step/component dependency view for power users, provisionally Cooklang-backed recipes first; timed layout follows meaningful durations. Separate from M5 lineage. No near-term build date. |

Other preserved preferences include warm cookbook styling, desktop two-column reading, intentional phone/iPad/desktop layouts, monospace diff pages, editable serving input without ×2/÷2 clutter, no equal-weight history tabs, username settings, private-first publishing and honest traction. Already implemented photos-in-history, tick persistence and fork listing supersede old absence claims. Earlier source snippets, enum/migration directions and hour estimates are historical material, not instructions to execute.

Nonblocking product calls remain: Cookbook/Journal/Friends navigation and exact grouping language, post-MVP local versus synced draft recovery and Trash/retention policy, pinned-save access after unpublishing, first migration format, household versus power packaging, Made it placement and the first native platform if warranted. The recommendations above allow work to proceed to concrete designs; settle each call when its slice needs it rather than asking for a speculative global specification now.

### Reconciliation with the 9 November 2026 design decisions

Spencer reviewed the offline decision pack (`docs/design/2026-11-10-decision-pack/`) on 9 November 2026. Its `DESIGN-SUMMARY.md` is the design direction for the MVP builds; where it and this report differ, the summary wins and the differences are:

| This report said | Decided 9 November |
|---|---|
| Verbs "Save to cookbook" and "Make my version" | "Save" and **"Fork"**. Fork is the product's identity; revisit only if users visibly struggle. Counts read "saves" and "forks". |
| Cook-event comments enter the early P2 pilot | **No Comment in the first release.** Like (with a visible count), Save and the ⋯ menu only. Comments follow once the feed has real use. |
| "Real cooking matters more than engagement counts" | Both matter. Likes show their count in the Friends feed. |
| Private-first recipes, public on explicit publication | Three recipe audiences: **Only me / Friends / Public**, Only me default. Every surface, Discover included, lists what the viewer may see, so a friend sees your Friends-level recipes there; strangers see Public only. Log entries have two: Only me / Friends. |
| Cookbook / Journal / Friends is a task model to test | Adopted as the navigation, plus **Discover** as the fourth destination. Signed out, `/` is Discover; signed in, Cookbook. |
| "Made it" placement beside Cook is a design call | Settled: "Add to Journal" at the end of Cook, and a personal "You cooked this on … · Add to Journal" line on the recipe page. |
| Tick affordance: side-by-side evaluation in P2 | The shipped 16px marigold circle stays for the MVP; M20 remains a P2 revisit. |
| Ingredient quantities beside steps: build P2 with explicit references | **Moved to P4** with the Cooklang-style markup that supplies the references. Settings toggle when it lands. |
| "Save to cookbook" versus version-pinned save | The MVP Save pill is the moving favorite. The version-pinned save stays a P1 item with its own control. |
| No public scores in the pilot | Unchanged for the MVP. A public recipe rating is a later recipe feature, not a Journal one. |
| Durable drafts, Trash, Party mode, graphical view, AI | Unchanged: out of the MVP. |

Settled the same evening when the build was authorised: forks of a Friends recipe may be Only me or Friends, never Public, enforced server-side; the 16px ticks stay with 44px phone hit areas; Cook pins to the version in the URL, survives reload, and hands version and serving scale to the Journal entry; Discover's lead card uses saves over the last 7 days; audiences are Only me / Friends / Public for recipes and Only me / Friends for Journal entries. Deferred features stay deferred.

**Collections (Spencer, 9 Nov):** v1 is manual user collections ("To cook", "Good for parties", "Quick", "Healthy"), recipes added by hand, P1 as already tabled. Later versions add rule-based collections that fill themselves, for example "Max & Spencer's recipes" gaining every recipe a named friend adds. The v1 data model should leave room for a rule on a collection (a nullable rule column or a sibling table), not for stored membership only.

Not changed by the pack and still owed by the builds: the pilot's interim owner-data export, report/mute/block with manual moderation, profile pages gaining a friend request control and friends-level recipes, and the P1 cookbook items (collections, pins, search highlighting, paste/URL capture, print and archive) that the Cookbook grid must leave room for.

### Backlog adjustments, 9 November 2026 (evening)

Spencer re-phased these after reviewing the full post-MVP backlog. They override the disposition table above.

| Item | Was | Now |
|---|---|---|
| Durable drafts and autosave across reload | Post-MVP, unscheduled | **P1** |
| Trash and deleted-recipe restore | Post-MVP, unscheduled | **P1** |
| Recipe photo access follows the recipe's audience (private and friends-level photos are not publicly addressable) | Unlisted | **P1** |
| Settings page (account, username, default audience, later the measurement and inline-quantity preferences) | Unlisted | **P1** |
| Measurement system preference (metric / US) per user | Unlisted | **P1** |
| Recipe-level "last cooked" and "times cooked", derived from log entries, on cards and the recipe page | M17 concept only | **P1** |
| Serving scaler redesign: the current control doesn't feel like Fork; needs a design round | Unlisted | **P2 design backlog** |
| Onboarding and the new account's first ten minutes | Unlisted | **P2** |
| Audience-change side effects (saves, forks and log entries when a recipe becomes more private) | "State before release" | **P2, revisit** |
| Profile page redesign for the social world (friend request control, friends-level recipes, log entries) | "Owed by the builds" | **P2** |
| Global search with scoping filters (all friends' recipes, one person's recipes, mine, saved) | "Current content by default" | **P2** |
| Email notifications alongside in-app | Unlisted | **P2** |
| Journal and log-entry data export | Passing mention | **P2** |
| Easy import: text documents, Markdown files, other sites where possible | P1 paste/URL/files | **P2** (paste-first editor stays MVP) |
| Comment moderation (report a comment, delete on your own entry) | Unlisted | **P2**, with comments |
| Profile discovery: find friends and prolific cooks. A People scope in the global search (handle or name) with a friend-request control on the result, and a small "Cooks" strip on Discover ranked by public recipes and saves so prolific users surface | Unlisted (friend by URL or invite only) | **P2** (personalised suggestions stay P5 with algorithmic discovery) |
| Desktop app for Fork (Mac first; likely a PWA or thin wrapper over the web app, decided with the native platform call) | Unlisted | **P5**, alongside the native iOS/Android decision |
| Fork icon redesign: the stats-row fork glyph reads poorly and is the likely app logo, so it gets a proper mark, not a quick fix | Unlisted | **P1 design backlog**, with the scaler redesign |
| Cook mode visual distinction: cooking view looks too close to the recipe page | Unlisted | **P1 design backlog** |
| Editor photo field redesign: the photo itself with two pill overlays (Replace, Remove), or a single Add photo pill when empty. Separately, today Replace is a small-caps ink text button and Remove a serif clay one: two text-button styles where DESIGN.md allows one | Unlisted | **P1**, soon |
| Editor preview: a Preview option showing the recipe as it will appear on its page before saving | Unlisted | **P2** |
| Friends feed entry card: drop the "Shakshuka · v1" source line under the title; the entry title itself links to the recipe at the version that was cooked | Unlisted | **P1** polish |
| Text-button hover: whether word-buttons underline on hover (off for now; colour change only) | Unlisted | **P1 design backlog** |
| Journal icon: the side-view book is a placeholder; refine with the fork icon work | Unlisted | **P1 design backlog** |
| Dropdown panel background: the lifted white reads out of place against paper; revisit the colour | Unlisted | **P1 design backlog** |
| Hover colours: revisit Clay Deep (#6e2500, kept for now) and the hover palette as a whole | Unlisted | **P1 design backlog** |
| Ingredient search scaling: the title index is ORed with a scan over every version's ingredients, so each search reads the whole table (schema review, 10 Nov 2026). Move ingredient text into an indexed column when recipe count grows | Unlisted | **P2**, with global search |
| Search in place: tapping search opens a search field on the current page instead of navigating to /search; decide phone-only or phone and desktop | Unlisted | **P2**, with global search |

Settled later the same evening:

**Unfriend, block, mute.**
- Unfriend hides the other person's friends-level recipes at once, everywhere the same access check runs: Cookbook, search, collections, thumbnails and direct links. The save row stays so re-friending restores it.
- Forks the ex-friend made of your friends-level recipe stay theirs, but losing source access makes the fork private, and it cannot be published or shared with a new audience afterwards ("friends" of the fork owner is never a path to your recipe). Server-enforced like never-widen.
- Their Journal keeps their own dish name, photo and notes; the recipe reference hides. No source text or source photo survives through the Journal.
- Block = unfriend plus no requests or interactions in either direction. Existing likes and comments are hidden, not deleted. Public content stays publicly reachable; the UI explains that blocking restricts interaction, not public access.
- Mute hides their feed entries for the muter only; private.

**Tags, collections, filters.** Tags describe the recipe and follow the recipe's visibility (a tag on a friends-level recipe is not public). Collections organize your cookbook; "Italian" is as legitimate as "To cook". Filters are transient views, never saved. Want-to-cook and pins stay distinct concepts: "To cook" is intent; a pin may be intent or a frequently cooked recipe.

**Save and collections (settled 9 Nov, late).** Save is one tap, "keep this", into the Cookbook's Saved shelf, never a question. When collections ship (P1): optional "Add to collection" adjacent to Save or in the menu, never replacing the Saved confirmation; a recipe may sit in several collections; owned and saved recipes organize identically; removing from a collection leaves the recipe in the Cookbook (membership, not copies). Starter collections "To cook" and "Favorites" cover the two established intents (want to try; a keeper) without a separate Favorite system or another recipe-page button; a star shortcut can follow if wanted. Competitor evidence (Paprika, Recipe Keeper, AnyList, Samsung Food) is documentation, not usability testing.

**Save version.** One Save action, the moving favorite. "Keep this version" arrives later as an option on a saved recipe, with the state shown visibly on the recipe page ("Keeping v3" with "Follow latest version" to reverse), not only inside the menu. A kept version lasts across visits; a Cook URL selects the version for that cooking session only. Neither overrides access permissions.

### Retain the cookbook-app inventory as a sourced candidate backlog

**Spencer, 9 November 2026, confirmed after the coverage audit:** add all **87 entries** from the [Mac cookbook-app deep dive](../2026-11-09-cookbook-app-deep-dive/README.md) to the retained roadmap scope: the original 78 features/refinements and Q01–Q09. Refine, combine and sequence them as the relevant workstream is built; any trimming needs a recorded reason. The inventory is incorporated here by reference rather than duplicated, so its stable IDs, sources and decisions have one home. Approval to retain the full scope does not move later features into the MVP or remove the need to resolve an entry's uncertain behavior before implementation.

| Retained IDs | Workstream and current placement |
|---|---|
| E01–E11 | Editor and recipe representation; accepted editor refinements now, advanced media/duplication later as already scoped. |
| S01–S08 | Scaling and conversion, within the P2 scaler workstream. |
| C01–C13 | Cooking, timers and session state; P2 timers, P3 multi-recipe coordination, P4 ingredient-step references remain distinct. |
| L01–L11 | Library and retrieval; P1 manual collections/current-content relevance, P2 global search, rule-based collections later. |
| I01–I08 | Capture and migration; paste-first editor remains MVP, easy import P2, richer OCR/social capture later. |
| X01–X05 | Print and portability; preserve P1 print/archive and P2 Journal export, richer book production later. |
| G01–G08 and M01–M06 | Shopping and planning; P3 workstreams with later refinements, not MVP gates. |
| A01–A08 | Advanced recipes, household, creator, assistance and platform candidates; retain their existing dependencies and phase decisions. |
| Q01–Q09 | Accepted roadmap additions from the coverage audit; resolve details within the relevant parsing, cooking, planning, search, capture, pantry and social workstreams. Fold overlapping work into existing IDs while preserving traceability. |

**Three choices are already selected, not merely suggested candidates:** Paprika-like desktop editing with title/metadata left, photo right spanning those rows and ingredients/method below; equivalent `50%` / `1/2` / `0.5` scaler entry combined with a slider; and inline timers connected to a separate multi-recipe overview with persistent cooking-session state. These refine the current design and P2 scaler/timer work without moving Party Mode or the graphical view into the MVP.

Use the [inventory’s source map and audit](../2026-11-09-cookbook-app-deep-dive/README.md#retain-additional-leads-without-pretending-the-sweep-is-exhaustive) to trace candidates to [Crouton evidence](../2026-11-09-cookbook-app-deep-dive/notes/crouton.md), [Paprika evidence](../2026-11-09-cookbook-app-deep-dive/notes/paprika.md) and [Recipe Keeper evidence](../2026-11-09-cookbook-app-deep-dive/notes/recipe-keeper.md), then to the linked official guides. **T** means tested, **V** visible control only and **D** developer-documented; proposed Fork adaptations are recommendations, not claims about competitor behavior.

“Later” and “optional” preserve a candidate for consideration. They are not silent rejections. Combining entries should retain their IDs or record their replacement; rejecting an entry requires a concrete product, usability, reliability or cost reason recorded beside it. Competitor prevalence and user requests are meaningful inclusion signals, not grounds for dismissal and not automatic evidence of demand magnitude. This is a comprehensive sourced backlog from the researched surfaces, **not an exhaustive inventory of every platform, paid feature or interaction**, nor an instruction to build every candidate before launch. Remaining access and behavior tests are listed in the research report.

**Discovery and delivery decision:** pause broad new-feature discovery until most of this scope has been built and used. Revisit the gaps exposed by actual cooking, the friend-group pilot and later independent users. Targeted reference checks needed to implement an accepted item correctly can continue; they are not a reason to reopen the whole competitive sweep. User-reported blockers, accessibility failures, privacy problems and data-loss risks should be addressed when found rather than waiting for the backlog to finish.

For each coherent feature slice, record the user task it makes easier and verify the complete workflow, including applicable keyboard/mobile behavior, permissions, error/recovery states and realistic recipe data. Include a short real-use feedback pass after each phase, with fixes and refinements fed back into the existing workstreams. These are delivery requirements, not another feature expansion. The pilot can begin with the usable core; it does not wait for all 87 entries.

### Paprika feature follow-up: substitutions, search and companion surfaces

**Spencer, 9 November 2026:** explicitly retain the features highlighted on [Paprika's homepage](https://www.paprikaapp.com/), with details and evidence in the [inventory follow-up](../2026-11-09-cookbook-app-deep-dive/README.md#paprika-homepage-follow-up):

- **C12/A04 — Recipe-aware substitutions:** accessible from the ingredient, with reviewable quantity adjustments and expected effects. Keep the original recipe intact; a cook-specific substitution can later be recorded in Journal or deliberately saved as a version.
- **L03/L10 — Advanced search:** combine useful fields such as ingredients and preparation time, with saved rules expressed through later rule-based collections. Preserve the existing search sequencing.
- **A07 — Future companion surfaces:** name interactive meal/grocery widgets, an Apple Watch companion for cooking steps, groceries and timers, and Alexa/Echo Show meal, shopping and cooking access explicitly. Sequence these with platform work after the underlying workflows are dependable, sharing the same permissions and session state.

These are explicit refinements of retained IDs, not additional numbered features or new MVP requirements. Paprika's implementation and platform availability are references, not proof of compatibility with Fork; provider, device and background-execution support need validation when each integration is built.

### Zed-inspired design refinement

**Accepted, 9 November 2026 — next design implementation pass.** Apply the [Zed design reference report](../2026-11-09-zed-design-reference/README.md) to the editor, recipe header/metadata and section grouping, carrying the same principles into later cooking, library and timer work. This is refinement within the existing design workstream; the report contains ten ranked adaptations, five non-transfers and six implementation choices.

- Strengthen typography hierarchy and remove redundant labels; retain readable instructions and supporting metadata.
- Align the accepted editor composition precisely: title and metadata rows beside the right-hand photo, ingredients and method below.
- Use spacing and fine rules for grouping, with filled panels reserved for distinct content or interactions.
- Keep accent roles consistent and secondary actions quiet but discoverable; preserve visible focus and generous hit areas.
- Reflow controls and content on phones while retaining comfortable reading sizes.

Keep Fork's approved warm palette, Bitter/Source Sans typography and photography-led cookbook identity as the starting point. Tune weights, spacing and proportions in the working app; any font or palette replacement remains a separate design decision. Check long titles, missing photos, keyboard focus, contrast, mobile reflow and cooking readability before considering this refinement complete. The reference is a bounded visual study, not an accessibility certification or a requirement for another mockup round.

### Source register and limits

| Evidence | Role and boundary |
|---|---|
| [Current product audit](current_product_audit.md) | Source-linked local capability inventory and bounded live checks, 8 Nov 2026; not authenticated/runtime certification. |
| [Cookbook market research](cookbook_market.md) | Primary competitor documentation/prices and public cooking requests checked 8 Nov; documentation breadth is not hands-on quality. |
| [Mac cookbook-app inventory](../2026-11-09-cookbook-app-deep-dive/README.md) | Native fixtures, targeted Mac tests and official guides, 9 Nov; 78 retained candidates plus nine exploration leads, with source map and explicit coverage gaps. |
| [Advanced/quality/economics research](advanced_and_quality.md) | Standards, platform constraints, AI risks and unchanged scenario derivation; its older social sequencing is superseded here. |
| [Social launch research](../2026-11-08-social-launch/social_launch.md) | Friend pilot, supply/permissions and acquisition recommendations; checked 8 Nov, no invitations or permissions assumed. |
| [US copyright research](../2026-11-08-social-launch/us_copyright.md), [Canada copyright research](../2026-11-08-social-launch/canada_copyright.md) | Primary legal sources and qualified workflow guidance, checked 8 Nov; entity/territorial application and individual claims need counsel. Canadian consolidation retrieved current to 19 Oct; no exhaustive case-law audit. |
| [Prior feature research](../2026-10-31-feature-research.md), [prior business research](../2026-10-31-business-viability.md) | Historical leads and decisions. Fresh audit/primary evidence supersedes obsolete competitive exclusivity, prices, thresholds and estimates. |
| Vendor pages and official release/App Store links above | Accessed 8 Nov 2026; Paprika release dated 6 Nov. Tier/platform/promotional differences apply. |
| GitHub requests, standards and domain guidance above | Concrete jobs, implementation evidence and technical constraints; not representative demand, clinical advice or universal legal conclusions. |

The decisive next release combines a trustworthy minimum cookbook with a journal people can use after an ordinary dinner and a friends feed that leads to another real cook. Spencer’s group is the right place to learn quickly, provided founder encouragement is measured separately and independent circles follow. Keep completing the cookbook while the pilot runs; expand community reach, paid depth and AI only with evidence of useful repeat behavior and manageable rights/support operations.

**Not checked:** authenticated production flows, real-device/accessibility/performance tests, paid competitor trials, the friend group’s actual participation, willingness to pay or Fork’s legal eligibility. **Material risk:** supportive friends, source attribution and scenario arithmetic establish neither independent demand, copying permission, platform immunity nor future revenue. No invitations or creator outreach were sent.
