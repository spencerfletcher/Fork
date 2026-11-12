# Business plan

How Fork could become a sustainable solo business, what is still a hypothesis, and the arithmetic behind it. All money is USD. Nothing here is approved pricing, a forecast or a probability. Edited in place; changelog at the bottom.

Research record: [roadmap report, section 7](../research/2026-11-08-product-roadmap/README.md), [scenario derivation](../research/2026-11-08-product-roadmap/advanced_and_quality.md), [social launch](../research/2026-11-08-social-launch/social_launch.md), [design and solo-business review](../research/2026-11-10-design-and-solo-business.md), [finished product and revenue](../research/2026-11-10-finished-product-and-revenue.md), [deep dive pricing notes](../research/2026-11-09-cookbook-app-deep-dive/README.md).

## 1. Goal

A sustainable solo operation; venture-scale growth is not required (Spencer, 10 Nov 2026). Fork is a credible product to pursue toward that goal: a dependable everyday cookbook that remembers how a person's cooking evolves, with a low-friction Journal and useful friends' activity. Commercial viability is unproven until independent users return and some pay. A good free product can still lack a compelling paid package. A positive product and portfolio outcome is worthwhile even if revenue stays small.

## 2. The paid offer: shape decided, price open

- **Shape:** one annual plan, no tiers at first (Spencer, 11 Nov 2026: "Shape is one annual plan sure. Details decide later."). Price and entitlements are decided later; household or power packaging is deferred ([ROADMAP.md](ROADMAP.md) section 13).
- **Prices to test:** US$24/year personal and US$36/year household or power use, after a working bundle exists (R). Test US$36 rather than assuming US$24 is a ceiling; US$48 average annual revenue per account is a sensitivity case, not an endorsed price (S2). Higher prices must earn their premium and may lower conversion or renewal.
- **One offer first.** Start with one paid package; add household pricing only when shared value warrants it; do not launch household and power tiers just to fill a table. A household is one paying account, not one per member.
- **Purchased core plus recurring services** (DD) is no longer the first offer's shape, superseded by the one annual plan ([DECISIONS.md](DECISIONS.md) section 2, line 29). The reasoning stays on record: a graphical view or cookbook export could belong to a purchased product, while hosted collaboration, storage and metered AI create ongoing obligations. Avoid unlimited lifetime obligations for hosted features. Subscription-only is not settled.
- **Free stays useful (a packaging hypothesis):** friend connections, posting and reading real cooks, likes and comments, ordinary cookbook utility, logging, private recipes, manual creation, editing, scaling, Cook, basic history and a taste of imports and organization. Charging before a circle works would confound the pilot.
- **Paid candidates:** shared household libraries and coordination, generous import and photo allowances, convenient capture, large-library management and migration, richer development and Journal exploration, bounded AI credits, a polished cookbook PDF (X04). Limits come from observed use and cost, not an invented recipe cap.
- **Never paywalled:** existing content access, recovery, privacy and full owned-data export, including on downgrade. No coercive lock-in; no unlimited AI promise.
- **Before charging:** no payments work until a paid proposition can be shown concretely; test price against a working bundle with clear delivery and refund terms; terms of service, a privacy policy and a refund policy reviewed once by a lawyer (a few thousand dollars, an estimate; [31 Oct business viability](../research/archive/2026-10-31-business-viability.md), proposed); record purchases separately from interest; interview people who chose cheaper or free alternatives (AnyList, Paprika) after trying Fork.
- Competitor anchors (see [COMPETITIVE.md](COMPETITIVE.md)): Paprika 4 premium US$14.99/year introductory, AnyList US$9.99 individual and US$14.99 household per year. They make a premium a burden to earn, not evidence Fork can charge it.

## 3. One unit-economics model

**Assumptions, stated once.** These are illustrative budget assumptions, not quotes, measured costs or staffing guarantees.

| Assumption | Value | Basis and caveat |
| --- | --- | --- |
| Payment and billing allowance | 5.6% of billings | Built from Stripe Hong Kong's published pricing: 3.4% card + 0.5% international + 0.7% Billing + US$0.30 per US$30 charge (1%). Kept only to preserve the arithmetic; not a selected merchant country, ceiling or US or Canadian quote |
| Variable reserve | US$0.70 per paid account-month (US$8.40/year) | US$0.20 AI, US$0.10 incremental media and storage, US$0.40 cash support and moderation. Not measured token costs; support is cash capacity, not founder labour |
| Fixed infrastructure and operations | US$120/month (US$1,440/year) | The base budget. The scenarios use US$60, US$120 and US$350 per month. Free-user serving, email, monitoring and any trial AI must fit inside or be added |
| Blended price | US$30/year | An even mix of US$24 and US$36 accounts |

**Formulas.** Annual contribution per payer before fixed costs is `price × (1 − 0.056) − 8.40`. Payers needed is `ceil(annual target ÷ contribution)`.

| Average annual price | Contribution per payer | Payers to cover US$1,440 fixed | Payers for US$60,000 founder pay + US$4,200 fixed | Same target with US$1,440 fixed |
| --: | --: | --: | --: | --: |
| $24 | $14.26 | 102 | 4,504 | 4,310 |
| $30 | $19.92 | 73 | 3,223 | 3,085 |
| $36 | $25.58 | 57 | 2,510 | 2,402 |
| $48 | $36.91 | 40 | 1,740 | 1,665 |

The US$60,000 founder-compensation figure is a chosen target in the sources, not Spencer's stated salary or currency. The sources pair it with US$4,200/year fixed costs (the upside scenario's US$350/month); the last column shows the same target at the base US$120/month. At US$30, 3,223 payers is US$96,690 gross annual recurring revenue (ARR). Counts use unrounded contribution. A lower count at a higher price does not mean those customers are equally easy to win.

**Payer count to gross ARR** (`payers × price`):

| Active paying accounts |   At $30 |   At $36 |
| ---------------------: | -------: | -------: |
|                    100 |   $3,000 |   $3,600 |
|                    500 |  $15,000 |  $18,000 |
|                  1,000 |  $30,000 |  $36,000 |
|                  3,000 |  $90,000 | $108,000 |
|                  5,000 | $150,000 | $180,000 |

A few hundred payers would be meaningful validation and some side revenue; several thousand could support a solo business if acquisition, renewal and costs cooperate; five thousand would be a substantial achievement, not an expected result of building the roadmap. Paying accounts are billing units; household plans blur them with users.

## 4. 24-month scenarios: arithmetic, not forecasts

They start at a hypothetical paid launch with zero users: constant monthly registrations, conversion in the signup month, annual billing at the start of the month, no refunds, entitlement for the paid year, annual nonrenewal as churn, no paid acquisition. Real funnels have delays, seasonality and cancellations; replace these with cohort data. Fractional accounts are expected-value arithmetic.

| Assumption | Conservative | Base: working niche | Upside: strong niche |
| --- | --: | --: | --: |
| New registrations per month | 100 | 500 | 2,000 |
| Activation among registrations | 35% | 45% | 55% |
| Paid conversion among activated | 3% | 6% | 8% |
| Implied paid conversion of all registrations | 1.05% | 2.7% | 4.4% |
| New paying accounts per month, `n` | 1.05 | 13.5 | 88 |
| Annual renewal, `r` | 60% | 70% | 80% |
| Annual revenue per account, `p` | $30 | $30 | $30 |
| Fixed budget per month | $60 | $120 | $350 |

Activation means real value (saving several useful recipes and returning to retrieve or cook one), not signup. These rates are assumptions, not industry benchmarks.

Formulas: entitlements at month 12 `12n`, at month 24 `12n(1+r)`; ARR is entitlements × `p`; recognized revenue year 1 `78np/12`, year 2 `(144+78r)np/12`; billings `12np` then `12np(1+r)`; paid account-months over 24 months `(222+78r)n`.

| Output, rounded | Conservative | Base | Upside |
| --- | --: | --: | --: |
| Cumulative registrations, month 24 | 2,400 | 12,000 | 48,000 |
| New paying accounts, 24 months | 25 | 324 | 2,112 |
| Active paid entitlements, month 12 / month 24 | 13 / 20 | 162 / 275 | 1,056 / 1,901 |
| ARR, month 12 | $378 | $4,860 | $31,680 |
| ARR, month 24 | **$605** | **$8,262** | **$57,024** |
| Recognized revenue, year 1 | $205 | $2,633 | $17,160 |
| Recognized revenue, year 2 | $501 | $6,703 | $45,408 |
| Recognized revenue, 24 months | $706 | $9,335 | $62,568 |
| Cash billings, 24 months | $983 | $13,122 | $88,704 |
| Payment fees (5.6% of billings) | $55 | $735 | $4,967 |
| Variable reserve ($0.70 × account-months) | $198 | $2,614 | $17,519 |
| Fixed budget, 24 months | $1,440 | $2,880 | $8,400 |
| Cash billings less these costs | **-$710** | **$6,893** | **$57,818** |
| Billings still unearned at month 24 | $277 | $3,787 | $26,136 |
| Recognized revenue less these costs | **-$987** | **$3,107** | **$31,682** |
| Annualized contribution at month 24 (`entitlements × 19.92 − 12 × fixed`) | **-$318** | **$4,046** | **$33,664** |

ARR here annualizes current entitlements; a real report subtracts known nonrenewals. Annualized stock, revenue earned in a period and cash collected are different: annual cash near month 24 also commits Fork to future service. "Recognized revenue less costs" is a simplified operating comparison, not accounting profit (fees are deducted when billed, not amortized). The base case is a modest self-supporting side product; even the upside does not by itself establish a comfortably paid full-time business.

**Sensitivities:** halving registrations or conversion roughly halves payers and revenue at constant renewal. US$24 instead of US$30 lowers gross revenue 20%; US$36 raises it 20%, before behavioural effects. Raising AI from US$0.20 to US$1.00 per account-month cuts month-24 annualized contribution by about $194 / $2,644 / $18,248 (`entitlements × 9.60`); a generous low-price unlimited-AI tier can eat most of the margin, so meter useful AI actions and measure cost per successful reviewed import. A US$10 acquisition cost per new payer consumes another $252 / $3,240 / $21,120 over 24 months. Extra 2% currency conversion subtracts 2% of billings. Native-store commissions need a new channel model. Pricing, conversion and retention are not independent in reality.

**Renewal and replacement** (steady-state illustrations, not benchmarks): with 3,000 paying accounts, renewal of 70%, 80% or 90% needs 900, 600 or 300 replacement payers a year just to stay level (`3,000 × (1 − r)`). At an illustrative 5% registration-to-paid rate, replacing 600 takes 12,000 new registrations a year (`600 ÷ 0.05`). Conversion delay and cohort timing matter in a real model.

**Excluded everywhere:** founder salary and development time, acquisition spending, income and sales taxes (taxes collected for governments are not revenue), refunds and disputes, professional advice, native-store commissions, future development. Household use and advanced features may raise costs. Update the assumptions with real costs and renewal before using this for a personal income decision.

**Discrepancies found while recomputing:** none in the arithmetic; every figure in the sources reproduces. Two notes: the sources pair the founder target with US$4,200 fixed (US$350/month) while the break-even uses US$120/month, so both are shown; and the replacement example's 5% registration-to-paid rate is higher than every scenario's implied rate (1.05%, 2.7%, 4.4%).

## 5. Where revenue could come from: investments and mechanisms

Hypotheses to measure. More features also raise operating and maintenance cost, so completion is not profitability; no percentage uplift is established (R, AQ, S1, S2).

| Investment | Mechanism | Evidence to collect | Main cost or risk |
| --- | --- | --- | --- |
| Trustworthy saves, drafts, recovery, privacy, export | Investing a library feels safe; less abandonment and support | Successful recoveries, fewer lost-work incidents, continued use after substantial entry | Essential trust work may convert little directly |
| Faithful import, migration, first-cook onboarding, bounded AI import help | Acquisition and activation: lower switching effort | Correction work and time to first useful cook, retained imported libraries versus manual setup, cost per accurate saved recipe, opt-in rate; disable AI help with no net benefit | Import maintenance and silent fidelity errors |
| Groups, yields, collections, search, units, print, dependable mobile cooking and offline | Removes reasons to go back to an incumbent | Repeat purposeful sessions and cooks, fewer workarounds, device failures, actual offline use | A checklist without coherent execution adds complexity |
| Journal, exact version and scale, resurfaced notes, easy adaptations | Differentiated retention and a possible premium reason | Past notes reused, successful versions revisited, willingness to pay versus cheaper alternatives | Logging may feel like work unless later value shows |
| Friends, cook comments, source-linked saves | Trusted inspiration, repeat use, referral | Non-founder pairs, friend-inspired later cooks, voluntary invitations without founder prompting | Cold starts, moderation and privacy work, uneven activity |
| Groceries, light planning, households | More occasions per week; shared paid value | Repeated plan, shop, cook use; invitations accepted, second member active, household renewal, counted once | Combining and permission complexity; strong alternatives |
| Subrecipes, development tools, advanced views | Depth for a smaller, committed paying segment | Repeated use by a defined segment and demonstrated payment | Smaller audience, more support, interdependent data |
| Readable attributed shares, creator examples | Referral acquisition | Shared visit, activation and repeat use, not share counts | Rights boundaries |
| AI, native conveniences, integrations | Remove specific labour or platform friction | Measured time saved, retention and conversion versus simpler approaches | Recurring expense, correctness, platform maintenance |
| Design consistency and operating reliability | Understanding, trust, retention; less avoidable support | Support volume, task success | Polish cannot substitute for behaviour |

The likely benefit is cumulative: capture gets a recipe in, reliable cooking earns trust, history makes the next cook better, sharing gives another reason to return.

## 6. Acquisition routes and evidence milestones

**Routes, as hypotheses** (none authorized; no outreach, spending or partnerships have happened):

1. Spencer's own circle (his cooking and café connections may help recruit), then organic referrals into independent circles.
2. A clear migration proposition for existing-app users, with assisted migration early.
3. A few permission-based partnerships with small cooking creators, cooking clubs or instructors whose recipes evolve.
4. Shareable public recipes and cook stories with consent, such as a share card per cook or change (ROADMAP Not yet phased, proposed); opted-in public recipe links useful to recipients before any signup; good public metadata, but not search as the only channel.
5. Focused educational or search content once public pages are useful.
6. Broader communities, launch directories and portfolio exposure as explicit experiments, respecting community rules.

Marketing shows specific outcomes: remembering the changes that worked, keeping an original while making a personal version, repeating a successful dinner. Private imports never become public acquisition content. Funnel to measure: attributed visit or invite, connected participant, trustworthy save or real log, later useful session, friend-inspired cook, optional paid depth. Do not infer a viral coefficient from invitations; technical launch traffic is not serious cooks. Measure cash acquisition cost and founder effort by channel, against contribution rather than gross revenue, before any paid campaign; no broad paid acquisition until observed renewal and contribution support a measured payback.

**Evidence milestones, in order:** useful without founder reminders; useful to independent groups; first actual paid customers; a repeatable acquisition channel; sustained renewal with manageable costs. The next business milestone is a group of independent users who rely on Fork for repeated cooking, then evidence that some will pay. Increase commitment only after that evidence. Small-cohort renewal is noisy: show the counts.

## 7. Cost and operations watch-list

- **Hosting:** Supabase Pro starts at US$25/month with allowances and overages for auth, storage, egress and compute; usage decides fit. Netlify now prices by credits for compute, bandwidth, requests and deploys, with several Personal prices shown (US$9, 12, 15) and Pro add-on credits at US$10 per 1,500; budget from the real account, not an old US$9 assumption. At large scale, a CDN or cached egress in front of photos matters more than the database (31 Oct business viability, an estimate).
- **Payments:** Stripe's published pricing (8 Nov 2026, no account access):

| Merchant page | Domestic cards | International addition | Currency conversion | Billing |
| ------------- | -------------- | ---------------------- | ------------------- | ------- |
| United States | 2.9% + US$0.30 | +1.5%                  | +1%                 | 0.7%    |
| Canada        | 2.9% + CA$0.30 | +0.8%                  | +2%                 | 0.7%    |

Targeting US and Canadian customers does not decide Fork's entity, account country, card mix, charge currency or processor; confirm them before budgeting. Fixed per-charge fees make monthly and annual payment mixes differ.

- **Track separately from the start:** pilot hosting, photo storage, support, moderation and legal-review costs (the support reserve is not validated against them), correction effort, import failures, processing cost per useful result, cancellations, integration maintenance.
- **Keep it maintainable by one person:** self-service recovery and useful errors, bounded AI cost with an off switch, no dependence on daily founder-written content, shared models that keep recipe meaning across views.
- Never collect private recipe text for analytics.

## 8. Rights and copyright: operating summary

Not legal advice. Detail and sources: [US note](../research/2026-11-08-social-launch/us_copyright.md), [Canada note](../research/2026-11-08-social-launch/canada_copyright.md). Fork is run by Spencer personally while it is free; an entity is formed before the first payment is taken (Spencer, 11 Nov 2026: "fine on running it while it's free and incorporate before taking payment"). The working assumption is a US corporation (not an LLC), to be confirmed with a cross-border accountant before forming, since Spencer is tax resident in both the US and Canada (Spencer, 11 Nov 2026: "will assume that and can come back to accountant later"; questions in [ROADMAP.md](ROADMAP.md) section 13). Targeting the US and Canada does not settle which rules apply, and a user-country setting is not the legal routing rule. No specific claim or Fork's eligibility for any protection has been assessed.

**What a complaint means.** Fork can receive a complaint or face a claim when a user posts a chef's recipe as their own; liability is not automatic. What was copied, permissions and exceptions, Fork's own acts and knowledge, and intermediary rules matter. Cooking facts and basic procedures differ from expressive directions, headnotes and photographs. Plagiarism (a credit problem) and infringement overlap but differ: credited copying can still infringe. Buying a cookbook, a free web page, changing an ingredient or "inspired by" does not clear copied prose or photos; private import is not universally exempt; there is no safe word count or percentage. AI paraphrasing does not clear copyright. **Forking is not an ownership reset:** new original writing or a photo can have its own rights without transferring the source's (US §103 and §106; in Canada, substantial reproduction under s3, ownership and licences under s13, and moral rights).

|  | United States | Canada |
| --- | --- | --- |
| Protection | §512 safe harbor for qualifying user-directed hosting: a designated agent registered with the Copyright Office and shown publicly (renewed every three years; US$6 fee), a communicated and executed repeat-infringer policy, compliant notice handling, knowledge, control and financial-benefit conditions. No universal proactive scanning required | s31.1 protects specified intermediary acts, including qualifying hosting, with exceptions; it does not cover Fork's own infringing acts, and services primarily enabling infringement face separate rules (s27(2.3)) |
| Process | Act expeditiously on qualifying notices, notify the uploader, handle counter-notices; restoration 10 to 14 business days after a qualifying counter-notice unless a court action is notified | Notice and notice (ss41.25, 41.26): forward compliant notices electronically as soon as feasible, tell the claimant, keep records six months, one year from receipt if proceedings are notified in time; demands for money or personal data do not qualify; no identity disclosure without a court order |
| Do not assume | Section 230 shields copyright (it does not); an email address is agent registration; losing safe harbor proves infringement | The US restoration clock applies; fair dealing or the non-commercial user-generated content exception (s29.21) is a blanket licence for a paid platform; every disliked edit breaches moral rights (s14.1, s28.2) |

The Cox v Sony decision (25 March 2026) on contributory liability is recorded in the US note; it did not make hosting platforms immune.

**Operating process for the pilot:** a visible rights-report route without claimant signup, a monitored inbox, a named backup, a small case record (work, URLs, assets, versions, evidence, notices, actions, dates). Separate attribution complaints, statutory notices, community reports and court orders. Give uploaders a response and appeal path; a counter-notice involves legal statements and contact details, not a casual "disagree" button. No invented 24-hour deadline. If relying on US safe harbor, arrange the agent, policy and process first (this does not claim hosting without registration is unlawful). Ask counsel whether the contact setup exposes Spencer's home address.

**Restrictions must reach history:** append-only history cannot mean permanently public infringing content. Disable affected current pages, old versions, diffs, images and variants, previews, search snippets, served exports, direct asset URLs and caches. Use lineage to find related forks for individual review, not automatic condemnation. Keep minimal restricted evidence or tombstones under a counsel-reviewed retention policy; the law can require byte deletion. Restored backups reapply restrictions. Copies downloaded elsewhere cannot be guaranteed retractable.

**Before public launch** (ROADMAP P0, Public-launch prerequisites; proposed): terms of service and a privacy policy, a minimum age of 13 enforced at sign-up (US COPPA), the GDPR basics. **Before broad public launch:** scoped US and Canadian counsel review of the entity, importer, licences for users, platform and forks, notice paths, moral rights, evidence retention, court-order response and existing-fork treatment; rehearse a dummy report, disable, notify, counter-notice and restore case end to end; review insurance and escalation. Fork's own curated or promoted catalog is rights-cleared independently of passive user storage. This is a focused launch dependency, not a reason to halt product work or prescreen everything.

**Licences and creators.** CC BY (Creative Commons Attribution) permits commercial adaptation with conditions and is irrevocable while complied with; BY-SA adds ShareAlike for distributed adaptations; NC limits commercial use; ND excludes distributing adaptations. Wikibooks is a candidate pool for per-recipe review (text under BY-SA; each image checked separately), not a ready catalog. Offer creators (chefs, independent developers, established contributors; no degree gate) a small free permission partnership first: credited profile and source links, cook and adaptation attribution, a correction route, permission controls, respectful aggregate activity. Agree which recipes and assets Fork can host, what users may adapt, publish and export, commercial use, territories, attribution, duration and withdrawal. Keep verified identity, creator tools and per-recipe permissions separate; a paid plan never buys a credibility badge, and identity verification never certifies ownership of a publisher's text or a photographer's image. Publishing one's own work under Fork's terms does not licence imported third-party material. Permission labels such as "Cook, log, link" and "Fork and publish permitted under this licence" are interface examples, not a legal schema; unknown rights default to source-link-only sharing; hosting permission is not adaptation or export permission. Commissioned recipes and licences are costs; creator subscriptions are potential revenue; marketplace revenue share adds payment, tax, rights and support work and stays later. None of it raises the scenarios above.

**Public catalog acceptance template** (SL): title; source, creator and rights record; quantities and units as authored; grouped method; realistic yield; timing including long waits; tester, date, version and what was actually cooked; ambiguity notes; image ownership or licence; mobile and print read-through. Every essential ingredient appears in a usable method; review scaling examples; dietary labels state their basis and never imply allergen-free; prefer an explicit untested status to silently filling gaps.

## Changelog

- 2026-11-11: created from the roadmap report's revenue and rights sections, the scenario derivation, the social launch note, the US and Canada notes and both 10 Nov syntheses; every figure recomputed.
- 2026-11-11: removed the October deadline and weekly-logger caveat (RM §16.26).
- 2026-11-11: recorded the one-annual-plan shape, purchased core superseded (RM §16.29), and the operator decision with its US-corporation assumption (RM §14).
- 2026-11-12: legal and launch items from the 31 Oct business viability note (terms, privacy and refund policies; minimum age; share cards; photo CDN at scale), proposed.
