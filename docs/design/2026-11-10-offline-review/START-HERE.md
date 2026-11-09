# Fork offline work pack

For 10 November 2026, Asia/Hong Kong. Prepared on 9 November for a development laptop.

The best use of this time is to bring your cooking judgment and design taste to Fork: try realistic recipes, make a few concrete interface decisions, and build one small interaction yourself. You do not need another broad roadmap session.

## Start here

Open `index.html` in a browser. It contains local screenshots and links to every worksheet. The gallery needs no server, account, internet connection, remote font, or remote photograph. The screenshots are static design references, not a working application.

Use your editor to fill in `WORKSHEET.md`. Use `RECIPE-CASES.md` for paste examples and `EDITOR-EXERCISE.md` if you want to code. The `references/` folder contains snapshots of the roadmap, design research and current design brief; online citations are optional reading for when you reconnect.

## Choose a useful session

| Time available | Work | Concrete result |
| --- | --- | --- |
| About 90 minutes | Review the editor and Cook screenshots, then write the exact Insert-heading interaction you want. | Three annotated issues and a short interaction specification. |
| Half a day | Add the recipe exercise and journal exercise below. | A small personal recipe corpus, real cooking-log examples, and prioritized product decisions. |
| Most of a day | Also build the isolated editor exercise. | A runnable local HTML experiment you can show the builder. |

These are optional time boxes, not deadlines. Finish one useful artifact rather than starting every exercise.

## Priority 1 — Stress-test the editor with recipes you actually use

Choose three to six recipes: one simple dinner, one with several components, one baking recipe, and one with awkward quantities or notes. Use your own wording or personal source notes. Keep them local; this exercise does not involve publishing recipes.

Write what you naturally want to paste before adapting it to Fork. Then compare that with the proposed `# Heading` structure. Record where you have to think about the tool instead of the recipe. Use the supplied fixtures for additional edge cases, not as a substitute for real cooking experience.

Deliverable: recipe text plus the three most important friction points. If the live app cannot run offline, do this against the screenshots and your text editor; mark it as a design exercise rather than a completed app test.

## Priority 2 — Decide the Insert interaction

The agreed direction is a collapsible Insert toolbar, visible `#` markers, and larger/heavier heading lines. Decide where insertion happens, what is selected, how Enter behaves, and how to undo it. Walk through typing, pasting and using the button. Do not redesign the whole product or introduce more syntax.

Deliverable: a short sequence of actions and expected results, or the optional editor experiment.

## Priority 3 — Write five real journal entries

Record five meals you actually made recently, including an improvised meal, a repeat recipe and a meal without a photo. Write the smallest entry you would willingly make after dinner. Separate what you would share with friends from a private note for next time.

Deliverable: realistic content and a decision about the minimum logging form. Do not invent polished social posts just to make the mockup look good.

## Priority 4 — Cook once, if your day allows it

Use a familiar, trusted recipe. Notice when you look ahead, lose your place, need a quantity, wait, or switch tasks. Write observations after each natural pause. Do not use the synthetic test fixtures as cooking instructions.

Deliverable: a short account of actual friction. If there is no kitchen available, skip this rather than treating a desk simulation as equivalent.

## Current scope and baseline

Cleanup is complete according to your latest verification report. At preparation, the local checkout was `3019fa9`; recent commits already include recipe groups and yield. Do not rebuild those from scratch. Their complete end-to-end behavior was not re-audited for this pack.

Keep MVP work on deletion, approachable recipe structure/yield, privacy/sharing, Journal and Friends. Durable drafts, Trash, party mode, the graphical view and AI remain later work. The latest editor interaction decision supersedes the older textarea-only screenshots. The gallery also shows comments/notifications in places; their appearance is not a new MVP requirement.

See `LOCAL-READINESS.md` before attempting application work. Keep any independent experiment outside production files while another builder may be working.

## Bring back

1. Your three highest-priority observations, with concrete examples.
2. The desired Insert interaction, including undo and paste behavior.
3. A few real recipe and journal examples.
4. Any isolated prototype and its known limitations.

This is enough to turn the next agent session into implementation work rather than another round of guessing.
