# Product-reference patterns for Fork

## Which references offer useful principles without becoming a template?

### Takeaway
Use the references as a menu of mechanisms: Bear for an edited document, Things for quiet focus, Linear for consistent action placement and controlled density. Todoist, Obsidian, and Claude are light taste signals, not design requirements. None supplies evidence that Fork needs a new palette or an application-wide redesign.

Research date: 8 November 2026. Evidence below is official documentation or first-party design writing, not a usability study. “Documented” means the vendor describes the behavior; “vendor intent” means its stated rationale, not independently demonstrated efficacy. No authenticated product session was tested. No screenshot was successfully rendered for visual inspection in this research pass.

### Cited Findings
- **Bear — documented:** A note combines text, images, attachments, and links. A formatting button exposes operations without requiring Markdown knowledge. Optional syntax hiding retains formatting. Heading/list folding reveals local controls; a separate Info Panel holds counts, last edit, table of contents, and backlinks. Read-only is available through the note menu. This is a useful document/control separation, not evidence for giving Fork a generic Markdown model. [Bear editor guide](https://bear.app/faq/how-to-use-bears-editor/), undated live help.
- **Bear — documented:** Editor typography has separate controls for font, size, line height, line width, paragraph spacing, and indentation. On iOS, the line-width setting affects iPads only. The transferable concern is comfortable text measure across devices; a full theme/font customization system is not necessary. [Typography options](https://bear.app/faq/typography-options/), undated live help.
- **Things — documented:** Slim Mode hides the sidebar. Navigation remains possible through Quick Find, and on Mac through a navigation popover. Hiding navigation does not remove the navigation model. The help describes dragging the sidebar boundary and a keyboard shortcut; a discoverable touch control would be preferable for a kitchen screen. [Show and hide Things’ sidebar](https://culturedcode.com/things/support/articles/3238254/), undated live help.
- **Things — documented:** Quick Find searches item/project/tag names initially, then “Continue Search” expands to notes, checklists, and completed items. When the sidebar is hidden, clicking the list name also opens navigation. This provides a concrete example of scoped search, but its two-stage scope can hide expected results. [Quick Find](https://culturedcode.com/things/support/articles/2803584/), undated live help.
- **Things — documented constraint:** Notes support Markdown, menus, and keyboard formatting. The syntax remains visible; title styling and text-color customization are restricted. Photos and attachments are not supported in notes. Borrow constrained presentation, not these content limitations: food photographs are central to Fork’s direction. [Writing notes](https://culturedcode.com/things/support/articles/4438545/), undated live help.
- **Linear — vendor design intent and documented changes:** Its March 12, 2026 refresh addresses actions appearing in inconsistent places, dims navigation relative to content, reduces icon ornament, softens separators, and moves the default palette toward less saturated warm gray. The authors explicitly seek to retain information density. They describe iterative refinement, not a wholesale aesthetic replacement. This is a useful rationale for tuning Fork’s hierarchy within its existing warm palette. No measured scanning-speed or satisfaction result is given. [A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh).

### Inferences
- The most promising combination is cookbook-like content presentation with restrained, stable application controls. This is a design hypothesis for Fork, not a published finding about cooks.
- Avoid importing Things’ task-completion ontology, Bear’s general-purpose note model, or Linear’s issue-tracker density. Recipe ingredients, steps, cooking outcomes, and versions have different roles.
- Keep palette and typography decisions contingent on inspecting Fork itself. This study does not establish current contrast, spacing, or interaction defects.

### Gaps
- No comparative task-completion studies across these products were sought; popularity, awards, and testimonials are not evidence of usability.
- No primary source here establishes an ideal recipe-editor line length, exact touch-target size, or optimal information density. Those need domain/accessibility evidence and device-level validation.

## What transfers from capture, disclosure, editing, and recovery?

### Takeaway
The common mechanism is preserving the content object while progressively revealing secondary controls. Capture should be easy to begin; recovery and navigation must remain accessible when the interface becomes quieter.

### Cited Findings
- **Todoist — documented:** Quick Add opens from an Add task action or Q. Actions appear while typing and are also available through a plus control. Description is disclosed separately and can be configured to stay visible. Automatically recognized date text can be returned to plain text by clicking/tapping it. This is a concrete reversible-interpretation pattern, not evidence that recipes should use natural-language parsing. Page updated September 1, 2026. [Quick Add](https://www.todoist.com/help/todoist/features/use-task-quick-add-in-todoist-va4Lhpzz).
- **Todoist — documented:** Users can hide sidebar views and counts; hidden views remain reachable through a command menu or More. Desktop/web sidebar visibility has an explicit toggle. Page updated October 9, 2026. Borrow recovery from disclosure, not necessarily sidebar-customization settings. [Sidebar and navigation](https://www.todoist.com/help/todoist/features/customize-the-sidebar-and-navigation-menu-in-todoist-S9JLTYqZV).
- **Obsidian — documented:** Live Preview formats text inline and reveals Markdown syntax when the cursor enters formatted content. Reading and source views are available separately. This shows how editing can stay close to the rendered document; it does not imply structured ingredient fields should become raw Markdown. [Views and editing mode](https://obsidian.md/help/edit-and-read), undated live help.
- **Obsidian — documented:** Desktop has collapsible sidebars and splittable tab groups; mobile has bottom navigation, sidebars opened by swipes, and an editing toolbar above the keyboard. That is adaptation by device rather than a single compressed desktop layout. [Workspace](https://obsidian.md/help/workspace), undated live help.
- **Obsidian — documented:** File Recovery takes snapshots, provides a “Show changes” comparison, and has retention and file-type limits; it is explicitly not a complete backup. Recovery and durable version history are different promises. Do not model Fork’s append-only recipe history after a temporary recovery cache. [File recovery](https://obsidian.md/help/plugins/file-recovery), undated live help.
- **Claude — documented:** Artifacts are independently revisitable outputs, open beside conversation, and can be directly edited when created from a template. Selected text can be targeted for revision. Editing an earlier message can create another conversation direction with its own artifacts. This supports separating an enduring object from the discussion around it; it does not justify chat as Fork’s primary editor. [Artifacts help](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them), fetched November 8, 2026; page uses a relative update date.

### Inferences
- Distinguish **recipe**, **cooking journal entry**, and **discussion** in the UI. A cook’s observation should not silently rewrite the recipe, and a comment should not masquerade as a new recipe version. Claude’s object/conversation distinction is a useful analogy, not a complete version-control specification.
- A compact editor can still show the fields needed for the current task. Progressive disclosure is a poor excuse to hide ingredients, quantities, or step order during recipe editing.
- Keep saved-state feedback, Undo, and version recovery conceptually separate. Do not label a merely autosaved draft as a published recipe revision.

### Gaps
- These sources do not verify Fork’s existing persistence, undo, import, or version semantics. Any proposal must first map to what the implementation already does.
- Claude help has changed substantially over time. The current article does not establish that all artifact types have a uniform version-history selector. Do not cite old screenshots as proof of current history behavior.

## Which concrete patterns should Fork test, and what visual references are reviewable?

### Takeaway
Prefer a small refinement pass: stable controls, readable recipe content, progressively disclosed secondary information, and a deliberately quieter Cook state. These are testable proposals, not a mandate for six products’ combined feature sets.

### Cited Findings
Official visual-reference shortlist, for human review or a later screenshot pass:
- [Linear’s 2026 design refresh](https://linear.app/now/behind-the-latest-design-refresh) includes before/after sidebar, tab, and separator images. **Actually reviewed:** article text and image captions. **Not visually inspected:** image pixels; direct image fetches failed. Useful for hierarchy and chrome, not a dark-theme recommendation.
- [Bear typography options](https://bear.app/faq/typography-options/) links a typography-settings screenshot. **Actually reviewed:** controls listed in the page. **Not visually inspected:** the fetched image exposed no readable/rendered content. Useful for comparing body text, headings, spacing, and line measure rather than copying settings UI.
- [Things writing notes](https://culturedcode.com/things/support/articles/4438545/) includes styled-note screenshots. **Actually reviewed:** written behavior and limitations. **Not visually inspected:** image fetch failed. Useful for restrained title/body hierarchy, subject to inspecting the screenshots later.

### Inferences
Eight actionable mappings, ordered roughly by impact and reversibility:

1. **Establish a stable action hierarchy per state.** Recipe overview: Cook is prominent, Edit/Save/Share are secondary according to ownership and saved status. Editor: the existing save/publish operation stays predictably located. Keep secondary actions in the same place across screens. Borrow Linear’s consistency principle; determine actual labels from Fork’s behavior. Trade-off: one shared action location must still work on narrow screens. [Rationale](https://linear.app/now/behind-the-latest-design-refresh).
2. **Let content carry the warmth.** Preserve the coherent cream/espresso/clay/marigold direction unless inspection finds a defect. Use food photography as the visual highlight in browsing and recipe overview; keep the working editor restrained; minimize the hero during active Cook so ingredients and instructions occupy the screen. Reserve strong interface color for actionable/selected states, with meaning also expressed in text or shape. This is a Fork-specific inference from attention hierarchy, not a palette prescribed by any reference. [Hierarchy rationale](https://linear.app/now/behind-the-latest-design-refresh).
3. **Make editing resemble the resulting recipe.** Keep headings, ingredient groups, quantities, and steps spatially recognizable; show row-level controls on focus/interaction without hiding keyboard access. Put optional attribution and metadata in a clearly labeled disclosure. Preserve structured ingredient semantics. [Editing analogy](https://obsidian.md/help/edit-and-read); [formatting controls](https://bear.app/faq/how-to-use-bears-editor/).
4. **Capture first, enrich next.** If Fork already supports imports/drafts, begin with the source or title and a clear next action; reveal secondary details after content exists. Any parsed ingredient interpretation should be inspectable and correctable before commitment. Do not introduce an AI parser merely to imitate Todoist. Trade-off: a shorter start needs an obvious route to finish incomplete recipes. [Reversible recognition analogy](https://www.todoist.com/help/todoist/features/use-task-quick-add-in-todoist-va4Lhpzz).
5. **Use Cook as an explicit focus state.** Reduce global navigation and social/history chrome, retain clear exit/back behavior and access to needed recipe context. Do not rely on hover-only discovery or gestures to recover navigation. Desktop editing and kitchen use deserve different density. [Slim Mode](https://culturedcode.com/things/support/articles/3238254/); [mobile/desktop adaptation](https://obsidian.md/help/workspace).
6. **Keep the journal beside the recipe conceptually.** Present dated outcomes/photos and “what I changed” as a readable chronology; link an entry to the recipe version cooked where supported. Secondary discussion should not overpower ingredients or method. Do not add a permanent split pane just because Claude uses one. [Object/discussion analogy](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them).
7. **Expose meaningful recovery, not a technical history dashboard.** Start history with date, human summary, and ingredient/step changes; allow inspecting a version before any restore operation. Respect append-only storage. Separate draft recovery from intentional revision history. Trade-off: simplification must not hide which version is being cooked or edited. [Snapshot comparison and limitations](https://obsidian.md/help/plugins/file-recovery).
8. **Tune density by content, not by shrinking everything.** Give prose a controlled measure; let ingredients use compact aligned rows; increase separation between meaningful sections rather than boxing every subsection. Keep labels readable and controls usable. Validate at phone, tablet, and desktop widths. Avoid inheriting Things’ second-stage search unless users can see its scope. [Typography concerns](https://bear.app/faq/typography-options/); [search-scope trade-off](https://culturedcode.com/things/support/articles/2803584/).

### Gaps
- No live Fork UI was assessed by this researcher; these mappings are candidates for the coordinator’s current-product audit.
- No package installation, app edits, account access, or visual redesign was performed. The primary risk is copying attractive documented patterns without testing recipe editing and cooking tasks in Fork; the evidence supports inspiration, not efficacy claims.
