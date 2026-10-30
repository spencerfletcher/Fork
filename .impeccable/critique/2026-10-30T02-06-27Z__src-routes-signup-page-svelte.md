---
target: sign-up, sweep 5
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/signup/+page.svelte"
target_fingerprint: "sha256:f8e05291a373a7c625a49ef3baa84a1ed24f9283815e8311f071daebec9ee061"
target_path: /Users/spfle/Dev/Fork/src/routes/signup/+page.svelte
timestamp: 2026-10-30T02-06-27Z
slug: src-routes-signup-page-svelte
---
# Sign-up, sweep 5 (29 October 2026)

Single context, A+B combined (brief-scoped reviewer, no question tool; overlay skipped, detector clean). Trend 22 → 28 → 29 → 31 → 31 → 33/40 (1:3 2:3 3:3 4:4 5:4 6:3 7:3 8:3 9:4 10:3). Title "Create an account — Fork", h1 sentence case; 5 styles, lowest 5.35; fits the viewport at 390/768/1280 in every state; 200% zoom no overflow; forced colours keep borders and ring. Username rule at 390: "Jane.Doe+1987@example.com" prefills janedoe1987, valid, left alone stays valid; "Jane Doe" + Tab gives aria-invalid, describedby "username-rule username-hint", rule "Usernames are 3 to 30 characters: letters, digits, - or _" and the hint drops its repeat; "ab" keeps it; "jane_doe-1" clears it; a later email edit leaves the typed handle alone. Bad email "jane@": same message and aria wiring as login, focus moves on to username, clears when fixed. "Log in" 35×47.1 at 390.

Previous items: [P2] Title Case h1 and tab title: fixed (c517a63). [P3, carried] the rule not announced as it appears: still open (and now shared by the email message). [P3] server-side username errors: not exercised (no submit allowed).

Priority: [P3] neither the rule nor the email message is live; a screen reader hears them only on return. Fix: one polite live region per field, or accept on-return as the rule. [P3] hint punctuation: "3 to 30 letters, digits, - or _." (line 142) has a stop, "At least 6 characters" (line 157) and the rule (line 137) do not. [P3] while typing "jane@" the username prefills "jane" before the address is valid; harmless (valid handle, replaced as the email grows). Persona: none blocking for Jane. Strengths: the rule appears and clears with the value; the prefill respects a typed handle.

## Navbar (shared, all pages)

Signed out at 390/768/1280: Skip to content 44, brand 44.3, phone icons 44, desktop links 29, Log in and Sign up 32.8, rings marigold 2px offset 2 on the bar and clay 2px offset 2 in the card; aria-current "page" on Log in and Sign up, nothing on the recovery pages. Since the last run (from commits, not exercised signed out): Log out takes the links' 0.9375rem (2689955), Escape closes the phone menu and returns focus (bfebb2e). [P3, carried] Log in and Sign up sit 32.8 tall beside 29px left links.
