# Business viability and paths to scale — 31 October 2026

Spencer's question: "is there a way to turn it into a business of scale? a viable product? ... what would we need?" Inputs: `docs/ROADMAP.md`, `PRODUCT.md`, `docs/research/2026-10-31-feature-research.md`, then web research on 31 October 2026.

Source marks: **(F)** a page fetched and read for this note; **(S)** a search-engine summary, not opened, so treat as unverified; **(E)** an estimate, mine or a third party's, with no disclosure behind it. Reddit, Inc.com, uxdesign.cc and the Copyright Office PDF could not be read (403 or binary).

## (a) Verdict

1. A solo, web-only Fork can realistically become a **small paid product: 10k–50k registered users, 300–2,000 payers, about $10k–$70k a year** (E). That is a good side business, not a company.
2. A **strong outcome is 100k–500k registered and $100k–$750k a year** (E), which in this category has meant a native app, a sharp wedge community and years: Letterboxd took from 2011 to 2021 to reach 3 million members and was valued at $50–60M in 2023 (F, [Wikipedia](https://en.wikipedia.org/wiki/Letterboxd)).
3. **Venture scale is unlikely on recipes alone.** Big recipe audiences monetise badly: Cookpad, with tens of millions of monthly users, made ¥5,336M (about $34M) in FY2025, down 9.2%, "a continued decline in premium service subscribers" (F, [BigGo summary of the TDnet filing](https://finance.biggo.com/news/jpx_tdnet_140120260205549442)); Yummly had 15 million US active users in 2014 and was shut down by Whirlpool in December 2024 (F, [Wikipedia](https://en.wikipedia.org/wiki/Yummly)).
4. Recipe *storage* sells for $10–$40 a year (AnyList, Copy Me That, Pestle, Plan to Eat; table c). Paying more needs a habit and identity, which is what Strava and Letterboxd sell, not storage.
5. Freemium consumer apps convert about **2.1% of downloads to paid by day 35** (median), hard paywalls 10.7%; the median app makes about **$72 a month a year after launch**, and only 17.3% reach $1k a month within two years (F, [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps)). Plan on those numbers, not on the outliers.
6. SEO will not carry it: People Inc (Allrecipes' owner) saw Google fall from 55% to 25% of its core sessions between Q1 2024 and Q1 2026, with AI Overviews on almost 70% of its top keywords (F, [Press Gazette](https://pressgazette.co.uk/publishers/digital-journalism/beyond-websites-people-inc-grows-digital-revenue-despite-google-traffic-collapse/)). Growth has to come from sharing and community.
7. What would have to be true: (i) one community uses Fork weekly for something no other app does, and the cook log tied to a version (feature research gap 1) is the best candidate; (ii) people share what they log, so each user brings others; (iii) at least 3–5% of weekly users pay $30–$60 a year; (iv) Spencer is willing to ship an iOS app within about 12 months of finding (i).
8. Fork's real asset is the data shape: versions with reasons, forks with credit, diffs. No competitor in table (c) stores *why* a recipe changed. The business case rests on making that visible and shareable, not on more recipe-manager features.
9. Top strategy: **the baker's notebook that becomes Strava for home cooking** (b1). Start single-player for serious bread and pastry bakers, add the social layer once 200+ weekly loggers exist.
10. Decide in 6 months against the kill criteria in (e). If they trip, Fork is still a fine personal cookbook and portfolio piece; that is a legitimate outcome.

## (b) Three strategies, ranked

### 1. Baker's notebook → "Strava for home cooking" (recommended)

- **Wedge:** serious bread and pastry bakers, who already iterate in grams and hydration percentages and post every attempt. r/Breadit about 1.1–1.2M members, r/Baking about 4.4M, r/Cooking about 6.2M (S, [Hive Index](https://thehiveindex.com/communities/r-cooking/), [GummySearch](https://gummysearch.com/r/Breadit)). That bakers are the best wedge is a hypothesis to test, not a finding.
- **Model:** free core with a paid tier at $30–$50 a year (diary stats, year in review, unlimited photos per cook, history export, private groups). Pricing mirrors Letterboxd Pro $19 / Patron $49 (S, [TradingView](https://www.tradingview.com/news/seekingalpha:8498541cf094b:0-letterboxd-valued-at-over-300m-as-buyers-circle/)) and AllTrails Plus $35.99 (S, [Popular Science](https://www.popsci.com/gear/alltrails-peak-subscription-hiking-app/)). Charge from the first months: Strava reportedly charged within six months of launch (S, source not identified in the search summary).
- **First 1,000:** Spencer's own circle, then posts in bread and baking communities that show a real "sourdough v1 → v7" diff with the reason for each change; one Show HN; join two baking Discords as a member first. Onboard people by hand and watch what they log.
- **First 100,000:** every cook produces a share card (photo, diff chip, link) built for Instagram stories; a year in review in December; baking creators adopting Fork for their public recipe changelog ("v4: less salt after your comments"); an iOS app with push for kudos and comments.
- **Fork must build:** see (d). Mainly M17 attempts, M18 cook mode, M15 import, M4 follows and feed, share cards.
- **Risk:** the social half is the hard half. Cook logs exist (Fava, Larder, Cooked This, per the feature research) and none has broken out; logging a meal may be a weaker habit than logging a run. Beli shows food logging can spread by word of mouth (75M reviews by September 2025, F, [Wikipedia](https://en.wikipedia.org/wiki/Beli_(app))), but restaurants are public places and recipes are not.

### 2. The household cookbook that remembers (utility, Paprika model)

- **Wedge:** people who already pay for or self-host a recipe manager and want history: Mealie has 13,747 GitHub stars (F, [GitHub API](https://api.github.com/repos/mealie-recipes/mealie)) and its version-control request is still open (feature research). Also NYT Cooking subscribers unhappy about AI rewriting recipes in October 2026 (S, [Nieman Lab](https://www.niemanlab.org/2026/10/the-new-york-times-is-adding-more-ai-features-to-its-cooking-app-and-users-arent-thrilled/)): "your recipe, your changes, nothing rewritten" is a clean pitch.
- **Model:** $20–$40 a year per household, or a one-time price. Market prices: AnyList Complete $9.99 / $14.99 household (F, [AnyList](https://www.anylist.com/complete)); Pestle $19.99 a year or $37.99 once (S, MacStories); Plan to Eat $49 on the web, $54.99 through Apple "because Apple charges us a fee" (S, [Plan to Eat help](https://learn.plantoeat.com/doc/how-much-does-plan-to-eat-cost)).
- **First 1,000:** Show HN, self-host forums, a "move from Paprika/Mealie in one minute" importer, a comparison page.
- **First 100,000:** hard without a native app and app-store search; this market is mostly found through the App Store.
- **Fork must build:** URL and photo import, household sharing, units, grocery list, offline reading, export.
- **Risk:** crowded, low price, feature race against Paprika, Mela, Crouton, Pestle, ReciMe and Samsung Food (6M+ users, Food+ $6.99 a month; F, [Ubergizmo](https://ubergizmo.com/2024/09/samsung-ai-food-platform)). Versioning is a nice extra here, not a reason to switch. Most reliable, lowest ceiling.

### 3. Versioned recipes for creators (B2B2C)

- **Wedge:** recipe developers and food newsletter writers losing Google traffic (bloggers report 30–80% drops; one says traffic is down 40%, F, [Storyboard18](https://www.storyboard18.com/digital/food-bloggers-report-traffic-revenue-plunge-due-to-googles-ai-summaries-84831.htm)) who need an owned audience. Pitch: a recipe that improves in public, readers fork and report back, and the creator sees which tweaks readers make.
- **Model:** creator subscription ($10–$20 a month) or a cut of paid recipe access, Substack-style. Optional grocery affiliate later: Instacart's developer platform builds a shoppable recipe page and pays affiliate commission; its creator pilot pays 3% (S, [Instacart docs](https://docs.instacart.com/developer_platform_api/get_started/recipe)).
- **First 1,000:** 20 recipe developers recruited one by one, each bringing readers.
- **First 100,000:** creator readers, if creators drive them.
- **Fork must build:** creator pages, embeds for Substack and blogs, paid recipes (Stripe), email to followers on a new version, per-recipe analytics, schema.org output.
- **Risk:** creators want traffic and money, and are entrenched in WordPress (WP Recipe Maker 50K+ installs, S) and Substack; one developer cannot sell and support a B2B product while building consumer features. Best kept as a later layer on strategy 1.

Models ruled out: **ads** (rejected in `docs/ROADMAP.md`, and session revenue is shrinking industry-wide, People Inc session revenue −1% in Q1 2026, F); **hardware tie-ins** (Cookidoo's 6M+ subscribers at about €60 a year exist because of the Thermomix, S, [Vorwerk](https://www.businessforhome.org/2026/05/vorwerk-increases-2025-revenue-to-a-record-eur-3-6-billion/)); **data licensing** (needs scale first).

## (c) Comparables

| Product | Users | Revenue | Pricing | Pay rate | Source |
|---|---|---|---|---|---|
| NYT Cooking | not broken out; NYT 12.8M digital-only subs Q2 2026 | not broken out | $4.99/mo, $39.99/yr (store listing) | 70% of subscribers return weekly | Digiday (F); TheWrap, app store (S) |
| Cookpad | 60M JP / 40M global monthly, undated | ¥5,336M FY2025 (−9.2%), op. profit ¥264M | premium subscription + ads | premium subs falling | Wikipedia, BigGo filing summary (F) |
| Yummly | 15M US active (2014) | n/a | free | n/a; shut Dec 2024 after whole team laid off Apr 2024 | Wikipedia (F) |
| Samsung Food (Whisk) | 6M+ (2024); 500k MAU Aug 2022 | undisclosed | Food+ $6.99/mo | unknown | Ubergizmo (F); whisk.com (S) |
| Paprika | undisclosed | $100k–300k MRR claimed by a third party, no method | one-time per platform | n/a | myapptemplates (E) |
| AnyList | undisclosed | undisclosed | $9.99 / $14.99 household per yr | unknown | anylist.com (F) |
| Copy Me That | undisclosed | undisclosed | $12.99/yr, $24.99 lifetime | unknown | App Store (S) |
| Pestle | undisclosed | undisclosed | $1.99/mo, $19.99/yr, $37.99 once | unknown | MacStories (S) |
| Plan to Eat | undisclosed | undisclosed | $49/yr web, $54.99 via Apple | unknown | help page (S) |
| ReciMe | 800k (2024) | US Android peak about $68.2K a week, Sep 2025 | freemium, paid imports | unknown | Sensor Tower (F); press (S) |
| Mela, Crouton, Mealime, eMeals | not found | not found | Mealime Pro $2.99 IAP; eMeals $59.99–$99.99 IAP | unknown | App Pricing Lab (S) |
| Cookidoo (Thermomix) | 6M+ subscribers 2025 | Vorwerk culinary €2.1B (devices) | about €60 / US$65 per yr | tied to device | businessforhome (S) |
| Strava | 180M registered Dec 2025 | $415M–$490M 2025 | $79.99/yr | undisclosed; about 2% of registered | Business of Apps, Sacra (E/S) |
| Letterboxd | 30M+ July 2026; 3M Jan 2021 | about $15M projected 2026 | Pro $19, Patron $49 per yr; ads | undisclosed | Wikipedia (F); Bloomberg via search (S) |
| Duolingo | 140.6M MAU, 58.7M DAU Q2 2026 | $298.5M in Q2 2026 | freemium | 12.7M paid ≈ 9.0% of MAU (my arithmetic) | SEC 8-K via search (S) |
| Goodreads | 150M+ members Sep 2023 | undisclosed (Amazon) | free | none | Wikipedia (F) |
| Untappd | 3.2M (2016); 820k checking in (2020) | undisclosed | consumer tier + Untappd for Business (venues) | unknown | Wikipedia (F) |
| Beli | 75M reviews, Sep 2025 | $12M raised by Jun 2025 | free; NYC-only paid Supper Club | n/a | Wikipedia (F) |

Pattern: the social logging apps (Strava, Letterboxd, Untappd, Beli, Goodreads) were each **useful alone on day one** (a ride record, a film diary, a beer list, a restaurant list), grew from one tight community (cyclists; cinephiles; craft-beer drinkers; Gen Z in New York, Chicago and San Francisco), and charged late and lightly, or for extras. Most users never pay.

## (d) What we would need

**Product, strategy 1 (in order):**
1. Cook log on the version (M17): one tap, multiplier, note, photo, "what I changed" → save as a version or fork.
2. Cook mode (M18 + M11 timers), because logging starts in the kitchen.
3. Import from URL (M15 stage 3); nobody retypes their recipes.
4. Share card per cook and per diff: an OG image and a page that reads well logged out.
5. Follows, a feed of friends' cooks, kudos (M4); comments later (M3).
6. Diary and year in review on the profile (the paid tier's core).
7. Sharing defaults settled first: private by default, explicit publish (ROADMAP sharing defaults).
8. Payments (Stripe on the web) and a paid tier; an iOS app later.

Strategy 2 swaps 4–6 for household sharing, units, grocery list and offline. Strategy 3 adds creator pages, embeds, paid recipes and follower email on top of 1–5.

**Distribution:** pick one community and become known in it before launching anywhere else; post real diffs, not ads. Show HN once the log works. A December year in review as the share moment. No paid ads until retention is proven. Do not plan on SEO; the logged-out recipe page should still be good, because shared links land there.

**Costs (E), assuming about 20% of registered users are monthly active and photos are served from Supabase Storage:**

| Band | Supabase | Netlify | Other | Total per month |
|---|---|---|---|---|
| 10k registered | Pro $25 (100k MAU, 100 GB storage, 250 GB egress included) | Personal $9 | SMTP about $20 | about $55 |
| 100k registered | Pro $25 + Small–Medium compute $15–$60; storage under 100 GB | Pro $20 + bandwidth at about $0.13/GB | SMTP, error tracking about $50 | about $150–$300 |
| 1M registered | Pro + MAU overage ($0.00325 each over 100k), Large–XL compute $110–$210, cached egress $0.03/GB on several TB | requests about $0.01 per 10k, compute about $0.07/GB-hour | moderation tooling, email | about $1.5k–$3k |

Prices from [Supabase pricing](https://supabase.com/pricing) and [Netlify pricing](https://www.netlify.com/pricing/) (F). At 1M registered, a CDN in front of images (or Supabase's cached egress) matters more than the database. Infrastructure is not the constraint at any band; time and moderation are. Apple's cut matters for the native app; RevenueCat finds web purchases are only 3.2% of subscription-app revenue globally (F), so most consumer subscription money is still collected in-app.

**Legal and moderation:**
- Copyright: "A mere listing of ingredients is not protected under copyright law", but protection can extend to "substantial literary expression in the form of an explanation or directions" (F, [Copyright Office FAQ](https://www.copyright.gov/help/faq/faq-protect.html)). So imports stay private by default; publishing an imported recipe should require the cook's own method text, and every import keeps its source link. Register a DMCA agent before user content is public.
- Children: set a 13+ minimum in the terms and stop sign-up for anyone who says they are younger; the amended COPPA rule's compliance date was 22 April 2026 (S, [Mondaq](https://www.mondaq.com/unitedstates/privacy-protection/1621136/ftc-finally-publishes-amended-coppa-rule-compliance-deadlines-set)). GDPR basics for EU users: a privacy policy, data export and deletion (export is already M16), a lawful basis for email.
- Moderation, before any public feed: report button on recipes, cooks, comments and photos; an admin hide; rate limits on sign-up and posting; photo uploads checked against a known-abuse hash service. One person can moderate a community of thousands; beyond that it needs volunteers or a hire.
- Before taking money: terms of service, a privacy policy and a refund policy, reviewed by a lawyer once (E: a few thousand dollars).

**Native app:** not needed for the first 1,000. iOS supports web push for home-screen web apps since iOS 16.4 (S, [MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)), enough for a pilot. Needed for strategy 1 past about 10k weekly users (camera, reliable push, App Store discovery) and for strategy 2 from the start. M14 already plans it.

**Cofounder:** not needed to test the wedge. Past about 10k weekly users, the missing skill is community and content (someone known among bakers), not a second engineer. Strategy 3 would need a person who sells to creators.

## (e) Kill criteria (by 30 April 2027)

Stop pushing for a business, and keep Fork as a personal product, if any of these hold after a real launch to the wedge community:

1. Fewer than **200 people log a cook in a typical week**, three months after launch.
2. **Week-4 retention below 20%** among people who logged at least one cook.
3. Fewer than **30% of active users ever save a second version or a fork**: versioning is not what they came for.
4. Shares do not bring sign-ups: under **1 new user per 10 cooks shared**.
5. Fewer than **50 people pre-pay** (or join a paid waitlist) out of the first 1,000 active users, or under 2% of weekly users pay once the tier exists.
6. Spencer's honest test: he has not wanted to open Fork himself in a typical week.

## (f) Sources not linked above

- Strava: [Wikipedia](https://en.wikipedia.org/wiki/Strava) (F; founded 2009, 50M+ users by 2020, paywall moved in May 2020, Runna and Breakaway bought May 2025); [Business of Apps](https://www.businessofapps.com/data/strava-statistics/), [Sacra](https://sacra.com/c/strava/) (S/E). Confidential S-1 reported February 2026 (S).
- Goodreads: [Wikipedia](https://en.wikipedia.org/wiki/Goodreads) (F). Untappd: [Wikipedia](https://en.wikipedia.org/wiki/Untappd) (F); Brewbound on paid badges (S).
- NYT Cooking: [Digiday](https://digiday.com/media/the-new-york-times-crafts-personality-led-video-in-cooking-push-to-drive-subs/) (F); [TheWrap Q2 2026](https://www.thewrap.com/industry-news/business/new-york-times-q2-2026-earnings/) (S).
- Cookpad: [Wikipedia](https://en.wikipedia.org/wiki/Cookpad) (F). Duolingo: [SEC 8-K Q2 2026](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm) (S).
- App revenue: [Sensor Tower US Android food and drink Q3 2025](https://sensortower.com/blog/2025-q3-android-top-5-food%20and%20drink-revenue-us-602e0a75241bc16eb808976d) (F).
- Not found: Paprika, Mela, Crouton revenue or users; NYT Cooking's own subscriber count; any recipe app disclosing its paying share.
