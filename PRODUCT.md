# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two confirmed audiences, equal weight:

- Home cooks who tweak recipes over time and want each change kept with a reason, not lost in a notes app.
- The owner, using Fork as a personal cookbook: creating recipes, reading them while cooking, keeping the ones worth keeping.

Reading happens on a phone or an iPad propped on the counter and on a desktop. Mobile must be high quality, but the desktop and iPad layout is designed in its own right, never derived from the phone layout.

## Product Purpose

A recipe platform that treats recipes the way git treats code: every edit is a version with a commit message, any public recipe can be forked with attribution, and any two versions can be diffed. Success is a recipe you can read and cook from without friction, a recipe you can create without friction, and a history that tells you what changed and why.

## Positioning

Three things together, which a neighbouring recipe site cannot claim at once: a clean reading experience, a clean creating experience, and versioning (history, forks with attribution, diffs). Versioning is a differentiator, not the product's whole identity; the reading and creating experience carry equal weight.

## Operating Context

- Reading a recipe while cooking: hands busy, device at arm's length, ingredients and method scanned repeatedly.
- Creating or editing a recipe: a form with title, description, servings, times, ingredients, steps, photo, tags and visibility; one Save button appends a version when content changed and updates settings in place otherwise.
- Browsing: a feed, search (Postgres full-text with ingredient matching), tag pages, favorites, user profiles.
- Comparing: a diff page between any two versions; a sample diff is shown on the logged-out landing page.

## Capabilities and Constraints

- Versioning is linear per recipe: append-only versions numbered 1..n, each a full snapshot. No branching, no merging. A fork is a copy with a pointer home.
- Gram weights are shown beside ingredients, computed from a local density table; whole-item weights are estimates and are labelled as such.
- A recipe may have no photo. Layouts must hold without one.
- Pre-production: the only real data is seed data (four recipes, one author). No backward compatibility with stored data is required.
- Not in the product and must not be shown: pull requests, merging, comments, following, collections, ratings, macros, pricing, pantry search, AI features, export.
- Stack: SvelteKit, TypeScript, Tailwind 4, Drizzle, PostgreSQL on Supabase, deployed on Netlify at recipes.spencerfletcher.com.
- Terminology: an ingredient's number is `quantity`; a saved edit is a version with a commit message; a copy is a fork.

## Brand Commitments

- Name: Fork, wordmark "Fork." with a marigold full stop. Favicon and an Open Graph image exist in `static/`.
- The current visual system (cream paper ground, clay accent, marigold action colour, Bitter for display, Source Sans 3 for text, JetBrains Mono for version chips, bylines and labels) is the incumbent, not a binding commitment. The owner wants it examined for correctness; any part may change if the examination shows it should. Monospace accents are a deliberate choice the owner has reaffirmed and should be kept unless there is a strong, specific reason.
- Versioning UI (version chip, version bar, diff) is wanted but not sacred: if it harms the reading or creating experience on a surface, it may be reduced or removed from that surface.
- Voice: plain, specific, no marketing filler. Commit messages read as a cook's note ("Chill the dough and shift the sugar toward brown").

## Evidence on Hand

- Four seed recipes with real content in `src/lib/server/db/seedData.ts`; three carry Unsplash photos, one has none.
- Screenshots in `docs/screenshots/`.
- A design research note in `docs/research/2026-10-26-ui-design-directions.md`.
- No testimonials, no user counts, no press, no ratings. None may be invented.

## Product Principles

1. The cook comes first: a recipe must be readable at arm's length and scannable mid-task.
2. Creating should feel as light as reading; the editor is a product surface, not a back office.
3. History is honest: versions are never rewritten, forks always credit their source, and nothing claims a change that did not happen.
4. Show only what is true: no fabricated proof, no invented numbers, no features the codebase does not have.
5. Desktop, iPad and phone are each composed on purpose.

## Accessibility & Inclusion

Interactive elements need keyboard support and ARIA where appropriate (project rule). Text in diffs must clear 4.5:1 against the surface behind it (tested in e2e). No other product-specific requirement established.
