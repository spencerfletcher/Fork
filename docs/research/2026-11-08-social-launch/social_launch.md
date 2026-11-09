# Fork social launch: a friend-group pilot and trustworthy recipe supply

Research checked 8 November 2026. Scope: serious home cooks in the US and Canada, beginning with Spencer’s own friend group. User-approved direction: **Cookbook / Journal / Community**. Social ships after a minimum trustworthy cookbook and cook log; household administration, sophisticated planning, subrecipes and comprehensive import parity are not prerequisites. All cohort sizes, quantities, timelines and gates below are proposed operating hypotheses, not market benchmarks or commitments.

## What should the first social product and four-week friend pilot look like?

### Takeaway

Launch a small, recognizable circle of real cooks and make recording dinner easier than writing a recipe. The product hypothesis is that a friend’s actual cooking inspires another cook, while the journal and cookbook remain useful on quiet days.

### Cited Findings

- Strava supports activity-level Everyone/Followers/Only You audiences and per-activity overrides. This is evidence for separating an activity’s audience from account defaults, not proof that the same defaults suit Fork. [Activity privacy](https://support.strava.com/en-us/articles/15401987-how-do-my-activity-privacy-controls-work-on-strava)
- Strava documents both personalized and latest-activity feeds; its personal and club feeds are chronological. It also documents comments and configurable notifications. These are established social interaction patterns, not evidence of a retention uplift for cooking. [Feed ordering, 29 September 2026](https://support.strava.com/en-us/articles/15402105-how-does-strava-order-my-activity-feed), [Comments, 16 September 2026](https://support.strava.com/en-us/articles/15402008-how-do-i-give-and-receive-comments-on-strava)
- Samsung Food explicitly offers public/private communities and saving community recipes into a personal box. Its help describes approval for private membership and restrictions on sharing edited recipes. Social cooking is therefore an established category; Fork’s proposed contribution is a cook-event and improvement loop with clear provenance. [Community help, updated 13 February 2025](https://support.samsungfood.com/hc/en-us/articles/18365296571412-Getting-Started-with-Samsung-Food-Communities)

### Inferences

**Minimum pilot product.** Cookbook: save/paste/edit recipes reliably, preserve source, find saved recipes, readable mobile cooking, trustworthy scaling where supported, export. Journal: “I cooked” accepts a dish name and date; recipe/version, original source URL, note, photo and scale are optional. Never require someone to recreate a complete recipe merely to say they made dinner. A linked Fork recipe records the actual version cooked; an external-link or improvised cook is a valid event, not a broken recipe.

Community: approved friends, a chronological feed, reversible kudos, simple comments, and visible **Only me / Friends** audience selection. Start with approved-follow access or a simple invitation circle; avoid building a general-purpose groups hierarchy. A public recipe catalog can exist separately from friends-only cook events. Public activity posting can follow once consent, visibility and moderation work. Dates should distinguish when cooked from when posted; choose and label a consistent feed order without algorithmic reshuffling.

The useful flow is **see a friend’s cook → open source or permitted recipe → save for later → cook → record own result → adapt when permitted**. A source-only post must not expose a friend’s private imported recipe. A private note remains private even when the cook event is shared. Empty Community should explain how to connect with friends and offer clearly labeled examples elsewhere, never fabricate friends’ activity.

**Admission gate:** no known cross-user privacy leakage; server-side permission checks cover feed, comments, saves, photos and direct URLs; edits survive a failed save; no known critical quantity corruption; logging works on the cohort’s phones; reporting and moderator removal work; no copied publisher content defaults to public. Test these as actual end-to-end paths before inviting anyone.

Proposed pilot: **8–15 willing friends**, adjusted to the actual group, with at least a few existing relationships beyond Spencer. Participation is optional. Ask each person to bring **two or three recipes they actually use if convenient**; a bookmark or one dinner log is enough to start. Do not require public recipes or photos. Invite through Spencer’s usual channel only when he chooses to send invitations; no outreach has been performed.

| Period | Pilot activity | Evidence to collect |
|---|---|---|
| Preparation | Spencer tests several ordinary meals, demonstrates one cook event, checks rights/privacy and sets up support. Briefly ask what phones, current recipe tools and normal cooking frequency friends use. | Baseline habits, device coverage, blockers; demo content kept separate from real activity |
| Week 1: first usefulness | Help people save something relevant and log one real meal; explicitly show audience controls. Encourage connecting with people they already know. | Invited → accepted → first useful save/log; time/friction; help required; misunderstood visibility |
| Week 2: friend-to-cook loop | Suggest one optional shared theme or recipe exchange. Observe whether people save, ask a cooking question or try something from another friend. | Real paths from cook event to source/save to later cook; non-founder responses; why people do not post |
| Week 3: ordinary use | Stop planned founder posting prompts and personal reminders. Continue necessary support. Avoid rewards or a staged activity burst. | Which people return, cook, save or respond without nudges; whether founder content dominates |
| Week 4: decide | Interview active and inactive participants individually. Ask what they would keep using and what they still send through group chat. Offer an optional invite to one genuine cooking friend. | Repeat utility, independent sharing, concrete missed needs; continue, repair or run another small cohort |

Basic controls before even this private pilot: unfollow/remove access, block/mute, report cook/comment/photo, remove one’s own content, a named moderator and contact route, spam/rate limits, plain community expectations and a visible response process. Strip photo location metadata before serving uploads. Do not scrape contacts or expose emails. Prefer in-app notifications first; opt into email/push or digests explicitly and permit muting. A private circle reduces operational scope; it does not remove permission or abuse requirements.

### Gaps

The friend group’s size, cooking frequency, devices and willingness to participate have not been measured. Four weeks cannot establish durable retention or commercial demand. Friends may tolerate bugs and post to help Spencer; founder-assisted onboarding must be recorded separately from independent success.

## Where should recipes come from, and what can be shared?

### Takeaway

Use real personal libraries to make the pilot useful and a small, deliberately licensed catalog to demonstrate public discovery. An imported recipe, a source-linked cook and a redistributable public recipe are different objects and require different sharing behavior.

### Cited Findings

- CC BY 4.0 permits commercial sharing/adaptation with attribution, a license link and change indication; other rights may still matter. [License deed](https://creativecommons.org/licenses/by/4.0/)
- CC BY-SA 4.0 also allows commercial reuse, but distributed adaptations must follow its ShareAlike requirements; additional legal/technical restrictions cannot contradict the grant. [License deed](https://creativecommons.org/licenses/by-sa/4.0/)
- CC BY-NC restricts commercial use; CC BY-ND does not permit distributing modified material. Neither should be treated as generic permission for a commercial app’s remixable public seed catalog. [BY-NC](https://creativecommons.org/licenses/by-nc/4.0/), [BY-ND](https://creativecommons.org/licenses/by-nd/4.0/)
- Wikibooks’ cookbook footer licenses its **text** under CC Attribution-ShareAlike, with additional terms potentially applying. Wikimedia Commons states that images have file-specific licenses, requires verifying the individual file’s status, and distinguishes uploader from creator. An open recipe page does not clear every photograph on it. [Wikibooks cookbook](https://en.wikibooks.org/wiki/Cookbook:Table_of_Contents), [Commons reuse guidance, last edited 2 November 2026](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)

### Inferences

Use three explicit supply lanes:

| Lane | Intended use | Publication rule |
|---|---|---|
| Private personal collection | A user’s own saved/imported cooking references and private changes | Private by default; never automatically promote into Community/catalog. Privacy is not a legal exemption or proof copying is authorized. |
| Source-linked social event | “I made this,” the cook’s own note/photo, source title/link, and permitted metadata | Link to the publisher; do not bundle its full instructions or unlicensed photo. A recipient saves the link and follows any permitted import flow themselves. |
| Public recipe content | Original writing/photos owned by contributor, explicit permission, or compatible open license | Record scope and attribution; allow sharing/adaptation only as authorized. Unknown rights means source-link-only publication pending resolution. |

**Seed recommendation:** do not wait for thousands of recipes. Begin with Spencer’s real, tested recipes and consenting friends’ contributions. An eventual **20–40 tested original or permissioned public recipes** is a practical coverage hypothesis, not a launch prerequisite or an activity target. Choose recipes people will cook this month: a few quick dinners, vegetarian mains, a baked item, leftovers-friendly dishes and a couple of interesting variants. Prefer missing photos to false photographic claims. Demo recipes and invented demonstration cooks remain labeled and excluded from real feeds, counts and analytics.

Scale supply through a repeatable submission/review process and a few creator partnerships, not bulk scraping. A proposed creator offer: permission for a small starter collection, prominent author/source links, agreed image treatment, correction route, and aggregate saves/cooks where privacy permits. Permission should explicitly cover hosting/display, commercial use, images separately, user adaptation and redistribution/export, credit requirements, term and withdrawal handling. The creator retains ownership unless a real agreement says otherwise. No creators have been contacted and no permissions are assumed.

Wikibooks is a **candidate pool for per-recipe review**, not an endorsed ready-to-import catalog. Preserve the applicable text license, contributor attribution/history and change record; check image permissions separately and comply with ShareAlike for relevant published adaptations. Do not apply a blanket proprietary “all rights reserved” notice to licensed derivative content. If the required license behavior is not implemented, use original/expressly permissioned material first. AI paraphrasing does not make an unlicensed source automatically publishable; legal review should resolve uncertain rights, rather than inventing a percentage-change threshold.

**Provenance vocabulary:** creator = authored the source recipe; importer = saved it into Fork; adapter = made a documented change; cook = prepared the dish on a date. One person can fill several roles, but importing never silently makes someone the creator. Store/display source URL or book/page, source author where known, content/asset rights basis and license version, import date, parent/version lineage, and who supplied the own photo. “Inspired by” is a relationship label, not permission.

Deduplicate exact source identity conservatively: known canonical URL and source recipe identifier can connect saves to the same source while preserving private snapshots and variants. Retain the original URL. Never globally merge “chicken curry” or similar ingredient lists into one recipe; these may be different dishes or independent authors. Recipe-version identity is separate from source identity. Remove only known tracking parameters, not query values that select content.

**Catalog acceptance template:** title; source/creator/rights record; ingredient quantities and units as authored; grouped method; realistic yield; timing including long waits; tester/date/version and what was actually cooked; notes about ambiguity; image ownership/license; mobile and print read-through. Require every essential ingredient to appear in a usable method and review scaling examples. “Tested” means prepared by a named or accountable tester, not merely imported without an error. Dietary labels should state their basis (creator-supplied/reviewed/unknown); never infer an allergen-free guarantee from a short ingredient list. Prefer explicit uncertain/untested status to silently completing missing information.

### Gaps

No specific external recipe or image has been cleared, imported or cooked during this research. CC summaries are not full legal opinions; actual rights, platform terms and public-domain status can differ across US/Canada and individual assets. Obtain targeted review of the publishing/permission flow before a public commercial catalog, rather than making the private pilot depend on speculative bulk licensing.

## How should acquisition, retention and revenue learning proceed?

### Takeaway

Treat the first circle as a usability and social-loop experiment. Advance to independent friend clusters when people show real cooking value without Spencer repeatedly supplying activity. Social can improve acquisition and retention; it does not justify changing revenue assumptions before measurement.

### Cited Findings

- Samsung Food’s creator guidance explicitly invites creators to build public/private communities and share them with an existing audience. This supports creator-led community distribution as a real channel pattern, not a forecast of Fork’s acquisition costs or success. [Creator guide](https://support.samsungfood.com/hc/en-us/articles/18365153609748-The-Recipe-Creator-s-Guide-to-Samsung-Food)

### Inferences

Record meaningful **people and events**, with denominators and founder activity separate:

- Invitation: number invited, accepting, and completing one useful save or real cook log; track source of invitation with consent, not contact harvesting.
- Repeat utility: unique people using Cookbook/Journal in later weeks; unique people logging on distinct cooking days. Count saves/reading separately so readers are not mislabeled failed cooks.
- Social value: unique non-founder pairs exchanging useful comments; people whose friend event led to a source visit/save; later cooks explicitly linked to that inspiration. Kudos alone is lighter evidence.
- Independence: returning participants without personal founder reminders; proportion of content/replies from Spencer; participant-initiated invitations and invitees who become active. Report “3 of 10” rather than a deceptively precise 30% benchmark.
- Burden and trust: minutes/help to first use, abandoned imports/logs, permission confusion, complaints and moderation load. A privacy leak or corrupted recipe is a stop-and-fix gate, irrespective of engagement.

Provisional expansion rule for a roughly ten-person active cohort: look for **several (for example four) non-founder repeat users across weeks 3–4, at least two distinct friend-inspired cooking paths, and no unresolved critical trust failures**. These are discussion thresholds, not statistical validation. If people like the idea but only post when prompted, repair the logging/usefulness loop and repeat; do not buy traffic. Then test **two or three independent clusters**, each with its own willing organizer and existing relationships. Compare supported versus self-serve onboarding and include inactive people’s feedback. A single friends cohort cannot establish a network effect.

Channel order: (1) Spencer’s real circle; (2) organic member referrals into independent circles; (3) a few permissioned creator/cooking-club partnerships; (4) shareable public recipes and cook stories, with consent; (5) focused educational/search content once public pages are useful; (6) broader communities, launch directories and portfolio exposure as explicit experiments. Respect community posting rules. No paid acquisition until activation, repeat use and costs can be measured; technical launch audiences are not substitutes for home cooks.

Funnel: attributed visit/invite → connected participant → trustworthy save or real log → subsequent useful session → friend-inspired cook → optional paid depth. Measure where it breaks and why. Never assume every cook produces a referral, every invitation converts, or all retained users need to subscribe.

Keep basic friend connections, posting, reading, kudos/comments and ordinary cooking utility free as a **packaging hypothesis**: charging before the circle works may inhibit testing. Paid candidates are depth/convenience—richer version/attempt exploration, advanced capture allowances, larger curated workflows or later household capabilities. Validate willingness to pay after recurring value; preserve access to owned content and export. Keep the existing price and revenue arithmetic unchanged until actual activation, retention, conversion, support, storage and moderation costs warrant updates.

### Gaps

Sources were accessed 8 November 2026; Samsung’s community guidance is dated February 2025, Strava feed/comments September 2026, and CC license pages are undated current summaries. No market-size, viral-coefficient, CAC or conversion claim was established. No invitations, creator outreach, publishing, account changes or paid campaigns were performed. The main risk is mistaking supportive friends and founder-generated activity for independent demand.

#### Fee-country caveat for the unchanged revenue scenarios

Public Stripe pricing verified 8 November 2026, without account access:

| Merchant pricing page | Standard online domestic cards | Listed international-card addition | Currency conversion addition | Billing pay as you go |
|---|---|---|---|---|
| [United States](https://stripe.com/pricing) | 2.9% + US$0.30 per successful transaction | +1.5% | +1% when required | 0.7% of Billing volume |
| [Canada](https://stripe.com/en-ca/pricing) | 2.9% + CA$0.30 per successful transaction | +0.8% (page marks this with an asterisk) | +2% when required | 0.7% of Billing volume |

**Writer recommendation:** retain the existing **5.6% fee allowance** solely as an explicit illustrative modeling assumption, preserving scenario arithmetic. It is not a Stripe quote, a guaranteed ceiling or a selected merchant jurisdiction. Targeting US/Canadian customers does not determine Fork’s operating entity, payment-account country, card-origin mix, charge/settlement currency or processor. Those choices and actual terms require confirmation before budgeting launch costs. Billing is a separate product fee; fixed per-transaction costs make monthly and annual payment mixes differ. Do not explain this allowance as a confirmed Hong Kong merchant choice, and do not assume domestic pricing for every US/Canadian customer.
