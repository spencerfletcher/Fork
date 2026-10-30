---
target: reset password, sweep 5
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/reset-password/+page.svelte"
target_fingerprint: "sha256:20c7f9de263a0235c7ffc106a25b4cd4bd38fbe7759396a070040c30fb2d93f0"
target_path: /Users/spfle/Dev/Fork/src/routes/reset-password/+page.svelte
timestamp: 2026-10-30T02-06-27Z
slug: src-routes-reset-password-page-svelte
---
# Reset password, sweep 5 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no question tool; overlay skipped, detector clean). 30 → 31/40 (1:3 2:3 3:3 4:3 5:3 6:4 7:3 8:4 9:2 10:3). Signed out, no token and ?error_code=otp_expired give the same "Link expired" card (load ignores error_code, so the copy is right for it), subtitle "A reset link works once, and not for long. Ask for a new one.", "Send a new link" 52.4 a link to /forgot-password; 3 styles; fits the viewport; 200% zoom fine; forced colours draw the link-button as a LinkText-bordered box. Tab at 390: skip, brand, search, menu, Send a new link, then out of the page. The form state (needs a real emailed link) was read from source only.

Previous items: [P1, security] any signed-in session could change the password: fixed (0d2df71, 745e699; linkValid needs the recovery cookie, +page.server.ts:39, action re-checks). [P1, unverified on hosted] default PKCE template says "Link expired" on another device: still open, unverified (a dashboard setting; the page handles token_hash). [P3] expired card has no "Log in" line: still open (+page.svelte:50-56; Tab leaves the card after one stop). [P3] owner-state subtitle: resolved by the gate (only someone who came through the link sees the form).

Priority: [P1, carried, unverified] set the hosted recovery template to /reset-password?token_hash={{ .TokenHash }}&type=recovery, or the copy should be "This link didn't work". [P3] add "Remembered it? Log in" under the expired card, as on the other three. [P3] tab title "Reset password — Fork" over the h1 "Link expired". Persona: the cross-device cook still loops if the template is default. Strengths: the expired state always offers a way on and works without JavaScript.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card; aria-current "page" on Log in and Sign up, nothing on the recovery pages. Since the last run (from commits, not exercised signed out): Log out takes the links' 0.9375rem (2689955), Escape closes the phone menu and returns focus (bfebb2e). [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
