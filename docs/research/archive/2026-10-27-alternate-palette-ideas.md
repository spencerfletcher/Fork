> Archived 12 Nov 2026: a palette replaced by the shipped tokens in [DESIGN.md](../../../DESIGN.md); nothing here is current. Kept as the research record.

# Design ideas

Input to the UI redesign, priority 2 in `docs/history/2026-10-milestones.md`. Nothing here is applied; it is a palette and a set of observations to weigh when the redesign starts. See `TODO_UI.md` beside it for reference sites.

## Alternate palette: warm parchment with vivid green and golden tags

Saved from an abandoned git stash ("WIP on master: b4f4a36 Design refinements", 2026-03-27) before it was dropped. It predates the current amber-accent palette, so it is a reference, not a patch. Variable names match `src/app.css`.

### Ideas worth keeping

- **Give tags their own color.** Tag pills and the tag input used the accent color, so tags looked like actions. A separate golden ochre tag color sets them apart from buttons and links. Master now has `--color-tag`; the stash's ochre values are an alternative to the current ones.
- **Warm every neutral.** Backgrounds, text, and borders all lean yellow-brown instead of gray, so the page reads as paper rather than a UI.
- **Brighter diff red.** `#c24030` reads as "removed" more clearly than the earlier muted `#8b3a3a`.

### Light theme

| Variable | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#f7eed8` | Page background |
| `--color-surface` | `#fdf6e8` | Cards |
| `--color-surface-2` | `#ede3cc` | Raised or inset surfaces |
| `--color-text` | `#1a1610` | Body text |
| `--color-text-2` | `#4a4438` | Secondary text |
| `--color-text-3` | `#8a8070` | Muted text |
| `--color-accent` | `#4a7c1e` | Vivid green accent |
| `--color-accent-mid` | `#72a832` | Accent hover and mid tone |
| `--color-accent-pale` | `#d4e8b0` | Accent tint |
| `--color-tag` | `#b8880a` | Golden ochre tag text |
| `--color-tag-pale` | `#f5e4a8` | Tag background |
| `--color-border` | `#ddd1b0` | Borders |
| `--color-border-2` | `#cdc09a` | Stronger borders |
| `--color-add` | `#4a7c1e` | Diff: added text |
| `--color-remove` | `#c24030` | Diff: removed text |
| `--color-add-bg` | `#e4f0d4` | Diff: added background |
| `--color-remove-bg` | `#f5e0dc` | Diff: removed background |

### Dark theme

| Variable | Value |
| --- | --- |
| `--color-bg` | `#1a1610` |
| `--color-surface` | `#221e14` |
| `--color-surface-2` | `#2c261a` |
| `--color-text` | `#f0e8d0` |
| `--color-text-2` | `#a89e88` |
| `--color-text-3` | `#6a6050` |
| `--color-accent` | `#72a832` |
| `--color-accent-mid` | `#90c848` |
| `--color-accent-pale` | `#243a10` |
| `--color-tag` | `#d4a830` |
| `--color-tag-pale` | `#3a2e08` |
| `--color-border` | `#38301e` |
| `--color-border-2` | `#4a4028` |
| `--color-add-bg` | `#1e2e10` |
| `--color-remove-bg` | `#301814` |

### Where the stash applied the tag colors

- The `.tag` pill style in `src/app.css`: `color: var(--color-tag)` and `background: var(--color-tag-pale)`.
- The selected-tag chip in `src/lib/components/TagInput.svelte`: the same two variables.

### Before reusing

Fix contrast first. Three light-theme pairs fail the WCAG AA ratio of 4.5:1 for normal text. The dark-theme tag pair passes.

| Pair | Ratio | AA for normal text |
| --- | --- | --- |
| Tag `#b8880a` on `#f5e4a8` | 2.52:1 | Fails badly. Needs a much darker ochre |
| Accent `#4a7c1e` on bg `#f7eed8` | 4.33:1 | Fails narrowly |
| Remove `#c24030` on `#f5e0dc` | 4.07:1 | Fails narrowly |
| Dark tag `#d4a830` on `#3a2e08` | 6.00:1 | Passes |

## From the 2025 design document

The original design brief, kept for the parts that still hold. Its forest-green palette, Inter/Lora pairing, Bits UI component plan and page sketches are superseded by the current amber palette, Instrument Sans/Lora/JetBrains Mono and native elements.

**Philosophy.** Editorial food media meets developer tool: the warmth of a good cookbook with the precision of a well-built product. Reference NYT Cooking's hierarchy and whitespace. No gradients, no decorative flourishes, no hero blobs; the serif/sans pairing does the work.

**Rules still in force.**

- No hardcoded colours in components; every value is a token from `app.css`.
- Section labels (INGREDIENTS, METHOD, DETAILS) are the small uppercase letter-spaced `h4` style, the NYT Cooking pattern.
- Version numbers render in the accent colour; they anchor the history strip. Amber is reserved for actions and version identity.
- The reading column on recipe and compare pages is 720px, centred; ingredients and steps are never stretched full width.
- Shadows belong to cards and floating panels, never buttons.
- Whitespace is generous: at least `--space-5` (24px) between sections.
- Inputs: surface background, 1.5px border, `--radius-md`, a pale accent focus ring.

**Original palette, for reference.** Cream `#f5f0e8` page, `#fdfaf4` surfaces, forest green accent `#3d5a3e` / `#6b8f71` / pale `#c8d5b9`, diff red `#8b3a3a`, with a matching dark block. Superseded by the amber set in `app.css` and the parchment alternative above.
