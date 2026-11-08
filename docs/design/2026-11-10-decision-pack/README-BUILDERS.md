# For screen builders

One page. Read `CONTENT.md` for every name, number, date and line of copy; read `assets/fork.css` once (it is sectioned and commented).

## Files

- Screens: `screens/<name>.html` (cookbook, discover, recipe, cook, editor, delete, journal, friends). Comparisons: `compare/1-navigation.html`, `compare/2-cook-density.html`, `compare/3-editor-toolbar.html`. Prototype: `prototype/editor.html`. Lowercase, hyphens, no spaces.
- One file per screen; all its states live in it. Page-specific CSS goes in a `<style>` in that file. Never edit `assets/` (ask the foundation owner instead), so four builders never write the same file.
- No external URLs at all: no CDN, no Google Fonts, no web address of any kind in any file (a grep for "http" must come back empty). Everything opens from `file://` offline. Links between pack files are relative.

## Skeleton

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Recipe · Fork</title>
  <link rel="stylesheet" href="../assets/fork.css">
  <script src="../assets/state.js" defer></script>
</head>
<body data-state="owner">          <!-- the default state -->
  <span class="static-label"></span>  <!-- or proto-label -->
  <!-- nav-top, then <main class="page">…</main>, then tab-bar -->
</body>
</html>
```

## States

`state.js` reads the URL: `?state=visitor` sets `<body data-state="visitor">`, `?variant=b` sets `data-variant`, `?clean=1` adds `body.clean` (hides `.annot`). Without a parameter the body keeps the default you wrote.

- Show or hide blocks: `<div data-state-in="owner visitor">` is shown only in those states (space-separated). `data-variant-in` works the same.
- Small differences: style from the page CSS, e.g. `body[data-state=scaled] .serves { … }`.
- State names are fixed by `index.html`: cookbook `full|empty|search-none|filter-saved`; recipe `owner|visitor|signed-out|no-photo|scaled`; cook `start|midway`; editor `ordinary|grouped|errors|privacy`; journal `full|empty|log-form`; friends `full|empty`. Discover and delete have one state each.
- The index frames each state in a 390×844 and a 1280×800 iframe (recipe owner also 834×1112), so your media queries see real widths. Check yours at those three.

## Labels and annotations

- Every page carries exactly one label, first in `<body>`: `<span class="static-label"></span>` (a picture of one state) or `<span class="proto-label"></span>` (clickable). The text comes from CSS.
- Feature status inline: `<span class="shipped">Shipped</span>` or `<span class="planned">Planned</span>`. Use them where a reader could not tell, not on every element. The table is at the end of `CONTENT.md`.
- Callouts for Spencer: `<p class="annot"><strong>Why:</strong> …</p>` in the flow, or add `annot--float` and position it. Keep them short; they vanish with `?clean=1`, so the screen must make sense without them.

## Classes that exist (fork.css)

- **Type:** h1 (clay, one clamp), h2, h3, h4/`.eyebrow-label`, `.group-name`, `.mono` / `.mono-id` / `code` (identifiers only), `.handle`, `.muted`, `.sr-only`, `.icon` (16px svg).
- **Buttons:** `.btn-primary`, `.btn-ghost` (`aria-pressed="true"` = marigold-tint pressed), `.btn-danger-ghost`, `.pill` (recipe action row only), `.btn-sm`, `.text-btn` / `.btn-text`, `.arrow-link`, `.back-link`. Buttons are 6px corners everywhere except `.pill`.
- **Marks:** `.chip` / `.tag`, `.vchip` (marigold version chip), `.vid` (clay version id), `.tag-line`, `.measure` with `.pair` spans and `<b>` values, `.dynamic` (clay, reader-changed value), `.not-scaled`, `.stats` / `.stat`.
- **Forms:** `.form`, `.field`, `.label`, `.optional`, `.required-mark`, `.input`, `.textarea`, `.select`, `.hint`, `.error` (+ `aria-invalid="true"` on the input), `.form-error` (boxed, for failures no field owns), `.field-row`, `.form-actions` (pinned Save bar on a phone), `.check-row`, `.choice` (radio rows), `.status-live` (+ `.is-error`). Errors appear only after a field was edited and left or a save was blocked.
- **Cards:** `.recipe-grid`, `.card`, `.card__media`, `.card__photo`, `.card__title`, `.card__meta`, `.card__desc`, `.card--no-photo`.
- **Surfaces:** `.avatar` (`--sm`, `--lg`), `.rule` (`--2`), `.section-heading`, `.surface`, `.band` (`--no-photo`), `.lock-note` + `.lock-note__label`, `.menu` (+ `.danger`), `.empty-state`, `.tick`.
- **Layout:** `.page` (`--flush`), `.page-head`, `.grid-5-7`, `.cols`, `.column-680`, `.stack`, `.tag-tabs`.

Card markup:

```html
<a class="card" href="recipe.html?state=owner">
  <div class="card__media"><img class="card__photo" src="../assets/photos/p3.jpg" alt=""></div>
  <h3 class="card__title">Cardamom Cinnamon Buns with Brown Butter Glaze</h3>
  <p class="card__meta">1h 10m · <span class="vid">v3</span></p>
</a>
<a class="card card--no-photo" href="…">
  <div class="card__media"><h3 class="card__title">Grandmother's Slow-Roasted Tomato Sauce for the Freezer</h3></div>
  <p class="card__meta">3h 15m · <span class="vid">v5</span></p>
</a>
```

## Navigation (paste exactly; set `aria-current="page"` on the current destination in both bars)

Leave the tab bar out of Cook and the editor (they pin their own bars). Signed out: replace the right side with `<a class="nav-top__login" href="#">Log in</a>` and omit the tab bar.

```html
<header class="nav-top">
  <div class="nav-top__row">
    <div class="nav-top__left">
      <a class="nav-top__brand" href="cookbook.html">Fork<span>.</span></a>
      <nav class="nav-top__links" aria-label="Main">
        <a href="cookbook.html" aria-current="page">Cookbook</a>
        <a href="journal.html">Journal</a>
        <a href="friends.html">Friends</a>
        <a href="discover.html">Discover</a>
      </nav>
    </div>
    <div class="nav-top__right">
      <a class="nav-top__new" href="editor.html?state=ordinary">+ New recipe</a>
      <a class="avatar" href="#" aria-label="Maria Okafor, your profile">M</a>
    </div>
  </div>
</header>

<nav class="tab-bar" aria-label="Main">
  <a href="cookbook.html" aria-current="page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3"/><path d="M9 8h6"/></svg>Cookbook</a>
  <a href="journal.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4M8 14h4"/></svg>Journal</a>
  <a href="friends.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17.5 14.5A5 5 0 0 1 21.5 19"/></svg>Friends</a>
  <a href="discover.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>Discover</a>
</nav>
```

## Photos (`../assets/photos/`)

| File | Shape | Shows | Used for |
|---|---|---|---|
| p1 | landscape | curry with naan | Weeknight Dal |
| p2 | portrait | chocolate chip cookies | Brown Butter Cookies |
| p3 | portrait | basket of cookies | Cardamom Cinnamon Buns (no bun photo exists) |
| p4 | square | salmon poke bowl | Salmon Poke Bowl |
| p5 | landscape | risotto | Shakshuka (as briefed) |
| p6 | landscape | chickpea bowl | Dev's Rainbow Chickpea Bowl (feed) |
| p7 | landscape | sharing platter | Charred Lemongrass Beef… |
| p8 | portrait | beet salad | Beet and Feta Salad |
| p9 | landscape | pesto farfalle | Pesto Farfalle |
| p10 | portrait | seared salmon | Pan-Seared Salmon |
| p11 | portrait | kebab platter | Journal: Backyard kebab night |
| p12 | portrait | meatballs | Journal: Lamb meatballs |

Every photo is cropped with `object-fit: cover` to its slot (4:3 cards and band, 3:2 feed); never letterboxed.

## House rules worth repeating

Clay is text only (titles, links, version ids, dynamic values); marigold is the one fill, always with ink on it. No shadows at rest (only `.menu`). Mono for handles and version ids only. 44px targets on a phone. Desktop first, then give the phone its own crop.
