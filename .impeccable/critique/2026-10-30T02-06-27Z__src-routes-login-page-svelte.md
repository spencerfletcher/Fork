---
target: login, sweep 5
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/login/+page.svelte"
target_fingerprint: "sha256:580e823258f907318ae82e87bc9aacd9666ca0eda924dcdfc6edc3e35c188b39"
target_path: /Users/spfle/Dev/Fork/src/routes/login/+page.svelte
timestamp: 2026-10-30T02-06-27Z
slug: src-routes-login-page-svelte
---
# Login, sweep 5 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no question tool; overlay skipped, detector run). Trend 23 → 25 → 27 → 28 → 31 → 33/40 (1:4 2:3 3:3 4:4 5:3 6:3 7:3 8:3 9:4 10:3). Title "Log in — Fork", h1 "Welcome back" (sentence case), Bitter 40/33/28 clay 5.84; 5 styles, lowest contrast 5.35 (labels); page exactly the viewport at 390/768/1280; no overflow at 200% zoom (640 CSS px); forced colours keep card, input and button borders and a 2px ring; no transitions under reduced motion. Tab at 390: skip, brand, search, menu, email, password, Forgot password? (103×47.1). "jane@" then Tab: aria-invalid, describedby email-error, "Enter an email address like name@example.com" 14px #a3362b, red border; fixing it clears both; a stopped submit shows the same. Detector: 1 advisory, line 117 font-size 0.875rem off the ramp, a false positive (the 14px hint step the page already uses).

Previous items: [P2] Title Case heading: fixed (c517a63). [P3] bad email silent: fixed (e90b512). [P3, carried] no show-password toggle: still open.

Priority: [P3] the email message is not announced as it appears (no live region; heard on return through describedby), as with the sign-up rule. [P3] hint and message punctuation drifts across the auth pages: "Enter an email address like name@example.com" (line 73) and "At least 6 characters" end bare while "3 to 30 letters, digits, - or _." ends with a stop; pick one (no stop on single-clause hints). [P3, carried] show-password toggle. Persona: Sam hears the email error only on returning to the field. Strengths: recovery one stop after the password; the subtitle says why you were sent here.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card; aria-current "page" on Log in and Sign up, nothing on the recovery pages. Since the last run (from commits, not exercised signed out): Log out takes the links' 0.9375rem (2689955), Escape closes the phone menu and returns focus (bfebb2e). [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
