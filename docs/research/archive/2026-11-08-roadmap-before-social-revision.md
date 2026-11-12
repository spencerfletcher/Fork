> Archived 12 Nov 2026: an earlier draft of the [roadmap report](../2026-11-08-product-roadmap/README.md), which replaced it; the current plan is [docs/product](../../product/README.md). Kept as the research record.

# Make Fork the Cookbook That Improves

**Authoritative product direction · 8 November 2026 · serious home cooks first**

**Build Fork into an excellent personal cookbook before expanding it into an AI assistant or social platform.** The next work should protect writing and privacy, complete recipe editing and capture, make a personal library easy to navigate, and make cooking dependable on real phones and tablets. Shopping lists, light meal planning, household sharing, print, export and offline reading belong in that baseline: their prevalence across competitors and recurring requests are strong reasons to include them. Fork’s distinctive promise should then become tangible: **“Your cookbook, improved every time you cook.”** Exact recipe versions, private cooking notes and reusable components can answer what someone made, what changed, and what worked without requiring Git knowledge. This is a credible product and portfolio direction; it is not yet evidence of willingness to pay or a defensible commercial moat. The roadmap below recommends milestone gates rather than dates, preserves earlier product commitments, and treats the current interface as a foundation to improve rather than an approved final design.

## 1. Complete the cooking journey before widening the product

### The audience decision makes the scope clearer

The primary customer is a serious home cook: someone collecting useful recipes, adapting them to their household, cooking repeatedly, and wanting their accumulated knowledge to survive. Include weeknight cooks, enthusiastic bakers, family-recipe keepers and mixed-device households in discovery. Chefs matter as adjacent recipe developers: precise yields, batch scaling, reusable sauces or doughs, testing notes and clear printouts help both groups. Restaurant procurement, stock valuation, payroll, POS and multi-location kitchen operations require a different buyer and operating model. Professional platforms such as meez illustrate that broader surface; Fork should not inherit it simply because chefs use recipes. ([meez plans](https://www.getmeez.com/pricing))

The main pushback is against breadth without dependable everyday use. A beautiful recipe page is insufficient if a cook loses an edit, cannot import an existing collection, or keeps scrolling to recover an ingredient quantity. Conversely, a feature does not need a version-control angle to deserve inclusion. Competitive convergence and repeated forum requests are strong positive evidence of useful jobs; sequence them by dependencies, correctness and operating burden. Do not reject them because of their provenance. This roadmap recommends **a complete cookbook plus an unusually good improvement loop**, with advanced features extending that foundation.

### Today’s implementation is substantial, but not yet the quality target

The repository audit found implemented functionality, not a blank slate. “Built locally” below means inspected source, not a passing runtime test. “Observed live” means logged-out browser observation on 8 November at 1280×720. “Unverified” means no result was established, not that something fails. The public deployment was updated during research, and the modern recipe controls appeared on recheck; the earlier mismatch is superseded for that surface. A remaining homepage copy/order difference needs an ordinary release check, not a new deployment-centered roadmap. ([Current product audit](../2026-11-08-product-roadmap/current_product_audit.md))

| Area | Current evidence | Roadmap implication |
|---|---|---|
| Editor and history | **Built locally:** paste-friendly ingredient/method editors, retained unparsed lines, one save, snapshot history, versioned photos, comparisons, failed-save text recovery and transactional stale-write protection | Extend and preserve these strengths. Durable recovery after closing/reloading the tab was not found; history cannot recover unsaved text. |
| Cooking and scaling | **Built locally; controls observed live:** servings, Cook mode, wake-lock handling, independently tickable ingredients/steps and 12-hour version-scoped tick persistence | Refine existing behavior, then add units, timers and explicit offline reading. Do not list cook mode/scaling as unbuilt. |
| Organization | **Built locally:** own recipes, favorites, tags, public browse and title/description/ingredient search | Add collections and clearer Cookbook/Discover navigation. Ingredient search currently considers historical versions; decide and test the intended current-content contract. |
| Visibility and lineage | **Built locally:** owner checks, public/private recipes, parent recipe attribution and fork list. New recipes default public; forks inherit source visibility; no structured copied-version reference found | Fulfil the prior private-first decision; pin source versions and explain bookmark versus editable adaptation. Audit media access before promising private cookbooks. |
| Missing cookbook breadth | No collections, durable drafts, import/export routes, print styling, cook logs, shopping/planning, household grants or AI found in the bounded inspection | These are proposed additions. Existing free text supports notes informally but not structured groups, yield, sources or ingredient-step references. |
| Quality | Existing tests and accessibility provisions are visible in source | Current test results, authenticated journeys, actual phones, screen readers, production mail, private-media policy and field performance remain **unverified**. |

This source audit is bounded and linked to the relevant implementation in its evidence note. The current uploader obtains a public Storage URL; that warrants a policy/access check, not an unsupported claim of a demonstrated leak. Likewise, public-by-default behavior is a product-default issue, not proof of an authorization bypass. ([Audit evidence and limits](../2026-11-08-product-roadmap/current_product_audit.md))

### Design around a complete loop, including the inconvenient cases

| Moment | What the cook should be able to do | What “good” means |
|---|---|---|
| Capture | Type, paste a whole recipe, import a URL, then migrate existing recipes or scan a card | One reviewable editor; original source preserved; uncertain or omitted data visible; never auto-publish. |
| Organize and find | Put owned, adapted and saved recipes in a personal cookbook; use collections, tags, search and predictable sorting | Find a known recipe or an ingredient-based option without understanding site architecture. |
| Prepare | Choose servings/yield, check equipment, select optional ingredients, build a grocery list and a flexible meal queue | Accurate quantities and clear exceptions; no demand to maintain a perfect pantry or calendar. |
| Cook | Read ingredients and method comfortably, track progress, run named timers, switch between recipes, print or open a saved offline copy | No lost place, unexplained unit changes, tiny targets or false promise of locked-screen alarms. |
| Remember and improve | Record “Made it,” retain the exact version and scale, recall last time’s note, deliberately save an improvement | A one-off substitution remains an observation until the cook chooses to revise the recipe. |
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

**The differentiation claim must be narrower than “only Fork has versions/logs.”** Cooklang advertises Git workflows, and Mealie’s merged subrecipe implementation references “I Made This” and a timeline. Fork’s opportunity is the integrated experience: capture a recipe faithfully, cook comfortably, remember an exact iteration, and turn a successful adjustment into a reusable version. That is a positioning hypothesis to prove with users, not a discovered monopoly. ([Cooklang](https://cooklang.org/), [Mealie implementation](https://github.com/mealie-recipes/mealie/pull/4800))

### Public requests reveal concrete jobs worth building

| Evidence of a recurring problem | Decision for Fork |
|---|---|
| Mealie users describe repetitive US/metric conversion and separate temperature preferences, including 2026 discussion. [#3881](https://github.com/mealie-recipes/mealie/discussions/3881) | Include reversible unit and temperature display in the base cooking phase; distinguish dimensional conversion from density estimates. |
| Range quantities and alternatives appear in specific requests. [#2989](https://github.com/mealie-recipes/mealie/discussions/2989), [#3717](https://github.com/mealie-recipes/mealie/discussions/3717) | Preserve ranges and free text; make optional/alternative selections explicit when generating shopping lists. |
| Concurrent timers and whole-recipe totals versus step allocations are documented needs. [Mealie #1573](https://github.com/mealie-recipes/mealie/discussions/1573), [Tandoor #1325](https://github.com/TandoorRecipes/recipes/issues/1325) | Include named simultaneous timers and ingredient-step references. The Tandoor issue is now Done; the need remains relevant. |
| Users describe variant clutter and reusable crust/stock components. [Mealie #880](https://github.com/mealie-recipes/mealie/discussions/880), [#1761](https://github.com/mealie-recipes/mealie/discussions/1761) | Group adaptations and build version-pinned subrecipes after reliable yield/scaling. The latter has implemented competitor work, strengthening category evidence. |

These are self-selected accounts, useful for identifying real friction and supporting inclusion. They do not estimate population prevalence. Interviews and observed cooking should determine defaults, usability and release order; they should not become a pretext for indefinitely postponing already well-supported basics. No reliable competitor market shares, paying-subscriber counts or category-wide willingness-to-pay estimates were established in this sweep. ([Market evidence note](../2026-11-08-product-roadmap/cookbook_market.md))

## 3. Ship six phases with observable completion gates

### P0–P2 establish the excellent cookbook; later phases deepen it

Sizes describe relative scope: **S** is bounded presentation or logic; **M** crosses flows/data/state; **L** introduces substantial model, platform or operational complexity. A phase contains several slices, not one giant ticket. These are not hourly estimates or delivery promises. Quality gates persist through every phase; completing P0 does not finish reliability work.

| Phase | Deliverable and dependencies | Completion gate |
|---|---|---|
| **P0 — Trust the work** | Durable local draft recovery, truthful save state, private-first creation/adaptation, media/access verification, conflict recovery, auth/mail usability and backup/restore exercise. Mostly M. | Interrupted edits recover; both stale and saved work remain available; no silent publication; private recipe/media/history surfaces pass owner/other-user/logged-out checks. Existing behavior tests run successfully. |
| **P1 — Own a useful cookbook** | Groups, yield/source/notes, preview and restore-as-new-version; coherent Cookbook/Discover, collections/search/pins; print and portable archive; paste/URL capture and one migration format. M slices, after P0. | A cook brings a realistic recipe/library into Fork, corrects it, organizes and retrieves it, prints/exports it, and restores an older iteration without loss of declared content. |
| **P2 — Cook and return** | Refine existing mobile/tablet cooking, scaling/ticks; units/temperature, multiple named timers, explicit offline saves, ingredient access from steps; thin private “Made it” log. M–L, after stable P1 content. | Real meals on supported devices succeed without lost place or incorrect quantity behavior. Reopen offline, resume timers honestly, cook twice and recover the exact last version/scale/note. |
| **P3 — Support the household routine** | Grocery list, simple meal queue/calendar, household cookbook/list permissions, optional-ingredient choices; ad hoc pantry matching and richer diary. M–L; uses P1 content and P2 quantities/logs. | Plan several meals, change a serving count, shop, cook and reschedule leftovers without duplicate or stale unexplained quantities; second household member can contribute; revocation works. |
| **P4 — Develop better recipes** | Version-pinned subrecipes, grouped variations, richer comparison/suggested changes, batch yields/baker’s percentages; optional measured nutrition and timeline prototypes. M–L; stable units, pins and permissions required. | Reproduce an earlier compound recipe, intentionally update a child version and see the diff; shared suggestions cannot overwrite newer edits; advanced calculations disclose assumptions. |
| **P5 — Add assistance and reach** | Evaluated OCR/import assistance, cookbook-grounded search, reviewed adaptations/attempt summaries; later social/creator surfaces and native app decisions. Separate M–L bets. | Each capability beats its non-AI/current-platform baseline on a defined task; costs and failure modes are controlled. Social has repeat sharing and moderation readiness; native addresses measured platform limits. |

The main dependency path is **trust → faithful content/library → dependable cooking → routine/household → deeper development**. P5 is not a requirement to finish every P4 experiment: evaluated photo capture can follow a stable editor before a timeline exists. Similarly, a small print improvement or thin private cook note can ship early without waiting for every feature in its phase. The ordering prevents foundational work being postponed behind more photogenic additions.

### Start with three concrete build slices

| Order | Reviewable slice | Acceptance criteria and boundary |
|---|---|---|
| **1. Recoverable writing — M** | Add durable draft recovery and clear local/saved/failed states around the existing one-save editor. Preserve current validation and concurrency. | Type a long recipe, reload and reopen the tab, interrupt network, expire the session, trigger validation and conflict: text remains recoverable. A stale draft never silently overwrites a newer saved version. Recover/discard is deliberate; drafts are isolated between accounts. State the photo-file recovery limit and preserve successful upload references safely. Local autosave creates no history spam; cross-device draft sync is deferred. |
| **2. Private recipes and exact origins — M** | Default new recipes/adaptations private, explain publication, record the copied source version, and distinguish “Save to cookbook” from “Make my version.” | Public source → adaptation remains private until explicit publication. Fork-from-older-version records that exact source. Test direct URLs, history/diff, images, search/favorites and exports across accounts. Verify media policy rather than assuming public URLs are private. Existing public content is not silently reclassified. |
| **3. A faithful recipe can leave Fork — M–L, split into small PRs** | Add ingredient/method groups, yield separate from servings, source attribution and notes; carry them through edit/read/history/preview, print and a documented archive. | Save a dough/filling recipe yielding 12 buns; reopen, scale, compare, print and export without flattened groups or lost wording. Restore an old version by appending a new one. Export includes the supported versions, source and photos; a round-trip/restoration fixture proves fidelity. No silent “12 buns = 12 people” conversion. |

These are implementation recommendations, not permission to change the application during this research task. Before each slice, read its current callers/tests and make the smallest complete vertical change. Schema work must follow the current Drizzle migration rules; append-only history remains invariant. The first three slices prepare the immediate next P1 work: collections/navigation/search, then whole-recipe paste and URL capture using the same trustworthy editor.

### Give every meaningful feature an explicit disposition

| Capability | Decision and phase | Minimum useful scope; reason for sequence |
|---|---|---|
| Durable drafts, save/conflict state | **Build P0** | Recover one-device writing first; multi-device drafts add conflict complexity. |
| Privacy, source version, safe adaptation | **Build P0** | Honour earlier defaults and reproducibility before expanding capture/sharing. |
| Account settings, username, confirmation/resend | **Build P0–P1** | Complete access/recovery; verify actual mail setup. Username changes need stable identity and old-link behavior. |
| Archive/trash/restore and account lifecycle | **Build P1** | Introduce recoverable recipe lifecycle deliberately; define retention and account deletion before broad onboarding. Existing delete action is not a usable recovery policy. |
| Groups, yield, source, notes, preview | **Build P1** | Faithful content across all readers first. Equipment/pan size, storage, reheating and rest/chill details can begin as optional notes; no bloated required form. |
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
| Private Made it log, note/photo/rating | **Build thin P2; enrich P3** | Exact version/scale plus optional observation; easy repeated use before diary analytics or social scores. |
| Grocery list and optional alternatives | **Build P3** | Selected recipes/scales, manual items, safe combining, source links, aisle grouping and share/export; ambiguous items remain separate. |
| Meal queue/planner and calendar export | **Build P3** | Flexible dates, manual meals and leftovers, feeding groceries; optimization is unnecessary for the first useful planner. |
| Household cookbook and shared lists | **Build P3** | Clear owner/editor/viewer roles, invitations, revocation and attribution; personal notes stay private. |
| Pantry list and missing-ingredient search | **Include P3 experiment** | Start with ingredients on hand; show missing items. Exact stock depletion, expiry tracking and grocery pricing defer because maintenance/integration burden is much higher. |
| Subrecipes and grouped variants | **Committed P4** | Pin child versions, scale explicit batches, show updates, expand shopping intentionally; accepted user direction, not a speculative rejection. |
| User ingredient weights, baker’s percentages | **Include P4** | Known weights and visible assumptions; preferment flour/water included. User overrides do not silently reinterpret old attempts. |
| Nutrition estimates and diet filters | **Include gated P4** | Reliable identity/weights/servings first; expose missing inputs and source. Preference labels are not allergy certification. |
| Extra/step photos and richer diary | **Include P3–P4** | Start with optional attempt photos; add instructional images where useful, with upload/privacy/storage controls. |
| Cooklang import/export | **Include P4, earlier if pilot needs it** | Supported subset with explicit loss report and original retained; never invent ingredient-step links. |
| Suggested changes and version comments | **Include P4–P5** | Begin with deliberate shared review and stale-write checks; public interactions require moderation. Real-time editing/automatic merge deferred. |
| Follows/feed, kudos, public ratings | **Retain P5 candidates** | Social was revived, not cancelled. Earn it through repeated voluntary sharing; protect private logs and operate reporting/blocking first. |
| Lineage graph, timeline, discovery trends | **Retain P4 prototypes/P5 decisions** | Graphs need useful dependencies/durations and demonstrated navigation/coordination benefit; not merely a portfolio screenshot. |
| OCR/photo/PDF/social capture | **Include P5, eligible after P1** | Strong capture value, but evaluated extraction and rights/platform constraints first. Prioritize formats pilot cooks actually bring. |
| AI search, adaptation, notes summaries | **Include gated P5** | Must save work beyond deterministic baseline; reviewed proposals and citations, never silent rewrites. |
| Translation, read-aloud, hands-free controls | **Retain P5 experiments** | Test language/accessibility needs and device support; preserve original wording, allow correction, keep ordinary controls. |
| Dark mode, richer reading preferences | **Include after core readability** | Contrast-tested tokens and stable reflow first; prioritize actual cooking comfort rather than themes for their own sake. |
| Native iOS/Android integration | **Decision in P5; PWA earlier** | Trigger on measured capture/offline/alarm friction and commercial value, not an arbitrary user count or AI prerequisite. |
| Creator publishing, embeds, analytics | **P5 commercial experiment** | Test a few evolving recipe collections before paid-content infrastructure or a marketplace. |
| Generic AI recipe generation | **Defer beyond assistance** | Prior idea retained; weak early differentiation, harder verification and ongoing cost. Reviewable adaptation has a clearer starting point. |
| Restaurant operations | **Outside current target** | Procurement, invoices, staff operations and compliance need a separate professional discovery decision. |
| Ads, automatic prep-time estimates, stored “grams made” field | **Remain rejected** | Preserve explicit earlier decisions; observed per-attempt outcomes and derived yield are different concepts. |

### Make the interface feel good through task-level decisions

Keep the established warm annotated-cookbook direction unless testing supports a change: cream/ink surfaces, clay/marigold emphasis, purposeful typography, and no unsolicited wholesale redesign. Preserve desktop ingredient/method columns, the editable servings control near Ingredients, mobile Ingredients/Method navigation and progressively disclosed history. Do not resurrect equal-weight Recipe/History/Forks tabs; the user explicitly rejected them. The current live hero/version area occupies roughly the first 550 pixels at the observed desktop viewport: test whether “Cook” or a concise jump affordance gets returning cooks to useful content promptly rather than treating that measurement alone as a design failure. ([Design](../../../DESIGN.md), [audit](../2026-11-08-product-roadmap/current_product_audit.md))

Make **Cookbook** consistently personal and **Discover** consistently public; the current route changing meaning on login makes orientation harder. Within Cookbook, use filters for mine/adaptations/saved, collections, tags and recently used; avoid three competing destinations for the same mental category. Search should explain its match, preserve filters and show recoverable empty states. Tag suggestions can use a small deterministic scorer before AI; structured cuisine/diet/meal-type taxonomy waits until a flat list demonstrably impedes retrieval.

Keep the editor paste-first and forgiving. Allow incomplete recoverable drafts, expose optional detail progressively, keep the preview consistent with saved rendering, and preserve unparsed text visibly. Reordering requires keyboard alternatives; save errors should focus useful feedback without discarding content. In cooking, quantities need strong hierarchy, ingredient access should not lose the current step, tick state must be obvious without color alone, and undo/clear must be predictable. Do not auto-split or rewrite methods to create a simplified reading mode without review.

Use familiar verbs: “Save to cookbook,” “Make my version,” “History,” “Compare changes,” “Restore as new version” and “Suggest a change.” Keep technical power available. A moving favorite follows the author’s current recipe and may disappear if access changes; a pinned save records which version was chosen but does not automatically grant permanent access or copying rights. State that access policy before release. Offer an authorized independent adaptation when the user needs an editable copy. Source recipe, source version and imported attribution are distinct records; a note saying “copied v3” is not enough to support dependable references.

| Cross-phase quality gate | Required validation |
|---|---|
| Trust | No known reproducible unresolved work loss, accidental publication or cross-account exposure in the release matrix; upload failure, auth expiry, conflict and account changes covered. Backup restore exercised. |
| Accessibility | Target WCAG 2.2 AA; keyboard and screen-reader journeys, meaningful headings, visible/unobscured focus, non-drag alternatives, reduced motion, 200% zoom and narrow reflow. Automated checks supplement manual use. |
| Kitchen ergonomics | Observe a real meal on iOS Safari, Android Chrome and a tablet; test counter-distance text, long recipes, accidental ticks, switching recipes, phone locking and denied permissions. Prefer 44px main cooking targets; WCAG AA’s target criterion generally starts at 24px with exceptions. |
| Performance | Establish baseline, then target good field Core Web Vitals: p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, separately mobile/desktop. Label lab results honestly until field data exist. |
| Culinary correctness | Ranges/fractions/packages/divided ingredients, metric/US/imperial distinctions, mass versus fluid ounces, missing yield and unparsed lines. Never scale temperatures, time or pans mechanically. |
| Task completion | Test create/import → organize → retrieve → scale → cook → note → revise → compare → export with 100–500 varied recipes. An initial 4-of-5 unassisted qualitative gate can expose friction; report raw counts, never statistical certainty. |

Accessibility and performance thresholds come from current standards; the 44px cooking preference and initial task target are product recommendations. ([WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Web Vitals](https://web.dev/articles/vitals)) Wake locks and browser timers can be suspended or denied; store timer deadlines and recompute elapsed time, but do not market background web alarms as guaranteed. Offline saved reading is a separate deliverable from reliable scheduled notification or offline editing. ([MDN Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), [timers](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout), [offline operations](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation))

## 4. Let reproducible cooking guide advanced features and AI

### Version-linked observations and components create the strongest next layer

Keep three things separate: the recipe as written, what happened on one cook, and a lasting revision. A “Made it” entry records the exact version, scale/date and optional note/photo; cooking a half batch with oat milk does not silently rewrite the recipe. Surface the last relevant note before the next cook, then offer “Use these changes next time” as a reviewed new version or adaptation. Restore similarly appends a new version. Past content and the meaning of earlier attempts remain unchanged.

Subrecipes make this model practical: the pie remembers which dough worked. Start with explicit “× batch” use; 200 g of a sauce requires a meaningful child yield, not an inference from “serves four.” A parent’s saved child version does not move when that child changes. An intentional update creates a parent revision and a visible comparison. Handle cycles, private/unavailable components, export inclusion and recursive shopping expansion before shipping. Let someone using already-made stock exclude stock’s ingredients from today’s groceries. Ingredient-step links and totals must agree across scaling, print and shopping.

For baking depth, percentages require total flour and water—including preferments—not merely dividing each visible line by the first flour ingredient. Volume-to-mass conversion also depends on ingredient and preparation; a source table’s flour cup is not a universal cup definition. Keep authored quantities and display assumptions visible. ([King Arthur baker’s percentage](https://www.kingarthurbaking.com/pro/reference/bakers-percentage), [ingredient weights](https://www.kingarthurbaking.com/learn/ingredient-weight-chart))

The graphical step timeline stays on the roadmap as a prototype after durations/dependencies and subrecipes exist. Ask whether it helps coordinate a multi-component meal enough to justify the authoring burden. The first pantry feature should likewise answer “What can I make with these ingredients?” rather than demand inventory bookkeeping. These are scoped implementations of accepted ideas, not cancellations.

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

Public collaboration follows individual and household usefulness. Before comments/feed, add reporting, blocking where appropriate, moderation/hide workflows and posting limits. Preserve attribution through capture, adaptations and export, but never equate attribution with permission to republish creative text/photos. Private defaults reduce accidental exposure; they are not a universal legal exemption. Scope rights/privacy review to actual launch flows and jurisdictions. ([US Copyright Office Circular 33](https://www.copyright.gov/circs/circ33.pdf))

## 5. Treat revenue as a testable outcome, not a forecast

### The credible first business is a small paid utility

Current competitive prices leave little room to charge merely for recipe storage. Test **US$24/year personal** and **US$36/year household or power use** as hypotheses after a working bundle exists. Start with one paid offering if a second has no distinct value; do not launch household and power tiers merely to fill a pricing table. The illustrative $30 blend below corresponds to an even account mix at $24/$36, and a household counts as one paying account. Paprika’s introductory subscription and AnyList’s low household price make the premium a burden to earn, not evidence Fork can charge it. ([Paprika launch](https://www.paprikaapp.com/news/2026/11/06/paprika-4-is-now-available-for-all-users/), [AnyList Complete](https://www.anylist.com/complete))

Free should demonstrate the personal loop: private recipes, ordinary editing, scaling/cooking, useful organization/history and a taste of capture/logging. Paid candidates are shared household libraries, generous import/photo allowances, larger-library convenience, richer development/diary views and bounded AI credits. Determine limits from actual use and costs. Keep existing content access, recovery, privacy and full owned-data export available on downgrade. Avoid unlimited lifetime AI economics and coercive lock-in.

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

Model web-payment fees at **5.6% of billings**, using a specified Stripe HK example: 3.4% base, 0.5% international, 0.7% Billing and a $0.30 charge equivalent to 1% of a $30 annual payment, with USD settlement and no conversion. The actual merchant entity/payment mix must be confirmed; timezone does not determine it. Reserve **$0.70 per paid account-month**: $0.20 AI, $0.10 incremental media and $0.40 cash support/moderation allowance. These reserves and fixed budgets are assumptions, not measured token costs or sufficient staffing guarantees. ([Stripe HK](https://stripe.com/en-hk/pricing))

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

Halving registrations or conversion roughly halves payer/revenue outputs at constant renewal. A $24 price lowers gross revenue 20% versus $30; $36 raises it 20%, before behavioral effects. Raising AI from $0.20 to $1 per paid account-month cuts month-24 annualized contribution by about **$194 / $2,644 / $18,248**. A $10 acquisition cost per new payer consumes another **$252 / $3,240 / $21,120** over 24 months. Extra currency conversion at 2% subtracts 2% of billings; native-store economics require a new channel model. Pricing, conversion and retention are not independent in reality. ([Scenario derivation and assumptions](../2026-11-08-product-roadmap/advanced_and_quality.md))

### Build and measure the features that improve the economics

| Investment | Plausible business mechanism | Evidence required before expanding |
|---|---|---|
| Faithful import/migration and first-cook onboarding | Acquisition/activation: lower switching effort | Correction work, import-to-first-cook completion and retained cohorts versus manual setup. |
| Mobile editing/cooking, offline, print | Retention: dependable at the moment of use | Repeat purposeful sessions/cooks; device failures and abandonment. |
| Collections, groceries and planning | Habit: more useful occasions each week | Repeated planning→shopping→cooking use, not simply lists created. |
| Version-linked attempts/adaptations | Differentiated retention and paid value | Past notes reused, successful revisions revisited, willingness to pay versus cheaper alternatives. |
| Household sharing | Conversion and retained shared value | Invitations accepted, another member active and renewal; count households once. |
| Readable attributed shares and creator examples | Referral acquisition | Shared visit→activation→repeat use, rather than share count or impressions. |
| Bounded AI import help | Reduced correction effort and possible premium value | Cost per accurate saved recipe, total task time and actual paid retention. |

Begin with serious-cook/baking circles, existing personal connections and a few creators whose recipes evolve. Offer assisted migration and show an actual improvement story; respect community posting rules. Maintain good public metadata/Recipe JSON-LD for public content, but do not assume SEO or a populated feed will deliver an audience. Test price against a working bundle with clear delivery/refund terms. Record purchases separately from stated interest, interview people who choose cheaper/free alternatives, and measure renewal with actual cohort counts.

A small observational pilot should include repeat weeknight cooking, baking, family archives and shared households; chefs can test the development tools secondarily. Establish baseline task success, then a diary spanning several real cooking occasions. Track durable saves, known-recipe retrieval, return to a useful recipe, repeat cooks and reuse of notes/history. Never collect private recipe text just to create analytics. Do not impose the old April 2027 deadline or 200-weekly-logger threshold: those were speculative planning numbers, not discovered business laws.

For the portfolio, demonstrate one coherent story: capture a family dough recipe, retain its source, cook twice, compare a purposeful adjustment, pin that version into a pie, and produce a grocery list and printable recipe. Document transaction/concurrency invariants, migration choices, privacy tests, accessibility findings and before/after task results. Distinguish shipped behavior from planned screenshots. The engineering is already interesting; the next improvement is making its value immediately understandable to a cook.

## Decision ledger and evidence boundaries

### Preserve earlier commitments while replacing obsolete sequencing

This report supersedes the active ordering and estimates in the historical roadmap. It preserves ideas explicitly accepted by Spencer; “later” means delayed with a dependency or decision gate, not silently cancelled. The September blanket social deferral was superseded in October; today’s core-first request changes sequence again. ([Preserved historical roadmap](../../history/2026-10-milestones.md))

| Earlier milestone | Current disposition |
|---|---|
| M1 Pull requests | P4–P5 reviewed “Suggest a change”; retain concurrency/permission/attribution, rewrite old implementation sketch under current schema/content rules. |
| M2 Per-page metadata | Already built locally; verify public previews, add public Recipe structured data in P1. |
| M3 Version comments | P4–P5; private notes earlier, deliberate shared review before public conversation. |
| M4 Following/feed | P5 retained candidate after repeat sharing and moderation; Cookbook navigation moves earlier and does not depend on a feed. |
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
| M17 Attempts | Thin P2, richer P3; retain Made it concept/count and last-cook line. Exact phone placement remains a design call beside Cook. |
| M18 Cook mode | Already built and modern controls observed live; P2 validation/refinement, not a replacement feature. |
| M19 Match highlighting | P1, preserved explicit request. |
| M20 Tick affordance | P2 side-by-side cooking-task evaluation, preserved explicit request. |
| M21 Pantry matching | P3 bounded on-hand/missing-ingredient experiment; accepted idea retained. |
| M22 Subrecipes | P4 committed version-pinned component capability, preserving the explicit acceptance. |
| M23 Timeline | P4 prototype after meaningful duration/dependency data; remains idea-stage and unscheduled. |

Other preserved preferences include warm cookbook styling, desktop two-column reading, intentional phone/iPad/desktop layouts, monospace diff pages, editable serving input without ×2/÷2 clutter, no equal-weight history tabs, username settings, private-first publishing and honest traction. Already implemented photos-in-history, tick persistence and fork listing supersede old absence claims. Earlier source snippets, enum/migration directions and hour estimates are historical material, not instructions to execute.

Nonblocking product calls remain: exact Cookbook grouping language, local versus eventual synced drafts, retention/trash policy, pinned-save access after unpublishing, first migration format, household versus power packaging, Made it placement and the first native platform if warranted. The recommendations above allow work to proceed to concrete designs; settle each call when its slice needs it rather than asking for a speculative global specification now.

### Source register and limits

| Evidence | Role and boundary |
|---|---|
| [Current product audit](../2026-11-08-product-roadmap/current_product_audit.md) | Source-linked local capability inventory and bounded live checks, 8 Nov 2026; not authenticated/runtime certification. |
| [Cookbook market research](../2026-11-08-product-roadmap/cookbook_market.md) | Primary competitor documentation/prices and public cooking requests checked 8 Nov; documentation breadth is not hands-on quality. |
| [Advanced/quality/economics research](../2026-11-08-product-roadmap/advanced_and_quality.md) | Standards, platform constraints, AI risks and explicit scenario derivation; product and revenue hypotheses are labeled. |
| [Prior feature research](2026-10-31-feature-research.md), [prior business research](2026-10-31-business-viability.md) | Historical leads and decisions. Fresh audit/primary evidence supersedes obsolete competitive exclusivity, prices, thresholds and estimates. |
| Vendor pages and official release/App Store links above | Accessed 8 Nov 2026; Paprika release dated 6 Nov. Tier/platform/promotional differences apply. |
| GitHub requests, standards and domain guidance above | Concrete jobs, implementation evidence and technical constraints; not representative demand, clinical advice or universal legal conclusions. |

The decisive next investment is making it safe and pleasant to entrust an existing cookbook to Fork, then proving that returning to it makes the next cook better. If that loop earns repeat use, households, recipe development and selective assistance have a coherent place to grow. If it produces modest revenue, a dependable tool with an honest engineering case study remains a successful outcome; commercial expansion should follow observed value rather than an assumed audience.

**Not checked:** authenticated production flows, real-device/accessibility/performance tests, paid hands-on competitor trials, customer interviews or willingness-to-pay experiments. **Material risk:** competitive documentation and plausible scenarios cannot establish Fork’s usability, demand, conversion or future revenue; those require the validation gates above.
