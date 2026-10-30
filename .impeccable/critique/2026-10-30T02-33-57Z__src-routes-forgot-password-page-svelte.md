---
target: forgot password, sweep 6
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/forgot-password/+page.svelte"
target_fingerprint: "sha256:5f0a1091eb992455b5509162546f6e46099d9f17444afa2b2708d6b7ab140d43"
target_path: /Users/spfle/Dev/Fork/src/routes/forgot-password/+page.svelte
timestamp: 2026-10-30T02-33-57Z
slug: src-routes-forgot-password-page-svelte
---
# Forgot password, sweep 6 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no question tool; overlay skipped, detector clean). 34 → 35 → 35/40 (1:4 2:4 3:4 4:3 5:2 6:4 7:3 8:4 9:4 10:3). Form: "Forgot your password?", "Send reset link" 52.4; Tab at 390: email, Send reset link, Log in. Bad email: aria-invalid, message, red border, no fill; a stopped submit focuses the field. Sent state (POST intercepted with page.route and fulfilled locally, 77-character address; nothing reached Supabase): tab title "Check your email — Fork" and h1 the same, focus on the h1, the address breaks inside the card, Send again 69×48.8 at 390, then Log in; Send again restores the form, address filled, focus in the field.

Previous items: [P3] sent-state tab title: fixed (65a5d45). [P3] Send again does not name spam: still open, optional. [P3] email message not live: still open (+page.svelte:99-101).

Priority: [P2, new, shared by login, sign-up and forgot] a tap on the submit button straight from a bad email can be lost: the blur inserts the message, the button drops 27 to 36px at 390 (16 to 18 at 1280), and the click lands on nothing. Playwright touch at 390: no click on sign-up and forgot, one on login; mouse at 1280 got through; timing-dependent, unverified on a real phone. Workaround: a second tap. Fix: skip the blur reveal when focus moves to the form's submit (relatedTarget), and let the submit's invalid event show the message. Here: +page.svelte:92; touch tap lost at 390 (27px shift), so Error prevention drops to 2 and Visibility rises to 4 for the title. [P3] "Didn't get it? Check spam, or send again." would save a resend. Persona: none blocking. Strengths: no account enumeration; the loop closes on itself and the title now follows the step.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card; forced colours keep the brand box (d727b92). [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
