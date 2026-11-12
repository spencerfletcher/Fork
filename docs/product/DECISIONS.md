# Fork decisions

Spencer's product decisions, what they replaced, and removals awaiting his approval. Split from [ROADMAP.md](ROADMAP.md) on 12 November 2026 (it was sections 14, 16 and 17 there); source codes are the roadmap's source key. A decision also goes into the roadmap item it changes. Edited in place; changelog at the bottom.

## 1. Decided

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
- 9 Nov: unfriend, block and mute rules as in [ROADMAP.md](ROADMAP.md) section 7 (R).
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
- 11 Nov: household or power packaging and the first native platform are deferred, listed in [ROADMAP.md](ROADMAP.md) section 13 (OD: "decide later").
- 11 Nov: Spencer talks to friends first, then sends the first invitations; no date; the admission gate stands as written (OD: "will talk to friends then yes").
- 11 Nov: Fork is run by Spencer personally while it is free; an entity is formed before the first payment is taken (OD: "fine on running it while it's free and incorporate before taking payment").
- 11 Nov: unfriending or blocking removes a saved Friends-only recipe from the saver's Cookbook with no copy kept; the keep-your-copy rule applies only when the author unpublishes or deletes (OD: "first is fine for saver friend rule").
- 11 Nov: the working assumption is a US corporation (not an LLC), formed before the first payment; confirmed with a cross-border accountant before forming, since Spencer is tax resident in both the US and Canada (OD: "will assume that and can come back to accountant later").
- 11 Nov: account deletion is the recipe delete path for every recipe: gone for everyone, savers keep their read-only copy with no author name, forks survive as "Original recipe deleted"; Journal, collections, saves, friendships and photos removed; the username stays reserved 30 days (OD: "Same as recipe delete").
- 12 Nov: the varied seed (about 30 cooks, recipes with versions and forks, friendships, Journal, collections, reports) loads on local and production, e2e keeps its small fixed seed; seeded cooks may appear in production feeds and counts until public launch, overriding the rule that kept invented cooks out; a production reseed is approved, after which `MODERATOR_IDS` is set to the new ids; the build is next, after the cookie seed fix (OD).
- 12 Nov: test data on production holds only until public launch (own domain, real cooks); prepare a two-tier setup, a staging tier with test data and a clean production, before then (OD: "production having test info is fine for now until i have the site properly go public").
- 12 Nov: the cookie example's seed faults are fixed (OD).
- 12 Nov: seeded cooks are not labelled as demo; they are removed at public launch (OD: "no label needed").
- 12 Nov: the next builds, in order: varied seed data, Journal recall (UX 1), the empty Cookbook entry point (UX 2), easy import starting with an options page (UX 2), onboarding; this accepts the UX review's order. Featured recipe content (UX 3) is carried by the cookie fix and the varied seed; real-meal validation (UX 4) waits on the public-launch prerequisites (OD: "build order good").
- 12 Nov: the `pluralize` npm package is approved for a yield's free-text noun after a whole-number count ("2 loaf" reads "2 loaves"), used only there; tracked in the roadmap's Scaler workstream (OD: "add pluralize").

## 2. Dropped as superseded

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
12. "Search current owned/pinned content by default" as the search scope (R) → global search over own, friends' and Public recipes with scopes, P2 (R 9 Nov evening, OD 10 to 11 Nov). History search settled 11 Nov (section 1).
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
27. The 8 Nov evidence labels for the pre-MVP product state (R, PA) → [ROADMAP.md](ROADMAP.md) section 2 states the shipped state; the audit stays as the research record (removed with Spencer's approval, 11 Nov 2026).
28. "First competitor migration importer" in P1 (R, CM) → all importers P2, the first migration importer with paste, URL and file import (OD, 11 Nov).
29. "A purchased core plus recurring services" as an option for the first paid offer (DD) → one annual plan, no tiers at first (OD, 11 Nov).

## 3. Proposed removals, awaiting Spencer's approval

None pending.

## Changelog

- 2026-11-12: created from ROADMAP.md sections 14 (now 1), 16 (now 2) and 17 (now 3); earlier history is in ROADMAP.md's changelog and git.
- 2026-11-12: the build order and `pluralize` recorded.
