# Fork: repository reconciliation

2026-09-09. Source inspection of the local checkout; live behavior and database policies have not been exercised. Existing untracked `AGENTS.md` and `TODO_UI.md` belong to the user and remain untouched.

## What exists and what needs adjustment

### Write and edit

**Evidence:** `src/routes/recipes/new/`, `src/routes/recipes/[slug]/edit/`, ingredient and step editors

Manual structured entry exists. New recipe visibility is checked public. Metadata and content save separately; draft recovery is not established.

### Find your recipes

**Evidence:** `src/routes/recipes/+page.server.ts`, `src/routes/search/+page.server.ts`

Personal library exists; global search includes public recipes and the caller's own private recipes. Ingredient search scans historical versions too.

### Read and cook

**Evidence:** `src/routes/recipes/[slug]/+page.svelte` and components

Ingredients, method, and a responsive layout exist. Touch/keyboard kitchen usability requires browser verification. No confirmed cooking-record flow.

### Preserve formulations

**Evidence:** `recipe_versions` in `src/lib/server/db/schema.ts`, edit action and version strip

Ingredients and steps append as revisions. Servings, title, description, image, and times are mutable metadata, so an old revision is not a complete historical recipe snapshot.

### Add a step note

**Evidence:** `StepEditor.svelte`, edit form, `saveVersion`

UI enables annotations, but the action rebuilds each step with only number and text. Notes are discarded. These annotations are recipe content, not private cooking observations.

### Share and adapt

**Evidence:** Detail load/action and `components/RecipeActions.svelte`

Anonymous public reading, authenticated independent copies, parent attribution, and share metadata exist. A favorite is only a bookmark. Copying inherits source visibility; UI excludes owners and historical views, and the action always copies the latest version. Source revision identity is not stored.

### Privacy

**Evidence:** Detail load, search load, RLS migration

Direct private detail access is checked, but a public child's returned parent object has no visibility check. Search tag options are not visibility-filtered; fork counts include private copies. RLS migration documents a privileged application connection, so route checks matter. Runtime exposure still needs regression verification.

### Import, records, components, default, export

**Evidence:** Routes and schema

No implemented URL importer, independent notes/attempt model, linked component revisions, default variation selection, or recipe export found.

No rewrite is indicated. Existing append-only content and independent-copy transactions are useful foundations. Preserve old versions and existing public recipes when changing defaults.

## Proposed first complete slice: deliberately share and adapt

User benefit: send a friend a recipe, let them adapt it privately, and receive their deliberately published variation without changing the original.

1. Start new recipes and independent copies privately. Keep public publishing explicit and explain that it makes the recipe publicly readable. Preserve existing visibility choices. Align any schema default change through a migration tested against a local production-shaped schema.
2. Restrict parent attribution data returned to readers to what they may see. Keep ancestry internally when a source becomes private; render a neutral unavailable-source attribution instead of its private title or description. Check shared responses, previews, tag options, and counts for private information.
3. Label editable copies as variations and distinguish them from bookmarks. Explain the private copy before submission; make a public link easy to copy and share back. Keep the first slice on the latest published formulation unless source-version pinning is explicitly included.

Acceptance: owner creates privately; strangers cannot read it; owner publishes; an anonymous friend reads it; a signed-in friend saves a private independent variation, edits it, publishes it, and shares it back. Source contents and history remain unchanged. A subsequently private source leaks no private parent data through the public variation. Failed actions report failure without falsely claiming a save or hiding entered work.

Verification plan: failing server tests first for private creation/copy and parent disclosure; component tests for visibility and variation/bookmark language; then two-account end-to-end checks with anonymous reading and mobile/keyboard use. Run the unit suite and type checks, and exercise SSR locally before committing. Existing detail and edit server tests provide patterns; creation and changed UI need new coverage.

Trade-off: this uses public/private links, not unlisted access or collaboration permissions. It finishes a useful social loop but does not finish the milk-tea reproduction loop. No schema for future cooking records or components is needed merely to share an independent copy.

## Follow immediately with reliable personal refinement

Fix step-annotation loss with a regression test and validated persistence; do not present those recipe annotations as private notes. Address clear save errors and preservation of unsaved work. Then finish one private observation tied to a revision, one component and its pinned revision, and choosing a default formulation without rewriting history. Servings/batch information needs explicit preservation before claiming reproducible historical results.

Add supported structured URL import with review and source attribution, manual/pasted fallback, and useful export in bounded slices. Full offline editing, broad social discovery, pull requests, AI, and commerce remain separate scope. An automatic cooking session never counts as a confirmed cook.

## Planning changes in this pass

Updated the accessible vault `ForkV2.md`, retaining its original backup and all original `Fork.md` content. Moved simple sharing early, separated household collections from professional operations, added the creator-collection experiment, and recorded actual implementation gaps. Marked the old repository roadmap as historical without deleting its detailed designs.

Application behavior is unchanged in this planning pass. The next implementation slice is ready for the repository-required check-in before execution.
