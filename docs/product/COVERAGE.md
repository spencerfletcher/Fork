# Coverage of the reconciliation

Working file. Proves that every section, table row and bullet-level item in the sources landed in the current set. Destinations: RD README.md, RM ROADMAP.md, DC DECISIONS.md, CV this file (M1 to M23), CO COMPETITIVE.md, BU BUSINESS.md, DE DESIGN-DIRECTION.md, IN INVENTORY.md; "§n" is the numbered section, "P0" to "P5" a phase table in RM §4. Status: **placed**; **superseded** (also in DC §2, item number given; the replacement is placed); **removed with approval** (removed from the set with Spencer's approval on 11 Nov 2026; recorded in DC §2, line given); **overtaken** (the code already does it, checked by one grep or listing on 12 Nov 2026; nothing to fold). Source-register tables (lists of citations) are one row each.

Sources: R [roadmap report](../research/2026-11-08-product-roadmap/README.md); CM [cookbook market](../research/2026-11-08-product-roadmap/cookbook_market.md); AQ [advanced and quality](../research/2026-11-08-product-roadmap/advanced_and_quality.md); PA [product audit](../research/2026-11-08-product-roadmap/current_product_audit.md); DD [deep dive](../research/2026-11-09-cookbook-app-deep-dive/README.md); S1 [design and solo business](../research/2026-11-10-design-and-solo-business.md); S2 [finished product and revenue](../research/2026-11-10-finished-product-and-revenue.md); SL [social launch](../research/2026-11-08-social-launch/social_launch.md); US [US copyright](../research/2026-11-08-social-launch/us_copyright.md); CA [Canada copyright](../research/2026-11-08-social-launch/canada_copyright.md); Z [Zed reference](../research/2026-11-09-zed-design-reference/README.md); CD [cookbook design research, 8 Nov](../research/2026-11-08-cookbook-design-research/README.md), its README only, folded 12 Nov; UX [UX review, 12 Nov](../research/2026-11-12-ux-review.md); CL [Cooklang research, 23 Oct](../research/2026-10-23-cooklang.md); PS [package sweep, 12 Nov](../research/2026-11-12-package-sweep.md); FR [feature research, 31 Oct](../research/archive/2026-10-31-feature-research.md); BV [business viability, 31 Oct](../research/archive/2026-10-31-business-viability.md); SW [site sweeps, 29 Oct](../research/archive/2026-10-29-site-sweeps.md); the CD notes and the notes reviewed with nothing to fold are linked in their sections.

## R: product roadmap report

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| R1 | Lead: three pillars, loop, pilot before full parity, US/Canada, validate before growth | RM §1, §3 | placed |
| R2 | §1 Audience decision (serious home cook, chefs adjacent, meez, restaurant ops out) | RM §1, §12 | placed |
| R3 | Pushback against breadth; convergence is positive evidence | RM §1 | placed |
| R4 | Implementation substantial; evidence labels Built locally / Observed live / Unverified; deployment recheck | DC §2.27 | removed with approval (DC §2.27) |
| R5 | State: Editor and history | RM §2, P1 drafts | placed |
| R6 | State: Cooking and scaling | RM §2, P2 cookbook lane | placed |
| R7 | State: Organization; ingredient search over history | RM §2, P1 search, P2 global search, DC §1 (11 Nov) | placed |
| R8 | State: Visibility and lineage (public default, inherit, no source-version ref, media) | RM §2, P0 exact origins, media check | superseded in part (DC §2.18) |
| R9 | State: Missing cookbook breadth | RM §2 known gaps | placed |
| R10 | State: Quality unverified | RM §2 | placed |
| R11 | Public Storage URL is a policy check, public default not a bypass | RM P0 media access check | placed |
| R12 | Loop: Capture | RM §1.1, P2 migration and easy import | placed |
| R13 | Loop: Organize and find | RM §1.2, P1 | placed |
| R14 | Loop: Prepare | RM §1.2, P3 | placed |
| R15 | Loop: Cook | RM §1.3, P2 cookbook lane | placed |
| R16 | Loop: Remember and improve | RM §1.4, §7 recipe, cook and revision | placed |
| R17 | Loop: Connect and inspire ("Follow approved friends") | RM §1.5, P2 Friends | superseded wording (DC §2.16) |
| R18 | Loop: Share and leave | RM P1 export, P3 household, BU §2 never paywalled | placed |
| R19 | Awkward acceptance library; Schema.org | RM §8 acceptance library | placed |
| R20 | §2 Matrix caveats (documented, prices 8 Nov, tiers) | CO §1, §3 | placed |
| R21 | Competitor: Paprika 4 | CO §3 | placed |
| R22 | Competitor: Recipe Keeper | CO §3 | placed |
| R23 | Competitor: Crouton | CO §3 | placed |
| R24 | Competitor: Mela | CO §3 | placed |
| R25 | Competitor: AnyList | CO §3 | placed |
| R26 | Competitor: Samsung Food | CO §3 | placed |
| R27 | Competitor: Mealie | CO §3 | placed |
| R28 | Competitor: Tandoor | CO §3 | placed |
| R29 | Competitor: Cooklang | CO §3 | placed |
| R30 | Differentiation narrower than "only Fork has versions"; hypothesis not monopoly | CO §2 | placed |
| R31 | Request: unit and temperature conversion | CO §5 | placed |
| R32 | Request: ranges and alternatives | CO §5 | placed |
| R33 | Request: concurrent timers, totals versus allocations | CO §5 | placed |
| R34 | Request: variant clutter, reusable components | CO §5 | placed |
| R35 | Self-selected accounts; no market shares | CO §5, §7 | placed |
| R36 | §3 MVP-first decision 8 Nov | DC §1 (8 Nov) | placed |
| R37 | MVP-first: drafts post-MVP, revisit if long authoring | RM P1 drafts | superseded (DC §2.7, DC §2.19) |
| R38 | Sizes S/M/L; gates persist | RM §3 | placed |
| R39 | Phase P0 row | RM P0 | placed |
| R40 | Phase P1 row | RM P1 | placed |
| R41 | Phase P2 row (two lanes, two gates) | RM P2 | placed |
| R42 | Phase P3 row | RM P3 | placed |
| R43 | Phase P4 row | RM P4 | placed |
| R44 | Phase P5 row | RM P5 | placed |
| R45 | Pilot path; pilot does not wait for listed items; interim export | RM §3, §10, P2 interim export | placed |
| R46 | Slice 1: verify writing and cooking | RM P0 save state, cleanup verification | placed |
| R47 | Slice 2: private recipes and exact origins | RM P0 private first, exact origins | placed |
| R48 | Slice 3: cookbook completion lane, 12-bun fixture | RM P1 gate and items | placed |
| R49 | Immediate pilot slice (cook event, friends, feed, comments, notifications, moderation, interim export) | RM P2 pilot lane, §10 | placed |
| R50 | Implementation recommendations (vertical changes, Drizzle, append-only, deletion, suppression) | RM §3 | placed |
| R51 | Disposition: existing save and conflict state | RM P0 save state | placed |
| R52 | Disposition: durable drafts post-MVP | RM P1 drafts | superseded (DC §2.7) |
| R53 | Disposition: privacy, source version, safe adaptation | RM P0 | placed |
| R54 | Disposition: account settings, username, confirmation | RM P0 account access, P1 settings | placed |
| R55 | Disposition: recipe deletion | RM P0 recipe deletion | placed |
| R56 | Disposition: Trash post-MVP | RM P1 Trash | superseded (DC §2.8) |
| R57 | Disposition: account lifecycle | RM P0 account lifecycle | placed |
| R58 | Disposition: groups, yield, source, notes, preview (Insert toolbar) | RM P1 groups, source, preview in P2 | superseded in part (DC §2.11) |
| R59 | Disposition: collections, want-to-cook, sorting, pagination, bulk | RM P1 collections, library growth | placed |
| R60 | Disposition: search relevance and highlighting, non-Latin slugs | RM P1 search quality | placed |
| R61 | Disposition: version-pinned saves and private notes | RM P1 Keep this version | superseded wording (DC §2.14) |
| R62 | Disposition: whole-recipe paste, URL, files P1 | RM P2 easy import | superseded (DC §2.10) |
| R63 | Disposition: readable export, archive, print | RM P1 print, export | placed |
| R64 | Disposition: first competitor migration importer | RM P2, DC §1 (11 Nov) | superseded (DC §2.28) |
| R65 | Disposition: mobile cooking, tick affordance, zoom | RM P2 mobile cooking refinement | placed |
| R66 | Disposition: scaling, units, temperature | RM P2 units | placed |
| R67 | Disposition: named timers, offline reading | RM P2 timers, offline | placed |
| R68 | Disposition: ingredient quantities beside steps P2 | RM P4 | superseded (DC §2.9) |
| R69 | Disposition: Journal, note, photo, rating | RM P2 Journal, private ratings | placed |
| R70 | Disposition: grocery list and alternatives | RM P3 grocery, optional ingredients | placed |
| R71 | Disposition: meal queue, calendar export | RM P3 | placed |
| R72 | Disposition: Party mode | RM P3 | placed |
| R73 | Disposition: household cookbook and lists | RM P3 | placed |
| R74 | Disposition: pantry experiment | RM P3 | placed |
| R75 | Disposition: subrecipes and grouped variants | RM P4 | placed |
| R76 | Disposition: user weights, baker's percentages | RM P4 | placed |
| R77 | Disposition: nutrition and diet filters | RM P4 | placed |
| R78 | Disposition: extra and step photos, richer diary | RM P2 Journal photo, P3 richer diary, P4 step photos | placed |
| R79 | Disposition: Cooklang import and export | RM P4 | placed |
| R80 | Disposition: comments and suggested changes | RM P2 comments, P4 suggested changes | superseded in part (DC §2.2) |
| R81 | Disposition: profiles, following, feed, appreciation | RM P2 Friends | superseded wording (DC §2.16) |
| R82 | Disposition: privacy, report, mute, block, moderation | RM P0 moderation, P2 rights operations | placed |
| R83 | Disposition: public ratings, algorithmic discovery | RM P5 | placed |
| R84 | Disposition: graphical view and timeline | RM P4 | placed |
| R85 | Disposition: lineage graph, discovery trends | RM P4 lineage, P5 discovery | placed |
| R86 | Disposition: OCR, photo, PDF, social capture | RM P5 | placed |
| R87 | Disposition: AI search, adaptation, summaries | RM P5, §7 AI | placed |
| R88 | Disposition: translation, read-aloud, hands-free | RM P5 | placed |
| R89 | Disposition: dark mode, reading preferences | RM not yet phased, DE personalization | placed |
| R90 | Disposition: native iOS and Android | RM P5 | placed |
| R91 | Disposition: creator roles and partnerships | RM not yet phased, BU §8 | placed |
| R92 | Disposition: creator publishing tools | RM P5 creator tools | placed |
| R93 | Disposition: generic AI generation | RM not yet phased | placed |
| R94 | Disposition: restaurant operations | RM §12 | placed |
| R95 | Disposition: ads, prep-time estimates, grams made | RM §12 | placed |
| R96 | Interface: keep warm direction, layouts, no tabs, 550px hero test | DE identity, page Recipe detail | placed |
| R97 | Interface: Cookbook / Journal / Friends as a task model to test | DC §1 navigation | superseded (DC §2.5) |
| R98 | Interface: Cookbook filters, search explains match, tag scorer, taxonomy waits | RM P1 search, DE page Search | placed |
| R99 | Interface: editor paste-first, preview, keyboard reorder, cooking hierarchy, no auto-split | DE page New and edit, Cooking; RM §7 content | placed |
| R100 | Accepted editor direction: collapsible Insert toolbar | RM P1 section heading tool | superseded (DC §2.11) |
| R101 | Section lines larger, `#` visible, Cooklang optional | RM P1 section heading tool | placed |
| R102 | Focused editor slice and acceptance | RM P1 section heading tool (shipped) | placed |
| R103 | Familiar verbs ("Save to cookbook", "Make my version") | RM §7 plain language | superseded (DC §2.1) |
| R104 | Moving favourite versus pinned save; access policy; distinct source records | RM §7 saves and access | placed |
| R105 | Gate: Trust | RM §8 | placed |
| R106 | Gate: Accessibility | RM §8 | placed |
| R107 | Gate: Kitchen ergonomics | RM §8 | placed |
| R108 | Gate: Performance | RM §8 | placed |
| R109 | Gate: Culinary correctness | RM §8 | placed |
| R110 | Gate: Task completion | RM §8 | placed |
| R111 | Standards note: wake lock, timers, offline distinct | RM §7 timers | placed |
| R112 | §4 Recipe, cook and revision separate; "Use these changes next time" | RM §7 | placed |
| R113 | Subrecipes make the model practical (constraints) | RM §7 subrecipes | placed |
| R114 | Baking depth: preferments, volume to mass | RM P4 batch yields, §7 scaling | placed |
| R115 | Party mode recorded 9 Nov | RM P3 Party mode | placed |
| R116 | Graphical cooking view accepted | RM P4 | placed |
| R117 | Cooklang-backed prototype detail, no inferred dependencies | RM P4 graphical view | placed |
| R118 | Pantry answers "what can I make" | RM P3 pantry | placed |
| R119 | AI priority 1 OCR and import repair | RM §7 AI table | placed |
| R120 | AI priority 2 search in cookbook | RM §7 AI table | placed |
| R121 | AI priority 3 formatting suggestions | RM §7 AI table | placed |
| R122 | AI priority 4 adaptation | RM §7 AI table | placed |
| R123 | AI priority 5 attempt summaries | RM §7 AI table | placed |
| R124 | Evaluation corpus, per-field errors, off switch | RM §7 AI | placed |
| R125 | Process only needed content; deterministic server duties | RM §7 AI | placed |
| R126 | Nutrition estimate, allergy, canning | RM §7 AI | placed |
| R127 | Friends loop before household; event audience distinct | RM §7, §3 | placed |
| R128 | §5 Committed early social product (dish and date, Only me / Friends, private notes) | RM P2 Journal, Friends | placed |
| R129 | Friend actions, notifications, controls, moderator, rate limits, metadata | RM P2 in-app notifications, abuse basics, rights operations | placed |
| R130 | Pilot group: four weeks, 8 to 15 friends, no pressure, preconditions | RM §10 | placed |
| R131 | Pilot: Preparation | RM §10 table | placed |
| R132 | Pilot: Week 1 | RM §10 table | placed |
| R133 | Pilot: Week 2 | RM §10 table | placed |
| R134 | Pilot: Week 3 | RM §10 table | placed |
| R135 | Pilot: Week 4 | RM §10 table | placed |
| R136 | What to count, discussion thresholds, stop gate, clusters | RM §10 | placed |
| R137 | Acquisition from real circles; no campaigns sent | BU §6 | placed |
| R138 | Supply lane: personal cookbook | RM §7 supply | placed |
| R139 | Supply lane: source-linked cook | RM §7 supply | placed |
| R140 | Supply lane: public catalog | RM §7 supply | placed |
| R141 | Starter recipes 20 to 40, demos labelled, tested means cooked | RM §7 supply | placed |
| R142 | Provenance registry, dedupe, tracking parameters | RM §7 supply | placed |
| R143 | No bulk scraping; Wikibooks; CC licence terms | BU §8 licences | placed |
| R144 | Creator role, identity versus tools versus permissions | BU §8 | placed |
| R145 | Free permission partnership; costs versus revenue | BU §8 | placed |
| R146 | Permission labels, unknown rights, survival of forks | BU §8 | placed |
| R147 | §6 Copied chef recipe: claims, not automatic liability | BU §8 | placed |
| R148 | Plagiarism versus infringement; no safe percentage | BU §8 | placed |
| R149 | Forking is not an ownership reset | BU §8 | placed |
| R150 | Jurisdiction row: United States | BU §8 table | placed |
| R151 | Jurisdiction row: Canada | BU §8 table | placed |
| R152 | US process, 10 to 14 business days | BU §8 table | placed |
| R153 | Canada process, six months and one year | BU §8 table | placed |
| R154 | Moral rights; entity and territory unconfirmed | BU §8 | placed |
| R155 | Proportionate pilot process, no 24-hour rule | BU §8 operating process | placed |
| R156 | Append-only cannot mean public infringing content | BU §8 restrictions | placed |
| R157 | Own catalog distinct; counsel review; dummy case | BU §8 before launch | placed |
| R158 | §7 Small paid utility; US$24 and US$36; one offer | BU §2 | placed |
| R159 | Keep basic participation free; paid candidates; downgrade | BU §2 | placed |
| R160 | Social not permission to inflate; track pilot costs | BU §7 | placed |
| R161 | Scenario framing, assumptions | BU §4 | placed |
| R162 | Assumption: registrations | BU §4 | placed |
| R163 | Assumption: activation | BU §4 | placed |
| R164 | Assumption: conversion | BU §4 | placed |
| R165 | Assumption: implied conversion | BU §4 | placed |
| R166 | Assumption: new payers | BU §4 | placed |
| R167 | Assumption: renewal | BU §4 | placed |
| R168 | Assumption: revenue per account | BU §4 | placed |
| R169 | Assumption: fixed budget | BU §4 | placed |
| R170 | Activation definition, formulas | BU §4 | placed |
| R171 | Output: cumulative registrations | BU §4 | placed |
| R172 | Output: new paying accounts | BU §4 | placed |
| R173 | Output: entitlements | BU §4 | placed |
| R174 | Output: ARR month 12 | BU §4 | placed |
| R175 | Output: ARR month 24 | BU §4 | placed |
| R176 | Output: revenue year 1 | BU §4 | placed |
| R177 | Output: revenue year 2 | BU §4 | placed |
| R178 | Output: revenue 24 months | BU §4 | placed |
| R179 | Output: cash billings | BU §4 | placed |
| R180 | Stock versus revenue versus cash | BU §4 | placed |
| R181 | 5.6% allowance and $0.70 reserve caveats | BU §3 | placed |
| R182 | Cost: payment fees | BU §4 | placed |
| R183 | Cost: variable reserve | BU §4 | placed |
| R184 | Cost: fixed | BU §4 | placed |
| R185 | Cost: cash less costs | BU §4 | placed |
| R186 | Cost: unearned | BU §4 | placed |
| R187 | Cost: recognized less costs | BU §4 | placed |
| R188 | Not accounting profit; exclusions; Supabase and Netlify | BU §4, §7 | placed |
| R189 | Contribution $19.92, 73 accounts, 3,223, month-24 contribution | BU §3, §4 | placed |
| R190 | Sensitivities (halving, price, AI, CAC, FX, native) | BU §4 | placed |
| R191 | Investment: import and onboarding | BU §5 | placed |
| R192 | Investment: mobile, offline, print | BU §5 | placed |
| R193 | Investment: collections, groceries, planning | BU §5 | placed |
| R194 | Investment: version-linked attempts | BU §5 | placed |
| R195 | Investment: friends feed, comments, saves | BU §5 | placed |
| R196 | Investment: household sharing | BU §5 | placed |
| R197 | Investment: attributed shares | BU §5 | placed |
| R198 | Investment: bounded AI import help | BU §5 | placed |
| R199 | Acquisition measurement sequence | BU §6 | placed |
| R200 | Price testing; private text never for analytics | BU §2, §7 | placed |
| R201 | April 2027 deadline, 200 weekly loggers | DC §2.26 | removed with approval (DC §2.26) |
| R202 | Portfolio story | RM §10 demonstration | placed |
| R203 | Ledger: preserve commitments; social deferral superseded | RM §3, CV M1 to M23, DC §1 | placed |
| R204 to R226 | M1 to M23 (23 rows, one each) | CV M1 to M23 (same milestone) | placed (M4 wording DC §2.16; M17 placement DC §2.6; M20 DC §2.22) |
| R227 | Other preserved preferences | CV M1 to M23 | placed |
| R228 | Nonblocking product calls | DC §1 (11 Nov), RM §13 deferred decisions; navigation and Made it settled | placed |
| R229 | Reconciliation 9 Nov: summary wins | DC §1 | placed |
| R230 | Recon: verbs | DC §1 | superseded (DC §2.1) |
| R231 | Recon: no Comment | DC §1, P2 comments | placed |
| R232 | Recon: likes count | DC §1 | placed |
| R233 | Recon: three audiences | DC §1, P0 | placed |
| R234 | Recon: navigation plus Discover | DC §1 | placed |
| R235 | Recon: Add to Journal placement | DC §1, P2 | placed |
| R236 | Recon: 16px tick stays, M20 revisit | DC §1, §6 | placed |
| R237 | Recon: inline quantities to P4 | RM P4 | placed |
| R238 | Recon: Save is moving favourite; pinned save P1 own control | RM P1 Keep this version | superseded wording (DC §2.14) |
| R239 | Recon: no public scores; rating a recipe feature | RM P2 private ratings, not yet phased | placed |
| R240 | Recon: drafts, Trash, Party mode, graphical view, AI out of MVP | RM P1, P3, P4, P5 | placed |
| R241 | Settled same evening: forks never widen, ticks, Cook pinned, lead card | DC §1, P0, P2 | placed |
| R242 | Collections v1 manual; rule-based later; rule column | RM P1 collections, not yet phased | placed |
| R243 | Still owed: interim export, moderation, profile, P1 cookbook items | RM P2, P1 | placed |
| R244 | Backlog: durable drafts P1 | RM P1 | placed |
| R245 | Backlog: Trash P1 | RM P1 | placed |
| R246 | Backlog: photo access follows audience P1 | RM P1 | placed |
| R247 | Backlog: settings page P1 | RM P1 | placed |
| R248 | Backlog: measurement preference P1 | RM P1 | placed |
| R249 | Backlog: last and times cooked P1 | RM P1 | placed |
| R250 | Backlog: serving scaler redesign P2 design backlog | RM §6 design backlog (P2) | kept as decided |
| R251 | Backlog: onboarding P2 | RM P2 | placed |
| R252 | Backlog: audience-change side effects P2 | RM P2 | placed |
| R253 | Backlog: profile redesign P2 | RM P2 | placed |
| R254 | Backlog: global search P2 | RM P2 | placed |
| R255 | Backlog: email notifications P2 | RM P2 | placed |
| R256 | Backlog: Journal export P2 | RM P2 | placed |
| R257 | Backlog: easy import P2 | RM P2 | placed |
| R258 | Backlog: comment moderation P2 | RM P2 comments | placed |
| R259 | Backlog: profile discovery P2 | RM P2 | placed |
| R260 | Backlog: desktop app P5 | RM P5 | placed |
| R261 | Backlog: fork icon P1 design backlog | RM §6 | placed |
| R262 | Backlog: cook-mode distinction | RM §6 | placed |
| R263 | Backlog: editor photo field P1 soon | RM P1 (next, soon) | kept as decided |
| R264 | Backlog: editor preview P2 | RM P2 | placed |
| R265 | Backlog: feed card title P1 polish | RM P1 | placed |
| R266 | Backlog: text-button hover | RM §6 | placed |
| R267 | Backlog: Journal icon | RM §6 | placed |
| R268 | Backlog: dropdown background | RM §6 | placed |
| R269 | Backlog: hover colours, Clay Deep | RM §6 | placed |
| R270 | Backlog: ingredient search scaling | RM P2 global search | placed |
| R271 | Backlog: search in place | RM P2 global search, DC §1 (11 Nov) | placed |
| R272 | Unfriend bullet | RM §7 | placed |
| R273 | Ex-friend forks bullet | RM §7 | placed |
| R274 | Journal after unfriend bullet | RM §7 | placed |
| R275 | Block bullet | RM §7 | placed |
| R276 | Mute bullet | RM §7 | placed |
| R277 | Tags, collections, filters | RM §7 saves and access | placed |
| R278 | Save and collections, starter collections | RM P1 collections, §7, DC §1 | placed |
| R279 | Save version, Keep this version | RM P1 | placed |
| R280 | Retain all 87 entries | RM §5, IN | placed |
| R281 to R289 | Inventory workstream rows E, S, C, L, I, X, G and M, A, Q (9 rows) | IN sections, RM §5 | placed |
| R290 | Three choices selected | RM §5, IN | placed |
| R291 | Source map and T/V/D labels | IN, CO §1 | placed |
| R292 | Later and optional preserve candidates | IN how to read | placed |
| R293 | Pause broad discovery | RM §3 | placed |
| R294 | Per-slice task and feedback pass | RM §3 | placed |
| R295 | Paprika: substitutions C12, A04 | RM §5, IN | placed |
| R296 | Paprika: advanced search L03, L10 | RM §5, IN | placed |
| R297 | Paprika: companion surfaces A07 | RM §5, IN | placed |
| R298 | Paprika: references, not compatibility | RM §5 | placed |
| R299 | Zed accepted for next design pass | DC §1, DE | placed |
| R300 | Zed: typography hierarchy | DE system Typography roles | placed |
| R301 | Zed: editor composition alignment | DE system Grid | placed |
| R302 | Zed: spacing and fine rules | DE system Grouping | placed |
| R303 | Zed: accent roles, quiet secondary actions | DE system Accent roles, Controls | placed |
| R304 | Zed: phone reflow | DE system Phones | placed |
| R305 | Zed: keep palette and fonts; completion checks | DE identity, From the Zed reference | placed |
| R306 | Source register (9 rows) | RM source key, CO and BU research records | placed |
| R307 | Closing paragraph | RM §1, §10 | placed |
| R308 | Not checked; material risk | RM §2, BU §1, CO §7 | placed |

## CM: cookbook market

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| CM1 | Takeaway: complete loop; convergence | RM §1, CO §2 | placed |
| CM2 to CM10 | Capability matrix rows: Paprika, Recipe Keeper, Crouton, Mela, AnyList, Samsung Food, Mealie, Tandoor, Cooklang | CO §3 (same product) | placed |
| CM11 | Correction: Paprika 4 shipped | CO §2 | placed |
| CM12 | Correction: subrecipes not unoccupied | CO §2, §3 Mealie | placed |
| CM13 | Correction: logging and versioning not unique | CO §2 | placed |
| CM14 | Correction: Tandoor 1325 Done | CO §5 | placed |
| CM15 | Baseline 1: trust the editor | CO §4 | placed |
| CM16 | Baseline 2: existing cooking life in | CO §4 | placed |
| CM17 | Baseline 3: useful personal cookbook | CO §4 | placed |
| CM18 | Baseline 4: cook successfully | CO §4 | placed |
| CM19 | Baseline 5: surrounding routine | CO §4 | placed |
| CM20 | Baseline 6: next cook better | CO §4 | placed |
| CM21 | Minimum fidelity content list | RM §7 content fidelity | placed |
| CM22 | Gap: documentation, not hands-on | CO §1 | placed |
| CM23 | Gap: reviews are anecdotes | CO §5 | placed |
| CM24 | Gap: no market shares | CO §7 | placed |
| CM25 | Takeaway 2: moments where cooks leave the app | RM §3 | placed |
| CM26 to CM32 | Jobs: conversion, ranges, alternatives, totals, timers, variants, shared technique | CO §5 (same row) | placed |
| CM33 | Job: scaled fractions | CO §5 | placed |
| CM34 | Standard: Schema.org | CO §5, RM §8 | placed |
| CM35 | Standard: Cooklang conventions | CO §5 | placed |
| CM36 | Standard: King Arthur reduction | CO §5 | placed |
| CM37 | Standard: Tandoor formats | CO §5 | placed |
| CM38 | Disposition: draft recovery build first | RM P1 drafts | superseded (DC §2.21) |
| CM39 | Disposition: groups, yield, notes, source | RM P1 | placed |
| CM40 | Disposition: paste and URL capture | RM P2 easy import | superseded phase (DC §2.10) |
| CM41 | Disposition: collections, filters, ingredient search | RM P1 | placed |
| CM42 | Disposition: scale and conversion | RM P2 | placed |
| CM43 | Disposition: cook readability, progress, print | RM P2 cookbook lane, P1 print | placed |
| CM44 | Disposition: multiple named timers | RM P2 | placed |
| CM45 | Disposition: offline saved recipes | RM P2 | placed |
| CM46 | Disposition: export | RM P1 | placed |
| CM47 | Disposition: first migration importer | RM P2 | superseded (DC §2.28) |
| CM48 | Disposition: grocery list | RM P3 | placed |
| CM49 | Disposition: meal queue | RM P3 | placed |
| CM50 | Disposition: private cook log bound to version | RM P2 Journal (shipped) | placed |
| CM51 | Disposition: household sharing | RM P3 | placed |
| CM52 | Disposition: step-linked quantities | RM P4 | placed |
| CM53 | Disposition: version-pinned subrecipes | RM P4 | placed |
| CM54 | Disposition: OCR and social import | RM P5 | placed |
| CM55 | Disposition: equipment, storage, reheating as notes | RM P1 source, notes, times | placed |
| CM56 | Disposition: optional ingredients and alternatives | RM P3 optional ingredients | placed |
| CM57 | Disposition: pantry matching | RM P3 | placed |
| CM58 | Disposition: nutrition | RM P4 | placed |
| CM59 | Disposition: baker's percentages | RM P4 | placed |
| CM60 | Disposition: full pantry inventory later | RM §12 | placed |
| CM61 | Disposition: public feed, ranking, badges later | RM P2 Friends; ranking P5; RM §12 | superseded for the feed (DC §2.20) |
| CM62 | Disposition: graphical timeline prototype later | RM P4 | placed |
| CM63 | Disposition: reject universal conversion, silent AI, allergen guesses | RM §12 | placed |
| CM64 | Disposition: restaurant operations | RM §12 | placed |
| CM65 | Acceptance corpus | RM §8 | placed |
| CM66 | Complete journeys, recruit, observe a meal | RM §8 task completion, §10 | placed |
| CM67 | Migration rules | RM §8 | placed |
| CM68 | Subrecipe constraints | RM §7 | placed |
| CM69 | International quantities and units | RM §7 scaling | placed |
| CM70 | Gap: no live session or survey | RM §2 | placed |
| CM71 | Gap: no food-safety certification | RM §7 AI | placed |
| CM72 | Gap: timers need device testing | RM §7 timers, CO §7 | placed |
| CM73 | Takeaway 3: a specific reason to switch | CO §2 | placed |
| CM74 to CM82 | Price rows: Paprika, Recipe Keeper, Crouton, Mela, AnyList, Samsung Food, Mealie, Tandoor, Cooklang | CO §3 (same product) | placed |
| CM83 | Activation ordering | CO §3 commercial reading | placed |
| CM84 | Retention ordering | CO §3 | placed |
| CM85 | Acquisition ordering | CO §3, BU §6 | placed |
| CM86 | Revenue ordering | CO §3, BU §2 | placed |
| CM87 | Portfolio demonstration | RM §10 | placed |
| CM88 | Positioning hypothesis | CO §2 | placed |
| CM89 | Deferral reasons | CO §3 | placed |
| CM90 | Source register (12 rows) and closing limits | CO header, §7 | placed |

## AQ: advanced opportunities and quality

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| AQ1 | Scope: recommendations, no interviews | RM §3, §8 | placed |
| AQ2 | Takeaway 1: explicit gates | RM §8 | placed |
| AQ3 | Finding: earlier private-by-default decision | RM P0 | placed |
| AQ4 | Finding: preliminary audit | RM §2 | placed |
| AQ5 | Finding: WCAG 2.2 | RM §8 | placed |
| AQ6 | Finding: wake lock | RM §7 timers | placed |
| AQ7 | Finding: timer throttling | RM §7 timers | placed |
| AQ8 | Finding: service workers | RM §7 timers | placed |
| AQ9 | Finding: Core Web Vitals | RM §8 | placed |
| AQ10 | Finding: King Arthur weights | RM §7 scaling, P4 | placed |
| AQ11 | Finding: Cooklang conventions | CO §5 | placed |
| AQ12 | Finding: FoodData Central | RM §7 AI | placed |
| AQ13 | Finding: SSRF | RM §8 URL import | placed |
| AQ14 | Base gate 1: private, one access rule | RM P0 | placed |
| AQ15 | Base gate 2: draft recovery before growth | RM P1 drafts | superseded (DC §2.21) |
| AQ16 | Base gate 3: portability | RM P1 export | placed |
| AQ17 | Base gate 4: support matrix | RM §8 | placed |
| AQ18 | Base gate 5: WCAG target, cooking hit areas, undo ticks | RM §8 | placed |
| AQ19 | Base gate 6: overview, references, no wizard | RM P4 inline quantities, DE page Cooking | placed |
| AQ20 | Base gate 7: scaling rules | RM §7 scaling | placed |
| AQ21 | Base gate 8: timers | RM §7 timers, P2 | placed |
| AQ22 | Base gate 9: offline reading first | RM P2 offline | placed |
| AQ23 | Base gate 10: URL import | RM §8 | placed |
| AQ24 to AQ29 | Scorecard: task completion, data loss and privacy, experience, save reliability, retrieval, cooking tests | RM §8 | placed |
| AQ30 | Gap: no measured results | RM §2 | placed |
| AQ31 | Gap: conversion depends on source | RM §7 scaling | placed |
| AQ32 | Gap: no proof of offline editing or native need | RM P2 offline, P5 native | placed |
| AQ33 | Takeaway 2: recipe that became yours | RM §1 | placed |
| AQ34 | Finding: earlier milestones M17, M21 to M23 | CV M1 to M23 | placed |
| AQ35 | Finding: prior business note estimates | BU §4 | placed |
| AQ36 | Finding: baker's percentages | RM P4 | placed |
| AQ37 | Finding: meez | CO §3 | placed |
| AQ38 | Finding: Circular 33 | BU §8 | placed |
| AQ39 | Milestone A: trustworthy daily cookbook | RM P0, P1 | placed |
| AQ40 | Milestone B: useful repeat cooking | RM P2 Journal, §9 recall | placed |
| AQ41 | Milestone C: organization and sharing | RM P1, P3 | placed |
| AQ42 | Milestone D: recipe development | RM P4 | placed |
| AQ43 | Milestone E: targeted assistance | RM P5 | placed |
| AQ44 | Milestone F: community after recurring sharing | RM P2 | superseded (DC §2.20) |
| AQ45 | Interleaving; quality in every phase | RM §3 | placed |
| AQ46 | Cooking-log design | RM §7 | placed |
| AQ47 | Subrecipes over decorative lineage | RM §7 | placed |
| AQ48 | Chef-adjacent scope | RM §1, §12 | placed |
| AQ49 | Plain language over Git | RM §7 | placed |
| AQ50 | Collaboration sequence | RM §7 | placed |
| AQ51 | Defer M23 | RM P4 | placed |
| AQ52 | M21 experiment | RM P3 | placed |
| AQ53 | Defer real-time editing | RM §12 | placed |
| AQ54 | Defer ratings, streaks, recommendations | RM §12, P5 | placed |
| AQ55 | Defer generic generation, nutrition scoring, subscription complexity, native | RM not yet phased, P4, P5, BU §2 | placed |
| AQ56 | Preserve prior rejections | RM §12 | placed |
| AQ57 | Metric: recruit varied cooks | RM §10 | placed |
| AQ58 | Metric: base tasks then diary pilot | RM §10 | placed |
| AQ59 | Metric: activated, repeat cooks, denominators | RM §10 | placed |
| AQ60 | Metric: version utility | RM §10 | placed |
| AQ61 | Metric: advance household and feed on behaviour; no 200-logger gate | RM §10, BU §4 | placed |
| AQ62 | Metric: stop features that add entry effort | RM §10 | placed |
| AQ63 | Portfolio demonstration strategy | RM §10 | placed |
| AQ64 | Interpretation update | CO §2 | placed |
| AQ65 | Pricing recommendation | BU §2 | placed |
| AQ66 | Packaging hypothesis | BU §2 | placed |
| AQ67 | Cost: Stripe Hong Kong | BU §3 | placed |
| AQ68 | Cost: Supabase | BU §7 | placed |
| AQ69 | Cost: Netlify | BU §7 | placed |
| AQ70 | Scenario framing | BU §4 | placed |
| AQ71 to AQ77 | Assumption rows (7) | BU §4 | placed |
| AQ78 | Activation and formulas | BU §4 | placed |
| AQ79 to AQ88 | Output rows (10) | BU §4 | placed |
| AQ89 | Deductions: 5.6% derivation, reserve | BU §3 | placed |
| AQ90 to AQ95 | Cash view rows (6) | BU §4 | placed |
| AQ96 | Not GAAP; exclusions | BU §4 | placed |
| AQ97 | Sensitivity: halving, price | BU §4 | placed |
| AQ98 | Sensitivity: contribution, 73, 3,223 | BU §3 | placed |
| AQ99 | Sensitivity: month-24 contribution | BU §4 | placed |
| AQ100 | Sensitivity: AI cost | BU §4 | placed |
| AQ101 | Sensitivity: currency conversion, native | BU §4 | placed |
| AQ102 | Sensitivity: acquisition cost | BU §4 | placed |
| AQ103 to AQ109 | Feature-to-business rows (7) | BU §5 | placed |
| AQ110 | Distribution and willingness-to-pay gates | BU §2, §6 | placed |
| AQ111 | Gap: not a validated moat | BU §1, CO §2 | placed |
| AQ112 | Gap: no interviews or WTP tests | BU §1 | placed |
| AQ113 | Gap: rights depend on business | BU §8 | placed |
| AQ114 | Takeaway 3: AI reduces clerical work | RM §7 AI | placed |
| AQ115 to AQ118 | Findings: NIST, OWASP, FDA, NCHFP | RM §7 AI | placed |
| AQ119 to AQ123 | AI opportunities 1 to 5 | RM §7 AI table | placed |
| AQ124 | Evaluation harness corpus | RM §7 AI | placed |
| AQ125 to AQ128 | Evaluation rows: import, search, adaptation, summary | RM §7 AI table | placed |
| AQ129 | Per-field reporting, fixed benchmark | RM §7 AI | placed |
| AQ130 | Privacy and security boundary | RM §7 AI | placed |
| AQ131 | Bounded culinary claims | RM §7 AI | placed |
| AQ132 | Gaps: no model, no demand, no clinical validation | RM §7 AI | placed |

## PA: product audit

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| PA1 | Takeaway and live recheck; homepage copy differs | DC §2.23 | removed with approval (DC §2.23) |
| PA2 | Product scope from PRODUCT.md | RM §1 | placed |
| PA3 to PA21 | Capability rows: create/edit, parser, failed-save recovery, durable draft, concurrency, history/diff, restore, forking, favorites, scaling, cooking, search, organization, visibility, auth, sharing, import/export/print, structured richness, advanced (19) | RM §2 shipped and known gaps; open items in P0, P1 | placed (visibility row superseded, DC §2.18) |
| PA22 | Inference: portfolio assets | RM §10 demonstration | placed |
| PA23 | Inference: ingredient search contract | DC §1 (11 Nov), P2 global search | placed |
| PA24 | Inference: pinned saves fit the model | RM P1 Keep this version | placed |
| PA25 | Gap: unverified runtime | RM §2 | placed |
| PA26 | Gap: no accessibility claim | RM §8 | placed |
| PA27 | Takeaway 2: trust and completeness | RM §3 | placed |
| PA28 | Finding: writing not durably recoverable | RM P1 drafts | placed |
| PA29 | Finding: publication defaults on | RM P0 private first | superseded (DC §2.18) |
| PA30 | Finding: private-image guarantee | RM P0 media access, P1 photo access | placed |
| PA31 | Finding: lifecycle design | RM P0 deletion, P1 Trash | placed |
| PA32 | Finding: accessibility work to preserve | RM §8 | placed |
| PA33 | Finding: empty and error states | DE page Cookbook | placed |
| PA34 | Finding: non-Latin slugs | RM P1 search, §2 | placed |
| PA35 | Order 1: writing and privacy trust | RM P0 | placed |
| PA36 | Order 2: personal cookbook, 4 of 5 gate | RM P1, §8 | placed |
| PA37 | Order 3: editor completeness | RM P1 | placed |
| PA38 | Order 4: capture and ownership | RM P1 print, export; P2 migration, import | placed |
| PA39 | Order 5: cooking reliability | RM P2 cookbook lane | placed |
| PA40 | Order 6: cooking memory | RM P2 Journal, §7 | placed |
| PA41 | Shared UX gate | RM §8 | placed |
| PA42 | Gap: open product proposals | DC §1 (11 Nov), P1 drafts, Trash, Keep this version | placed |
| PA43 | Gap: unit correctness | RM §7 scaling | placed |
| PA44 | Takeaway 3: decision ledger | CV M1 to M23 | placed |
| PA45 | Preserve cook-first principles | CV M1 to M23 preferences | placed |
| PA46 | Preserve visual decisions, no tabs | DE identity, RM §12 | placed |
| PA47 | Preserve strategic ideas | RM P1, P2, P4 | placed |
| PA48 | Social revived 29 Oct | DC §1 (8 Nov) | placed |
| PA49 | Preserve rejected ads, estimates, grams made | RM §12 | placed |
| PA50 | Supersede documentation errors (README) | RM §11 code-health sweeps | placed |
| PA51 | Supersede old technical recipes and estimates | CV M1 to M23 | placed |
| PA52 | Prior market research as leads | CO §7 | placed |
| PA53 | Inference: reasons to defer | RM §1 | placed |
| PA54 | Inference: bounded versions of later features | RM P3, §12 | placed |
| PA55 | Inference: portfolio documentation | RM §10 | placed |
| PA56 | Gaps: parallel research; runtime unverified | RM §2 | placed |

## DD: cookbook-app deep dive

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| DD1 | Lead: useful mechanics, failure cases, not MVP authorization | CO §2, IN | placed |
| DD2 | Evidence labels T, V, D, Proposal | CO §1, IN | placed |
| DD3 | Authority: roadmap and design summary win; phase placements | IN, RM phases | placed |
| DD4 to DD12 | Focused tests (9 rows) | CO §4 fixtures (same test) | placed |
| DD13 | Bounded tests caveat | CO §4 | placed |
| DD14 | Disposition vocabulary | IN how to read | placed |
| DD15 to DD25 | E01 to E11 | IN (same ID) | placed |
| DD26 | Editing guide; compact empty photo | DE choices Empty photo | placed |
| DD27 to DD34 | S01 to S08 | IN (same ID) | placed |
| DD35 | No more scaler preference decisions; interaction test | DE choices Scaler slider | placed |
| DD36 to DD48 | C01 to C13 | IN (same ID) | placed |
| DD49 | Per-session timer identity is Fork's adaptation | RM §7 timers | placed |
| DD50 to DD60 | L01 to L11 | IN (same ID) | placed |
| DD61 | Keep Save, Cookbook, Collections; no separate Favorite system | RM §7, DC §1 | placed |
| DD62 to DD69 | I01 to I08 | IN (same ID) | placed |
| DD70 to DD74 | X01 to X05 | IN (same ID) | placed |
| DD75 | Capture tools not verified compatibility | CO §7 | placed |
| DD76 to DD83 | G01 to G08 | IN (same ID) | placed |
| DD84 to DD89 | M01 to M06 | IN (same ID) | placed |
| DD90 | Guides do not prove sync or consolidation | CO §7 | placed |
| DD91 to DD98 | A01 to A08 | IN (same ID) | placed |
| DD99 | Platform release histories; mobile claims not Mac tests | CO §7 | placed |
| DD100 | Paprika homepage follow-up | RM §5, IN C12, L03, L10, A07 | placed |
| DD101 | Three settled preferences | RM §5 | placed |
| DD102 to DD115 | Interaction choices (14 rows, personalization included) | DE choices, DE system Personalization | placed |
| DD116 | Per-recipe timers mean per session, version, timer | RM §7 timers | placed |
| DD117 | Highest-value next work | RM P1 editor composition, P2 scaler and timers | placed |
| DD118 | Coverage audit, Q01 to Q09 approved | IN, RM §5 | placed |
| DD119 | Build before another discovery sweep | RM §3 | placed |
| DD120 to DD128 | Q01 to Q09 | IN (same ID) | placed |
| DD129 | Already covered; follow-up questions | IN notes | placed |
| DD130 | Source chain table (9 rows) | IN header links | placed |
| DD131 | Comprehensive, not exhaustive | IN notes, CO §7 | placed |
| DD132 to DD141 | Coverage gap rows (10) | CO §7 | placed |
| DD142 to DD155 | Validation tests 1 to 14 | CO §7 | placed |
| DD156 | Best next desktop checks; Fork timers need own evidence | CO §7 | placed |
| DD157 | Hybrid pricing evidence | CO §3, BU §2 | placed |
| DD158 | Purchased core plus recurring services | BU §2 | placed |
| DD159 | Research leftovers in apps | CO §7 | placed |
| DD160 | Closing: continuity | CO §2, RM §1 | placed |

## S1: design refinement and solo business

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| S1-1 | Solo goal; credible; unproven | BU §1 | placed |
| S1-2 | Authority statement | RM source key, RD | placed |
| S1-3 | Sources; review coverage; reproduce before fixing | DE system intro, DE page | placed |
| S1-4 | Preserve the direction | DE identity | placed |
| S1-5 | Apple and NYT references; 8/10 and 9 to 9.5 | DC §2.25 | removed with approval (DC §2.25) |
| S1-6 | System: palette | DE system Palette, Accent roles | placed |
| S1-7 | System: typography | DE system Typography roles | placed |
| S1-8 | System: layout and spacing | DE system Layout | placed |
| S1-9 | System: surfaces and controls | DE system Controls | placed |
| S1-10 | System: photography | DE system Photography | placed |
| S1-11 | System: interaction | DE system Feedback and states | placed |
| S1-12 | Page refinements are not authorization | DE page | placed |
| S1-13 | Page: Cookbook | DE page | placed |
| S1-14 | Page: Discover | DE page | placed |
| S1-15 | Page: Search | DE page | placed |
| S1-16 | Page: Recipe detail | DE page | placed |
| S1-17 | Page: Cooking | DE page | placed |
| S1-18 | Page: History and comparison | DE page | placed |
| S1-19 | Page: New and edit | DE page | placed |
| S1-20 | Page: Journal | DE page | placed |
| S1-21 | Page: Friends | DE page | placed |
| S1-22 | Page: Profile and account | DE page | placed |
| S1-23 | Prioritize trust; continuity | DE quality ambition, RM §9 | placed |
| S1-24 | Competitive: Paprika 4 already covered | CO §2 | placed |
| S1-25 | Competitive: fidelity fixtures, not defect rates | CO §4 | placed |
| S1-26 | Competitive: 87 entries not 87 features | IN, RM §5 | placed |
| S1-27 | Model is a scenario; prices not approved; purchased core open | BU §2 | placed (purchased core superseded, DC §2.29) |
| S1-28 to S1-31 | Month-24 rows: registrations, entitlements, ARR, contribution | BU §4 | placed |
| S1-32 | Model: 5.6%, $0.70, $19.92, 73, 3,223, $96,690 | BU §3 | placed |
| S1-33 | Exclusions; cash is not earned revenue | BU §4 | placed |
| S1-34 | Self-funding, not full-time income | BU §1 | placed |
| S1-35 | Roadmap strengthens the hypothesis | BU §5 | placed |
| S1-36 to S1-43 | Investment rows (8): trust, import, cookbook breadth, Journal, friends, groceries and households, development tools, AI and integrations | BU §5 | placed |
| S1-44 | Cumulative benefit; no uplift | BU §5 | placed |
| S1-45 | Solo: shared models, vertical slices | RM §3 | placed |
| S1-46 | Step 1: finish trust and usability | RM §10 | placed |
| S1-47 | Step 2: recruit repeat and adapting cooks | RM §10 | placed |
| S1-48 | Step 3: pilot, stop reminders | RM §10 | placed |
| S1-49 | Step 4: independent clusters | RM §10 | placed |
| S1-50 | Step 5: one paid package | BU §2 | placed |
| S1-51 | Step 6: repeatable channel | BU §6 | placed |
| S1-52 | Four weeks; no sweep; next milestone | RM §10, BU §6 | placed |

## S2: finished product and revenue

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| S2-1 | Standalone synthesis, solo goal | BU §1 | placed |
| S2-2 | Read alongside; reconcile later | RM source key; this set is the reconciliation | placed |
| S2-3 to S2-8 | Six experiences 1 to 6 | RM §1 (same number) | placed |
| S2-9 | Continuity; product promise | RM §1, RD | placed |
| S2-10 | Look and feel: keep direction, brassier yellow | DE identity, system Palette | placed |
| S2-11 | Refinement is consistency and restraint | DE system | placed |
| S2-12 | 8/10 subjective; 9 to 9.5 ambition | DC §2.25 | removed with approval (DC §2.25) |
| S2-13 | Quality requires observed success | DE quality ambition | placed |
| S2-14 to S2-21 | Business rows (8): capture, search, cooking, Journal, planning, friends, development tools, design and reliability | BU §5 | placed |
| S2-22 | Broadens audience; no uplift; test early | RM §9, BU §5 | placed |
| S2-23 | Recall at the next cook | RM §9 | placed |
| S2-24 | First week | RM §9 | placed |
| S2-25 | Coherent paid offer; $36; $48; purchased core | BU §2 | placed (purchased core superseded, DC §2.29) |
| S2-26 | Repeatable route to customers | BU §6 | placed |
| S2-27 | Manageable operation | BU §7, RM §9 | placed |
| S2-28 | USD; billing units; no timeline | BU §3 | placed |
| S2-29 to S2-33 | ARR rows: 100, 500, 1,000, 3,000, 5,000 payers | BU §3 | placed |
| S2-34 | A few hundred to five thousand | BU §3 | placed |
| S2-35 to S2-38 | Contribution rows: $24, $30, $36, $48 | BU §3 | placed |
| S2-39 | Unrounded; exclusions; not take-home | BU §3, §4 | placed |
| S2-40 | Month-24 scenarios unchanged | BU §4 | placed |
| S2-41 | Renewal and replacement | BU §4 | placed |
| S2-42 | What to expect; evidence milestones; reminders | RM §10, BU §6 | placed |
| S2-43 | No new feature hunt; five beyond-feature areas | RM §3, §9 | placed |

## SL: social launch

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| SL1 | Scope and Cookbook / Journal / Community naming | RM §1 | superseded naming (DC §2.17) |
| SL2 | Takeaway 1 | RM §1 | placed |
| SL3 | Finding: Strava audiences | RM §10 (pattern), INSPIRATION | placed |
| SL4 | Finding: Strava feeds and comments | RM P2 | placed |
| SL5 | Finding: Samsung communities | CO §2, §3 | placed |
| SL6 | Minimum pilot product | RM P2, §10 | placed |
| SL7 | Community: approved friends, kudos, comments, audiences | RM P2 | superseded wording (DC §2.16) |
| SL8 | Useful flow; empty Community | RM §1, DE page Friends | placed |
| SL9 | Admission gate | RM §10 | placed |
| SL10 | Proposed pilot | RM §10 | placed |
| SL11 to SL15 | Pilot table rows (5) | RM §10 | placed |
| SL16 | Basic controls before the pilot | RM P2 abuse basics, rights operations, notifications | placed |
| SL17 | Gaps: group unmeasured | RM §10 | placed |
| SL18 | Takeaway 2: supply objects differ | RM §7 supply | placed |
| SL19 to SL22 | Findings: CC BY, BY-SA, NC and ND, Wikibooks and Commons | BU §8 licences | placed |
| SL23 to SL25 | Supply lanes (3) | RM §7 supply | placed |
| SL26 | Seed recommendation | RM §7 supply | placed |
| SL27 | Creator offer, permission scope | BU §8 | placed |
| SL28 | Wikibooks per-recipe review | BU §8 | placed |
| SL29 | Provenance vocabulary | RM §7 supply | placed |
| SL30 | Deduplication | RM §7 supply | placed |
| SL31 | Catalog acceptance template | BU §8 | placed |
| SL32 | Gaps: nothing cleared | BU §8 | placed |
| SL33 | Takeaway 3 | BU §6 | placed |
| SL34 | Finding: Samsung creator guide | CO §3, BU §6 | placed |
| SL35 to SL39 | Metrics: invitation, repeat utility, social value, independence, burden and trust | RM §10 | placed |
| SL40 | Expansion rule | RM §10 | placed |
| SL41 | Channel order | BU §6 | placed |
| SL42 | Funnel | BU §6 | placed |
| SL43 | Packaging; keep arithmetic unchanged | BU §2 | placed |
| SL44 | Gaps: no market size or CAC | BU §6 | placed |
| SL45 to SL46 | Stripe rows: United States, Canada | BU §7 | placed |
| SL47 | 5.6% writer recommendation | BU §3 | placed |

## US and CA: copyright notes

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| US1 | Scope, entity unconfirmed | BU §8 | placed |
| US2 | Risk takeaway and Circular 33 | BU §8 | placed |
| US3 | §106 rights; credit is not permission; fair use | BU §8 | placed |
| US4 | Section 230 preserves IP | BU §8 table | placed |
| US5 | Cox v Sony 2026 | BU §8 | placed |
| US6 | Practical examples table (5 rows) | BU §8 (condensed); full table in the US note | placed |
| US7 | Plagiarism versus infringement; user import versus editorial library | BU §8 | placed |
| US8 | §512 conditions; notice and counter-notice; agent registration and renewal | BU §8 table | placed |
| US9 | Managed inbox; no 24-hour rule; separate report types; counter-notice care; membership fees | BU §8 operating process | placed |
| US10 | Pilot requirements 1 to 5 | BU §8, RM §7 supply, RM P2 rights operations | placed |
| US11 | Removal architecture; tombstones; backups | BU §8 restrictions | placed |
| US12 | Before growth rehearsal; counsel questions (home address, insurance) | BU §8 | placed |
| US13 | Forks and new IP; creator permissions; open licences; permission checker | BU §8 | placed |
| CA1 | Currency of sources; no recipe-specific exemption | BU §8 | placed |
| CA2 | Ideas versus expression; owning a cookbook | BU §8 | placed |
| CA3 | s3 and s27 reserved acts | BU §8 | placed |
| CA4 | Moral rights s14.1, s28.2 | BU §8 table | placed |
| CA5 | Separable questions; credit labels; claimed rights holder | BU §8, RM §7 supply | placed |
| CA6 | s31.1 hosting protection and exceptions; s27(2.3) | BU §8 table | placed |
| CA7 | SOCAN v CAIP and 2021 consultation as background | BU §8 (pointer to the Canada note) | placed |
| CA8 | Notice and notice ss41.25, 41.26; statutory damages | BU §8 table | placed |
| CA9 | Complaint workflow 1 to 5 | BU §8 operating process | placed |
| CA10 | No US counter-notice clock in Canada | BU §8 table | placed |
| CA11 | Fair dealing s29; UGC s29.21 | BU §8 table | placed |
| CA12 | Low-regret controls; counsel gate | BU §8 | placed |
| CA13 | Forks, s13 licences, sharing presets, revocation | BU §8 | placed |

## Z: Zed design reference

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| Z1 | Recommendation: borrow hierarchy, keep identity | DE identity, From the Zed reference | placed |
| Z2 | Evidence, coverage, measured CSS values | DE From the Zed reference (limits); full values in the note | placed |
| Z3 to Z12 | Ranked adaptations 1 to 10 | DE system (Typography, Grid, Accent roles, Grouping, Density, Controls, Continuity, Metadata, Phones, Feedback) | placed |
| Z13 to Z17 | Not to copy 1 to 5 | DE From the Zed reference | placed |
| Z18 to Z23 | Taste choices 1 to 6 | DE From the Zed reference | placed |
| Z24 | Relationship to approved direction | DE identity | placed |
| Z25 | Limits | DE From the Zed reference | placed |

## CD: cookbook design research, 8 Nov 2026 (README)

Folded on 12 Nov 2026; its identity and reference sections had already reached the set through S1, Z and DS, so only the forward items are rows.

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| CD1 | Now: Cook keeps the hero, Fork outweighs Cook, history targets vanish in Cook | RM §6 Cook-mode distinction (closed 11 Nov) | superseded by the Cook redesign |
| CD2 | Now: live homepage differs from local; a contrast pair below threshold | DC §2.23 (homepage); DE Accent roles (contrast checked per screen) | superseded in part (DC §2.23) |
| CD3 | P0 to P5 rows of its friction table | RM §4 gates of P0, P1, P2 and P3 to P5 (same contracts) | placed |
| CD4 | Draft design contract | DE Identity, Working contract | placed |
| CD5 | Two learning tracks: formative usability with non-friends, then the friends pilot | RM §10 Formative usability track | placed |

## UX: UX review, 12 Nov 2026

Every row is a recommendation; "proposed" in RM marks it undecided (RM §3).

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| U1 | Assessment: scores, the first-visit versus return-visit gap | research note only (an editorial judgment, not a plan item) | placed |
| U2 | Assessment: food, time and the cook's experience over handles and version numbers | RM §6 First-scan emphasis; DE Metadata | placed |
| U3 | Evidence and its limits (three recipes, empty Journal and Friends, unobserved large library, phones, repeat use) | RM §10 validation paragraph | placed |
| U4 | Surface: Discover and versions (original plus a different adaptation, change in cooking terms) | RM P1 Featured recipe content; DE Discover | placed |
| U5 | Surface: Cookbook (dense phone grid and list, realistic volume, device-local drafts near Continue) | RM P1 Durable drafts, Library growth; DE Cookbook | placed |
| U6 | Surface: Recipe and Cook (yield, elapsed time and Cook first; version weight at a decision) | RM §6 First-scan emphasis; DE Recipe detail | placed |
| U7 | Surface: Journal (observation first, save with no writing, observation beside Cook) | RM P2 Journal recall; DE Journal | placed |
| U8 | Recommendation 1: repeat-cook flow, its verification and scale checks | RM P2 Journal recall, §9 Recall | placed |
| U9 | Recommendation 2: empty Cookbook entry point; import preview and its two trial recipes | RM P1 Empty Cookbook entry point, P2 Easy import, Onboarding, §9 First week | placed |
| U10 | Recommendation 3: cookie faults, waiting time, the featured adaptation | RM P1 Featured recipe content (cookie faults approved 12 Nov, OD) | placed |
| U11 | Recommendation 4: library of 50 to 100 recipes and drafts; pilot cooks' real meals and what to record | RM §10 validation paragraph; RM P1 Varied seed data (OD) | placed |
| U12 | Recommendation 4: intermittent 500s, cause left open | RM §11 | placed |
| U13 | Deferrals: extra social surfaces, cooking-history chips, Recently viewed; revisit Cook with version, scale and observation | RM §10, P1 Library growth, P2 Cooking session | placed |

## CL: Cooklang research, 23 Oct 2026

Folded on 12 Nov 2026. Every row is a recommendation; "proposed" in RM marks it undecided.

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| CL1 | Summary: borrow structure and portability, not another Cooklang editor; the development loop is a positioning opportunity, not an established edge; AI edits and a meal journal already exist there | CO §3 Cooklang row, CO §2 | placed |
| CL2 | Finish one save and versioned formulation | RM §2 (shipped: append-only versions, one save) | overtaken |
| CL3 | Scaling: arithmetic, measurement guidance and process changes kept apart; a multiplier never writes a version; fixed quantities an explicit author choice | RM §7 Scaling and units, P2 Scaler workstream | placed |
| CL4 | First AI adaptation benchmarked against CookBot on the same recipes; the adaptation bar | RM §7 AI | placed |
| CL5 | Timers are recipe content; a running timer is session state | RM §7 Timers and offline truth | placed |
| CL6 | Connect one adaptation to one real cook before expanding gram tables | RM §7 Recipe, cook and revision ("Use these changes next time"), P2 Units and temperature (later) | placed |
| CL7 | `.cook` import after the core loop; original kept; supported subset declared; evaluate existing parsers and the canonical parser tests first | RM P4 Cooklang import and export | placed |
| CL8 | Portability is a guarantee; history never locked behind payment | RM P1 Export and archive, BU §2 never paywalled | placed |
| CL9 | Cooking attempts tied to version, batch, deviations and outcome, distinct from the formulation and a proposed revision | RM P2 Journal, §7 | placed |
| CL10 | Ingredient use in steps: the relationship, divided amounts counted once | RM P4 Ingredient quantities in steps | placed (its "relationship, not the syntax" yields to DC §1, 9 Nov: Cooklang-style markup) |
| CL11 | Subrecipes reference a specific version | RM P4 Subrecipes, §7 Subrecipes | placed |
| CL12 | Edges A to D: a development workflow, history without Git, natural writing with optional structure, adaptation quality | RM §1, §7 Plain language, §7 AI | placed |
| CL13 | Grow no Fork-specific markup piecemeal | RM P4 Ingredient quantities in steps | placed |
| CL14 | Where not to compete; the target cook as a hypothesis | CO §3 Cooklang row | placed |
| CL15 | Immediate implications 1 to 3 | 1 as CL2; 2 RM §7; 3 RM §7 AI | placed |

## PS: package sweep, 12 Nov 2026

Folded on 12 Nov 2026. Nothing in it is decided except `pluralize` (DC §1, 12 Nov); RM marks the rest proposed.

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| PS1 | Summary: adopt now, `parse-ingredient` 3.2.0 then `pluralize` | RM §11 (`parse-ingredient` upgrade); RM P2 Scaler workstream and DC §1 (`pluralize`, approved) | placed |
| PS2 | Summary: adopt when the feature is built (`fflate`, `htmlparser2` and `ipaddr.js`, `@cooklang/cooklang`, error reporting, faker) | the rows of PS25 to PS45 | placed |
| PS3 | Summary: keep ours | RM §11 Dependency posture | placed |
| PS4 | Summary: the platform does it (wake lock, timers, PWA, signed URLs, staging, mail) | the rows of PS25 to PS45 | placed |
| PS5 | Summary: posture, seven runtime dependencies | RM §11 Dependency posture | placed |
| PS6 | Part A: `parse-ingredient` 3.0.0 to 3.2.0, then `MAX_LINE` | RM §11 | placed |
| PS7 to PS24 | Part A: keep ours (scaling, conversion, unit plurals, counted nouns, durations, photo sniffing and stripping, rate limits, validation, diffing, slugs, highlighting, Markdown export, JSON-LD, sitemap, time zones, drafts, the pool, UI primitives; 18 rows) | RM §11 Dependency posture; the rate-limit race and the embedded-Exif limit in RM P2 Abuse basics; `schema-dts` in RM P1 Public recipe metadata; `<dialog>` and `popover` first, and `fieldErrors` without its own tests, in RM §11 | placed |
| PS25 to PS28 | Part B: paste and Markdown files, URL import with `htmlparser2`, the safe fetch on `ipaddr.js`, no rendered HTML | RM P2 Easy import | placed |
| PS29 | Part B: the Paprika importer with `fflate` | RM P2 First migration importer | placed |
| PS30 | Part B: photo bundling in export with `fflate`, streamed | RM P1 Export and archive | placed |
| PS31 | Part B: `@cooklang/cooklang` | RM P4 Cooklang import and export | placed |
| PS32 | Part B: varied seed, built or faker as a dev dependency | RM P1 Varied seed data | placed |
| PS33 | Part B: onboarding is product flow, no package | RM P2 Onboarding (no change) | placed |
| PS34 | Part B: mail through Supabase SMTP and a provider's HTTP API | RM P2 Email notifications; P0 Account access (production mail) | placed |
| PS35 | Part B: offline reading through SvelteKit's service worker | RM P2 Offline saved reading | placed |
| PS36 | Part B: timers and wake lock are browser APIs | RM §7 Timers and offline truth | placed |
| PS37 | Part B: print through `@media print` | RM P1 Print (live) | overtaken |
| PS38 | Part B: grocery combining built on Fork's units | RM P3 Grocery list | placed |
| PS39 | Part B: nutrition from USDA FoodData Central | RM P4 Nutrition, gated | placed |
| PS40 | Part B: OCR and AI repair through `fetch` | RM P5 OCR and capture assistance | placed |
| PS41 | Part B: private photos by signed URLs | RM P1 Photo access follows audience | placed |
| PS42 | Part B: comment moderation is report and delete, no profanity filter | RM P2 Comments (no change) | placed |
| PS43 | Part B: payments with the `stripe` SDK | RM §11 Dependency posture | placed |
| PS44 | Part B: error reporting before public launch | RM §11 Dependency posture, P0 Public-launch prerequisites | placed |
| PS45 | Part B: staging on a second Supabase project and Netlify branch deploys | RM P0 Two-tier environments (already there) | placed |
| PS46 | Risks and things not verified | RM §11 (run the suite after the bump); the unverified notes in each row above | placed |

## FR: feature wishlist and competitor gaps, 31 Oct 2026

The roadmap report (R) read this note as leads; this section, added 12 Nov 2026, traces every item, including those R did not carry. New folds are proposed in RM.

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| FR1 | Method: self-hoster vote counts as a lower bound; Reddit unread | CO §5 (self-selected requests) | placed |
| FR2 | Candidate 1: cook mode with step timers | RM P2 Timers, Cooking session (Cook is live) | placed |
| FR3 | Candidate 2: units and °C/°F; a comparison in the reader's units | RM P1 Measurement preference, P2 Units and temperature | placed |
| FR4 | Candidate 3: "I cooked this" log | RM P2 Journal | placed |
| FR5 | Candidate 4: URL import | RM P2 Easy import | placed |
| FR6 | Candidate 5: quantities in steps and totals | RM P4 Ingredient quantities in steps | placed |
| FR7 | Candidate 6: print and export | RM P1 Print, Export and archive | placed |
| FR8 | Candidate 7: alternatives, optional ingredients, substitutions with evidence | RM P3 Optional ingredients, P5 Substitutions | placed |
| FR9 | Candidate 8: subrecipes | RM P4 Subrecipes | placed |
| FR10 | Candidate 9: variants grouped under a parent | RM P4 Grouped variations | placed |
| FR11 | Candidate 10: household and friend sharing | RM P3 Household cookbook, P2 Friends | placed |
| FR12 | Candidate 11: several photos, step photos, cooks' photos | RM P4 Step photos and links, P3 Richer diary | placed |
| FR13 | Candidate 12: grocery list by aisle | RM P3 Grocery list | placed |
| FR14 | Candidate 13: nutrition | RM P4 Nutrition, gated | placed |
| FR15 | Candidate 14: photo and PDF import | RM P5 OCR and capture assistance | placed |
| FR16 | Candidate 15: meal plan with calendar export | RM P3 Meal queue and calendar | placed |
| FR17 | Seen, not ranked: translation, excluding tags, equipment, ranges, the onion scaling bug | RM P5 Translation, P2 Global search, §7 Content fidelity, §8 Acceptance library | placed |
| FR18 | Gap 1: the cook log tied to the version | RM P2 Journal, CO §2 | placed |
| FR19 | Gap 2: substitutions with evidence | RM P5 Substitutions | placed |
| FR20 | Gap 3: subrecipes pinned to a version | RM P4 Subrecipes | placed |
| FR21 | Gap 4: a screen-reader cook mode | RM P2 Cooking session | placed |
| FR22 | Gap 5: formatting for neurodivergent cooks | RM Not yet phased, Reading options | placed |
| FR23 | Sketch 1: the atom is a cook | RM P2 Journal | placed |
| FR24 | Sketch 2: tweaks become a fork crediting the cook | RM §7 Recipe, cook and revision | placed |
| FR25 | Sketch 3: the feed shows friends' cooks with a change chip | RM P2 Friends, Feed card title | placed |
| FR26 | Sketch 4: kudos as one tap | RM P2 Like and Save on the feed | superseded wording (DC §2.16) |
| FR27 | Sketch 5: "cooked 14 times · 3 takes" | RM P1 Last and times cooked | placed |
| FR28 | Sketch 6: a diary grid and year in review | RM P3 Richer diary | placed |
| FR29 | Sketch 7: "better or worse than last time?" | RM P2 Private ratings | placed |
| FR30 | Sketch 8: trends (most forked, most cooked, most common tweak) | RM P2 Discover (lead card), P5 Substitutions | placed |
| FR31 | Sketch 9: an opt-in yearly cooking goal | RM §12 Streaks and posting pressure (deferred) | placed (deferred with streaks) |
| FR32 | Sketch 10: Feed, Cookbook, Diary as navigation | DC §1 9 Nov navigation | superseded (DC §2.5) |
| FR33 | Accessibility and reach (10 bullets) | RM §8 Accessibility and Kitchen ergonomics, P2 Cooking session, Not yet phased Reading options, P5 Translation, read-aloud, P2 Units, P2 Offline saved reading, P4 Nutrition (estimates only) | placed |
| FR34 | Sources | research note only | placed |

## BV: business viability, 31 Oct 2026

Read by the roadmap report (R, AQ) and superseded as a business plan by BUSINESS.md; this section, added 12 Nov 2026, traces every item.

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| BV1 | Verdict 1 to 6: outcome bands, venture scale unlikely, storage prices, conversion medians, SEO decline | BU §3, §4 (recomputed through R and AQ), CO §2 | placed |
| BV2 | Verdict 7: what would have to be true, including weekly-logger and payment thresholds | DC §2.26 | removed with approval (DC §2.26) |
| BV3 | Verdict 8: the asset is versions with reasons | CO §2 | placed |
| BV4 | Verdict 9 and strategy 1: the baker's notebook wedge | RM §10 (recruit repeat and adapting cooks; S1: bakers are not assumed to be the only market), BU §5, §6 | placed (the baker-only wedge yields to S1) |
| BV5 | Verdict 10 and (e): decide in six months against kill criteria | DC §2.26 | removed with approval (DC §2.26) |
| BV6 | Strategy 1's build list: share cards, year in review, iOS push | RM Not yet phased Share cards, P3 Richer diary, P5 Native apps | placed |
| BV7 | Strategy 2: the household cookbook | RM P3, BU §5 | placed |
| BV8 | Strategy 3: creators | RM P5 Creator tools, BU §5, §8 | placed |
| BV9 | Models ruled out: ads, hardware, data licensing | RM §12 | placed |
| BV10 | Comparables table and pattern | CO §3 (through R) | placed |
| BV11 | What we would need, product 1 to 8 | RM P2 Journal and Cooking, P2 Easy import, Not yet phased Share cards, P2 Friends, P3 Richer diary, P0 Private first, BU §2 | placed |
| BV12 | Distribution | BU §6 | placed |
| BV13 | Costs by band; photos behind a CDN at scale | BU §7 | placed |
| BV14 | Copyright: imports private, source kept, a DMCA agent | BU §8, RM §7 Recipe supply | placed |
| BV15 | Children and GDPR basics | RM P0 Public-launch prerequisites, BU §8 | placed |
| BV16 | Moderation before a public feed: reports, admin hide, rate limits, abuse hashing | RM P0 Moderation foundations, P2 Abuse basics, P0 Public-launch prerequisites | placed |
| BV17 | Terms, privacy and refund policies before money | BU §2, RM P0 Public-launch prerequisites | placed |
| BV18 | Native app thresholds; iOS web push | RM P5 Native apps (measured friction decides, not a user count) | placed |
| BV19 | No cofounder needed to test | BU §1 (a solo operation, DC §1 10 Nov) | placed |
| BV20 | Sources | research note only | placed |

## CD notes: cookbook design research, 8 Nov 2026 (three notes)

Folded on 12 Nov 2026: [design principles](../research/2026-11-08-cookbook-design-research/design_principles.md), [product references](../research/2026-11-08-cookbook-design-research/product_references.md) and [cooking workflows](../research/2026-11-08-cookbook-design-research/cooking_workflows.md). Most of their substance reached the set through the README (CD1 to CD5), S1 and Z; the rows below place what each adds.

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| CD6 | Principles §1: aesthetics and usability measured apart; seven judgments (palette as a hypothesis, photography's range, clay and marigold roles, task text direct, grouping before boxes, paired screens) | DE Identity, Accent roles, Typography roles, Grouping, Photography; RM §10 Formative usability track | placed |
| CD7 | Principles §2: the editor and cooking acceptance table (common editing, advanced operations, save semantics, failure, reversal, focus, touch, cooking layout, motion) and the WCAG 2.2 selection | DE Feedback and states, New and edit, Cooking; RM §8 Accessibility, Kitchen ergonomics; RM P0 Save state and recovery | placed |
| CD8 | Principles §3: the formative study plan and its record | RM §10 Formative usability track | placed |
| CD9 | Principles gaps: contrast on actual pairs and states; the 4.46:1 pair to verify | DE Accent roles, Palette (real pairs in every state) | placed |
| CD10 | References: Bear, Things, Linear as mechanisms; Todoist, Obsidian, Claude as light signals | CO §6, [INSPIRATION.md](../design/INSPIRATION.md), DE Identity | placed |
| CD11 | References: capture, disclosure, editing and recovery (reversible interpretation, recovery is not history, recipe versus entry versus discussion) | DE Identity working contract, RM §7 Recipe, cook and revision, RM P1 Durable drafts | placed |
| CD12 | References: eight mappings (action hierarchy per state, content carries warmth, editing resembles the recipe, capture first, Cook as focus, Journal beside the recipe, meaningful recovery, density by content) | DE Controls, Photography, New and edit, Cooking, Journal, History and comparison, Density | placed |
| CD13 | Workflows §1: interruption (working hierarchy, context without a tunnel, counter-distance reading, state is a promise, hands-free as an enhancement, acceptance checks) | DE Cooking; RM P2 Cooking session, Mobile cooking refinement, §8 Kitchen ergonomics | placed |
| CD14 | Workflows §2: precision (canonical quantity, inspectable scaling, subrecipe clarity, arithmetic is not authorship, timers belong to work, correction is core, the import fixture) | RM §7 Scaling, Subrecipes, Timers; RM P2 Easy import (the fixture, proposed; read first) | placed |
| CD15 | Workflows §3: journal (finish into a record, name the intent, history answers cooking questions, explicit audience, acceptance checks) | RM §7 Recipe, cook and revision; RM P2 Journal, Journal recall (read first) | placed |

## SW: site sweeps, 29 Oct 2026

Folded on 12 Nov 2026. The sweeps' fixes shipped the same week (checked: the `::placeholder` rule and the card title's `text-wrap: balance` in `src/app.css`); the screens they scored have since been redesigned (Favorites is the Cookbook's Saved, the landing page is Discover).

| # | Source item | Destination | Status |
| --- | --- | --- | --- |
| SW1 | Method and the morning scores | research note only | placed |
| SW2 | Cross-cutting findings (placeholders, titles, navbar targets, case, font shift, chip meaning, widows, card shadow, DESIGN.md drift) | applied 29 Oct (Shared fixes, Final batch) | overtaken |
| SW3 to SW9 | Applied rounds: compare, browse and landing, profile and favorites, editor, recipe page, shared fixes, final batches | the code | overtaken |
| SW10 | Wave and final-run score tables | research note only | placed |
| SW11 | Still open, recipe page: Clear ticks without undo, silent 12-hour ticks (Spencer's calls) | DE Cooking | placed |
| SW12 | Still open, compare: no key for the marks; case-only changes | DE History and comparison | placed |
| SW13 | Still open, auth: show-password (Spencer's call), no confirm field, announcements | DE Profile and account; DE design quality pass checklist | placed |
| SW14 | Still open, browse: no `srcset` | DE Photography | placed |
| SW15 | Still open, profile: no sort past about twelve recipes; "8 changes" as a link | RM P2 Profile redesign | placed |
| SW16 | Hosted recovery template, redirect allow-list and SMTP (Spencer's one-way doors) | RM P0 Account access (verified production mail) | placed |
| SW17 | The rest of the P3 list | DE design quality pass (the still-open list as a checklist) | placed |
| SW18 | Flaky e2e under machine load | research note only | placed |

## Notes reviewed 12 Nov 2026 with nothing to fold

| # | Note | Why nothing is folded | Status |
| --- | --- | --- | --- |
| UD | [UI design directions, 26 Oct](../research/archive/2026-10-26-ui-design-directions.md) | Direction C with the clay and marigold roles was built on 27 Oct and is DESIGN.md; directions A and B, the other accents and the espresso hero were rejected there; dark mode's recorded set is RM Not yet phased, Dark mode | overtaken |
| AP | [Alternate palette ideas, 27 Oct](../research/archive/2026-10-27-alternate-palette-ideas.md) | A stashed March palette and the 2025 brief, both replaced by the shipped tokens; tags no longer share the action colour | overtaken |
| RC | [Recipe page critique, 28 Oct](../research/archive/2026-10-28-recipe-page-critique.md) | Its composition shipped 28 to 29 Oct; its parked ideas are built (fork from an older version, Keep this version) or replaced (Save and Fork pills, DS) | overtaken |
| RS1 | [UI reuse sweep, 9 Nov](../research/archive/2026-11-09-ui-reuse-sweep.md) | Extracted: `ConfirmStep`, `FormActions`, `ChoiceGroup`, `Avatar`, `EmptyPanel`, `ResultStatus` in `src/lib/components/ui/` | overtaken |
| RS2 | [Server reuse sweep, 9 Nov](../research/archive/2026-11-09-server-reuse-sweep.md) | Extracted: `viewableRecipe`, `ownRecipe`, `inLibraryOf`, `cardList`, `failure` and the testing helpers (AGENTS.md, Shared helpers) | overtaken |
| RB | [Roadmap before the social revision, 8 Nov](../research/archive/2026-11-08-roadmap-before-social-revision.md) | An earlier draft of the roadmap report, replaced by its revision (R), which this file traces | superseded (by R) |

## M1 to M23: October milestones

Where each milestone of the [October milestones](../history/2026-10-milestones.md) went in the current plan. Moved here from ROADMAP.md section 13 on 12 November 2026.

| Milestone | Disposition |
| --- | --- |
| M1 Pull requests | P4 to P5 reviewed "Suggest a change"; keep concurrency, permission and attribution; rewrite the old sketch under current schema rules |
| M2 Per-page metadata | Built; verify public previews, add Recipe structured data in P1 |
| M3 Version comments | Simple cook comments in P2 once the feed has use; version-review comments P4 |
| M4 Following and feed | Friends and the chronological feed shipped; algorithmic discovery P5 |
| M5 Lineage visualization | P4 prototype, P5 decision; the fork list is built |
| M6 Collections | P1 personal, P3 household |
| M7 Fuzzy diff matching | P4 bounded quality work |
| M8 Search ranking | P1 known-item relevance across every version; popularity is a public-discovery signal |
| M9 Optimistic concurrency | Built; preserved in P0; extends to suggestions later |
| M10 Drizzle migrations | Shipped infrastructure; current rules govern every slice |
| M11 Timers | P2 named persistent-deadline timers, replacing the component-local sketch |
| M12 Gram tables | P2 carefully sourced conversion coverage; broader data P4 with ingredient and preparation matching |
| M13 User weights | P4 explicit overrides |
| M14 iOS | P2 web and offline improvements; P5 native decision on measured limits |
| M15 Import | P2 first migration and easy import; P4 Cooklang subset; P5 OCR and social capture |
| M16 Export | P1, before import dependency; history, provenance and later logs |
| M17 Attempts | Shipped as the Journal; last and times cooked P1 |
| M18 Cook mode | Built; P2 validation and refinement |
| M19 Match highlighting | P1 |
| M20 Tick affordance | Shipped 16px circle stays; P2 side-by-side revisit |
| M21 Pantry matching | P3 bounded experiment |
| M22 Subrecipes | P4 committed |
| M23 Graphical cooking view and timeline | P4 optional dependency view, separate from M5 lineage; no near-term date |

Other preserved preferences: warm cookbook styling, desktop two-column reading, intentional phone, iPad and desktop layouts, monospace diff pages, the editable serving input without ×2 and ÷2 clutter, username settings, private-first publishing and honest traction. Earlier code snippets, enum and migration directions and hour estimates are history, not instructions (R).

## Counts

Each table row above counts as one item, except rows that name a range (for example "R204 to R226", "DD15 to DD25"), which count as the number of items in the range; source-register rows count as one.

- Items in the sources: 1,106 (R 308, CM 90, AQ 132, PA 56, DD 160, S1 52, S2 43, SL 47, US 13, CA 13, Z 25, CD 5, UX 13, CL 15, PS 46, FR 34, BV 20, CD notes 10, SW 18, notes with nothing to fold 6), counted from the row numbers above.
- Items placed in the current set: 1,084. This includes 31 rows marked superseded in whole or part (RB, FR26, FR32, CD1, CD2, R8, R17, R37, R52, R56, R58, R61, R62, R64, R68, R80, R81, R97, R100, R103, R230, R238, CM38, CM40, CM47, CM61, AQ15, AQ44, PA29, SL1, SL7), plus superseded notes inside R204 to R226 (M4, M17, M20), PA3 to PA21 (visibility), S1-27 and S2-25 (purchased core); each is placed through its replacement.
- Items removed with approval: 7 rows (R4, R201, PA1, S1-5, S2-12, BV2, BV5), DC §2 lines 23 to 27; line 24 comes from the design summary, which stays current and is not a reconciled source. Placed 1,084 plus removed 7 plus overtaken 15 is 1,106.
- Lines in DC §2: 30, of which 25 are dropped as superseded (line 30, the first 12 Nov build order, is a decision record, not a source item) (several rows above share one line; lines 12, 15 and 17 replace wording in R254, R253 and the design summary) and 5 are removals with approval (lines 23 to 27).
- Items overtaken by the code: 15 (CL2, PS37, SW2, SW3 to SW9, UD, AP, RC, RS1, RS2).
- Items kept with removal proposed: 0.
- Unplaced: 0.

## Changelog

- 2026-11-11: created with the product set.
- 2026-11-11: five kept-with-removal-proposed rows now removed with approval (RM §16.23, 25 to 27); counts updated.
- 2026-11-11: rows moved by Spencer's 11 Nov answers (RM §14): migration importer to P2 (R64, CM47 superseded, RM §16.28), purchased core superseded (RM §16.29), search and drafts rows point at §14; §15 references updated; counts updated.
- 2026-11-12: UX section added (U1 to U13, the 12 Nov UX review); counts updated.
- 2026-11-12: CD section added (the 8 Nov cookbook design research README); counts updated.
- 2026-11-12: CL section added (the 23 Oct Cooklang research); status **overtaken** defined; counts updated.
- 2026-11-12: PS section added (the 12 Nov package sweep); counts updated.
- 2026-11-12: FR and BV sections added (the 31 Oct feature research and business viability notes); counts updated.
- 2026-11-12: CD notes, SW and nothing-to-fold sections added (the three 8 Nov design notes, the 29 Oct site sweeps, the October design notes, the 9 Nov reuse sweeps and the pre-revision roadmap); counts updated.
- 2026-11-12: CD14 points at the import fixture now in RM P2 Easy import.
