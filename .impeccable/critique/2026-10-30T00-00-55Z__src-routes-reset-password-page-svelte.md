---
target_identity: "file:/Users/spfle/Dev/Fork/src/routes/reset-password/+page.svelte"
target_fingerprint: "sha256:20c7f9de263a0235c7ffc106a25b4cd4bd38fbe7759396a070040c30fb2d93f0"
target_path: /Users/spfle/Dev/Fork/src/routes/reset-password/+page.svelte
timestamp: 2026-10-30T00-00-55Z
slug: src-routes-reset-password-page-svelte
---
---
target: reset password, first run
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
---
# Reset password, first run (29 October 2026)

Combined A+B; overlay skipped. 30/40 (1:3 2:3 3:3 4:3 5:2 6:4 7:3 8:4 9:2 10:3) on tree 61dd3ab. Logged out with no link: the "Link expired" state (no redirect), subtitle "A reset link works once, and not for long. Ask for a new one.", primary "Send a new link" (52.4) to /forgot-password; a bogus ?code gives the same; title "Reset password — Fork" in every state. The form: "New password", hint "At least 6 characters" (5.35), "Set password". Strengths: the expired state always gives a way on; "Send a new link" is a link, so it works without JavaScript.

**[P1, security] Any signed-in session could change the password from this page** (the form showed whenever a user was signed in and the action asked for no current password; secure_password_change is off locally; a shared kitchen tablet could lock the owner out). Fixed after the sweep (0d2df71, 745e699): the form and its action require the recovery cookie the emailed link sets, 15 minutes on /reset-password, spent on success; a session merely signed in gets the expired state. **[P1, unverified on hosted]** With Supabase's default recovery template a link opened on another device says "Link expired" (untrue, a loop of new links): set the hosted template to /reset-password?token_hash={{ .TokenHash }}&type=recovery (the page already handles it), or change the copy to "This link didn't work". [P3] The expired card has no "Log in" line like the other two. [P3] The owner-state subtitle "You'll be logged in once it's set." was wrong for someone already signed in (gone with the gate). Persona: a cook who asks on a laptop and opens the email on a phone may loop on expired links until the template is set. Question: the hosted template, or the copy?

## Navbar (shared, all pages)

Small caps Source Sans 15/600 all-small-caps 0.08em, synthesised from the capitals; tan 7.80:1, the current link cream; heights at 1280 links 29, Log in and Sign up 32.8, Log out 31.1, handle 29.7, CTA 37.1; at 390 brand 44.3, icons 44, menu rows 50.4, handle row 48.8; aria-current right for Favorites, the handle, Log in and Sign up; the recovery pages mark nothing. [P3] Log out is 14px beside 15px links (.logout-btn 0.875rem; drop it). [P3] Log in and Sign up sit 1–2px off the left links. [P3] The phone menu does not close on Escape. [P3, carried] Logged-out "Recipes" is current on /recipes/no-such-recipe.
