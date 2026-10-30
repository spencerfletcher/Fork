---
target: reset password, sweep 7
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/reset-password/+page.svelte"
target_fingerprint: "sha256:c4f55f85d7063f6019173f1fe46a7f1aada85f82d63e72ac424ca7acb22b27c7"
target_path: /Users/spfle/Dev/Fork/src/routes/reset-password/+page.svelte
timestamp: 2026-10-30T04-04-57Z
slug: src-routes-reset-password-page-svelte
---
# Reset password, sweep 7 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no sub-agent split, no question tool; overlay skipped, detector clean). 30 → 31 → 33 → 33/40 (1:3 2:3 3:4 4:4 5:3 6:4 7:3 8:4 9:2 10:3). No source change since sweep 6. Signed out, no token and ?error_code=otp_expired give the same card: tab title "Link expired — Fork", h1 "Link expired", subtitle "A reset link works once, and not for long. Ask for a new one.", "Send a new link" 52.4 to /forgot-password, then "Remembered it? Log in" 35×47.1 at 390; Tab at 390: skip, brand, search, menu, Send a new link, Log in. Fits the viewport at 390/768/1280; 200% zoom fine; forced colours draw the link-button with a LinkText border. 4 type styles, lowest 5.84. The form state (needs a real emailed link) read from source only.

Previous items: [P1, carried, unverified on hosted] default PKCE recovery template says "Link expired" on another device: still open (dashboard setting; the page handles token_hash, +page.server.ts:21-36); nothing in the repo records the template being changed. [P3] subtitle leaves "one." alone on the second line at 1280: still open (resetErr-1280.png; .auth-subtitle in app.css:917 has no text-wrap). [P3] "At least 6 characters" (+page.svelte:43) shares sign-up's punctuation question: still open.

Priority: [P1, carried, unverified] set the hosted recovery template to /reset-password?token_hash={{ .TokenHash }}&type=recovery, or the copy must stop blaming the link's age. [P3] text-wrap: pretty on .auth-subtitle. [P3] the form has no confirm field and no show-password toggle, so a typo in the only box sets a password nobody knows (recovery is another reset; read from source). Persona: the cross-device cook still loops if the template is default. Strengths: the expired state matches its siblings and works without JavaScript.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card. [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
