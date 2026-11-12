# Competitive analysis

Where Fork sits among recipe apps, what the market already gives every cook, and where Fork can be different. Prices were checked on 8 November 2026; hands-on tests ran on the Mac on 9 November 2026. Edited in place; changelog at the bottom.

Research record: [cookbook market](../research/2026-11-08-product-roadmap/cookbook_market.md), [Mac deep dive](../research/2026-11-09-cookbook-app-deep-dive/README.md) with notes on [Crouton](../research/2026-11-09-cookbook-app-deep-dive/notes/crouton.md), [Paprika](../research/2026-11-09-cookbook-app-deep-dive/notes/paprika.md) and [Recipe Keeper](../research/2026-11-09-cookbook-app-deep-dive/notes/recipe-keeper.md), and the [product roadmap report](../research/2026-11-08-product-roadmap/README.md).

## 1. Evidence labels

| Label | Meaning |
| --- | --- |
| **Tested** (T) | Directly exercised in the app, on a small synthetic library |
| **Visible** (V) | A control or menu was seen; its operation was not tested |
| **Documented** (D) | A vendor or project primary source describes it |
| **Inferred** | Fork's product judgment or proposed adaptation, not a claim about the competitor |
| **?** | Not verified in this research. Never read "?" or an empty cell as absent |

Capabilities can be paid or platform-specific; a free download does not mean a listed capability is free. Documentation breadth is not hands-on quality.

## 2. Market shape

- Basic cookbook software is inexpensive and feature-rich. Successful products converge on capture, search, collections, scaling, cooking views, grocery lists and planning; that convergence is strong evidence those jobs belong in Fork. Differentiation changes sequence and quality, not whether ordinary jobs matter (documented, inferred).
- Paprika 4 launched on 6 November 2026 on iOS, macOS, Android and Windows, adding cookbooks, advanced search and duplicate detection, with premium scanning, social import and family accounts. Older claims that these are missing, or that every platform needs a separate purchase, are obsolete (documented).
- Neither versioning nor cook logging is unique to Fork: Cooklang advertises Git workflows, and Mealie's merged subrecipe work (PR 4800, merged 4 November 2025) mentions an "I Made This" dialog and a timeline. Social cooking is not exclusive either: Samsung Food runs public and private communities with community recipe saving (documented).
- Fork's plausible distinction is the integrated experience: capture faithfully, cook comfortably, learn from an exact iteration, and be inspired by people one knows, without learning Git. This is a positioning hypothesis to prove with users, not a discovered monopoly (inferred).
- Positioning hypothesis: **"Your cookbook, improved every time you cook."** Supporting promise: save trusted recipes, cook comfortably, remember changes, keep the versions that worked. "GitHub for recipes" stays an engineering and portfolio explanation, never required user knowledge (inferred, CM).
- Generic AI recipe generation alone is not a credible moat (inferred).

## 3. Competitors

Prices are public observations on 8 November 2026 in USD unless stated; they vary by region, tax, promotion and platform, and features may sit in paid tiers.

| Product | Model and price | Documented strengths | Gaps or unknowns in this research | What Fork takes from it |
| --- | --- | --- | --- | --- |
| **Paprika 4** | Subscription: premium introductory US$14.99/year, US$9.99/year for previous owners; previous owners keep Standard free; new free tier limited to 50 recipes | Web capture, editing, cookbooks, advanced search with saved rules, duplicate finder, scaling and US/metric conversion, current step, ticks, timers, screen-on, offline, groceries, pantry, meal plans, menus, HTML and Paprika export, print; premium scanning, social capture, family sharing; Apple Intelligence substitutions; widgets, Watch, Alexa | Brand-new release, no independent quality check; introductory price | The value anchor. Faithful migration and a repeat-cooking benefit are essential, not "we also have grocery lists". Recipe-shaped editor, forgiving number entry, global timers, named companion surfaces (tested and documented) |
| **Recipe Keeper** | US iOS Pro US$19.99; other platforms purchased separately; the Mac app offered a one-time purchase | Web, social, photo and PDF capture with OCR, migration, collections and categories, name, ingredient and direction search, filters, scaling and conversion, ticks, offline, shopping by aisle, weekly and monthly planning, printable cookbooks | Reviews are anecdotes; old complaints not asserted as current | Existing libraries and family archives create switching costs: preserve organization and photos. Polished cookbook PDF as a later paid-value candidate. A negative design reference for parallel labels |
| **Crouton** | Crouton Plus US$24.99 one-time; Discover US$14.99/year or US$1.99/month; exact entitlement split and older purchases not resolved | Web, book and photo capture with OCR and AI import, step view with tappable ingredient quantities, scaling slider, ingredient-ratio scaling, multiple timers, meal plan, Reminders groceries, iCloud household sharing; Apple Design Award cooking view | Export, print and full offline behaviour not verified | The native cooking and OS-integration quality bar; browser reach helps mixed-device households but does not excuse a weaker Cook. Scale to an ingredient on hand |
| **Mela** | iOS and iPadOS one-time unlock US$6.99; Mac separate | Web preview and share extension, scan, categories, favourites, want-to-cook, focused cooking, multiple recipes and timers, print and PDF, a documented file format, shared iCloud library, Reminders and Calendar | Local storage documented; every offline workflow untested | Attractive reading alone has a low price ceiling: Fork must sell repeat cooking, iteration or collaboration. A warning about minimalism that hides core actions |
| **AnyList** | Complete US$9.99/year individual, US$14.99/year household | Strong shared groceries with combining, recipe capture, many-to-many collections, search, scaling, cooking view, planning and calendar | Offline and full archive fidelity unverified; feature checkmarks extracted from the browser are unreliable | Household shopping is a formidable retention habit; list export or integration lets cooks keep it |
| **Samsung Food** | Food+ US$59.99/year or US$6.99/month, seven-day trial; country variation; several features mobile-only | Saved and personal recipes, public and private communities, creator communities, planning, shopping, nutrition, paid AI and personalization | Cooking view, units, offline and export unverified | Higher AI pricing exists but proves nothing about Fork demand; avoid competing on diet coaching. Creator-led communities as a real channel pattern |
| **Mealie** | Open-source self-hosting; no official hosted price verified | URL, HTML and JSON import, migration from Paprika and Recipe Keeper, AI capture, cookbooks and tags, linked ingredients and steps, subrecipes with recursive shopping, shopping, plans, households | Merge evidence is not a cross-client quality test | Hosted ease, portability and humane history matter; subrecipes and logs are not vacant categories. Its forum threads supply concrete jobs (section 5) |
| **Tandoor** | Self-hosting documented; hosted price not reliably verified | Structured editor, JSON-LD and microdata import, many migration formats, full-text and trigram search, bulk tagging, scaling, shopping and planning, collaboration, native archive export | Some pages stale; cook, offline and timer detail unverified | Match useful library jobs without every power-user setting; document export fidelity explicitly |
| **Cooklang ecosystem** | Free tooling plus optional cloud; Cook Pro €12.99/month with CookBot; lower tiers not checked | Portable text files, sections, ingredients in steps, named timers, optional ingredients, subrecipes, shopping and menu files, Git workflows | The specification is not universal client support | Portability and version control already exist; Fork makes their cooking benefit accessible. Cooklang-style markup is Fork's later path for inline quantities and the graphical view. CookBot already edits recipe files with visible changes and undo, and a Meal Journal plugin keeps dated entries, so AI edits and cook logs are not unique claims; Fork does not compete for cooks who want local files in Git, and serves them through export ([Cooklang research](../research/2026-10-23-cooklang.md), 23 Oct 2026) |
| **meez** | Professional plans | Recipe books, scaling, subrecipes, costing, team prep, inventory, locations, integrations | Vendor claims, not Fork-user demand | Shows how much larger professional kitchen operations are; Fork does not inherit that surface |
| **NYT Cooking** | Not researched as a competitor |  | No price or feature check in this research | A design-quality reference (type roles, serving stepper, tap-to-cross ingredients); see [INSPIRATION.md](../design/INSPIRATION.md) |

**Pricing model observations.** The category is not subscription-only: Crouton separates one-time Plus from recurring Discover, Recipe Keeper's Mac app offered a one-time purchase, and Paprika 4 sells a subscription while existing owners keep Standard. A purchased core plus recurring services is a live option for Fork, not a settled choice; [BUSINESS.md](BUSINESS.md) holds the hypotheses.

**Commercial reading** (inferred, CM): _activation_ comes from paste and URL capture, mobile capture, a representative demo recipe, a clear first cookbook and a migration preview, measured by the first trustworthy saved recipe and first successful cook; _retention_ from predictable search and collections, dependable cooking, offline and print, attempt notes and version recall, and the grocery and plan routine; _acquisition_ from shareable readable recipe pages and collections, attractive print and export, credited variants and "what changed, what worked" examples; _revenue_ from convenience and advanced capability, never from gating recovery or export. Where Fork defers a familiar feature, the reason is stated: data dependencies (nutrition, subrecipes), reliability and permissions (offline, households), recurring cost (AI, social) or a different customer (restaurant procurement).

## 4. Table stakes and Fork's difference

**The baseline every serious cook expects**, in recommended order (CM): trust the editor (paste or type without losing content, groups, notes, source, yield, save status, conflicts, no publishing surprise); get an existing cooking life in (paste and URL capture, one migration importer); a useful personal cookbook (collections, saved and owned recipes, want-to-cook, recently cooked, title and ingredient search, filters, predictable sorting, without conflating a live favourite with a stable copy); cook successfully (two-pane desktop and coherent phone view, ingredients beside the method, progress, accurate servings and yield, units, simultaneous named timers, print, saved offline recipes; "it looked beautiful" is not a pass if the cook keeps scrolling for the butter); the surrounding routine (grocery list from selected scaled ingredients with provenance, then a light plan); and making the next cook better.

**Where Fork differs** (inferred, a hypothesis to test):

| Difference | What it is | Shipped today |
| --- | --- | --- |
| Version-aware memory | Every edit is a version with a note; any two compare; a cook remembers the exact version and scale; "Keep this version" and restore as a new version | Versions, compare, Cook pinned to a version, Journal prefilled with version and scale |
| Journal | A log entry needs only a dish and a date; private next-time notes come back at the next cook | Journal shipped; recall at the next cook is P1 and P2 work |
| Friends | A chronological feed of real cooks and recipe changes with clear audiences; save the source, cook, adapt | Shipped |

**Hands-on fidelity findings as acceptance fixtures** (tested, 9 Nov, a small synthetic library; particular behaviours, not comparative defect rates or proof Fork does better):

| Test | Observed | Fixture for Fork |
| --- | --- | --- |
| Paprika multiplier syntax | `50%`, `0.5` and `1/2` gave the same half batch; reopening normalized to `1/2` | One field accepts all three; keep the user's text while editing, normalize after (S01) |
| Crouton ingredient-based scale | 375 g flour against 250 g gave 1.5× | Scale to the amount on hand (S03) |
| Range at 2× | Crouton and Paprika gave `2-4 tbsp`; Recipe Keeper gave `2-2 tbsp` for `1-2 tbsp` | Test ranges explicitly; a plausible wrong quantity is worse than an honest unparsed line (S05) |
| Paprika free-text yield | `3 servings; makes 6 buns` became `6 servings; makes 6 buns` | Keep Serves and Makes separate (S06) |
| Groups into shopping | Paprika and Recipe Keeper both added Dough and Glaze as shopping items, though Paprika showed them as headings | One grouping model drives reading, shopping, print and nutrition (G01) |
| Crouton paragraph groups | A later Glaze was recognized and excluded; the first Dough stayed an ingredient | Show interpreted groups with a repair action before saving (E04); fixture-specific, not a claim that all Crouton groups fail |
| Paprika timers | Two timers stayed paused across navigation; clicking the same inline duration opened a new preview, not the renamed timer | Timer identity belongs to its cooking context; "another timer" is explicit (C03) |
| Recipe Keeper text import | Clean text filled servings, times, ingredients and method but shortened the title to "Lemon buns", losing the qualification | Capture preserves qualifications and source wording; cleanup is suggested, not applied silently (I02) |
| Recipe Keeper cooking and search | Clicking ingredients dimmed them; a direction was emphasized; searching `180°C` found it in the method | Reversible accessible progress (C10); search the working recipe, not just the title (L02) |

The commercial opportunity is faithful handling across the whole workflow plus accessible, version-aware cooking memory, not an exclusivity claim about history or logging (S1).

## 5. Public requests that show real jobs

Self-selected accounts from developer and self-hoster communities: evidence a job is real and support for inclusion, not population prevalence (documented).

| Job or friction | Evidence | Fork decision |
| --- | --- | --- |
| Repetitive US and metric conversion; separate temperature preference; cup ambiguity | Mealie discussion 3881 (2024, comments July to August 2026) | Reversible unit and temperature display in P2; dimensional conversion separate from density estimates |
| Ranges, not one exact quantity | Mealie 2989 (January 2024) | Preserve ranges, scale both bounds; "to taste" and unparsed text unchanged |
| Alternatives should not buy both | Mealie 3717 (June 2024, support into 2026) | Faithful author notes and optional lines now; structured alternatives when shopping needs them |
| Totals for mise en place, per-step allocations while reading | Tandoor 1325 (2022, now Done) | Keep both totals and step references; no double counting |
| Several timers and recipes at once | Mealie 1573 (2022), a Paprika migrant missing concurrent timers | Named simultaneous timers with recipe and step context |
| Variant clutter | Mealie 880 (2021, closed) | Group variants, each usable and findable |
| A shared component in several dishes | Mealie 1761 (2022; implemented later) | Version-pinned subrecipes after yield, scaling and access rules |
| Scaled fractions hard to measure | Recipe Keeper App Store review, June 2022 | Test readability of ⅓ and ½ and tiny portions, not only arithmetic |

Domain constraints: Schema.org Recipe allows text or structured ingredients, sectioned instructions and textual yield; Cooklang conventions separate fixed quantities and never scale timers or cookware; King Arthur's guidance on reducing recipes names pan size, bake time and dividing an egg; Tandoor documents that export formats differ in images and fields (documented).

## 6. Design references

Fork borrows discipline, not identity: Zed for typographic hierarchy, alignment and restrained accents; Lunch Money for calm dense tables and rule-based filters; NYT Cooking, Crouton and Paprika for cooking and editing craft. The full list, with what to look at in each, is [INSPIRATION.md](../design/INSPIRATION.md); the Zed findings are in [DESIGN-DIRECTION.md](DESIGN-DIRECTION.md).

## 7. What is not known

- No reliable market shares, paying-subscriber counts or category-wide willingness to pay; do not infer them from ratings, badges or GitHub stars.
- No paid competitor subscriptions or trials were bought; premium flows, mobile-only surfaces, deeper settings and integrations were not exercised. The inventory is comprehensive for what was researched, not exhaustive.
- An exhaustive quality comparison is not complete. Remaining coverage by area: editor keyboard, undo, multiline paste and section repair across views; scaling invalid inputs, limits, decimal commas, packages, conversion accuracy, independent recipe scales; timer expiry, sleep and relaunch, repeated cooks, accessible announcements; 100 to 500 recipe libraries with multi-filter search, return position and bulk filing; difficult sites, OCR, multi-page capture and migration losses; real list additions, merging, undo, planned scales and leftovers; generated exports re-opened and round-tripped; invitations, revocation and permission behaviour; VoiceOver, large type, narrow layouts, touch and orientation; controlled offline recovery, paid workflows, sync and device integrations.
- The next bounded validation batch, in the research's numbering: (1) print or export each synthetic recipe and reimport; (2) structured site, awkward page and manual-capture fallback; (3) clean scan, two pages, columns, handwriting, difficult fractions; (4) group repair and a keyboard-only editor pass; (5) numeric and conversion edge cases; (6) two recipes, several timers, a repeated inline click, expiry and reopening; (7) quit and relaunch, lock and sleep, long backgrounding; (8) shopping additions, merges, checks and plan-to-list transfer; (9) larger-library search and bulk organization; (10) phone and tablet cooking and share capture; (11) offline edits, reconnection and a two-device conflict; (12) household invite and revoke, subscription access changes; (13) connected scale or probe, widgets and shortcuts; (14) Fork's own browser timer and offline acceptance suite. Tests 1, 4, 5 and 6 are the best next desktop checks; none authorizes purchases, sends, deletion or account changes.
- Fork's browser timers need their own evidence: persistent deadlines recover elapsed time but do not guarantee an audible alarm while the browser is suspended or closed.
- Research leftovers in the competitor apps: a "Fork review test, Lemon buns (not kitchen-tested)" recipe in each app, a second capture-test recipe in Recipe Keeper, two paused Paprika timers, and a text fixture in `/private/tmp`. No personal recipe was edited, nothing was bought, deleted or sent.

## Changelog

- 2026-11-11: created from the cookbook market note, the Mac deep dive, the roadmap report's competitor matrix and the 10 Nov syntheses.
- 2026-11-12: Cooklang row: CookBot and the Meal Journal mean AI edits and cook logs are not unique; Git-file users served through export (23 Oct Cooklang research).
