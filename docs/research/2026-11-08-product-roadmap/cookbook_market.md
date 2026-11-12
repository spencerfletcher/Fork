# Cookbook market, core workflows, and competitive position

Research checked 8 November 2026. Audience: serious home cooks first, including enthusiastic bakers and people developing their own recipes. This is evidence and product judgment for the roadmap, not a hands-on certification of competing apps. Existing `docs/history/2026-10-milestones.md` and `docs/research/2026-10-31-feature-research.md` were read as background. Their vote rankings, absence claims, and estimates are not accepted as current evidence without verification.

## What does an excellent recipe book need to cover, and what do competitors establish?

### Takeaway

Build a complete **capture → organize → find → prepare → cook → remember → improve → share/export** loop. The convergence of successful products on capture, search, collections, scaling, cook views, grocery lists, and planning is strong positive evidence for inclusion; differentiation changes sequence and quality, not whether normal cooking jobs matter. Fork should make its improvement loop unusually useful after the basic cookbook earns trust.

### Cited Findings

Capability matrix: **documented** means a vendor or project primary source explicitly describes it; **?** means this sweep did not verify it, not that the feature is absent. Capabilities can be paid or platform-specific. These rows describe capabilities, not quality rankings or exhaustive parity.

| Product | Capture / editor fidelity | Organize / retrieve | Scale / cook / offline | Take recipes out / everyday use |
|---|---|---|---|---|
| **Paprika 4** | Web capture; premium social, photo and clipboard capture; editable recipes | Categories, cookbooks, advanced search, duplicate finder | Scaling and US/metric conversion; current step, ingredient ticks, timers, screen-on; offline | HTML/Paprika export; print; groceries, pantry, meal plans; premium family/cookbook sharing. [Current features](https://www.paprikaapp.com/), [Windows guide](https://www.paprikaapp.com/help/windows/), [US listing](https://apps.apple.com/us/app/paprika-recipe-manager-4/id1303222868) |
| **Recipe Keeper** | Own recipes, web/social capture, OCR from photo/PDF; other-app migration; formatted text and photos | Collections, categories, name/ingredient/direction search; filters | Servings and measurement conversion; ticks, readable text, wakefulness, offline | Print/PDF cookbooks; email/sharing; shopping by aisle; weekly/monthly planning. [Product](https://recipekeeperonline.com/), [US listing](https://apps.apple.com/us/app/recipe-keeper/id974683711) |
| **Crouton** | Web, book/photo, OCR/AI import; can retain a photo or title-only recipe | Recipe organization; blog feeds | Scaling, unit conversion, multiple timers; step view with tappable ingredient quantities; offline ? | Grocery lists integrate with Reminders; meal plan; household iCloud sharing; print/export ? in this sweep. [Product](https://crouton.app/), [US listing](https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987) |
| **Mela** | Web preview/share extension, scan, editing, RSS capture | Categories, favorites, want-to-cook | Large type, focused steps, ticks, multiple recipes, timers; local storage documented; full offline workflow not tested | Print/PDF; documented recipe file format; Reminders groceries, Calendar planning, shared iCloud library. [Product](https://mela.recipes/), [Help](https://mela.recipes/help/), [US listing](https://apps.apple.com/us/app/mela-recipe-manager/id1548466041) |
| **AnyList** | Web and pasted recipes, own recipe collection | Many-to-many collections, name/ingredient search | Scaling, cooking view, switch recipes; offline ? | Strong grocery combining/sharing; household recipes; planning/calendar integration; email/print documented, full archive fidelity ? . [Features](https://www.anylist.com/features), [Recipe page](https://www.anylist.com/recipes), [sharing help](https://help.anylist.com/topics/recipes/sharing-recipes/) |
| **Samsung Food** | Web recipe saving and personal recipe creation | Saved recipes and communities | Detailed cook/units/offline behavior ? in this sweep | Recipe/plan shopping lists and sharing; weekly planner; nutrition and paid AI/personalization; portability fidelity ? . [Product](https://samsungfood.com/), [Food+](https://samsungfood.com/food-plus/) |
| **Mealie** | URL, HTML/JSON, manual editor; migration from Paprika, Recipe Keeper and others; AI capture | Categories, tags, tools, cookbooks; data bulk actions | Linked ingredients/steps and nested recipes; offline native-client behavior outside this scope; conversion remains actively discussed | Recipe export and full instance backup differ; shopping, meal plans, groups/households. [Features](https://mealie.io/documentation/getting-started/features/), [subrecipe implementation](https://github.com/mealie-recipes/mealie/pull/4800) |
| **Tandoor** | Structured editor, web JSON-LD/microdata, many migration formats | Cookbooks, tags, full-text/trigram search, bulk tagging | Fractions/decimals, recipe scaling; cook/offline/timer detail ? | Print; native archive export, experimental PDF; recipes → shopping/planning; collaboration. [Docs](https://docs.tandoor.dev/), [import/export](https://docs.tandoor.dev/features/import_export/) |
| **Cooklang ecosystem** | Portable text syntax, web imports, desktop editor; optional advanced capture/migration | Files and metadata; optional cloud | Ingredient quantities in steps, sections, cookware, named timers, optional ingredients, subrecipes; offline-first files | Shopping, menu files, PDF/print ecosystem, Git workflows, optional cloud sync. App support varies by language feature. [Home](https://cooklang.org/), [specification](https://cooklang.org/docs/spec/), [conventions](https://cooklang.org/docs/conventions/) |

Important corrections to the previous research:

- **Paprika 4 shipped on 6 November 2026**, according to its dated release announcement, on iOS/macOS/Android/Windows. It adds cookbooks, advanced search and duplicate detection; premium includes scanning, social import and family accounts. Statements that these are missing or that every platform requires a separate new purchase are obsolete. [Release announcement](https://www.paprikaapp.com/news/2026/11/06/paprika-4-is-now-available-for-all-users/)
- **Subrecipes are not an unoccupied category.** Mealie PR #4800 merged on 4 November 2025. Its description includes linked recipes, recursive shopping-list expansion, and reflecting child-recipe edits in the parent; the associated request is closed. This establishes implemented work, not a hands-on certification of every released client. [PR](https://github.com/mealie-recipes/mealie/pull/4800), [request](https://github.com/mealie-recipes/mealie/discussions/1761)
- **Neither logging nor versioning broadly is unique to Fork.** Mealie’s subrecipe implementation refers to an “I Made This” dialog and timeline; Cooklang explicitly advertises Git version control. Fork’s plausible distinction is accessible, version-pinned cooking history and revisions without asking a cook to understand Git. [Mealie PR](https://github.com/mealie-recipes/mealie/pull/4800), [Cooklang](https://cooklang.org/)
- Tandoor’s ingredient-total request #1325 is now closed and marked Done. It remains useful evidence of a cooking problem; it is not evidence of a current missing feature. [Issue](https://github.com/TandoorRecipes/recipes/issues/1325)

### Inferences

Recommended minimum excellent baseline (product judgment, in sequence):

1. **Trust the editor.** Paste or type without losing content; preserve meaningful groups, notes, source, quantities, yield and methods; recover drafts; show save status and resolve conflicts; allow incomplete drafts. No public publishing surprise. One excellent editor feeds every importer and future AI flow.
2. **Get an existing cooking life into Fork.** Whole-recipe paste and URL capture into a reviewable draft; source retained; failures explained; no silent missing ingredients. Offer one high-value migration importer, chosen from actual target testers’ libraries, before promising broad migration support. Paprika is a sensible first candidate based on its explicit export and overlapping serious-cook audience, not a proven largest-share claim.
3. **Have a useful personal cookbook.** Collections, saved recipes, owned/modified recipes, want-to-cook and recently cooked should be understandable without a tutorial. Search title and ingredients, filter collections/tags/time, keep sorting predictable. Avoid conflating favoriting another person’s live recipe with owning a stable copy.
4. **Cook successfully.** A readable two-pane desktop/tablet view and coherent phone view, ingredients available while reading the method, ingredient/step progress, accurate servings/yield, understandable units, simultaneous named timers, print, explicitly saved offline recipes. “It looked beautiful” is not a pass if the cook repeatedly scrolls to remember the butter quantity.
5. **Support the surrounding routine.** Grocery list from selected recipes and selected scaled ingredients, manual items, sensible combining, provenance back to the recipe, basic sharing. Then a light plan/queue that can feed that list. These are strongly supported baseline jobs; dependency and scope explain ordering after the recipe core, not dismissal.
6. **Make the next cook better.** Private attempt note tied to exact version and scale, remembered adjustments, optional photo, compare versions, restore by appending a revision, promote an experiment into a variant. Do this before public social engagement machinery.

Minimum recipe fidelity is not “more mandatory fields.” Keep the fast path short; disclose optional detail when needed. Content should support: title; description; ingredient and method groups; free-text lines when parsing is uncertain; source author/URL/book/page; active/cook/total time with optional resting/chilling notes; servings separately from textual yield (“12 rolls”, “1 loaf”, “500 ml sauce”); equipment/pan-size notes; storage/reheating notes written by the author; variations and optional ingredients. One plain notes field is a valid initial home for niche details. Preserve it through import, editing, history, print and export rather than building fifteen structured sub-editors immediately.

### Gaps

- This is documentation research, not paid hands-on testing of every competitor. An unverified cell must remain “?”; neither a marketing claim nor an empty cell proves actual performance.
- App Store reviews and open-source discussions offer concrete jobs and pain, not an estimate of total market prevalence. Competitor convergence plus recurring requests supports inclusion; interviews and observed cooking should tune defaults and release order.
- No reliable market shares or competitor paid-subscriber counts were established. Do not infer these from ratings, download badges or GitHub stars.

## Which real cooking problems should determine fidelity, priority, and acceptance gates?

### Takeaway

The strongest feature choices solve recurring moments where cooks otherwise leave the app, retype information, recalculate quantities, or cannot reconstruct what worked. An authoritative roadmap should specify those moments and release gates, not promise reliable conversion, import, timers or migration because a checkbox exists.

### Cited Findings

The following public discussions are **anecdotal evidence of real user jobs**, with stronger confidence when the same need appears in both products and independent requests. No votes are presented as representative prevalence; no old counts were carried forward.

| Observed job/friction | Evidence and date | Product implication |
|---|---|---|
| Imported recipes require repeated manual measurement conversion | Mealie #3881 opened 11 July 2024; July–August 2026 comments describe repetitive US-to-metric work, separate temperature preferences, and cup ambiguity. [Discussion](https://github.com/mealie-recipes/mealie/discussions/3881) | Same-dimension display conversion is a high-priority baseline. Keep temperature choice separate. Do not conflate volume→mass with unit conversion. |
| Recipe authors give ranges, not always one exact quantity | Mealie #2989, 14 January 2024, with examples such as ranges of herbs/water and criticism of forcing an arbitrary midpoint. [Discussion](https://github.com/mealie-recipes/mealie/discussions/2989) | Preserve ranges; scale both bounds. “To taste,” “as needed,” approximate and unparsed text must survive unchanged. |
| Ingredient alternatives should not cause buying both options | Mealie #3717, 8 June 2024, proposes clear alternatives and mutually exclusive shopping selections; follow-up support in 2025–26. [Discussion](https://github.com/mealie-recipes/mealie/discussions/3717) | Start with faithful author notes and explicit optional lines; introduce structured alternatives when grocery generation needs that meaning. |
| Mise en place needs totals, method reading needs per-step allocations | Tandoor #1325, 15 January 2022, describes eggs split across steps and manually adding them; now closed/Done. [Issue](https://github.com/TandoorRecipes/recipes/issues/1325) | Keep both whole-recipe totals and step references. Repeated occurrences must not double-count totals. |
| Cooks run multiple tasks/recipes at the same time | Mealie #1573, 18 August 2022; a November 2022 Paprika migrant specifically misses detected durations and app-wide concurrent timers. [Discussion](https://github.com/mealie-recipes/mealie/discussions/1573) | Multiple named timers with recipe/step context beat a single timer tied to one component. |
| Small variants become a cluttered collection | Mealie #880, 15 December 2021, describes three rum-cake recipes for different molds and awkward alternatives in comments. It is currently closed. [Discussion](https://github.com/mealie-recipes/mealie/discussions/880) | Group variants while keeping each usable, named and independently findable; avoid forcing history jargon into the main cookbook. |
| A shared technique is reused in multiple dishes | Mealie #1761, 23 October 2022, names crust, pasta and stock; implemented work later linked. [Discussion](https://github.com/mealie-recipes/mealie/discussions/1761) | Subrecipes are valuable and justified; version pins add reproducibility. Stage after yield/scaling/privacy rules. |
| Scaled fractions can be impractical to measure | Recipe Keeper review dated June 2022 requests fraction/decimal display and better small-unit presentation. [US listing and developer response](https://apps.apple.com/us/app/recipe-keeper/id974683711) | Test readability of ⅓/½ quantities and tiny portions, not only arithmetic correctness. Historical experience, not a claim about current app behavior. |

Standards and domain evidence:

- Schema.org Recipe permits text or structured ingredients, text or HowToStep/HowToSection instructions, and textual or quantitative yield. A robust importer cannot assume every recipe is a flat string array plus numeric servings. [Schema.org Recipe](https://schema.org/Recipe)
- Cooklang explicitly represents sections, preparations, notes, optional occurrences and recipe references; its page warns that not every app supports the latest language features. Its conventions separate fixed quantities and ordinary scaling and do not scale timers/cookware automatically. [Specification](https://cooklang.org/docs/spec/), [conventions](https://cooklang.org/docs/conventions/)
- King Arthur’s guidance on reducing a recipe highlights pan size, baking time and dividing an egg as additional problems beyond multiplying ingredient quantities. [How to reduce a recipe, 23 November 2020](https://www.kingarthurbaking.com/blog/2020/11/23/how-to-reduce-a-recipe)
- Tandoor documents that export formats differ in supported images and fields, and distinguishes its native archive from other formats. Its Mealie importer calls out nutrition’s per-serving/per-recipe ambiguity. [Import/export documentation](https://docs.tandoor.dev/features/import_export/)

### Inferences

#### Feature disposition and minimum complete slices

These are recommendations, not verified implementation estimates. **S/M/L** describe relative engineering/validation burden: S bounded interface/presentation; M cross-flow data and state; L substantial model/platform/operational complexity. They are not hours or commitments. “Later” is inclusion with dependencies, not rejection.

| Capability | Disposition | Smallest complete slice / reason / dependency | Size and gate |
|---|---|---|---|
| Draft recovery, save feedback, conflict handling | **Build first** | Protect the work people entrust to the editor; history does not recover unsaved text | M; reload/reopen, failed save and simultaneous edits lose no work |
| Ingredient/method groups, flexible yield, notes/source | **Build baseline** | Fidelity before clever parsing; “12 buns” is not “12 people” | M; save/read/scale/print/export a grouped baking recipe accurately |
| Whole-recipe paste + URL capture | **Build baseline** | Fastest activation path; all capture lands in same review draft | M; representative fixture corpus; no dropped required lines; warning for unsupported structure |
| Collections, filters, ingredient search | **Build baseline** | Make a growing personal library useful | M; users find a known recipe and an ingredient-based candidate without help |
| Scale + display conversion | **Build baseline** | Competitor convergence and repeated demand; separate exact dimensional conversion from density estimates | M; fractions, ranges, locale formats, unparsed lines, packages and zero-invalid values checked |
| Cook readability + progress + print | **Build baseline** | The kitchen is the core environment, print is a dependable alternate surface | S–M; real cooking on phone/tablet; print neither clips nor loses notes/groups |
| Multiple named timers | **Build baseline** | Proven concurrent-cooking job | M; pause/resume/reload/background lifecycle tested on target devices; never claim browser alarms are guaranteed |
| Explicit offline saved recipes | **Build baseline after trustworthy saves** | Kitchen/travel connectivity; avoid expanding to general offline editing | M–L; airplane-mode reopening of intentionally saved recipe and images, visible freshness |
| Machine-readable export + readable export | **Build baseline** | Trust and escape hatch before users invest a library | M; export/import round trip preserves owned content and provenance; report limitations |
| First competitor migration importer | **Build early after core fidelity** | Reduces switching cost; choose using testers’ source libraries | M; dry-run counts, duplicate handling, per-record failures, source preserved, no overwrite |
| Grocery list | **Build next baseline slice** | Broadly established daily job; valuable without a calendar | M; selected ingredients/scales, manual edits, provenance, optional exclusion and safe combining |
| Simple meal queue/planner | **Build after grocery list** | Prevalence favors inclusion; lightweight queue handles changing plans | M; move/remove meals without corrupting list; leftovers/manual meal notes; no optimizer initially |
| Private cook log bound to version | **Build early differentiation** | Remembers experiments; connects core version model to a human benefit | M; note optional, exact version/scale immutable, repeat effortless, privacy independent of recipe |
| Household sharing | **Build after individual loop** | Common requirement and strong retention potential; permissions make this larger than a share button | M–L; invitations, access revocation and edit attribution; no private-note leakage |
| Step-linked ingredient quantities | **Build after content model is stable** | Reduces scrolling and enables coherent scaling; explicit links, not guessed numbers | M; reorder/delete links safely, allocations agree with totals, unlinked prose remains valid |
| Version-pinned subrecipes | **Build after yield/scaling and access rules** | User-requested, clearly useful, technically distinctive in combination | L; pin survives child edits; cycles rejected; nested quantities, export, access and unavailable-child handling explicit |
| OCR/photo/PDF and social/video import | **Build later, strongly favored** | Strong competitor coverage and acquisition value; extraction review and source rights are extra burden | L; exact critical quantities/durations reviewed; original image/source kept; incomplete source identified |
| Equipment, storage, reheating | **Build baseline as notes** | Useful practical recipe content without premature modeling | S; visible in reader/print/export; author content, no autogenerated safety assertions |
| Optional ingredients / alternatives | **Build progressively** | Faithful text immediately, structured behavior before intelligent shopping/pantry | M; alternatives do not add both to shopping; optional excludes are visible |
| Pantry matching | **Validate workflow, then build** | User-requested and present in competitors; begin explicit ingredients-on-hand, no quantity ledger | M; useful suggestions with honest missing items; no claim an unavailable optional garnish blocks cooking |
| Nutrition | **Later / validate purpose** | Competitor demand merits exploration; reliable food mapping/yield is prerequisite | L; source and serving basis displayed; distinguish entered data from estimates |
| Baker’s percentages / scale-to-target-ingredient | **Validate as serious-cook extension** | Good fit for baking experimentation; not required of every household | M; interview active bakers; keep method and yield implications explicit |
| Full pantry inventory, expiry and automatic deduction | **Later** | Requires ongoing user maintenance and reconciliation; do not infer use from a recipe view | L; validate repeated real inventory upkeep first |
| Public feed, ranking, badges, social reactions | **Later** | Distribution can help, but requires enough public activity and moderation; personal usefulness must stand alone | L; evidence people want to share actual cooks; private-by-default log first |
| Graphical multi-recipe timeline / automatic scheduling | **Prototype later** | Needs dependable durations/dependencies and can imply more certainty than recipes supply | L; observe real coordinated meals before structured graph authoring |
| Universal semantic conversion, silent AI rewriting, “allergen-safe” guesses | **Reject these implementations** | Not the requested trustworthy cookbook; ambiguity/data errors can materially change food | Correct alternative: visible assumptions, reviewable changes, exact math where possible |
| Restaurant inventory/procurement/HACCP operations | **Not current roadmap** | Different buyer, integrations, accountability and operational product; serious home cooks first | Reconsider only with explicit professional discovery |

#### Acceptance corpus, onboarding and migration

Use a deliberately awkward test library: a simple weeknight meal; dough plus filling; a sauce yielding volume; an overnight fermentation; a recipe with divided butter; a multilingual recipe with Unicode fractions/decimal comma; “2 × 400 g cans”; “2–3 cloves”; “salt to taste”; optional garnish; alternate ingredients; a photo-only family card; a URL containing two recipes; an imported book recipe with attribution; and a linked subrecipe with a private owner. These are proposed tests, not claims that Fork already handles or fails them.

For every baseline milestone, test complete journeys, not isolated components: import → correct → save → find → scale → cook → note → revise → compare → print/export. Recruit actual serious home cooks, including a frequent baker and a mixed-device household. Observe an actual meal, not only a five-minute screen walkthrough. Record task completion, critical data loss, quantity errors, confidence, and where they leave the app. Set numeric targets after a baseline study; do not invent industry conversion or retention benchmarks.

Migration should preview counts and fields, preserve source attribution, handle duplicates explicitly and leave the original archive intact. Start with a small sample before the whole library. Show failures per recipe and allow retry; do not convert partially imported content into an apparently successful recipe. Importing into a separate collection is a reversible organizational choice. Exit/export should remain available regardless of paid status, as a recommended trust policy.

#### Subrecipe and international-quantity constraints

Pin a child **version**, not only its recipe identifier. A stable parent must not change because a sauce was edited. Initial quantity semantics should be explicit “× batch”; support mass/volume use only when the child yield establishes that mapping. A parent that uses 200 g of sauce cannot safely infer what fraction of “serves 4” that means. Parent scaling, ingredient aggregation and shopping expansion must use the same pin and scale. Reusing an already-made stock is different from making stock today; let the cook decide whether to expand its groceries. Define cycles, permissions, deletion/unavailability, export inclusion, and update-to-new-version before implementation.

Preserve authored units and provide reversible display conversion. A user’s location alone is not evidence that an imported “cup” uses that region’s measure; ambiguous units must stay visible or require a source-specific assumption. Never guess that a package, clove, pinch, pan dimension, time or oven temperature scales like a numeric ingredient. Volume-to-mass estimates require food and preparation context plus a visible source; exact metric/US dimensional math should not depend on AI. Store original authored content separately from view preferences conceptually; do not produce a recipe revision merely because a reader switches °C/°F.

### Gaps

- No live Fork usability session, production funnel, customer interview or quantitative demand survey was run in this subtask. Product ordering is a reasoned proposal supported by competitor convergence and public user evidence.
- The present research does not certify regulatory or food-safety recommendations. Storage/reheating as author-entered content is proposed; automatic validated food-safety advice is a different undertaking.
- Exact timer guarantees, service worker behavior and background notification support require device testing by the implementation team; competitor documentation cannot establish Fork’s browser behavior.

## How can Fork compete commercially without losing focus?

### Takeaway

The market makes basic cookbook software relatively inexpensive and feature-rich. Fork should win a specific reason to switch—an excellent personal recipe workspace that remembers which variation worked—while removing migration, reliability and mixed-device barriers. Generic AI generation alone is not a credible moat.

### Cited Findings

Prices below are public observations on **8 November 2026**, not lifetime guarantees. US App Store amounts are USD; website dollar displays are reported as shown and may vary by region. Do not assume a free download means the listed capabilities are free.

| Competitor | Position and platform | Verified price/business-model observation | Switching implication (inference) |
|---|---|---|---|
| Paprika | Cross-platform comprehensive personal/family cookbook | Official 6 November launch: premium introductory **US$14.99/year**, **US$9.99/year** for previous owners; previous owners get standard upgrade free; new free tier limited to 50 recipes. [Announcement](https://www.paprikaapp.com/news/2026/11/06/paprika-4-is-now-available-for-all-users/), [plans](https://www.paprikaapp.com/) | Major bundled-feature/value anchor. Winning requires a clear improvement benefit and faithful import, not “we also have grocery lists.” |
| Recipe Keeper | Broad-device family cookbook/capture and printable books | US iOS Pro upgrade **$19.99**; listing explicitly says other platforms require separate purchase. [US listing](https://apps.apple.com/us/app/recipe-keeper/id974683711) | Existing categorized archives, family habits and OCR value create switching cost; preserve organization and photos. |
| Crouton | Apple ecosystem cooking/meal planning | US listing: **Crouton Plus $24.99**; **Discover $14.99/year or $1.99/month**. Historical/early-bird purchases also listed; precise current entitlement split not established. [US listing](https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987) | Native cooking and OS integrations set a polish bar; browser reach helps mixed-device households but does not excuse weaker cook mode. |
| Mela | Apple-focused collection/reading | One-time iOS/iPadOS unlock **$6.99**; Mac is separately purchased. [US listing](https://apps.apple.com/us/app/mela-recipe-manager/id1548466041), [FAQ](https://mela.recipes/help/) | Very low price and low-friction native library. Fork must sell repeat cooking/iteration or collaboration value, not aesthetics alone. |
| AnyList | Shopping-first household utility with recipes | **$9.99/year individual; $14.99/year household**, website dollar price; web/Mac and extended recipe/planning features in Complete. [Complete](https://www.anylist.com/complete) | A household’s shopping workflow is hard to displace. Export/share into existing lists can reduce required behavior change. |
| Samsung Food | Broad cross-platform food platform; paid personalization/health | **$59.99/year or $6.99/month**, 7-day trial; country variation stated. Multiple advanced features explicitly mobile-only. [Food+](https://samsungfood.com/food-plus/) | Demonstrates higher-priced AI/planning tier, but not proof Fork customers will pay that price. Avoid competing primarily on diet coaching. |
| Mealie | Self-hosted household recipe platform | Self-hosted open-source model; hosting/administration remain user responsibilities. No official hosted paid plan verified here. [Introduction](https://mealie.io/documentation/getting-started/introduction/) | Offer hosted convenience, excellent portability and humane version history. Do not market standard subrecipes/logging as exclusive. |
| Tandoor | Power-user collection, search and collaboration | Official docs emphasize self-hosting and powerful data management. Hosted price not reliably verified in this sweep. [Docs](https://docs.tandoor.dev/) | Better out-of-box workflow can matter more than matching every power-user setting. |
| Cooklang | Open files and tooling; increasingly full ecosystem | Free open-source editor/tooling plus optional cloud; home page advertises **Cook Pro €12.99/month** with CookBot. Exact lower-tier prices not checked. [Home](https://cooklang.org/) | Portability and Git are already sold. Fork’s opportunity is seamless everyday use and cooking-specific version semantics. |

### Inferences

Commercially useful feature ordering:

- **Activation:** paste/URL capture, mobile capture entry, representative demo recipe, clear first cookbook, migration preview. Measure first trustworthy saved recipe and first successful cook; not account creation alone.
- **Retention:** predictable search/collections, dependable cooking, offline/print, private attempt notes and version recall, grocery/plan routine. Use observed recurring cooks and revisits to validate retention.
- **Acquisition:** shareable readable recipe pages and collections, attractive print/export, credited variants and “what changed / what worked” examples, content from real cooks who consent to publish. These show the distinctive benefit without needing a populated social feed.
- **Revenue:** paid convenience or advanced capability might include larger organized libraries, households, rich attempt history, advanced import, and high-volume AI-assisted extraction. Test willingness to pay with actual target users after baseline usefulness. Do not gate recovery of user data or portable export as coercive lock-in. Do not assume a given package or price is validated by competitor prices.
- **Portfolio:** demonstrate a coherent end-to-end story: import grandmother’s dough recipe, preserve the source, record two attempts, compare one quantity change, pin a tested dough into a pie, and produce a reliable grocery list/printout. This makes the engineering model legible in ordinary cooking terms. A technically ambitious timeline graph is less persuasive if editing and saves are fragile.

Recommended positioning hypothesis: **“Your cookbook, improved every time you cook.”** Supporting promise: save trusted recipes, cook comfortably, remember changes and keep the versions that worked. Avoid “GitHub for recipes” as required user knowledge; it can remain an engineering explanation and portfolio story.

Competitor prevalence is a positive inclusion signal. Where this proposal defers familiar features, the reasons are explicit: foundational data dependencies (nutrition/subrecipes), reliability/permissions (offline/households), recurring operational cost (AI/social), or a different target customer (restaurant procurement). The hypothesis should be tested by watching serious cooks use real libraries, not used as an excuse to dismiss requested features.

### Gaps

#### Source register and limitations

All sources below were accessed on 8 November 2026; source publication dates are included where reliably visible. Undated vendor/help pages are current documentation snapshots, and can mix released features, paid tiers and platform differences. No future-dated claims were used.

| Source group | Dated evidence / role | Limitation |
|---|---|---|
| Paprika [release](https://www.paprikaapp.com/news/2026/11/06/paprika-4-is-now-available-for-all-users/), [home](https://www.paprikaapp.com/), [guide](https://www.paprikaapp.com/help/windows/) | Release 6 Nov 2026; current baseline and pricing | Brand-new release; no independent quality verification; introductory price |
| Recipe Keeper [site](https://recipekeeperonline.com/), [US listing](https://apps.apple.com/us/app/recipe-keeper/id974683711) | Current capabilities, price, dated historical review examples | Reviews are anecdotes; old complaints not asserted current |
| Crouton [site](https://crouton.app/), [US listing](https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987) | Native cooking and IAP evidence | Entitlement mapping and export/offline not fully checked |
| Mela [site](https://mela.recipes/), [help](https://mela.recipes/help/), [US listing](https://apps.apple.com/us/app/mela-recipe-manager/id1548466041) | Library, cook/OS integration, price | Full app not run; local storage is not proof of every offline action |
| AnyList [features](https://www.anylist.com/features), [Complete](https://www.anylist.com/complete), [recipes](https://www.anylist.com/recipes) | Household utility, price and broad parity | Browser-extracted feature checkmarks are unreliable; do not infer every free/paid cell |
| Samsung [home](https://samsungfood.com/), [Food+](https://samsungfood.com/food-plus/) | Capability/pricing boundary and mobile exclusions | No inferred clinical value or verified subscription conversion |
| Mealie [features](https://mealie.io/documentation/getting-started/features/), [PR #4800](https://github.com/mealie-recipes/mealie/pull/4800) | Current docs; subrecipe merge 4 Nov 2025 | Merge evidence is not a cross-client quality test |
| Tandoor [docs](https://docs.tandoor.dev/), [import/export](https://docs.tandoor.dev/features/import_export/) | Current product/model and portability evidence | Some pages stale; templating page has contradictory release warning, so not used to certify present support |
| Cooklang [home](https://cooklang.org/), [spec](https://cooklang.org/docs/spec/), [conventions](https://cooklang.org/docs/conventions/) | Ecosystem, syntax and semantics | Specification is not universal client support |
| Public GitHub discussions and Tandoor issue linked above | 2021–2026 qualitative jobs and failure modes | Self-selected developer/self-hoster audience; supports investigation/inclusion, not population estimates |
| [Schema.org Recipe](https://schema.org/Recipe) | Interoperable structural possibilities | Development-version page; no assumption every publisher follows every field |
| [King Arthur recipe reduction](https://www.kingarthurbaking.com/blog/2020/11/23/how-to-reduce-a-recipe) | 23 Nov 2020 domain guidance | Not a universal automated baking conversion algorithm |

Revenue forecasts, unit economics and paid conversion scenarios are assigned to the parallel strategy research; these notes supply verified pricing anchors and feature implications only. No application code, production data, packages or commits were changed. No paid competitor subscriptions were purchased; the principal risk is treating documentation breadth as proof of UX quality or treating plausible willingness to pay as measured demand.
