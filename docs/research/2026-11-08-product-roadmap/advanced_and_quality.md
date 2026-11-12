# Fork: advanced opportunities, trustworthy assistance, and quality gates

Research date and access date for every external source below: **2026-11-08**. Primary audience: serious home cooks; chefs are adjacent recipe developers, not an authorization to build restaurant operations. All roadmap proposals below are researcher recommendations, not observed user demand. This research inspected planning documents and current primary references; it did not conduct user interviews, run Fork, audit accessibility, or evaluate an AI model.

## 1. What quality must the base experience achieve before expansion?

### Takeaway

Make trust, recovery, readability, and cooking correctness explicit release gates. A feature exists only when its failure states are understandable: a saved recipe survives interrupted work, a private recipe stays private, and scaling never silently manufactures certainty.

### Cited Findings

- Fork's historical roadmap already records private-by-default recipes and forks, explicit publication, source-version pinning, and a distinction between a bookmark and an editable variation. It records serving scaling and cook mode as shipped, so these should receive quality improvements rather than be proposed as new features. It also records a prior rejection of recipe-page tabs that give history equal prominence to ingredients/method. [Existing roadmap](../../history/2026-10-milestones.md)
- Coordinator's current repository audit reports existing optimistic concurrency protection, versioned photos and persistent ticks, but absent durable draft recovery and continuing public defaults/inherited fork visibility. This is a preliminary audit input, not independently reverified here; use the final audit's source references in the final roadmap.
- WCAG 2.2 adds AA requirements covering drag alternatives, minimum target size, unobscured focus, and accessible authentication. Minimum pointer targets are generally 24 by 24 CSS pixels or meet specified spacing/exceptions; 44 by 44 belongs to the enhanced AAA target criterion. Keyboard access, text contrast, reflow and visible focus remain relevant. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- Screen Wake Lock works only for active/visible documents, can be rejected or released for battery/system reasons, and must be requested again after release. It is an enhancement, not a guarantee that a device will remain awake. [MDN Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- Browsers throttle timers in background tabs; actual timeout delay can exceed the requested delay. A component-local `setTimeout` is therefore not a dependable locked-screen kitchen alarm. [MDN setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout)
- Service workers enable offline and background operations but browsers may terminate them; they do not run continuously. Offline reading and dependable scheduled alarms are different capabilities. [MDN offline and background operations](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- Google's current good Core Web Vitals thresholds are LCP at most 2.5 seconds, INP at most 200 ms, CLS at most 0.1, assessed at the 75th percentile and separated by mobile/desktop. These are performance targets, not a complete measure of UX. [Web Vitals](https://web.dev/articles/vitals)
- King Arthur's chart distinguishes ingredient-specific and preparation-specific weights, recommends weighing, and states its cup of all-purpose flour is 120 grams. This supports careful density matching; it does not make 120 grams a universal definition of every flour cup. [Ingredient weight chart](https://www.kingarthurbaking.com/learn/ingredient-weight-chart)
- Cooklang conventions support linear ingredient scaling, explicit fixed quantities, and no automatic scaling of timers or cookware. These conventions are interoperability guidance, not scientific proof that every recipe scales linearly. [Cooklang conventions](https://cooklang.org/docs/conventions/)
- FoodData Central distinguishes analytical, survey, legacy and branded-label data; its Foundation Foods metadata describe sources of nutrient variability. A database match is not a laboratory analysis of the user's final meal. [USDA FoodData Central FAQ](https://fdc.nal.usda.gov/faq/)
- URL import introduces a server-side fetch trust boundary. OWASP documents SSRF risks from user-controlled destinations, parser disagreement, redirects and resolution, and recommends application and network-layer controls. [OWASP SSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

### Inferences

**Recommended base release gate, before growth/social/AI:**

1. New recipes and variations start private; publication is explicit. Search, shared links, cached pages, images, history, exports, forks and future collection membership must all respect the same access rules. Explain what unpublishing can and cannot retract from existing independent copies. Do not accidentally turn a private collection into an access grant for a private recipe.
2. Editor draft recovery survives reload/navigation/interrupted network within a documented storage model. Clearly separate local draft state from saved versions; preserve text after validation/server failures; retain the existing conflict protection. Test both tabs editing, expiry of auth, refresh, back, offline save and failed upload. Local draft autosave should not flood append-only recipe history.
3. Data portability includes ordinary readable recipe export and a complete account archive capable of retaining versions, attribution, notes and photo references/files. Verify a representative export/reimport or documented restoration exercise. The user should be able to leave without losing the work that makes Fork valuable.
4. Maintain a small, stated browser/device support matrix including actual mobile Safari and Android Chrome, plus desktop keyboard use. Check narrow screens, zoom, long recipes, long ingredient names, fractions, Unicode, empty states and network failure. Automated accessibility checks support, but do not replace, manual keyboard and screen-reader journeys.
5. Adopt WCAG 2.2 AA as the target, not a claim of certified conformance. In cooking mode prefer larger primary hit areas (44 CSS pixels where feasible, a product choice beyond the AA minimum), strong contrast, legible quantities at counter distance, reduced-motion support, and an obvious undo for accidental ticks. Editor reordering must work without dragging.
6. Preserve ingredient and method overview while cooking; show needed quantities near the current step only through reliable ingredient references. Keep version history and development controls progressively disclosed. Avoid turning a familiar recipe into a wizard unless observed cooking tests show it helps.
7. Scale parsed numeric quantities without modifying saved content. Keep ranges, fractions, optional ingredients, 'to taste', package size and preparation qualifiers intact; explicitly show lines that could not scale. Never multiply temperatures or cooking durations by the serving multiplier. Conversion should preserve the author's original, show approximations/source assumptions, distinguish mass ounces from fluid ounces and unit systems, and decline uncertain ingredient-density matches.
8. Timers may be valuable, but the old M11 implementation sketch is not a reliability specification. Persist a deadline and recompute remaining time after reload/backgrounding; show multiple timer names and originating steps; verify notification-denied, silent mode, lock, background, resume and offline behavior on supported devices. State unsupported background-alarm behavior in the feature itself. Native alarm reliability is a future platform decision, not solved by adding a service worker.
9. Offline reading first: explicitly download a recipe/version, confirm availability, retain image/ingredient/method content, show which version is cached, and handle sign-out/account changes safely. Full offline editing and multi-device conflict resolution follow only if demand warrants them.
10. Gate URL import on bounded fetches, safe destination handling including redirects, content-type/size/time limits, sanitization, and preview before saving. A good importer also offers paste/manual fallback and preserves attribution. This is necessary base security, independent of whether AI parses the result.

**Proposed quality scorecard, not current results:**

- Critical task completion: import/create → organize → retrieve → scale → cook → save a correction → recover an old version. Record unassisted completion and every material error, with raw participant counts rather than claims of significance from tiny samples.
- Data-loss/privacy gate: no known unresolved reproducible loss of a user's work, cross-account exposure, or accidental publication in the release test matrix. A zero count in tests does not prove absence of bugs.
- Experience gate: no unresolved blocking keyboard/screen-reader failure in those journeys; no horizontal overflow on supported narrow screens; quantitative performance targets above, with lab numbers labeled as lab numbers until field data exist.
- Save reliability: successful durable saves / attempted saves, excluding user validation errors; count recovered drafts separately. Monitor upload failures, permission failures and conflict recoveries. Never collect private recipe text just to measure these.
- Retrieval: successful known-item retrieval and search-to-open success on a realistic personal cookbook; segment by title, ingredient, tag, spelling variant and language. Favorites and popular public recipes must not bury the user's exact match.
- Cooking tests: observe a real meal preparation on a counter, not only a seated usability session. Watch rereading, loss of place, scroll travel, accidental taps, phone locking and switching between recipes. Do not encourage unsafe phone use near heat/water.

### Gaps

- No measured Fork accessibility, speed, device reliability or usability results exist in this research. Acceptance gates are recommendations requiring verification.
- Ingredient conversion correctness depends on the source recipe's units, ingredient identity, preparation and quantities. External tables cannot settle all ambiguous imported text.
- No research here proves users need full offline editing, native apps, background notifications or a specific navigation arrangement. Test actual pain before committing to the larger implementation.

## 2. Which differentiated capabilities deserve the long-term roadmap?

### Takeaway

The strongest coherent direction is a personal cookbook that remembers how a recipe became yours. Version-linked cooking observations and reusable components are more directly connected to that promise than a feed, a generic chatbot, or restaurant administration.

### Cited Findings

- The existing roadmap preserves M17 cooking attempts, M22 version-pinned sub-recipes, M21 pantry matching and M23 graphical step timelines; social features were explicitly revived on October 29 after an older deferral. Any new sequence must acknowledge it is reprioritizing these ideas, not present an older deferral as the latest decision. [Existing roadmap](../../history/2026-10-milestones.md)
- The business note treats a baker's notebook and versioned cook log as a potential wedge, but explicitly calls the baker audience a hypothesis. Its revenue ranges and some user counts/prices are estimates or search summaries. Do not promote those figures, the proposed 200-weekly-logger threshold, or April 2027 kill date into evidence-based roadmap requirements. [Prior business research](../archive/2026-10-31-business-viability.md)
- Baker's percentages express each ingredient against total flour weight. King Arthur explicitly discusses the need to account for flour and water inside preferments when calculating an overall formula. [King Arthur baker's percentage](https://www.kingarthurbaking.com/pro/reference/bakers-percentage)
- meez's official product plans span recipe books, scaling, sub-recipes and costing into team prep, inventory, locations and integrations. This demonstrates that professional kitchen operations involve a substantially broader product surface than recipe development. These are vendor feature claims, not evidence of demand among Fork users. [meez plans](https://www.getmeez.com/pricing)
- US Copyright Office guidance distinguishes bare ingredient lists/basic procedures from protectable creative explanations, photos and illustrations. It does not establish a blanket permission to import or republish all recipes; applicability outside the US is not assessed here. [Copyright Office Circular 33](https://www.copyright.gov/circs/circ33.pdf)

### Inferences

**Milestone sequence proposed for synthesis:**

| Milestone | Smallest useful capability | Dependencies and release decision |
| --- | --- | --- |
| A. Trustworthy daily cookbook | Recovery/privacy/export; frictionless editing and retrieval; accessible cooking and print | Complete base journeys before expanding scope. Existing versions, scaling and cook mode remain strengths to refine. |
| B. Useful repeat cooking | Private 'Made it' entry tied to the exact recipe version; date, quick note and optional photo; recall the last relevant note before cooking | Stable identity/version references and base usability. One tap can log; every extra field is optional. Gate richer diary on actual repeat use. |
| C. Practical organization and sharing | Personal collections, clear save-versus-adapt labels, deliberate links, small shared cookbooks and household permissions | Stable privacy policy/implementation, source-version pinning, permission tests. A shared collection should solve a household job even with no public community. |
| D. Recipe development | Compare iterations, promote a successful attempt into a new version, version-pinned sub-recipes, ingredient-step references; later batch yield and baker's percentages | Logs show that people revisit changes. Sub-recipes need access control, cycle prevention, unit/portion semantics and exact version pinning. Advanced calculations use known weights, not speculative density inference. |
| E. Targeted assistance | Evaluated import repair/OCR, cookbook-grounded retrieval, explicit adaptation proposals | Trusted base, source-preserving editor, evaluation corpus, opt-in processing, cost/error monitoring. Each AI capability passes its own gate. |
| F. Community or professional depth | Version-specific feedback and suggested changes; follows/feed only after recurring sharing. Optional creator publishing or deeper baking tools | Evidence of the corresponding behavior. Never make social engagement a prerequisite for a useful personal cookbook. |

The order can interleave small items: private cooking notes may precede complex household permissions; structured URL import belongs in the base even if AI fallback belongs later; simple grocery lists/meal planning may belong before advanced development if the baseline research shows they complete the chosen daily-use loop. Avoid forcing all quality work into a one-off phase—every phase retains it.

**Cooking-log design:** distinguish the recipe as written, what happened on one occasion, and a lasting change to the recipe. Logging a substitution or a scaled batch does not automatically rewrite the canonical recipe. Offer 'Use these changes next time' to create a reviewed new version. A log should remember the version and relevant cooking scale; preserve a link to historical content if the live recipe changes. Privacy of a log is independent from the recipe's public visibility. Personal success/rating can be private before introducing public scores.

**Sub-recipes are a stronger flagship than a decorative lineage graph:** a pie records which dough version worked, and its next version can intentionally upgrade that component. Show the update clearly without teaching 'lockfiles'. Handle unavailable/private component links safely. A public parent recipe must not disclose a private child's content. Define whether shopping/export expands pinned components and deduplicates them before building UI.

**Chef-adjacent scope:** precise yields, optional weights, batch scaling with explicit limits, reusable sauces/doughs, iteration notes, photos, ingredient use in steps, readable print and small-team recipe feedback. These help serious home cooks too. Procurement, invoices, supplier prices, stock valuation, payroll, POS, multi-location rollout, HACCP/compliance and kitchen inventory are separate product decisions, not implied by 'for chefs'.

**Plain language over Git vocabulary:** keep Fork as the brand; test 'Make my version', 'Save to cookbook', 'History', 'Compare changes' and 'Suggest a change'. Git concepts can underpin exact lineage and append-only history without making users learn commits, branches or pull requests. Preserve diff power for interested users while ordinary saving stays ordinary.

**Collaboration sequence:** personal collections → deliberate recipe links → shared household cookbook with clear owner/editor/viewer semantics → version-specific notes/suggestions → optional follows/feed. Before public comments/feed, provide reporting, blocking where appropriate, moderation/hide workflows, posting limits and deletion handling. Do not confuse discoverability with rights to reuse. Retain original source/author in imports, adaptations and exports; attribution alone is not permission. Private-by-default reduces accidental exposure but is not a legal exemption for importing copyrighted work.

**Explicit defer/reject list:**

- Defer M23 dependency timeline until step durations/dependencies are useful and users struggle to coordinate recipes; a graph built only for a portfolio screenshot adds an editing burden.
- Keep M21 pantry matching as an experiment: start from an ad hoc 'ingredients I have' list, show missing ingredients, do not demand precise inventory maintenance. Full pantry depletion, expiry and grocery pricing remain separate decisions.
- Defer real-time collaborative editing and automatic merge. Existing optimistic conflict detection plus reviewed suggested changes may solve the actual need.
- Defer public star ratings, streak pressure, recommendation feeds and discovery graphs until a healthy cooking/sharing loop exists. Counts of clicks or posts are not evidence of better meals.
- Defer generic prompt-to-recipe generation, automatic nutritional scoring, subscription complexity and native builds until each has a specific validated value. Native work is warranted by measured limitations, not a fabricated user-count threshold.
- Preserve prior rejections: ads, automatic prep-time estimates, stored 'grams made' recipe field, and equal-weight recipe/history/forks tabs. A per-attempt observation or derived batch output is a different product decision from resurrecting a rejected global field.

**Validation and meaningful metrics:**

- Recruit serious home cooks with different habits: repeat weeknight meals, baking, saved web recipes, family recipes and shared-household cooking. Include chefs who develop recipes as a secondary group. Observe current tools and ask for recent actual failures, not wish lists.
- First test base tasks using participants' own recipes; then run a diary pilot spanning several real cooking occasions. A proposed small cohort is for discovering repeated failure modes, not estimating market demand.
- Measure activated cooks who retrieve/use a saved recipe on another occasion, successful repeat cooks, returning users with another purposeful session, and how often prior notes/version history helped. Define denominators and cohort start event before collecting data.
- Measure version utility by meaningful edits, revisited prior versions, recovery actions and successful adaptation; do not count autosaves as adoption. Cooking logs are optional, so a missing log is not proof that nobody cooked.
- Advance household sharing when households repeatedly exchange/use recipes and permissions are comprehensible. Advance feed when users voluntarily seek others' cooking updates and existing sharing generates return use. Do not copy an arbitrary '200 weekly loggers' gate from old speculative business planning.
- Stop expanding any feature that increases entry effort without reducing later effort. Ask whether people would miss it; compare against the existing workflow, and record non-use reasons.

**Portfolio demonstration strategy:** ship one complete narrative: capture a recipe, recover an interrupted edit, cook a scaled version, record a result, improve it, compare changes, deliberately share a variation with attribution. Add a second scenario showing a version-pinned dough inside a pie only after that is built. Publish a concise case study with observed usability problems, before/after evidence, accessibility/performance checks, failure-state handling and architecture trade-offs. An honest demonstration of recovery and permissions is more persuasive than an unvalidated feature count. Keep a reproducible demo dataset and logged-out view; don't expose actual private recipes or claim user outcomes that were not measured.

#### Revenue and competitiveness extension requested during research

**Interpretation update:** competitor prevalence and recurring forum requests are strong positive prioritization signals, especially for base cookbook jobs. They need not be rejected merely because they are vendor claims or self-selected reports. Validate exact implementation and economics, not whether every widely established basic feature deserves to exist. The market researcher's updated comparison also finds Cooklang now has editing/cloud/AI and Git workflows: do not claim version control alone is unique. Fork's candidate advantage is approachable, integrated version-plus-cooking-attempt workflows.

**Pricing recommendation (hypothesis):** test roughly **US$24/year personal** and **US$36/year household or power tier**, with one simple paid offering initially if the second tier cannot justify itself. Do not simultaneously commit to household and power as separate products. A $30 blended annual revenue per paid account below is illustrative, equivalent to an even mix of $24/$36 accounts. A household is one paying account, not one payer per household member. The market has strong cheaper alternatives: AnyList's official price is $9.99 individual/$14.99 household per year, with recipe import, planning, sharing and scaling among paid capabilities. The market agent additionally verified Paprika 4 introductory pricing at $14.99/year. Therefore $24–36 must earn its premium with repeat-cooking value, polish and migration, not merely match baseline storage. [AnyList Complete](https://www.anylist.com/complete)

**Packaging hypothesis:** free should demonstrate the full personal loop: private recipes, manual creation, ordinary editing, scaling/cook mode, basic history and a useful taste of imports/logging/organization. Keep access to existing user content, full user-owned data export, privacy and recovery available on downgrade. Paid candidates: shared household libraries, generous import/photo allowances, large-library organization/migration convenience, richer cook diary/development views, and bounded AI credits. Determine exact numeric limits from actual usage and costs; don't invent an arbitrary recipe cap before observing the library sizes needed to experience value. No lifetime-unlimited AI promise; no payments work until a paid feature proposition can be shown concretely.

**Cost evidence, verified 2026-11-08:**

- Stripe HK publishes 3.4% + US$0.30 per card charge settled in USD, +0.5% for international cards and +2% where currency conversion is required. Pay-as-you-go Stripe Billing is 0.7% of billing volume. Actual merchant location/payment mix must be confirmed; user timezone does not establish a legal entity. [Stripe Hong Kong pricing](https://stripe.com/en-hk/pricing)
- Supabase Pro starts at $25/month, including one Micro project's compute via credit, with published allowances and overages for auth, storage, egress and compute. It is a starting cost, not proof that every workload fits. [Supabase pricing](https://supabase.com/pricing)
- Netlify now exposes credit-based usage for compute, bandwidth, requests and deploys. Its fetched page contains multiple Personal prices ($9/$12/$15) and links to dashboard-specific pricing, so this research does **not** assert that the user's current plan costs $9. Pro add-on credits are listed at $10/1,500 credits. Use the real account and usage measurements when budgeting. [Netlify pricing](https://www.netlify.com/pricing/)

**24-month scenarios — arithmetic, not forecasts.** These begin at a hypothetical paid launch, not today; zero starting users, constant monthly signup acquisition, all conversions in the signup month, equal cohorts, annual billing at the beginning of the month, no refunds or mid-term service loss. Annual nonrenewal represents churn; cancellation requests keep paid entitlement through year end. No paid acquisition is assumed, so acquisition work is founder time excluded from cash costs. Real funnels have delays, seasonality and cancellations; replace assumptions with cohort data.

| Assumption | Conservative | Working niche | Strong niche |
| --- | ---: | ---: | ---: |
| New registrations/month | 100 | 500 | 2,000 |
| Activation among new registrations | 35% | 45% | 55% |
| Paid conversion among activated accounts | 3% | 6% | 8% |
| New paying accounts/month | 1.05 | 13.5 | 88 |
| Annual paid renewal | 60% | 70% | 80% |
| Annual revenue per paid account | $30 | $30 | $30 |
| Fixed infrastructure/operations budget/month | $60 | $120 | $350 |

Activation should mean a real value event (for example saving/importing several personally useful recipes and returning to retrieve/cook one), not simply registering. The conversion rates above are assumptions about activated accounts; across **all** new registrations they imply 1.05%, 2.7% and 4.4%, respectively. Do not present them as industry benchmarks.

Let `n = monthly registrations × activation × paid conversion`, `r = annual renewal`, `p = $30`. At month 12 paid entitlement stock is `12n`; month 24 is `12n(1+r)`. First-year recognized subscription revenue is `78np/12` (cohorts contribute 12+11+…+1 months); year two is `(144+78r)np/12`. First-year billings are `12np`; year two billings are `12np(1+r)`. ARR here is annualized paid entitlement value, assuming all current entitlements remain renewable; subtract known nonrenewals in a real operating ARR report.

| Output (rounded; fractional accounts are expected-value arithmetic) | Conservative | Working niche | Strong niche |
| --- | ---: | ---: | ---: |
| Cumulative acquired registrations, 24 months | 2,400 | 12,000 | 48,000 |
| New paid accounts acquired, 24 months | 25 | 324 | 2,112 |
| Active paid entitlements, month 12 | 13 | 162 | 1,056 |
| Active paid entitlements, month 24 | 20 | 275 | 1,901 |
| ARR at month 12 | $378 | $4,860 | $31,680 |
| ARR at month 24 | $605 | $8,262 | $57,024 |
| Recognized subscription revenue, year 1 | $205 | $2,633 | $17,160 |
| Recognized subscription revenue, year 2 | $501 | $6,703 | $45,408 |
| Total recognized subscription revenue, 24 months | $706 | $9,335 | $62,568 |
| Cash subscription billings, 24 months | $983 | $13,122 | $88,704 |

**Illustrative operating deductions:** model annual web payments at 5.6% of cash billings: 3.4% base +0.5% international +0.7% Billing +$0.30/$30 fixed-charge equivalent. This assumes USD settlement without conversion. Also reserve **$0.70 per paid account-month**: $0.20 AI, $0.10 incremental media/storage/egress, $0.40 cash support/moderation allowance. These are budget assumptions, **not measured vendor token costs or sufficient staffing forecasts**. AI free trials, free-user serving load, SMTP, monitoring and basic hosting must fit the fixed budget or be added; no unlimited free AI is assumed. Support allowance is only cash capacity, not a valuation of founder labor. Fixed budgets above are workload hypotheses, not infrastructure capacity guarantees.

| 24-month cash view | Conservative | Working niche | Strong niche |
| --- | ---: | ---: | ---: |
| Payment + Billing fees | $55 | $735 | $4,967 |
| AI/media/support variable reserve | $198 | $2,614 | $17,519 |
| Fixed infrastructure/operations budget | $1,440 | $2,880 | $8,400 |
| Cash billings less those costs | **−$710** | **$6,893** | **$57,818** |
| Of billings, service still unearned at month 24 | $277 | $3,787 | $26,136 |
| Recognized revenue less the above cash-period costs | **−$987** | **$3,107** | **$31,682** |

The last row is an intentionally simple operating comparison, **not GAAP profit**: it subtracts payment fees when cash is billed rather than amortizing them. Cash surplus is not all spendable profit because annual subscriptions still owe future service. Income/sales taxes, refunds/disputes, professional advice, acquisition spending, founder salary, native-store commissions and future development are excluded; add actuals before calling this a business profit estimate. Taxes collected on behalf of governments are not revenue.

**Sensitivity and meaning:**

- Changing the paid conversion or signup flow by half approximately halves payer/revenue outputs at constant retention; pricing and conversion are not independent in reality. At $24 instead of $30, gross revenue is 20% lower; at $36 it is 20% higher, before any conversion/renewal effect.
- At the $30 blend, annual contribution before fixed costs is approximately `$30 × (1−5.6%) − $8.40 = $19.92` per paid account. Covering $120/month fixed expenses needs about **73 active paid accounts**, ignoring acquisition and founder work. A chosen $60,000/year founder-pay target plus $4,200 fixed expenses would require about **3,223 active paid accounts** at the same unit economics—this is a target calculation, not a forecast or market-size claim.
- At month 24, annualized contribution after the modeled fixed/variable costs is about **−$318 / $4,046 / $33,664** across scenarios, before founder pay and exclusions. The middle case is a modest self-supporting side product; even the strong case does not by itself establish a comfortably paid full-time business.
- AI spend rising from $0.20 to $1.00 per paid account-month cuts annualized month-24 contribution by about **$194 / $2,644 / $18,248**. A generous low-price unlimited-AI tier can consume most margin. Meter useful AI actions, measure cost per successful reviewed import, and permit manual continuation.
- If all transactions require the extra 2% currency conversion, subtract 2% of billings from the cash view. Native-store commission, if introduced, must replace/add the appropriate actual channel fees; web economics do not automatically carry over.
- A $10 acquisition cost per new paid account would consume another **$252 / $3,240 / $21,120** over 24 months. Organic channels also consume founder time. Do not run broad paid acquisition until observed renewal/contribution supports a measured CAC and payback period.

**Features tied to business outcomes (hypotheses to measure):**

| Feature/quality investment | Expected business mechanism | Evidence to collect |
| --- | --- | --- |
| Bulk migration + trustworthy URL/photo import | Acquisition and activation: lower cost of moving an existing cookbook | Import-to-first-cook completion; correction work; cohort retention versus manual onboarding |
| Reliable mobile editing/cooking/offline reading | Retention: works at the moment of use | Repeat cooking/retrieval; save failure and abandonment; actual offline use |
| Collections + meal plan/grocery loop | Habit and household relevance; strong established competitor signal | Weekly repeated use across planning, shopping and cooking; shared-list value |
| Version-linked attempts + easy adaptations | Differentiated retention and possible premium reason | Reuse of past notes; repeat improvements; paid preference versus low-cost alternatives |
| Shared household cookbook | Household conversion and retained joint value | Invites accepted, second member active, household renewal; avoid counting both as payers |
| Good logged-out recipe + attributed share | Referral acquisition | Shared-link visit → useful activation → repeat use, not raw share count |
| Bounded AI import help | Higher activation or paid conversion if it saves correction effort | Cost per accurate saved recipe, opt-in rate, paid retention; disable if no net benefit |

**Distribution and willingness-to-pay gates:** begin with cooking/baking circles and friends-of-users, demonstrate real before/after iterations, offer assisted migration, and invite a few creators whose recipes naturally evolve. Community posts should show useful cooking results and respect community rules; do not assume access to an audience. Maintain good public metadata and search discoverability but don't make SEO the only channel. Test price against a working paid bundle with clear delivery/refund terms; distinguish actual purchases from waitlist interest. Interview people who chose AnyList/Paprika/free alternatives after trying Fork. Advance spending only when cohorts show useful repeat behavior, actual paid conversion and tolerable support/cost. Small-cohort renewal is noisy: show the underlying count. A positive product/portfolio outcome is worthwhile even when revenues stay in the conservative range.

### Gaps

- Version-linked learning is a coherent hypothesis, not a validated competitive moat. This research did not prove that competitors lack versioning or cooking logs.
- No new interviews, retention data, willingness-to-pay tests or representative chef research were performed. Do not promise a business outcome, market size or fixed delivery timeline.
- Rights, privacy, takedown and content retention requirements depend on the actual business, jurisdictions and implementation. US copyright guidance cannot settle every import/share case. Before broad public publishing, obtain a review scoped to actual flows rather than inventing universal legal requirements.

## 3. Where can AI help, and what evidence should permit its release?

### Takeaway

Use AI to reduce clerical work while keeping authorship and verification with the cook. Prioritize extraction and retrieval over invention; display adaptations as reviewable changes to a known recipe, with the original always recoverable.

### Cited Findings

- NIST's Generative AI Profile identifies confident false output as a risk and recommends empirical capability evaluation, verifying output sources, documenting limits, ongoing monitoring, and avoiding extrapolation from narrow anecdotal assessments. It is voluntary cross-sector guidance, not proof that a particular recipe assistant is safe. [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- OWASP identifies indirect prompt injection through external websites/files, including multimodal inputs; retrieval/fine-tuning do not fully solve it. Its mitigations include deterministic output validation, least privilege, segregating untrusted content, human control for privileged actions and adversarial tests. [OWASP prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- FDA describes ingredient labeling and cross-contact as separate concerns; the latter can introduce an allergen that was not intended as an ingredient. An ingredient-text classifier therefore cannot establish that an actual meal is safe for an allergy. [FDA food allergies](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies)
- NCHFP describes canning process safety as dependent on recipe composition, acidity, consistency, jar and pack characteristics, and testing. Changing a recipe while reusing its process time can be unsafe; there is no simple formula for deriving every safe canning process. [NCHFP heat-processing guidance](https://nchfp.uga.edu/resources/entry/backgrounder-heat-processing-of-home-canned-foods)

### Inferences

**Prioritized AI opportunities:**

1. **Import assistance:** deterministic structured recipe extraction first; AI/OCR for pasted unstructured text or photos when needed. Preserve the source and raw material for comparison; highlight uncertain quantities, missing units, ambiguous temperatures and omitted steps. Never silently 'improve' a source during transcription. Users approve a draft before saving. Measure time to an accurate saved recipe including corrections, not only speed to the first model response.
2. **Search inside my cookbook:** ordinary title/ingredient/tag search first. Add semantic interpretation if lexical search demonstrably fails on queries such as 'the soup I made last winter' or 'a quick dinner using chickpeas'. Filter by permissions before retrieval and again before rendering; cite actual saved recipes/versions/logs. Return no match when nothing supports the answer. A natural-language request should not silently mutate filters or recipes.
3. **Authoring assistance:** suggest missing formatting, optional tags, duplicate ingredients, and possible inconsistencies for review. Prefer deterministic checks where reliable. Never infer that an omitted ingredient must be added: omission may be intentional.
4. **Adaptation proposals:** start from a chosen version and an explicit goal; produce a proposed diff and explanation, with uncertainty and practical limitations. The cook accepts/rejects changes and saves a new version or variation. No autonomous overwrite, publication, shopping purchase or health claim.
5. **Learning from my attempts:** later summarize a user's own notes with links to the relevant attempts and versions ('you preferred the shorter bake in these two logs'). Do not fabricate causal certainty from uncontrolled household experiments. This is a more Fork-specific use of AI than generic recipe generation.

**Evaluation harness before release:** maintain a consented or rights-cleared corpus of representative recipes with human-reviewed expected data. Cover fractions, mixed units, ranges, decimal commas, multilingual text, ingredient groups, optional ingredients, repeated ingredients in different components, weak OCR, long pages, missing yields and adversarial source instructions. Include unsupported inputs intentionally.

| Capability | Evaluate | Block release or narrow scope when |
| --- | --- | --- |
| Import/OCR | Ingredient/quantity/unit and step retention; changed temperature/time; false added content; uncertainty detection; human correction time; cost and latency per usable recipe | Important source values are silently changed, omissions are not apparent, or total correction work is no better than paste/manual workflow |
| Search | Judged relevant results, known-item retrieval, unsupported claims, permissions, correct links; compare with lexical baseline | Private content leaks, cited recipes do not support the answer, or semantic search is worse than the baseline for common tasks |
| Adaptation | Follows the requested change; preserves non-target content; consistency between ingredients and steps; reviewer acceptance; critical safety-boundary cases | It changes food-safety instructions, claims allergy safety, fabricates tested results, or silently alters stored content |
| Notes summary | Every substantive statement supported by a linked log; faithful attribution; clear separation of observation and hypothesis | It invents preferences/results or implies unsupported causal conclusions |

Report per-field and per-case errors, especially safety-critical ones, instead of one attractive average score. A finite passing test set does not establish universal safety. Run the fixed benchmark on model/prompt/provider changes; version the evaluation inputs, record regressions, keep an operational off switch and deterministic/manual fallback. Establish actual acceptable correction burden and latency with observed user tasks before adopting arbitrary success percentages.

**Privacy/security boundary:** process only content needed for the requested action; explain when it leaves Fork, which provider processes it and actual retention/training settings. Do not promise 'never used for training' without verifying the chosen contract/settings. Do not default to sending an entire private cookbook or private diary. Avoid logging raw personal recipes/photos; keep operational logs minimal. Strip unnecessary image metadata where appropriate. Provider errors/quota/cost limits must preserve the draft and allow manual continuation. Treat model output and imported text as untrusted; schema validation, output sanitization, account authorization and URL-fetch protections remain deterministic server responsibilities. An importer needs no ability to send messages, fetch private account data or publish recipes.

**Bounded culinary claims:** keep nutritional estimates later than reliable ingredient identification/weights; label estimates and missing inputs rather than displaying false precision. Diet tags are preferences/content labels, not allergy certification. Do not generate or adapt preservation/canning safety instructions as an early AI feature; direct those workflows to tested authoritative sources. This is a narrowly chosen scope limit for a high-stakes category, not a claim that ordinary recipe adaptation has no value.

### Gaps

- No provider/model was selected or benchmarked; no claim of achievable accuracy, latency, cost or safe autonomy is made.
- No data establishes user demand for AI in Fork. An opt-in pilot must show less work or better retrieval beyond the non-AI baseline before prioritizing expansion.
- No clinical nutrition or food-safety validation is available. Human approval of an AI draft is useful product control but does not make an unsafe suggestion correct.
