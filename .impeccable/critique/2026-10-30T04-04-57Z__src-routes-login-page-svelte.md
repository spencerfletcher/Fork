---
target: login, sweep 7
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/login/+page.svelte"
target_fingerprint: "sha256:b6037b2075e70a9f553e4f5d60cfcf65b5254378375654fcffd9b4b33d924b3e"
target_path: /Users/spfle/Dev/Fork/src/routes/login/+page.svelte
timestamp: 2026-10-30T04-04-57Z
slug: src-routes-login-page-svelte
---
# Login, sweep 7 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no sub-agent split, no question tool; overlay skipped, detector run). Trend 27 → 28 → 31 → 33 → 33 → 33/40 (1:4 2:3 3:3 4:4 5:3 6:3 7:3 8:3 9:4 10:3). Title "Log in — Fork", h1 "Welcome back" Bitter 28/33/40 clay 5.84; 5 styles, lowest 5.35 (labels); page exactly the viewport at 390/768/1280; 200% zoom no overflow; forced colours keep card, input and button borders; no transitions under reduced motion. Tab at 390: skip, brand, search, menu, email, password, Forgot password? (103×47.1), clay ring 2px offset 2. "jane@" then Tab (to password): message, aria-invalid, describedby email-error, red border and value, no fill; fixing clears it. Detector: 1 advisory, line 134 font-size 0.875rem, a false positive (the hint step). Every POST aborted; none reached the server.

Tap check (b2f86de, 2a172e4): "jane@" then one touch tap on Log in at 390 (hasTouch, isMobile): button top 550.8 before the tap, events pointerdown, click, invalid in that order, the message appears after the click and the button moves to 577.9 (27.1px) once the tap has landed. Mouse at 1280: same, 15.5px. Enter in the field: click, invalid, message. Fixing the address returns the button to 550.8.

Previous items: [P2] lost tap from a bad email: fixed (b2f86de, 2a172e4). [P3] email message not live: still open (+page.svelte:85-87). [P3] hint punctuation drift: still open (see sign-up). [P3, carried] show-password toggle: still open.

Priority:
[P2, new, shared by login, sign-up and forgot] a stopped submit shows two messages for one error. The forms keep the browser's own validation (no novalidate, the invalid handlers do not cancel the event), so Chrome draws its bubble ("Please enter a part following '@'. 'jane@' is incomplete.") over the page's own "Enter an email address like name@example.com", covering most of it at 390 and, on sign-up, the Username label below (tap-signup-390.png). The bubble existed before this sweep; it is first reported here. Fix: cancel the invalid event on the fields that carry their own message (email, sign-up's username) and focus the first invalid field yourself; keep the bubble for fields without one (password), or give password a message too, because a cancelled email lets the browser report and focus the next field instead.
[P3, new, shared] the held-back message can stay held back. A press dragged off the submit (pointerdown, no click) or, on forgot-password, Tab from the email to Send reset link and on to Log in leaves the email red (:user-invalid, app.css:872) with no words and no aria-invalid until the next submit. Fix: reveal on the submit button's blur as well, so leaving the button for anywhere but the stopped submit shows the message.
Here the invalid handler is +page.svelte:79-82. [P3] message heard only on return. [P3, carried] show-password toggle. Persona: Casey's first tap now lands and shows the message, under a browser bubble that says the same thing. Strengths: one tap is enough again; recovery one stop after the password; the subtitle says why you were sent here.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card. [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
