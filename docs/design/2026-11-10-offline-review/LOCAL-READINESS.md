# Local readiness and what was checked

Prepared 9 November 2026 for offline work on 10 November. Baseline observed: `3019fa9` on the shared local checkout. Another builder may advance it; reconcile before bringing an experiment into the app.

## Available without an application server

- `index.html` and all eight full-page screenshots in `images/`.
- The work plan, worksheet, synthetic recipe cases and editor exercise.
- Local copies of the roadmap, design research and MVP design brief in `references/`.
- The repository source and already-installed dependencies on this laptop.

The screenshot gallery deliberately uses existing local PNGs. The original mockup HTML hotlinks Unsplash photos, which may fail offline; the screenshots preserve the images without requiring downloads. These static screens predate the live Insert-toolbar decision and show illustrative data. They are references, not current production evidence.

## Verified now

This focused command completed successfully: four files, 141 tests passed. It does not require the recipe database in the tested configuration.

```sh
cd /Users/spfle/Dev/Fork
pnpm exec vitest run src/lib/recipes/groups.test.ts src/lib/recipes/ingredients.test.ts src/lib/recipes/steps.test.ts src/lib/recipes/scale.test.ts
```

Keep installed dependencies in place. This pack does not include `node_modules` or guarantee that reinstalling packages will work offline. The tests were run with the machine's ordinary networking state; no network-disconnection test of the application was performed.

## If you want to use the full application

Before disconnecting, start your existing local development setup and confirm you can load a recipe and the editor using local services. Do not assume `pnpm dev` alone makes hosted authentication, database connections, storage or photographs available offline. Use a local test recipe; do not run a hosted seed/reset command as preparation.

If that setup is not ready, the gallery, fixtures and standalone editor exercise still work without it. Spending the whole offline session repairing infrastructure would be a poor use of the time.

## What not to carry in this pack

No environment files, tokens, database dumps, account sessions, third-party downloads or production data are included. The research documents contain links to online sources; the findings are readable offline, but those source pages are not archived here.

## Before you leave

- Open `index.html` and a full-size screenshot directly from disk.
- Open `WORKSHEET.md` in your editor and confirm you can edit it.
- Keep the repository and this folder on the laptop, not only in a cloud placeholder.
- Copy any personal recipes/photos you want to work with onto the laptop yourself.
- If another builder remains active, keep your experiment in its own agreed folder and do not switch the shared branch.

No application code, database or system networking was changed while preparing this pack.
