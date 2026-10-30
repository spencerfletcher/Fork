---
target: forgot password, sweep 7
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/forgot-password/+page.svelte"
target_fingerprint: "sha256:460dae8d55974a710a874d33065d934c4473a742fc2436a02b5c6544fdc7b04c"
target_path: /Users/spfle/Dev/Fork/src/routes/forgot-password/+page.svelte
timestamp: 2026-10-30T04-04-57Z
slug: src-routes-forgot-password-page-svelte
---
# Forgot password, sweep 7 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no sub-agent split, no question tool; overlay skipped, detector clean). 34 → 35 → 35 → 35/40 (1:3 2:4 3:4 4:3 5:3 6:4 7:3 8:4 9:4 10:3). Form: "Forgot your password?", "Send reset link" 52.4; Tab at 390: email, Send reset link, Log in. Sent state (POST intercepted with page.route and fulfilled locally, 77-character address; nothing reached Supabase): tab title and h1 "Check your email", focus on the h1, the address breaks inside the card, Send again 69×48.8 at 390 (69×28.8 at 1280), then Log in; Send again restores the form, address filled, focus in the field. 200% zoom no overflow; forced colours keep borders.

Tap check: "jane@" then one touch tap on Send reset link at 390: top 503.1, events pointerdown, click, invalid; message after the click, button moves 27.1px. Error prevention back to 3. Visibility drops to 3 for the new silent state below, which is reachable here by keyboard alone because the submit is the field's next stop: Tab from "jane@" to Send reset link and on to Log in gives a red box, no message, no aria-invalid (forgot-tabpast-1280.png).

Previous items: [P2] lost tap: fixed (b2f86de, 2a172e4). [P3] Send again does not name spam: still open, optional (+page.svelte:57). [P3] email message not live: still open (+page.svelte:112-114).

Priority:
[P2, new, shared by login, sign-up and forgot] a stopped submit shows two messages for one error. The forms keep the browser's own validation (no novalidate, the invalid handlers do not cancel the event), so Chrome draws its bubble ("Please enter a part following '@'. 'jane@' is incomplete.") over the page's own "Enter an email address like name@example.com", covering most of it at 390 and, on sign-up, the Username label below (tap-signup-390.png). The bubble existed before this sweep; it is first reported here. Fix: cancel the invalid event on the fields that carry their own message (email, sign-up's username) and focus the first invalid field yourself; keep the bubble for fields without one (password), or give password a message too, because a cancelled email lets the browser report and focus the next field instead.
[P3, new, shared] the held-back message can stay held back. A press dragged off the submit (pointerdown, no click) or, on forgot-password, Tab from the email to Send reset link and on to Log in leaves the email red (:user-invalid, app.css:872) with no words and no aria-invalid until the next submit. Fix: reveal on the submit button's blur as well, so leaving the button for anywhere but the stopped submit shows the message.
Invalid handler +page.svelte:106-109. [P3] "Didn't get it? Check spam, or send again." would save a resend. [P3, new] at 1280 the 2px-offset ring on the switch link's Log in meets the "?" of "Remembered it?" (forgot-tabpast-1280.png). Persona: Sam tabbing past the button hears nothing about the bad address until the stopped submit. Strengths: no account enumeration; the loop closes on itself and the title follows the step.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card. [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
