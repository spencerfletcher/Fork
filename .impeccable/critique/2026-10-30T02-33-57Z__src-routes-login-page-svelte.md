---
target: login, sweep 6
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/login/+page.svelte"
target_fingerprint: "sha256:580e823258f907318ae82e87bc9aacd9666ca0eda924dcdfc6edc3e35c188b39"
target_path: /Users/spfle/Dev/Fork/src/routes/login/+page.svelte
timestamp: 2026-10-30T02-33-57Z
slug: src-routes-login-page-svelte
---
# Login, sweep 6 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no question tool; overlay skipped, detector run). Trend 25 → 27 → 28 → 31 → 33 → 33/40 (1:4 2:3 3:3 4:4 5:3 6:3 7:3 8:3 9:4 10:3). Title "Log in — Fork", h1 "Welcome back" Bitter 28/33/40 clay 5.84; 5 styles, lowest 5.35 (labels); page exactly the viewport at 390/768/1280; 200% zoom no overflow; forced colours keep card, input and button borders; no transitions under reduced motion. Tab at 390: skip, brand, search, menu, email, password, Forgot password? (103×47.1), clay ring 2px offset 2. "jane@" then Tab: aria-invalid, describedby email-error, message 14px #a3362b, red border and red value, background stays the card's #fffdf9 (no fill, 3e5f968); fixing it clears both. Detector: 1 advisory, line 117 font-size 0.875rem, a false positive (the hint step). POSTs aborted; none reached the server.

Previous items: [P3] email message not live: still open (+page.svelte:72-74). [P3] hint punctuation drift: still open (see sign-up). [P3, carried] show-password toggle: still open. Since sweep 5: the error fill is gone; an empty stopped field now reads as an empty box with a red rule (fixed as intended).

Priority: [P2, new, shared by login, sign-up and forgot] a tap on the submit button straight from a bad email can be lost: the blur inserts the message, the button drops 27 to 36px at 390 (16 to 18 at 1280), and the click lands on nothing. Playwright touch at 390: no click on sign-up and forgot, one on login; mouse at 1280 got through; timing-dependent, unverified on a real phone. Workaround: a second tap. Fix: skip the blur reveal when focus moves to the form's submit (relatedTarget), and let the submit's invalid event show the message. Here: +page.svelte:65. [P3] the message is heard only on return (no live region). [P3, carried] show-password toggle. Persona: Casey on a phone may tap Log in twice after a typo. Strengths: recovery one stop after the password; the subtitle says why you were sent here.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card; forced colours keep the brand box (d727b92). [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
