---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/forgot-password/+page.svelte"
target_fingerprint: "sha256:7a864c1a9d5438562d7994b7465d7c678ab8ba295cc3f199a370789763670c1c"
target_path: /Users/spfle/Dev/Fork/src/routes/forgot-password/+page.svelte
timestamp: 2026-10-30T00-00-55Z
slug: src-routes-forgot-password-page-svelte
---
---
target: forgot password, first run
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
---
# Forgot password, first run (29 October 2026)

Combined A+B; overlay skipped; typed into, not submitted (the form sends a real email). 34/40 (1:3 2:4 3:4 4:3 5:3 6:4 7:3 8:4 9:3 10:3). Title "Reset password — Fork", h1 "Reset password", subtitle "We'll email you a link to set a new one.", "Send reset link", switch line "Remembered it? Log in" 27.1/47.1; 5 styles; Tab bar, email, Send reset link, Log in. The sent state (read from source) replaces the form with "Check your email" and focus moves to it; "If {email} has an account, a link to set a new password is on its way." never says whether the address exists, and the error path does not either. Strengths: short copy in Fork's voice; the sent state does not leak accounts.

Priority: [P3] two steps share one name ("Forgot password?" lands on "Reset password" and the next step is also "Reset password"): "Forgot your password?" here, "Reset password" for the step that sets it. [P3] The sent state offers nothing if the email never comes: a "Not there? Check spam, or send again" line. Persona: someone who mistyped their address is told a link is on its way with nothing to say it never will be. Question: add a send-again line? The three-page flow reads as one visually (same card, 5 styles, marigold primary, Bitter clay h1) and in voice; it splits on the case drift with login and the shared name.

## Navbar (shared, all pages)

Small caps Source Sans 15/600 all-small-caps 0.08em, synthesised from the capitals; tan 7.80:1, the current link cream; heights at 1280 links 29, Log in and Sign up 32.8, Log out 31.1, handle 29.7, CTA 37.1; at 390 brand 44.3, icons 44, menu rows 50.4, handle row 48.8; aria-current right for Favorites, the handle, Log in and Sign up; the recovery pages mark nothing. [P3] Log out is 14px beside 15px links (.logout-btn 0.875rem; drop it). [P3] Log in and Sign up sit 1–2px off the left links. [P3] The phone menu does not close on Escape. [P3, carried] Logged-out "Recipes" is current on /recipes/no-such-recipe.
