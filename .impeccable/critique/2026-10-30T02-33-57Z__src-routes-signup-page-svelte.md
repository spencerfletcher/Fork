---
target: sign-up, sweep 6
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/signup/+page.svelte"
target_fingerprint: "sha256:f8e05291a373a7c625a49ef3baa84a1ed24f9283815e8311f071daebec9ee061"
target_path: /Users/spfle/Dev/Fork/src/routes/signup/+page.svelte
timestamp: 2026-10-30T02-33-57Z
slug: src-routes-signup-page-svelte
---
# Sign-up, sweep 6 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no question tool; overlay skipped, detector clean). Trend 28 → 29 → 31 → 31 → 33 → 32/40 (1:3 2:3 3:3 4:4 5:3 6:3 7:3 8:3 9:4 10:3). Title "Create an account — Fork"; 5 styles, lowest 5.35; fits the viewport at 390/768/1280; 200% zoom no overflow; forced colours keep borders and ring. Username rule at 390: "Jane.Doe+1987@example.com" prefills janedoe1987, stays valid when left; "Jane Doe" + Tab gives aria-invalid, describedby "username-rule username-hint", the rule line, and the hint drops its repeat; "ab" keeps it; "jane_doe-1" clears it; a later email edit leaves the typed handle alone. Bad email "jane@": same wiring as login, no fill, red border and value. The one point off is Error prevention, for the lost tap below, found this run (the code predates sweep 5). POSTs aborted.

Previous items: [P3] rule and email message not live: still open (+page.svelte:105-107, 134-138). [P3] hint punctuation: still open ("3 to 30 letters, digits, - or _." line 142 ends with a stop; "At least 6 characters" line 157 and the rule line 137 do not). [P3] "jane@" prefills "jane" before the address is valid: still open, harmless.

Priority: [P2, new, shared by login, sign-up and forgot] a tap on the submit button straight from a bad email can be lost: the blur inserts the message, the button drops 27 to 36px at 390 (16 to 18 at 1280), and the click lands on nothing. Playwright touch at 390: no click on sign-up and forgot, one on login; mouse at 1280 got through; timing-dependent, unverified on a real phone. Workaround: a second tap. Fix: skip the blur reveal when focus moves to the form's submit (relatedTarget), and let the submit's invalid event show the message. Here the shift is largest (36px at 390) and the touch tap was lost: +page.svelte:98. [P3] live regions or accept on-return. [P3] one punctuation rule for single-clause hints (drop the stop at line 142, or move the clause into a sentence). Persona: Casey taps Create account after a typo and nothing happens until the second tap. Strengths: the rule appears and clears with the value; the prefill respects a typed handle.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card; forced colours keep the brand box (d727b92). [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
