# A small editor experiment you can build yourself

Goal: learn what the Insert interaction should feel like. Keep this a standalone experiment, not a second implementation of the production recipe model.

Create a new folder such as `docs/design/2026-11-10-editor-experiment/`. If a builder is still changing the shared checkout, agree that this folder is yours; do not switch its branch or edit production files underneath it. A single HTML file with embedded CSS and JavaScript can run by double-clicking it, with no new packages or network access.

## First useful version

1. One ordinary textarea containing a fixture recipe.
2. A native collapsible `details` element labelled Insert.
3. A Section heading button.
4. Clicking inserts `# Section name` at a deliberate position and selects `Section name`.
5. A read-only preview uses larger/heavier heading text with a visible, softer `#`.

This first version tests insertion and interpretation. A separate preview is not the final inline-formatting interaction. Only attempt live in-place styling after the simpler prototype behaves correctly; a native textarea cannot apply different font sizes to individual lines.

## Useful browser primitives

- `textarea.selectionStart` and `selectionEnd` identify the selected text range.
- `textarea.setRangeText(text, start, end, selectionMode)` replaces a range.
- `textarea.setSelectionRange(start, end)` selects the inserted name.
- `textarea.focus()` returns keyboard focus after the toolbar action.
- An `input` event handler updates a preview after typing. Programmatic replacement needs an explicit preview/state update too.
- `document.createElement` and `textContent` render literal recipe text safely. Do not put raw input into `innerHTML`.
- Native `details`/`summary` gives a collapsible control without a UI package.

These primitives do not guarantee the undo behavior you want. Test Undo/Redo explicitly rather than assuming a programmatic text edit behaves like typing.

## Decisions worth your attention

Does Insert split the current line, insert before it, or insert after it? What should happen to selected text? Does Enter after a heading create a normal ingredient line? How does someone turn a heading back into ordinary text? How much interpretation feedback is useful before it becomes noise?

Try a heading marker color that is quieter than the name but still easy to read. Styling must not be the only way to understand the section. Do not spend the session choosing a new palette.

## Check before calling the experiment useful

- Typing and button insertion produce identical text.
- The name selection is correct in an empty editor and between existing lines.
- Multiline paste and copying back out preserve all text and `#` markers.
- `#10 can` stays ordinary text; `# Dough` becomes a heading.
- Undo/Redo does not unexpectedly remove unrelated typing.
- Tab navigation and the Insert button work without a mouse.
- Long wrapped lines remain readable at a narrow width.
- The recipe is still usable with no sections at all.

Save a short note describing what works, what failed, and whether you still want this interaction. That note is more valuable than turning the prototype into production code prematurely.

## Stop here

No database, accounts, persistence, drag handles, general Markdown, rich-text package, Cooklang parser, party mode or dependency graph. The production groups/yield work already exists in the preparation baseline; do not rebuild it here.
