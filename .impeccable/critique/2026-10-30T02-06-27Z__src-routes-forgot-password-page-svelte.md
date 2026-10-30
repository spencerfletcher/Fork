---
target: forgot password, sweep 5
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/forgot-password/+page.svelte"
target_fingerprint: "sha256:d84769c5e932ca779e6f78a7726383df8727b508dc302f50cfd4207a07fdc6b6"
target_path: /Users/spfle/Dev/Fork/src/routes/forgot-password/+page.svelte
timestamp: 2026-10-30T02-06-27Z
slug: src-routes-forgot-password-page-svelte
---
# Forgot password, sweep 5 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no question tool; overlay skipped, detector clean). The POST was intercepted with page.route and fulfilled locally; nothing reached Supabase. 34 → 35/40 (1:3 2:4 3:4 4:3 5:3 6:4 7:3 8:4 9:4 10:3). Title and h1 "Forgot your password?", subtitle "We'll email you a link to set a new one.", "Send reset link" 52.4; 5 styles, lowest 5.35; Tab at 390: email, Send reset link, Log in. Bad email "jane@": aria-invalid, message, red border, clears when fixed; a stopped submit focuses the field. Sent state (fulfilled response, 77-character address): h1 "Check your email" takes focus (tabindex -1, no ring by design), the address breaks inside the card with no horizontal scroll, "Didn't get it? Send again." 69×48.8 at 390 and 28.8 at 1280, then "Log in". Send again brings the form back with the address filled and focus in the field.

Previous items: [P3] two steps share one name: fixed (4de0387, "Forgot your password?"). [P3] nothing if the email never comes: fixed (Send again). Mistyped-address persona: resolved, the address is shown and Send again refills it for correction.

Priority: [P3] the sent state keeps the tab title "Forgot your password? — Fork" under the h1 "Check your email" (title from +page.server.ts:5, page line 30); a tab-switcher or screen-reader title read says the wrong step. Fix: title follows the sent state. [P3] Send again only restores the form; a second press is needed, fine, but the line could name spam ("Check spam, or send again"). [P3] email message not live, as on login. Strengths: no account enumeration in either path; the recovery loop now closes on itself.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card; aria-current "page" on Log in and Sign up, nothing on the recovery pages. Since the last run (from commits, not exercised signed out): Log out takes the links' 0.9375rem (2689955), Escape closes the phone menu and returns focus (bfebb2e). [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
