# Fork roadmap

The single current plan for Fork, a recipe cookbook with version history, a cooking Journal and friends. Current as of 11 November 2026, the day the minimum viable product (MVP) went to production. Edited in place; history is in the changelog at the bottom and in git.

**Source key** used in the tables below:

| Key | Source |
| --- | --- |
| R | [Product roadmap report, 8 to 10 Nov 2026](../research/2026-11-08-product-roadmap/README.md), with its research notes [cookbook market](../research/2026-11-08-product-roadmap/cookbook_market.md) (CM), [advanced features, quality and economics](../research/2026-11-08-product-roadmap/advanced_and_quality.md) (AQ) and [product audit](../research/2026-11-08-product-roadmap/current_product_audit.md) (PA) |
| DD | [Cookbook-app deep dive, 9 Nov 2026](../research/2026-11-09-cookbook-app-deep-dive/README.md); entries by ID in [INVENTORY.md](INVENTORY.md) |
| SL | [Social launch research, 8 Nov 2026](../research/2026-11-08-social-launch/social_launch.md) |
| DS | [Approved MVP design summary and build record](../design/2026-11-10-decision-pack/DESIGN-SUMMARY.md) |
| S1 | [Design refinement and solo-business review, 10 Nov 2026](../research/2026-11-10-design-and-solo-business.md) |
| S2 | [Finished product and revenue synthesis, 10 Nov 2026](../research/2026-11-10-finished-product-and-revenue.md) |
| Z | [Zed design reference, 9 Nov 2026](../research/2026-11-09-zed-design-reference/README.md) |
| OD | Spencer's decisions in conversation, 9 to 11 Nov 2026, listed under section 14 |
| M1 to M23 | Milestones of the [October roadmap](../ROADMAP.md), mapped in section 13 |

## 1. The finished product

Fork is a dependable home for a cook's recipes that helps their cooking improve over time. It is useful on its own, without an active social network, and it gets better when friends are cooking too. The finished product is six connected experiences (S2):

1. **Bring recipes together.** Capture from supported sources, paste or write freely, migrate an existing collection, review how Fork read it, keep the attribution. Groups, quantities, yield and instructions keep their meaning everywhere.
2. **Find and prepare.** Collections, retrieval by useful criteria, choosing meals, scaling, shopping and shared household work. Simple at first; capabilities appear as they are needed.
3. **Cook confidently.** A clear phone, tablet and desktop presentation, ingredients always reachable, progress kept, contextual timers. Print and explicitly saved offline copies as alternatives. Browser alarms and cross-device behaviour are validated, never promised from a checklist.
4. **Remember and improve.** A lightweight Journal ties each cook to the exact version and scale, or to an external source or an improvised dish. Private adjustments and next-time notes come back when useful. Successful variants are easy to repeat without losing earlier versions.
5. **Share and discover through people.** See what friends actually cooked, save or adapt a recipe, share chosen results with clear audiences. Nobody has to author a full recipe to take part.
6. **Go deeper when needed.** Subrecipes, development tools and multi-recipe cooking for demanding cooks. AI (artificial intelligence), native apps and integrations are evaluated investments, not required parts of a successful business.

The differentiating experience is continuity: a recipe travels from capture through planning, cooking and revision without losing meaning, and Fork remembers the cook's experience of it. The intended loop is **see a friend's cook, save the source, cook, remember, improve, share** (R).

**Audience.** The primary customer is a serious home cook: collecting useful recipes, adapting them to a household, cooking repeatedly, wanting accumulated knowledge to survive. Discovery includes weeknight cooks, enthusiastic bakers, family-recipe keepers and mixed-device households. Chefs are adjacent recipe developers: precise yields, batch scaling, reusable sauces and doughs, testing notes and clear printouts help both groups. Restaurant procurement, stock valuation, payroll, point of sale and multi-location operations need a different buyer and are outside the target (R, AQ). The first market is the US and Canada, starting with Spencer's own friend group (R).

**Three pillars:** Cookbook, Journal and Friends (the community), with a dependable editor and cooking view as the foundation (R, decided 8 Nov). Breadth without dependable everyday use is the main risk: a beautiful recipe page is not enough if a cook loses an edit, cannot import a collection or keeps scrolling to find a quantity. A feature does not need a version-control angle to belong; competitor convergence and repeated requests are strong evidence of a useful job, sequenced by dependency, correctness and operating burden (R, PA).

## 2. Where Fork stands

**Published to production on 11 November 2026** (commit `daa1dd1`, migrations 0008 to 0011 applied):

- Three recipe audiences (Only me, Friends, Public) with one access rule on every surface: own recipes, accepted friends' Friends-level recipes and Public; a stranger or signed-out visitor sees Public only. New recipes and forks start Only me; a fork never widens its source's audience, enforced on the server.
- Friendships with requests, invite, and unfriend, block, mute and report (reports are stored for reading by hand).
- Journal: log entries with dish and date, optional recipe and version, serving scale, external link or "Improvised", photo, caption, private next-time note and audience (Only me or Friends); likes with counts.
- Friends feed, newest first, mixing friends' log entries and recipe events ("Maria changed Cardamom buns, v3 to v4").
- Discover: viewer-scoped, a lead card (most saved in the last 7 days, newest when nothing was saved), a Recent changes row linking to diffs, filters for friends, a person and tags (every selected tag must match).
- Cookbook: All, Mine and Saved in one grid with search and tags.
- Navigation: Discover, Cookbook, Journal, Friends; a phone tab bar; an avatar menu. Signed out, `/` is Discover; signed in, Cookbook.
- Recipe page redesign: Cook (the one primary), Save with its count, Fork, Add to Journal pills; "Log in to save" signed out; a version bar; Cook pinned to the version read, surviving reload and handing version and scale to the Journal.
- Line editor with `# Name` section headings (a direct Section heading button), live heading styling and a read-back of the groups; Makes beside Serves; the audience radio trio; owner-confirmed permanent delete.
- Kept from before: append-only versions with commit notes, any-two-version comparison, versioned photos, failed-save input retention, unsaved-change warning, stale-write protection, render-only scaling with ranges and fractions, Cook with wake lock, and ingredient and step ticks kept for 12 hours per version (PA).
- Engineering: a shared component set and a closed set of controls, the `code-health` skill and two audits (section 11).

**In flight, not yet landed:** a CSS simplification pass with no visible change; phone fixes (status-bar and top-bar colour on iOS Safari, New recipe button height, the servings control moved left with a smaller gap, the "Friends' recipes" toggle moved into the tag row as one filter bar).

**Known gaps in the shipped product** (from the audit and code, still true): recipe photos are served from public storage URLs whatever the recipe's audience; ingredient search matches every historical version, not only the current one; a fork's note names the source version but no structured source-version reference is stored; there is no settings route, export, print styling, collections, drafts or Trash; tag slugs drop non-Latin characters (PA). Present test results, authenticated journeys, real phones, screen readers, production mail, private-media policy and field performance are unverified (R).

## 3. How the plan works

- **Phases** P0 to P5 each have a goal, a completion gate and one item table. A phase holds several reviewable slices, not one ticket. Sizes describe relative scope only: **S** bounded presentation or logic, **M** crosses flows, data or state, **L** substantial model, platform or operational complexity. They are not hour estimates or delivery promises (R).
- **Status** in the tables: **shipped** (in production), **in flight** (being built), **next** (the current window: remaining P0, pilot prerequisites and P1), **later** (P2 onward, not started), **design backlog** (waits on Spencer's eye; section 6).
- **Two lanes run together.** The pilot lane is trust, privacy and rights plus useful create, save, retrieve and cook, then Journal, then the Friends loop, then watching real use. The cookbook lane continues through faithful content and library, dependable cooking, household routines and deeper development. The pilot does not wait for durable drafts, all P1 grouping, bulk migration, complete archives, P2 timers and offline, P3 planning and households, or P4 subrecipes; those keep their own gates (R).
- **Quality gates persist through every phase** (section 8); completing P0 does not finish reliability work (R).
- **Every coherent slice** records the user task it makes easier and verifies the complete workflow: keyboard and mobile behaviour, permissions, error and recovery states, realistic recipe data. A short real-use feedback pass follows each phase and feeds back into existing workstreams (R).
- **No broad new discovery** until most of the retained scope has been built and used. Targeted reference checks for an accepted item continue. User-reported blockers, accessibility failures, privacy problems and data-loss risks are fixed when found, not queued (R, DD, decided 9 Nov).
- **Later means delayed with a dependency or decision gate, never silently cancelled** (R). Settle each open product call when its slice needs it, not as a speculative global specification (R).
- Follow current Drizzle migration rules; authored history stays append-only while a recipe exists; owner-confirmed deletion may remove a recipe and its history. Lawful access suppression and retention handling are separate responsibilities (R).
- For a solo operator, prefer shared models and coherent vertical slices: one grouping rule that works in reading, shopping, scaling and export, rather than four support problems. Reliable integrations and bounded scope matter as much as breadth (S1).

## 4. Phases

### P0: Trust the work

**Goal:** nothing a cook entrusts to Fork is lost, published by surprise or exposed to the wrong person. Mostly M.

**Gate:** failed saves and conflicts keep input while the editor is open; saved versions stay intact; nothing is published silently; private surfaces pass owner, other-user and signed-out checks, including feed, photos and direct URLs; moderator disabling and restoration safeguards work; the existing behaviour tests pass (R).

| Item | What it is | Status | Source |
| --- | --- | --- | --- |
| Save state and recovery | Clear saved and failed states; input kept on validation, upload, server and session failures while the editor is open; unsaved-change warning; stale-write protection (edit revision, row lock, second check in the transaction). Test by interrupting a save, expiring the session, triggering validation and a conflict | shipped; keep verifying | R slice 1, PA, M9 |
| State in words | Editor header names the state: "Editing v3 · Unsaved changes · saves as v4", "Couldn't save: N fields need attention", "Couldn't reach the server. Your changes are still here.", "Saved as v4" | shipped | DS |
| Cleanup verification | Nonzero quantity formatting; upload limits compatible with the deployment | next | R slice 1, PA |
| Private first | New recipes and forks start Only me; publication is explained in one sentence per audience; existing public content is never silently reclassified | shipped | DS, R slice 2, OD |
| One access rule | Every recipe read (page, Cookbook Saved, Fork, Discover, search, tags, profiles, thumbnails, direct links) checks the viewer's access | shipped | DS |
| Forks never widen | A fork of a Friends recipe is Only me or Friends, never Public; enforced on create and every later visibility change | shipped | DS, OD |
| Exact origins | Store the exact copied source version on a fork; forking an older version records that version; test direct URLs, history and diff, images, search, saves and exports across accounts | next | R slice 2, PA |
| Save versus Fork | "Save" keeps a moving favourite; "Fork" makes an editable copy; counts read "saves" and "forks" | shipped | DS, OD |
| Recipe deletion | Owner-only permanent deletion with a confirmation saying the recipe and its history cannot be restored; related records and media references handled; independent forks survive with "Original recipe deleted" | shipped | R, DS |
| Account access | Account settings, username change with stable identity and old-link behaviour, confirmation page naming the address with resend, verified production mail (P0 to P1) | settings and username change built (awaiting publish); confirmation page and production mail next | R, PA |
| Account lifecycle | Account deletion and retention defined independently of recipe deletion, before broad onboarding | next | R |
| Media access check | Inspect the storage bucket policy and test intended private-media behaviour before promising private cookbooks; a public URL is a policy question, not a demonstrated leak | next | R, PA |
| Backup and restore | Exercise a restore; restored data reapplies current restrictions and takedowns | next | R, US note |
| Moderation foundations | Report (shipped) plus moderator disabling and restoration that reach current pages, old versions, diffs, images and variants, previews, search snippets, exports and caches | report shipped; suppression next | R, SL |

### P1: Own a useful cookbook

**Goal:** a personal cookbook good enough to be someone's main one. M slices, after P0.

**Gate:** a cook brings a realistic recipe or library into Fork, corrects it, organizes and retrieves it, prints and exports it, and restores an older iteration without losing declared content (R). Fixture: a dough and filling recipe making 12 buns saves, reopens, scales, compares, prints and exports without flattened groups or lost wording; "12 buns" is never read as 12 people (R slice 3).

| Item | What it is | Status | Source |
| --- | --- | --- | --- |
| Groups and Makes | Ingredient and method groups by `# Name` lines, Makes separate from Serves, the scaling notice ("Pan sizes and oven temperatures are not scaled") | shipped | DS, R |
| Section heading tool | Direct Section heading button inserting `# Section name` with the name selected; typed and pasted markers give the same groups; the `#` stays visible in a softer colour; ordinary recipes need no markers; no general Markdown | shipped | DS, R, E03 |
| Source, notes, times | Source name and URL separate (E07); notes; time entry with rest and make-ahead (E08); equipment, storage and reheating as author notes; carried through edit, read, history, preview, print and archive. Built through edit, read, history, diff, restore, fork, kept copies, search, print and the export (Export and archive); preview (Editor preview, P2) carries it when it is built | in flight (built, awaiting publish) | R, CM, DD |
| Restore as new version | Restore an old version by appending a new one; past content never changes | in flight (built, awaiting publish) | R, PA |
| Durable drafts | Draft recovery across reload, tab close and crash, saved on the device; drafts never flood version history; synced drafts are a P2 item | in flight (built, awaiting publish) | R (9 Nov evening), AQ, OD |
| Trash | Deleted recipes recoverable for 30 days | in flight (built, awaiting publish) | R (9 Nov evening), OD |
| Photo access follows audience | Private and Friends-level photos are not publicly addressable | next | R (9 Nov evening) |
| Settings page | Account, username, default audience; later the measurement and inline-quantity preferences, and a volume-or-weight choice for how quantities are shown (OD, 11 Nov 2026: "another settings candidate later on") | in flight (built, awaiting publish) | R (9 Nov evening) |
| Measurement preference | Metric or US per user | in flight (built, awaiting publish) | R (9 Nov evening) |
| Last and times cooked | Derived from log entries, on Cookbook cards and the recipe page's personal line; never on cards about the recipe (Discover, Search, tags, profiles) | shipped | R (9 Nov evening), M17 |
| Cookbook and Discover | Separate destinations; a route never changes meaning on sign-in | shipped | DS |
| Collections | v1 manual collections ("To cook", "Good for parties", "Quick", "Healthy", "Italian"); starter collections "To cook" and "Favorites"; optional "Add to collection" beside Save or in the menu, never replacing Save's confirmation; multiple membership; membership not copies; owned and saved organize the same way; the data model leaves room for a rule. Personal library works without a feed | in flight (built, awaiting publish) | R, OD, L06, M6 |
| Keep this version | An option on a saved recipe, shown on the page ("Keeping v3 · Follow latest version"); lasts across visits; never overrides access. If the author unpublishes or deletes the recipe, the saver keeps a read-only copy of the version they saved, marked as no longer shared by the author, and cannot re-share it (section 7). Private notes on saved recipes | in flight (built, awaiting publish) | R, DS, L11, OD |
| Pins | Distinct from "To cook": a pin may be intent or a frequently cooked recipe | next | R |
| Search quality | Relevance across every version, explained matches with highlighting (M19, L02), exact useful matches before popularity, filters kept, recoverable empty states, non-Latin slugs fixed; opening a result at its matched version comes with P2 global search | in flight (built, awaiting publish) | R, PA, M8, OD |
| Library growth | Pagination; bulk collection and tag actions as libraries grow; compact list view (L01); Journal-derived views (L04); kept queries and scroll (L05); overflow actions (L07). Built 11 Nov 2026: pagination (Show more on the Cookbook, Discover, Search, tag pages, profiles, the Journal and the Friends feed, whose 50-item cap is gone), a sitemap and L05's kept queries and scroll (Back and a reload keep the filters, the pages shown and the scroll); L05's recent queries and recipes and next/previous are not. Still next: bulk actions, L01, L04, L07 | next | R, DD |
| Print | Readable single-recipe print with version, scale and source (X01); print neither clips nor loses notes or groups | in flight (built, awaiting publish; the Print menu row lands with the recipe's ⋯ menu) | R, CM |
| Export and archive | Human-readable export and a structured archive with supported versions, provenance, photos, groups, organization; selected or whole library (X02, X03); round-trip fixture proves fidelity; export stays available whatever the payment status. Built: Settings "Your data" downloads the whole library as a JSON archive (`ForkExport`, `src/lib/export/archive.ts`, `format`/`version` keyed) or one Markdown document; the recipe's ⋯ menu exports one recipe for its owner; every version, provenance, audience, tags, groups, collections, saves (by reference) and the Journal; no gate of any kind; the round trip is proved against the database (`src/lib/server/export.db.test.ts`). Limitations: photos are linked by URL, not bundled; no multi-select or per-collection export yet; no import, so fidelity is proved by parse-and-compare rather than re-import | in flight (built, awaiting publish) | R, CM, M16 |
| Public recipe metadata | Verify public previews; add Recipe structured data for public recipes | in flight (built, awaiting publish; previews verified by hand on the live site after publish) | M2 |
| Photo field redesign | The photo itself with two paper pills (Replace, Remove), or a compact row with an Add photo pill when empty; Remove undoable until save ("Photo removed · Undo"); built as option 7C on 11 Nov with the shared `.pill-btn`, which ends the two text-button styles | in flight (built, awaiting publish) | R (9 Nov evening), OD |
| Feed card title | Drop the "Shakshuka · v1" source line; the entry title links to the recipe at the cooked version | shipped | R (9 Nov evening), OD |
| Editor composition | Title and metadata left, bounded photo right, ingredients and method below (E01); optional fields collapse and show when filled (E02); the Zed-inspired refinement pass | next | DD, Z |

### P2: Cook, record and connect

**Goal:** dependable cooking, a Journal people use after an ordinary dinner, and a friends loop that leads to another real cook. M to L slices.

**Gates (distinct):** _Pilot gate:_ a real cook, then a friend's source visit or save, then a later cook works with correct audiences, report, block and removal, and no critical data or quantity failures. _Full phase gate:_ real-device cooking, offline reopening, timer recovery and version and scale recall pass (R).

Pilot lane:

| Item | What it is | Status | Source |
| --- | --- | --- | --- |
| Journal | Dish and date required; recipe and version, servings, external link or improvised, photo, caption, private note for next time and audience optional; cooked date distinct from posting date; "Friends see the dish and your photo, not the recipe"; never requires writing a recipe | shipped | DS, R, M17 |
| Add to Journal | From the end of Cook and from the recipe page, prefilled with recipe, version, servings and today | shipped | DS |
| Friends | Requests, invite, profile relation control, feed newest first with log entries and recipe events; the empty state leads with a pending request, then Invite | shipped | DS, M4 |
| Like and Save on the feed | Like with a visible count ("Like · 3"); Save when a shareable recipe is attached; no public scores | shipped | DS, OD |
| Unfriend, block, mute, report | Rules in section 7 | shipped | R, DS |
| Discover | Viewer-scoped list, lead card, Recent changes, filters | shipped | DS |
| Interim owner-data export | A readable export for pilot participants before the full archive. Met by Export and archive's Markdown download (Settings, "Your data"); same limitations | in flight (built, awaiting publish) | R, SL |
| Rights and moderation operations | Rights-report route needing no signup, monitored inbox, named moderator and backup, small case record, response and appeal path, community expectations | next (pilot prerequisite) | R, SL, US and Canada notes |
| Abuse basics | Basic rate limits; photo location metadata stripped before serving; no contact harvesting; no exposed emails | next (pilot prerequisite; not verified in code) | R, SL |
| In-app notifications | Useful reply, request and follow notifications with mute controls | next (pilot slice) | R, SL |
| Email notifications | Opt-in, alongside in-app; digests only by choice | later | R (9 Nov evening), SL |
| Comments | Simple cook comments once the feed has real use, with comment moderation (report a comment, delete on your own entry) | later | R, DS, M3 |
| Onboarding | A new account's first ten minutes (see section 9) | later | R (9 Nov evening), S2 |
| Audience-change side effects | What happens to saves, forks and log entries when a recipe becomes more private; revisit (saves on unpublish or delete are settled in section 7) | later | R (9 Nov evening), OD |
| Profile redesign | Friend request control (shipped), friends-level recipes, log entries; identity and settings without empty-metric dashboards | later | R (9 Nov evening), S1 |
| Synced drafts | Drafts recovered across devices, after P1's on-device recovery | later | R, OD |
| Global search | One search covering own, friends' and Public recipes, with scopes (all friends' recipes, one person's, mine, saved) and a People scope (handle or name) with a friend-request control; matches every version, and a result that matched on an earlier version says which version matched and opens the recipe at that version; opens in place on the current page, phone and desktop, one behaviour built once; ingredient text moves to an indexed column covering every version, not only current content, as recipe count grows, since today each search reads the whole versions table | later | R (9 to 10 Nov), OD |
| Profile discovery | A small "Cooks" strip on Discover ranked by public recipes and saves; personalised suggestions stay P5 | later | R (9 Nov evening), OD |
| Journal export | Journal and log-entry data export | later | R (9 Nov evening), X02 |
| Easy import | Text documents, Markdown files, other sites where possible, through one review path (I01 to I03, I07, E04 repair, E09, Q01, Q07); bounded safe URL fetching is part of the feature; paste-first editing stays as it is | later | R (9 Nov evening), DD |
| First migration importer | One competitor format chosen from pilot libraries (Paprika is a sensible candidate, not a proven market-share leader); preview counts, duplicates and per-record failures; never overwrite silently; original archive untouched (I06) | later | R, CM, M15, OD |
| Editor preview | See the recipe as its page will show it before saving; the preview matches saved rendering and is not a second place to edit | later | R (9 Nov evening), OD |
| Private ratings | Personal ratings may follow; no public scores in the pilot | later | R, Q04 |

Cookbook lane:

| Item | What it is | Status | Source |
| --- | --- | --- | --- |
| Mobile cooking refinement | Obvious blockers earlier; keep overview and place; zoom; tick affordance compared side by side on real cooking tasks (16px marigold circle with 44px phone hit stays until then) | later | R, DS, M18, M20, C10 |
| Scaler workstream | S01 to S08: one field for `50%`, `1/2`, `0.5` plus a slider, scale to an ingredient on hand, persistent scaled state, faithful ranges | later | DD |
| Units and temperature | Reversible display conversion; exact same-dimension math first; density estimates need ingredient and preparation context; carefully sourced gram coverage | later | R, CM, M12 |
| Timers | Several named timers with persisted deadlines (C01 to C05); honest about browser alarm limits | later | R, DD, M11 |
| Cooking session | Version, scale, ticks and position kept when switching (C06); columns and optional focus (C08); type size and keep-awake (C11) | later | DD |
| Offline saved reading | Explicitly saved versions readable offline with visible version and freshness and safe sign-out (A06); offline editing waits for demonstrated need | later | R, AQ |

### P3: Support the household routine

**Goal:** Fork earns use between cooking sessions. M to L; uses P1 content and P2 quantities and logs.

**Gate:** plan several meals, change a serving count, shop, cook and reschedule leftovers without duplicated or stale unexplained quantities; a second household member can contribute; revocation works (R).

| Item | What it is | Status | Source |
| --- | --- | --- | --- |
| Grocery list | Selected recipes and scales, manual items, safe combining, source links, aisle grouping, share and export; ambiguous items stay separate; optional and alternative lines never add both (G01 to G06, G08) | later | R, CM, DD |
| Meal queue and calendar | Flexible dates, manual meals and leftovers, feeding groceries, calendar export; no optimizer first (M01 to M05, Q03) | later | R, DD |
| Party mode | Several recipes in one cooking session, each keeping version, scale, progress and position; quick switching first; a shared timer overview once timers exist; works with ordinary recipes; one cook, not multi-user (C07, M05) | later | R (9 Nov), DD |
| Household cookbook and lists | Owner, editor and viewer roles, invitations, revocation, attribution; personal notes stay private (A02); household collections (M6) | later | R, AQ |
| Optional ingredients | Choose optional and alternative ingredients before shopping | later | R, CM |
| Pantry experiment | "What can I make with these ingredients?": ingredients on hand, missing items shown; stock depletion, expiry and pricing deferred (G07, M21) | later | R, AQ |
| Richer diary | Deeper Journal exploration and step photos (E10 depth P3 to P4) | later | R |

### P4: Develop better recipes

**Goal:** deeper recipe development for frequent adapters and demanding cooks. M to L; needs stable units, pins and permissions.

**Gate:** reproduce an earlier compound recipe, intentionally update a child version and see the diff; shared suggestions cannot overwrite newer edits; advanced calculations disclose their assumptions (R).

| Item | What it is | Status | Source |
| --- | --- | --- | --- |
| Subrecipes | Version-pinned components with explicit batch use, update prompts and intentional shopping expansion (A01, M22); constraints in section 7 | later | R, CM, AQ |
| Grouped variations | Group adaptations so variants stay usable, named and findable, without history jargon | later | R, CM |
| Suggested changes | Richer comparison and reviewed "Suggest a change" with permission and stale-write checks; comments on version review; no real-time co-editing or automatic merge (M1 from P4 to P5, M3) | later | R, AQ |
| Batch yields and baker's percentages | Total flour and water including preferments; user ingredient weights as explicit overrides that never reinterpret old attempts (M13) | later | R, AQ |
| Nutrition, gated | Reliable identity, weights and servings first; missing inputs and sources shown; preference labels are not allergy certification (A05, Q05) | later | R, AQ |
| Ingredient quantities in steps | Inline quantities ("Warm the milk (240 ml)") with Cooklang-style ingredient markup and a settings toggle; explicit references, totals agree, divided ingredients never double-counted (C09, Q02) | later | R, DS, OD |
| Cooklang import and export | A supported subset with an explicit loss report, original kept; never invent ingredient and step links; earlier if the pilot needs it | later | R, M15 |
| Graphical cooking view | Optional power-user view of ingredients feeding steps, components flowing into later steps and parallel branches; prototype on Cooklang-backed recipes; a timed layout only when durations are meaningful (M23) | later | R, AQ |
| Lineage graph | Prototype a recipe ancestry view; it must solve a navigation problem (M5) | later | R |
| Fuzzy diff matching | Bounded comparison quality; distinct ingredients never conflated; exact comparison stays as fallback (M7) | later | R |
| Step photos and links | Optional step photos, related recipes, video links (E10) | later | DD |

### P5: Assistance and wider reach

**Goal:** separate, evaluated bets. Each beats its non-AI or current-platform baseline with controlled costs and failures.

**Gate:** each capability beats its baseline; broad discovery follows independent social use and scalable moderation; native work answers measured platform limits (R).

| Item | What it is | Status | Source |
| --- | --- | --- | --- |
| OCR and capture assistance | Evaluated OCR (optical character recognition), photo, PDF and social capture after deterministic extraction; formats pilot cooks actually bring (I04, I05); eligible after P1 | later | R, CM |
| AI in your cookbook | Ranked list and release evidence in section 7 | later | R, AQ |
| Substitutions | Recipe-aware substitutions from an ingredient, with reviewable quantity changes and expected effects (C12, A04) | later | R (Paprika follow-up), DD |
| Translation, read-aloud, hands-free | Experiments; original wording kept, correction allowed, ordinary controls kept (C13) | later | R |
| Public ratings and algorithmic discovery | Gated on independent demand, an adequate catalog and moderation capacity; personalised friend suggestions | later | R, M4 |
| Creator tools | Creator feeds and read-only links (A03); paid publishing tools, embeds, analytics as commercial experiments; marketplace revenue share later still | later | R, DD |
| Native apps | iOS and Android decision on measured capture, offline and alarm friction and commercial value, not a user count or AI prerequisite; web and PWA (progressive web app) improvements first (M14) | later | R |
| Desktop app | Mac first; likely a PWA or thin wrapper over the web app; decided with the native call | later | R (9 Nov evening), OD |
| Companion surfaces | Interactive widgets, Apple Watch, Alexa and Echo Show, shortcuts and share-sheet capture (A07), on stable workflows with the same permissions and session state | later | R (Paprika follow-up), DD |

### Not yet phased

| Item | What it is | Status | Source |
| --- | --- | --- | --- |
| Dark mode and reading preferences | After core readability; contrast-tested tokens and stable reflow; cooking comfort over themes. Direction (OD, 11 Nov 2026): swap the paper and espresso relationship for surfaces and type, keep the marigold period constant, and tune clay links, muted text and dividers separately on dark surfaces; the L8 (dark) and L7 (light) marks are the pair | later (todo, direction set) | R, DD, OD |
| Link sharing of private recipes | Later | later | DS |
| Duplicate your own recipe | Likely "Start from an existing recipe" on New recipe, not a Fork button (E11) | later | DS |
| Help in the editor | A Help menu beside Section heading when the tips grow | later | DS |
| Public log entries | After consent, visibility and moderation work | later | DS, SL |
| Public recipe rating | A later recipe feature, not a Journal one | later | DS |
| Creator role and partnerships | Pilot provenance first; small free permission partnerships after the pilot (section 7) | later | R |
| Rule-based collections | Collections that fill themselves ("every recipe Max adds"), unifying saved searches (L10) | later | R, OD |
| Generic AI recipe generation | Deferred beyond assistance: weak early differentiation, harder verification, ongoing cost | later | R |

## 5. The 87-entry cookbook-app inventory

All 87 entries from the deep dive are retained scope (Spencer, 9 Nov 2026), refined, combined and sequenced as each workstream is built; trimming needs a recorded reason. [INVENTORY.md](INVENTORY.md) lists every ID with its phase and status. Counts: shipped 2, P0 1, P1 14, P2 28, P3 16, P4 6, P5 7, not yet phased 13. Retaining the scope moves nothing into an earlier phase, and the pilot does not wait for all 87.

Named commitments, selected rather than candidate:

- Paprika-like editor composition with Fork's photo on the right (E01).
- One scaler field accepting `50%`, `1/2` and `0.5`, combined with a slider (S01, S02).
- Inline timers connected to a separate multi-recipe overview with persistent per-session state (C01 to C03).
- From the Paprika homepage follow-up (Spencer, 9 Nov): recipe-aware substitutions (C12, A04), advanced multi-field search with saved rules through rule-based collections (L03, L10), and named companion surfaces: widgets, Apple Watch, Alexa and Echo Show (A07). Paprika's implementation and platforms are references, not proof of compatibility; providers, devices and background support are validated when each is built.

## 6. Design backlog

Items waiting on Spencer's eye. Rules live in [DESIGN.md](../../DESIGN.md); the direction is in [DESIGN-DIRECTION.md](DESIGN-DIRECTION.md).

| Item | What is open | Phase | Source |
| --- | --- | --- | --- |
| Fork icon and logo | Logo decided 11 November 2026: the F. mark (G4, C3) is the logo, favicon and app icon, and the "Fork." wordmark is retired from the bar; see DESIGN.md, Logo. 1A (three tines on a round shoulder) remains the stats row's fork icon; open there: a deeper head and a handle widening toward its end, upright or on the diagonal | P1 | R, OD |
| Cook-mode distinction | Closed 11 November 2026: Spencer's direction from the Call 3 options is built (paper cooking header, bottom Ingredients \| Method switch, Finish cooking); see DESIGN.md, Cooking | done | R, OD |
| Serving scaler redesign | The control does not feel like Fork; a design round, with the S01 to S08 behaviour | P2 | R |
| Tick affordance | Revisit candidate (M20) | P2 | DS |
| Three-voice type stack | Eyebrow, Bitter heading and sans rows: keep where each adds information | revisit | DS, Z |
| Brassier yellow | Explore a slightly less saturated yellow within the identity through full-screen comparisons; no replacement token chosen | revisit | S1, S2 |
| Friends filter chip | The bordered marigold-tint "Friends' recipes" chip has no DESIGN row (moving into the tag row in flight) | P1 | code-health audit |
| Cook phone title | Closed 11 November 2026: the cooking header sets the title on two lines at most | done | DS |
| Current-step marker | Optional marker or focused view during cooking refinement; the MVP has none | P2 | DD |

## 7. Product rules that hold across phases

**Recipe, cook and revision stay separate.** The recipe as written, what happened on one cook, and a lasting revision are three things. A log entry records the version and scale when available; an external-source or improvised cook is valid. A half batch with oat milk never rewrites the recipe. Surface the last relevant note before the next cook, then offer "Use these changes next time" as a reviewed new version or adaptation. Restore appends. Past content and the meaning of earlier attempts never change. A log entry's audience is distinct from the recipe's visibility and from any private note (R, AQ).

**Content fidelity.** Minimum fidelity is not more mandatory fields. Content supports title, description, ingredient and method groups, free-text lines where parsing is uncertain, source (author, URL, book, page), active, cook and total time with resting notes, servings separately from textual yield ("12 rolls", "500 ml sauce"), equipment and pan notes, storage and reheating notes, variations and optional ingredients. One notes field is a valid first home for niche details, preserved through import, editing, history, print and export (CM). Preserve ranges and free text; never auto-split or rewrite a method into a simplified mode without review (R).

**Scaling and units.** Scale parsed quantities without changing saved content; keep ranges, fractions, "to taste", packages and qualifiers; show lines that could not scale; never multiply temperatures, times or pans. Conversion keeps the author's original, shows assumptions, separates mass from fluid ounces and unit systems, and declines uncertain densities. A user's location is not evidence of which "cup" a recipe meant. Switching °C and °F never creates a version (AQ, CM).

**Saves and access.** Save is one tap, "keep this", into the Cookbook's Saved shelf, never a question. A moving favourite follows the author's current recipe. When the saver loses access because a friendship ends (unfriend or block), a saved Friends-only recipe leaves their Cookbook and no copy is kept; Keep this version records the chosen version but grants no copying right. When an author unpublishes or deletes a recipe someone saved, the saver keeps a read-only copy of the version they saved, marked as no longer shared by the author, and cannot re-share it (OD, 11 Nov). Source recipe, source version and imported attribution are distinct records; a note saying "copied v3" is not enough. Tags describe the recipe and follow its visibility. Collections organize your cookbook; filters are transient views, never saved; "To cook" is intent (R, decided 9 Nov).

**Unfriend, block, mute** (decided 9 Nov): unfriend hides the other person's Friends-level recipes at once everywhere the access check runs; the save row stays so re-friending restores it. Forks the ex-friend made of your Friends-level recipe stay theirs but become private and cannot be widened; "friends of the fork owner" is never a path to your recipe. Their Journal keeps their dish name, photo and notes, but the recipe reference hides; no source text or photo survives through it. Block is unfriend plus no requests or interactions either way; existing likes and comments are hidden, not deleted; public content stays publicly reachable, and the interface says blocking restricts interaction, not public access. Mute hides their feed entries for the muter only. A privatised fork can return to Friends only once its author can see the parent again (DS build record).

**Subrecipes** (P4, before shipping): pin a child version, not only its recipe; start with explicit "× batch"; 200 g of a sauce needs a meaningful child yield, not "serves four"; a parent's pinned child never moves when the child changes; an intentional update creates a parent revision with a visible comparison; handle cycles, private or unavailable components, deletion, export inclusion and recursive shopping expansion; a public parent never discloses a private child; already-made stock can be excluded from today's groceries; links and totals agree across scaling, print and shopping (R, CM, AQ).

**Timers and offline truth.** Wake locks and browser timers can be suspended or denied; store deadlines and recompute elapsed time, but never market background web alarms as guaranteed. A component-local timeout is not a kitchen alarm. Offline saved reading is a separate deliverable from scheduled notifications or offline editing. Per-recipe timers mean, underneath, per cooking session, pinned version and individual timer; validate local navigation and reload recovery first; cross-device and shared household timers are later scopes (R, AQ, DD).

**AI reduces clerical work without taking authorship.** Priorities and release evidence (R, AQ):

| Priority | Assistance | Release evidence | Block or narrow when |
| --- | --- | --- | --- |
| 1 | OCR and import repair after deterministic extraction | Source and draft compared; quantities, temperatures, times, groups, steps preserved; ambiguity highlighted; total correction time beats manual or paste capture | Values change silently, omissions are hidden, or correction is no better than paste |
| 2 | Search within the user's cookbook and notes | Better than ordinary search on real failed queries; links to supporting recipes, versions, logs; no unsupported answer; permissions filtered before retrieval and rendering | Private content leaks, citations do not support the answer, or it is worse than lexical search |
| 3 | Formatting and inconsistency suggestions | Reviewable proposals; deterministic checks preferred; no invented missing ingredient |  |
| 4 | Adapt a chosen version to an explicit goal | Proposed diff, rationale and uncertainty; accept or reject before a new version; no autonomous rewrite, publication or purchase | It changes food-safety instructions, claims allergy safety, fabricates results or alters stored content |
| 5 | Summarize the cook's own attempts | Every observation links to a real log; preference distinct from proof of cause | It invents preferences or causal conclusions |

Build a consented or rights-cleared evaluation corpus (difficult quantities, multilingual text, weak OCR, groups, alternatives, several recipes on a page, missing yields, malicious source instructions, unsupported inputs). Report per-field and critical errors, correction time, latency and cost per useful result, not one average; re-run on every model, prompt or provider change; keep a manual fallback and an off switch. Process only the content an action needs; explain provider and retention accurately; never send a whole private cookbook by default; URL fetch protection, authorization, schema validation, sanitization and cost limits stay deterministic server work; an importer cannot publish or read unrelated private records. Nutrition stays an estimate with missing data shown; ingredient classifiers cannot establish allergy safety; no generative canning or preservation advice in early adaptation. Human approval does not make an unsafe suggestion correct (R, AQ).

**Recipe supply and provenance.** Three lanes: the personal cookbook (own recipes, saved references, permitted imports, private adaptations; private by default, never auto-promoted; private storage is not a legal exemption), the source-linked cook (own note and photo plus the source link; publisher text and images are not redistributed), and the public catalog (original, permissioned or compatibly licensed; rights and credit recorded). Start with Spencer's tested recipes and willing contributors; 20 to 40 tested public starter recipes is an optional coverage target, not a launch gate. Prefer a missing photo to a falsely attributed one; label demos and keep invented cooks out of feeds and counts; "tested" means cooked. A provenance registry distinguishes source creator, importer, adapter, cook and photographer, with source URL or book and page, known author, permission evidence and licence version, covered assets, import date and lineage. Deduplicate only on known source URLs or identifiers, never on similar titles or ingredients; keep original URLs, removing only known tracking parameters. Importing never assigns authorship (R, SL). The catalog acceptance template and creator partnership terms are in [BUSINESS.md](BUSINESS.md) section 8.

**Plain language.** Use familiar verbs: Save, Fork, History, Compare changes, Restore as new version, Suggest a change. Git concepts underpin lineage without users learning commits or branches; diff power stays for those who want it (R, AQ, DS).

**Collaboration order.** Personal collections, then deliberate links, then a shared household cookbook, then version-specific notes and suggestions; reporting, blocking, moderation, posting limits and deletion handling come before public comments. Discoverability is not a right to reuse; attribution alone is not permission (AQ).

## 8. Quality gates and acceptance fixtures

| Gate | Required validation |
| --- | --- |
| Trust | No known reproducible loss of saved work or failed-save input, accidental publication or cross-account exposure. Covers feed, comment, photo and direct-URL permissions, audience changes, blocks, upload failure, conflicts and account changes. Backup restore reapplies restrictions. Until P1 drafts land, losing unsaved text on reload, tab close or crash is an accepted limitation |
| Accessibility | Target WCAG (Web Content Accessibility Guidelines) 2.2 AA: keyboard and screen-reader journeys, meaningful headings, visible unobscured focus, non-drag alternatives, reduced motion, 200% zoom, narrow reflow. Automated checks supplement manual use; not a conformance claim |
| Kitchen ergonomics | A real meal on iOS Safari, Android Chrome and a tablet: counter-distance text, long recipes, accidental ticks, switching recipes, phone locking, denied permissions. 44px main cooking targets (a product choice; AA starts at 24px with exceptions); an obvious undo for accidental ticks; no unsafe phone use near heat or water |
| Performance | Establish a baseline, then good field Core Web Vitals at the 75th percentile, mobile and desktop separately: LCP (largest contentful paint) at most 2.5s, INP (interaction to next paint) at most 200ms, CLS (cumulative layout shift) at most 0.1. Lab numbers labelled as lab |
| Culinary correctness | Ranges, fractions, packages, divided ingredients, metric, US and imperial, mass versus fluid ounces, missing yield, unparsed lines. Never scale temperatures, times or pans mechanically |
| Task completion | Create or import, organize, retrieve, scale, cook, note, revise, compare, export, with 100 to 500 varied recipes. A first 4-of-5 unassisted qualitative gate exposes friction; report raw counts, never statistical certainty |

Also measured, never by collecting private recipe text: save reliability (durable saves over attempts, recovered drafts counted separately; upload, permission and conflict failures), known-item retrieval by title, ingredient, tag, spelling variant and language (popular public recipes never bury an exact personal match), and a stated browser and device support matrix. A zero count in tests does not prove absence of bugs (AQ).

**Acceptance library** (R, CM): a simple weeknight meal; dough plus filling; a sauce yielding 500 ml; an overnight fermentation; divided butter; "2 × 400 g cans"; "2-3 cloves"; "salt to taste"; optional garnish; alternatives; Unicode fractions and decimal commas; non-Latin tags; a photo-only family card; a page or URL containing two recipes; an imported book recipe with attribution; a linked subrecipe with a private owner. Schema.org allows sectioned instructions and textual yield, so a flat list plus numeric servings is not a safe assumption. The competitor fidelity fixtures are in [COMPETITIVE.md](COMPETITIVE.md) section 4.

**Migration rules** (CM): preview counts and fields; preserve attribution; handle duplicates explicitly; leave the original archive intact; start with a small sample; show per-recipe failures with retry; never present a partial import as a successful recipe; importing into a separate collection is a reversible choice.

**URL import** is gated on bounded fetches, safe destinations including redirects, content-type, size and time limits, sanitization and a preview before saving, with paste and manual fallback (AQ).

## 9. Beyond features

The syntheses name five kinds of work beyond the feature list (S1, S2). They are recommendations; none is an approved decision.

| Work | What it means | Where it sits |
| --- | --- | --- |
| First week | Help someone bring in one existing recipe, cook it, record an adjustment and meet that adjustment later. Explain capabilities in context, not with a tour. Offer bounded personal migration help to early testers, then turn the learning into self-service rather than an ongoing manual dependency | P2 onboarding; migration help is an experiment, not scheduled |
| Recall at the next cook | Before a repeat cook, show prior changes, scale and next-time notes; after cooking, recording one observation is optional and quick; repeating the successful version is straightforward. Keep reliable facts automatically; never infer that someone cooked or succeeded because Cook was opened | P1 last and times cooked; P2 Journal recall; "Use these changes next time" in section 7 |
| Paid offer | One clear package tested with people who have experienced recurring value | [BUSINESS.md](BUSINESS.md); experiment, not scheduled |
| Acquisition | Connected cooking groups, a migration proposition, permission-based creator and instructor partnerships, useful opted-in public links | [BUSINESS.md](BUSINESS.md); after the pilot; experiment, not scheduled |
| Operations | Track support burden, correction effort, import failures, processing cost, cancellations and integration maintenance; self-service recovery and useful errors; bounded AI cost; no product that needs daily founder-written content to feel alive | Continuous; [BUSINESS.md](BUSINESS.md) section 7 |

Prioritize trust, capture, reading and cooking, and retrieval refinements before decorative polish; do not delay the pilot for a visual score (S1). Completing every item before testing would delay the most important evidence (S2).

## 10. Pilot path and validation milestones

**Pilot path:** trust, privacy and rights plus useful create, save, retrieve and cook (done in the MVP, P0 remainder next), then Journal and the Friends loop (shipped), then the remaining pilot prerequisites (interim export, rights and moderation operations, abuse basics, in-app notifications), then real use (R).

**Admission gate before inviting anyone** (SL, R): no known cross-user privacy leak; server-side permission checks on feed, comments, saves, photos and direct URLs; edits survive a failed save; no known critical quantity corruption; logging works on the cohort's phones; reporting and moderator removal work; no copied publisher content defaults to public; an interim way to take personal data out works. Test these as end-to-end paths. Comprehensive archives, migration, timers and planning need not be finished.

**The pilot** (an adjustable example, not a sample size): roughly four weeks with 8 to 15 willing friends, including relationships beyond Spencer. Friends bring two or three real recipes or links if convenient; one saved link or dinner log is enough. No compulsory weekly cooking, public photos or streaks. No invitations, creator outreach or campaigns have been sent; Spencer talks to friends first, then invites, with no date set (R, SL, OD).

| Period | Activity | Learn from actual behaviour |
| --- | --- | --- |
| Preparation | Spencer cooks several ordinary meals, demonstrates one real log entry, asks about phones, current tools and cooking frequency, rehearses privacy and report handling | Critical blockers and help needed; demo activity kept separate |
| Week 1 | Help each person save something useful and log a real meal; show audience controls; connect existing friends | Invited, accepted and first-use counts; visibility comprehension; help burden |
| Week 2 | Optional recipe exchange or shared theme; watch source, save and comment paths | Whether one person's cook leads to another's later cook; non-founder conversation; why people do not post |
| Week 3 | Stop planned founder reminders and posting prompts; keep necessary support | Voluntary returns, ordinary cookbook use, non-founder content and replies |
| Week 4 | Interview active and inactive friends separately; offer an optional real friend invitation | What survives without nudges, what still goes through group chat, repair or expand |

**What to count:** repeat cooks on distinct days, meaningful cookbook returns, notes reused, non-founder pairs, friend-inspired cooks, misunderstood audiences, minutes and help to first use, abandoned imports or logs, complaints and moderation load. Report "3 of 10", not percentages; readers who never post still get value; record founder help separately. For a roughly ten-person active group, several (for example four) independent repeat users in weeks 3 and 4 and at least two distinct friend-inspired cooking paths are discussion signals, not statistical proof. A privacy leak or quantity corruption stops the pilot until fixed. If people only post when prompted, repair the logging loop and repeat; do not buy traffic. Then test two or three independent connected clusters, each with its own organizer, comparing supported and self-serve onboarding (R, SL).

**Evidence milestones, in order** (S2, S1): useful without founder reminders; useful to independent groups; first actual paid customers; a repeatable acquisition route; sustained renewal and manageable costs. Four weeks shows initial behaviour, not annual renewal; no arbitrary calendar kill criterion is set. Judge optional reminders by whether they help an expressed cooking intention, not by clicks (S2). Recruit frequent repeat and adapting cooks as a first behaviour-based segment, including existing-app users and people with informal notes; bakers are not assumed to be the only market (S1). Measure version utility by meaningful edits, revisited versions, recoveries and successful adaptations, not autosaves; a missing log is not proof nobody cooked; stop expanding any feature that adds entry effort without saving later effort (AQ).

**Demonstration story** (R, CM, AQ): a friend posts a real cook with source credit, another saves it and cooks their version, and a useful note improves the next attempt; later, a pinned dough inside a pie, a grocery list and a printout (or a grandmother's dough recipe imported with its source, two attempts compared). Document transaction and concurrency invariants, migration choices, privacy tests, accessibility findings and before and after task results; keep shipped behaviour distinct from planned screenshots; keep a reproducible demo dataset and never expose real private recipes.

## 11. Engineering health

- [Code-health sweep, 10 Nov 2026](../audits/code_health_2026-11-10.md): last clean run 1689 unit tests, svelte-check 0 errors, lint clean, e2e 221 passed; top items include the menu CSS twin, about 19 hand-written CSS-rule extractors in tests, dead `BrowseSections`, raw `fail()` in auth routes, docs drift, and missing indexes behind list queries (several since fixed in git).
- [CSS complexity sweep, 10 Nov 2026](../audits/css_complexity_2026-11-10.md): about 250 removable lines, mostly declarations restating Tailwind preflight; the CSS simplification pass in flight follows it.
- Standing sweeps: the [`code-health`](../../.agents/skills/code-health/SKILL.md) skill runs monthly, after any build over about 1000 lines or more than two parallel slices, and before a production publish; one dated report goes under `docs/audits/`.
- Still owed after the MVP: remove the temporary `cream-palette` hook ignore once the MVP design settles (DS); the ingredient search index, covering every version and not only current content, since a result opens at its matched version (P2 global search).
- Candidate, not decided (OD, 11 Nov 2026): fold a page's view state (`?version=`, `?serves=`, `?cook=`, `?collection=`, `?q=`, `?tags=`, `?filter=`, `?page=`) into one encoded `?meta=` parameter "rather than having so many ? tags". Weigh against it: readable, hand-editable and shareable URLs, canonical and link-preview rules that strip individual keys, and progressive enhancement of the filter forms, which submit named fields.

## 12. Outside the target and rejected

| Item | Disposition | Reason |
| --- | --- | --- |
| Restaurant operations | Outside the current target | Procurement, invoices, staff, stock valuation, HACCP compliance and kitchen inventory need a separate professional discovery decision (R, AQ, CM) |
| Ads, automatic prep-time estimates, a stored "grams made" field | Rejected | Earlier explicit decisions; per-attempt outcomes and derived yield are different concepts (R) |
| Equal-weight Recipe, History and Forks tabs | Rejected | Reading dominates the recipe page (R, PA) |
| Universal semantic conversion, silent AI rewriting, "allergen-safe" guesses | Rejected implementations | Visible assumptions, reviewable changes and exact math instead (CM) |
| Real-time collaborative editing, automatic merge | Deferred | Conflict detection plus reviewed suggestions may meet the need (R, AQ) |
| Streaks, posting pressure, public star ratings before a healthy loop | Deferred | Counts of clicks or posts are not better meals (AQ, SL) |
| Full pantry inventory, expiry and automatic deduction | Later | Needs ongoing upkeep; validate real inventory habits first (CM) |

## 13. Earlier milestones M1 to M23

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

## 14. Decided

- 8 Nov 2026: Cookbook, Journal and Friends are the three defining pillars; an early friends pilot ships once trust, privacy, retrieval, cooking and rights handling are ready; cookbook quality continues in parallel (R).
- 8 Nov: MVP first; owner-confirmed permanent deletion in the MVP; failed-save retention, unsaved-change warnings and stale-write protection preserved (R).
- 9 Nov: verbs are Save and Fork; Fork is the identity, revisited only if users visibly struggle ("Fork (make your own)" as fallback) (DS).
- 9 Nov: recipe audiences Only me, Friends, Public, Only me default; log entries Only me or Friends (DS).
- 9 Nov: one access rule on every surface, Discover included (DS).
- 9 Nov: forks never widen access and start private; enforced on the server (DS, OD).
- 9 Nov: navigation is Cookbook, Journal, Friends and Discover; signed out `/` is Discover, signed in Cookbook; Discover first in the bar (DS, git).
- 9 Nov: no Comment in the first release; Like shows its count; cooking and engagement both matter (DS).
- 9 Nov: Add to Journal at the end of Cook and on the recipe page, prefilled; Cook pinned to the version in the URL (DS).
- 9 Nov: the 16px marigold tick circle with 44px phone hit stays for the MVP; M20 remains a P2 revisit (DS).
- 9 Nov: Discover's lead card is most saved in the last 7 days, newest as fallback (DS).
- 9 Nov: inline ingredient quantities in steps move to P4 with Cooklang-style markup and a settings toggle (DS, OD).
- 9 Nov: Save is a moving favourite; starter collections "To cook" and "Favorites" cover want-to-try and keeper without a separate Favorite system; collections v1 manual, rule-based later; Keep this version is a later option on a saved recipe (R, OD).
- 9 Nov: re-phasing: drafts, Trash, photo access, settings, measurement preference and last and times cooked to P1; onboarding, audience side effects, profile redesign, global search, email notifications, Journal export, easy import and comment moderation to P2 (R).
- 9 Nov: unfriend, block and mute rules as in section 7 (R).
- 9 Nov: profile discovery (People scope and a "Cooks" strip) is P2; personalised suggestions P5 (R, OD).
- 9 Nov: a desktop app is P5 with the native decision (R, OD).
- 9 Nov: editor preview is P2; feed card title links to the cooked version as P1 polish (R, OD).
- 9 Nov: hover palette, text-button underline, dropdown background, fork icon and logo, cook-mode distinction and Journal icon are P1 design backlog; the serving scaler redesign is P2 design backlog; the photo field with pill overlays is a P1 build item, soon (R, OD).
- 9 Nov: all 87 inventory entries retained; three selected interaction choices; Paprika follow-up items named; pause broad discovery until most scope is built and used (R, DD).
- 9 Nov: the Zed-inspired refinement is accepted for the next design implementation pass (R).
- 9 Nov: the editor's Section heading is a direct toolbar button, replacing the Insert disclosure (DS, git).
- 10 Nov: required fields are marked "Required"; optional ones are not (OD, git).
- 10 Nov: hovers: grey text may turn ink, clay darkens to Clay Deep, ink turns clay; text buttons change colour only (OD, git).
- 10 to 11 Nov: search covers own, friends' and Public recipes; search opening in place is P2 with global search; ingredient search needs an indexed column when recipe count grows, P2 (OD, R).
- 10 Nov: the intended business is a sustainable solo operation, not venture scale (OD, S1, S2).
- 11 Nov: the MVP is published to production.
- 11 Nov: search matches every version; a result that matched on an earlier version says which version matched and opens the recipe at that version, P2 with global search (OD: "search all history; we want users to be able to find previous versions of that recipe but we also need to make sure that when they click on that recipe the version they clicked on is what opens").
- 11 Nov: search in place works on phone and desktop with one behaviour, P2 with global search (OD: "everywhere built once").
- 11 Nov: durable drafts are saved on the device in P1; synced drafts are P2, beside the profile and settings work (OD: "saved on device for P1 and synced later").
- 11 Nov: deleted recipes are recoverable from Trash for 30 days, P1 (OD: "30 days in trash is fine").
- 11 Nov: when an author unpublishes or deletes a saved recipe, the saver keeps a read-only copy of the version they saved, marked as no longer shared by the author, and cannot re-share it (OD: "yes keep what you saved").
- 11 Nov: P1 design calls: fork icon 1A for now, still a redesign candidate; Journal is one spiral notepad (2B); menus are paper with a 1px Ink 2 edge, the band on hover and no shadow (4A softened); hovers are one step of colour, text buttons and arrow links also underline, an action inside a sentence is underlined at rest, one 1px underline 3px below the words (5A with 6B) (OD, git).
- 11 Nov: all importers are P2; the first competitor migration importer moves from P1 to join paste, URL and file import (OD: "Move all importers to P2").
- 11 Nov: the first paid offer is one annual plan, no tiers at first; price and entitlements are decided later (OD: "Shape is one annual plan sure. Details decide later.").
- 11 Nov: household or power packaging and the first native platform are deferred, listed under section 15 (OD: "decide later").
- 11 Nov: Spencer talks to friends first, then sends the first invitations; no date; the admission gate stands as written (OD: "will talk to friends then yes").
- 11 Nov: Fork is run by Spencer personally while it is free; an entity is formed before the first payment is taken (OD: "fine on running it while it's free and incorporate before taking payment").
- 11 Nov: unfriending or blocking removes a saved Friends-only recipe from the saver's Cookbook with no copy kept; the keep-your-copy rule applies only when the author unpublishes or deletes (OD: "first is fine for saver friend rule").
- 11 Nov: the working assumption is a US corporation (not an LLC), formed before the first payment; confirmed with a cross-border accountant before forming, since Spencer is tax resident in both the US and Canada (OD: "will assume that and can come back to accountant later").

## 15. Open questions for Spencer

1. **Price of the annual plan.** US$24 and US$36 (R, AQ); test US$36 rather than treating US$24 as a ceiling, with US$48 as a sensitivity case (S2). Nothing is approved.

**To confirm with a professional**

- Entity country and form (assumed US corporation), which also decide the payment account country, fee schedule and which US and Canadian copyright processes apply (R, SL, legal notes; [BUSINESS.md](BUSINESS.md) section 8). Questions for a cross-border accountant: which country the treaty tie-breaker assigns; which entity avoids double taxation and whether a US LLC is safe; the annual filing cost of each option; whether where the work is physically done changes the answer; whether the choice can wait until just before the first payment.

**Deferred decisions** (OD, 11 Nov: "decide later"):

- Household versus power packaging (R).
- The first native platform, if warranted (R).

## 16. Dropped as superseded

Each line: the old text, what replaced it, and the source of the replacement.

1. "Verbs 'Save to cookbook' and 'Make my version'" (R) → "Save" and "Fork" (DS, 9 Nov).
2. "Cook-event comments enter the early P2 pilot" (R) → no Comment in the first release; comments once the feed has real use (DS, 9 Nov).
3. "Real cooking matters more than engagement counts" (R) → both matter; likes show their count (DS, 9 Nov).
4. "Private-first recipes, public on explicit publication" with binary visibility (R, PA) → three audiences Only me, Friends, Public, with one access rule (DS, 9 Nov; shipped in 0008).
5. "Cookbook / Journal / Friends is a task model to test, not a prescribed final tab bar" (R) → adopted as navigation plus Discover (DS, 9 Nov).
6. "'Made it' placement beside Cook is a design call" (R, PA) → Add to Journal at the end of Cook and on the recipe page (DS, 9 Nov).
7. "Durable drafts and autosave: post-MVP nice-to-have; unscheduled" (R, 8 Nov) → P1 (R backlog adjustments, 9 Nov evening).
8. "Trash and deleted-recipe restore: post-MVP nice-to-have; unscheduled" (R) → P1 (R, 9 Nov evening).
9. "Ingredient quantities beside steps: Build P2" (R) → P4 with Cooklang-style markup and a settings toggle (DS, R reconciliation, 9 Nov).
10. "Whole-recipe paste, URL, text/Markdown files: Build P1" (R) → easy import P2; paste-first editor stays (R, 9 Nov evening).
11. "Optional Insert toolbar" and "a collapsible Insert toolbar" (R) → a direct Section heading button beside each box's label (DS, 9 Nov; git 2692114).
12. "Search current owned/pinned content by default" as the search scope (R) → global search over own, friends' and Public recipes with scopes, P2 (R 9 Nov evening, OD 10 to 11 Nov). History search settled 11 Nov (section 14).
13. "Profile page ... 'Owed by the builds'" (R) → profile redesign P2 (R, 9 Nov evening); the relation control shipped (DS build record).
14. "Version-pinned save stays a P1 item with its own control" (R reconciliation) → "Keep this version" as an option on a saved recipe, shown on the page (R "Save version", 9 Nov late).
15. "Lead card = newest" (pack recommendation in DS) → most saved in the last 7 days (DS, Spencer's override).
16. "Profiles/approved following" and "appreciation", "kudos" (R, SL) → friendships with requests, and "Like" (DS, 9 Nov).
17. "Cookbook / Journal / Community" pillar naming (SL) → Friends (DS).
18. "New recipes default public; forks inherit source visibility" as current state (PA, R) → Only me default, forks start private and never widen (DS; shipped).
19. "Revisit durable drafts if actual use involves long authoring sessions" (R) → drafts scheduled in P1 (R, 9 Nov evening).
20. AQ's sequencing "follows/feed only after recurring sharing" and CM's "Public feed ... Later" → social is a defining pillar with an early pilot (R, 8 Nov: "its older social sequencing is superseded here").
21. AQ's base release gate item 2 (durable draft recovery before growth, social or AI) → MVP-first decision: drafts are P1, not a pilot gate (R, 8 Nov and 9 Nov evening).
22. "Tick affordance: side-by-side evaluation in P2" as the near-term plan (R) → shipped 16px circle stays for the MVP, revisit in P2 (DS, 9 Nov).
23. "Homepage copy and order check" as a P0 release check (PA, R: "Recipes, under version control." and full diff before Recent on the live homepage) → removed; `/` became Discover or Cookbook on 9 Nov (removed with Spencer's approval, 11 Nov 2026).
24. "You cooked this on Sun 8 Nov · Add to Journal" as the personal line (DS) → the line shows the last cooked date only; Add to Journal is a pill in the action row (Spencer, 9 Nov: "Add to journal should also be an action in the button set on the recipe page"; git f80cc60, 754e0c9) (removed with Spencer's approval, 11 Nov 2026).
25. The numeric quality ambition from S1 and S2 → quality stated as observed behaviour in DESIGN-DIRECTION.md (removed with Spencer's approval, 11 Nov 2026).
26. The October launch deadline and weekly-logger threshold (R, AQ) → removed; the sources called them speculative historical numbers (removed with Spencer's approval, 11 Nov 2026).
27. The 8 Nov evidence labels for the pre-MVP product state (R, PA) → section 2 states the shipped state; the audit stays as the research record (removed with Spencer's approval, 11 Nov 2026).
28. "First competitor migration importer" in P1 (R, CM) → all importers P2, the first migration importer with paste, URL and file import (OD, 11 Nov).
29. "A purchased core plus recurring services" as an option for the first paid offer (DD) → one annual plan, no tiers at first (OD, 11 Nov).

## 17. Proposed removals, awaiting Spencer's approval

None pending.

## Changelog

- 2026-11-11: created as the single current roadmap, folding in the 8 Nov roadmap report and its amendments, the deep dive, the Zed note, both 10 Nov syntheses and Spencer's 9 to 11 Nov decisions.
- 2026-11-11: applied the five approved removals (now §16 lines 23 to 27); §17 has none pending; open question 10 (quality ambition wording) deleted.
- 2026-11-11: recorded Spencer's answers to the open questions (§14, 11 Nov lines); importers to P2, synced drafts P2, Trash 30 days, saved copies kept, search opens the matched version; entity assumed a US corporation; §15 is now price, plus one item to confirm with a professional and deferred decisions; §16 lines 28 and 29.
- 2026-11-11: saved Friends-only recipes are removed, not copied, when a friendship ends.
