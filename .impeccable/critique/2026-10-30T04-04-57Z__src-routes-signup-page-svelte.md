---
target: sign-up, sweep 7
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/signup/+page.svelte"
target_fingerprint: "sha256:d0150808ebc8065882c5ca89c98094882c32605a8bda01bf2f59868c1cf7d5e9"
target_path: /Users/spfle/Dev/Fork/src/routes/signup/+page.svelte
timestamp: 2026-10-30T04-04-57Z
slug: src-routes-signup-page-svelte
---
# Sign-up, sweep 7 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no sub-agent split, no question tool; overlay skipped, detector clean). Trend 29 → 31 → 31 → 33 → 32 → 33/40 (1:4 2:3 3:3 4:4 5:3 6:3 7:3 8:3 9:4 10:3). Title "Create an account — Fork"; 5 styles, lowest 5.35; fits the viewport at 390/768/1280; 200% zoom no overflow; forced colours keep borders and ring. Username rule at 390: "Jane.Doe+1987@example.com" prefills janedoe1987, stays valid when left; "Jane Doe" + Tab gives aria-invalid, describedby "username-rule username-hint", the rule line, the hint drops its repeat; "ab" keeps it; "jane_doe-1" clears it; a later email edit leaves the typed handle alone. Every POST aborted.

Tap check: "jane@" then one touch tap on Create account at 390: top 602.6, events pointerdown, click, invalid; the message appears after the click and the button moves 36.4px to 639. Mouse at 1280: 15.5px, same order. The point back is Error prevention's lost tap; Visibility rises to 4 with it.

Previous items: [P2] lost tap: fixed (b2f86de, 2a172e4). [P3] rule and email message not live: still open (+page.svelte:118-120, 147-152). [P3] hint punctuation: still open ("3 to 30 letters, digits, - or _." line 155 ends with a stop; "At least 6 characters" line 170 and the rule line 150 do not). [P3] "jane@" prefills "jane" before the address is valid: still open, harmless (visible in tap-signup-390.png).

Priority:
[P2, new, shared by login, sign-up and forgot] a stopped submit shows two messages for one error. The forms keep the browser's own validation (no novalidate, the invalid handlers do not cancel the event), so Chrome draws its bubble ("Please enter a part following '@'. 'jane@' is incomplete.") over the page's own "Enter an email address like name@example.com", covering most of it at 390 and, on sign-up, the Username label below (tap-signup-390.png). The bubble existed before this sweep; it is first reported here. Fix: cancel the invalid event on the fields that carry their own message (email, sign-up's username) and focus the first invalid field yourself; keep the bubble for fields without one (password), or give password a message too, because a cancelled email lets the browser report and focus the next field instead.
[P3, new, shared] the held-back message can stay held back. A press dragged off the submit (pointerdown, no click) or, on forgot-password, Tab from the email to Send reset link and on to Log in leaves the email red (:user-invalid, app.css:872) with no words and no aria-invalid until the next submit. Fix: reveal on the submit button's blur as well, so leaving the button for anywhere but the stopped submit shows the message.
Worst here: at 390 the bubble covers the Username label. Invalid handlers +page.svelte:112-115 and 138. After the stopped submit the empty password also turns red with only its grey hint under it (:user-invalid on every field after a submit attempt), as intended since sweep 6. [P3] one punctuation rule for single-clause hints. Persona: Casey's tap now lands; Sam hears the rule only on return. Strengths: the rule appears and clears with the value; the prefill respects a typed handle.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card. [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
