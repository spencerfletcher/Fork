# Fork – Git-Style Recipe Platform
## Design Document for Claude Code

---

## 1. Project Overview

**Name:** Fork  
**Tagline:** Git-style recipe platform  
**Live URL:** recipes.spencerfletcher.com  
**GitHub:** github.com/spencerfletcher/RecipeBook  
**Started:** October 2025  

Fork is a full-stack recipe platform where the core differentiator is **git-style version control applied to cooking**. Users can create recipes, track modifications over time, fork other users' recipes into their own collection, see diffs between versions, and browse a public feed with proper attribution and lineage. Think GitHub, but the repos are recipes.

The concept originated from a real pain point: home cooks modify recipes constantly but have no structured way to remember what they changed, credit original sources, or learn from others' successful experiments. Existing platforms (AllRecipes, Pinterest, Paprika, Notes apps) either lack community sharing or lack version tracking — Fork combines both.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit (full-stack, TypeScript) |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Auth | Supabase Auth |
| File Storage | Supabase Storage (recipe images) |
| Deployment | recipes.spencerfletcher.com |
| Testing | E2E and unit tests (Playwright / Vitest) |

---

## 3. Design System

### 3.0 Philosophy

The design language is **editorial food media meets developer tool** — the warmth and craft of a great cookbook, the clarity and precision of a well-built product. Reference: NYT Cooking's content hierarchy and whitespace, but greener, fresher, and more typographically restrained. No gradients, no decorative flourishes, no hero blobs. The serif/sans pairing does the heavy lifting.

---

### 3.1 Color Tokens

Define these as CSS custom properties in `app.css` (or your global stylesheet). Every component must use these variables — no hardcoded hex anywhere in component files.

```css
:root {
  /* Backgrounds */
  --color-bg:          #F5F0E8;   /* warm cream page background */
  --color-surface:     #FDFAF4;   /* cards, recipe panels, inputs */
  --color-surface-2:   #EDE8DC;   /* subtle inset, tag backgrounds */

  /* Text */
  --color-text:        #1A1A1A;   /* primary — near-black, not pure black */
  --color-text-2:      #4A4A4A;   /* secondary — metadata, timestamps */
  --color-text-3:      #888880;   /* tertiary — placeholders, disabled */

  /* Accent (forest green) */
  --color-accent:      #3D5A3E;   /* primary accent — buttons, links, fork CTA */
  --color-accent-mid:  #6B8F71;   /* hover states, icons */
  --color-accent-pale: #C8D5B9;   /* tinted surfaces, selected states */

  /* Borders */
  --color-border:      #D6D0C4;   /* default border */
  --color-border-2:    #C2BBB0;   /* stronger border, inputs on focus */

  /* Semantic */
  --color-add:         #3D5A3E;   /* diff additions (reuse accent green) */
  --color-remove:      #8B3A3A;   /* diff removals */
  --color-add-bg:      #E8F0E4;   /* diff addition row background */
  --color-remove-bg:   #F5E4E4;   /* diff removal row background */

  /* Elevation */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-raised: 0 4px 12px rgba(0,0,0,0.08);
}
```

**Dark mode** — add a `[data-theme="dark"]` block (or `@media (prefers-color-scheme: dark)`) with:
```css
[data-theme="dark"] {
  --color-bg:          #1A1C1A;
  --color-surface:     #222520;
  --color-surface-2:   #2A2E28;
  --color-text:        #EDE8DC;
  --color-text-2:      #A8A89E;
  --color-text-3:      #66665E;
  --color-accent:      #6B8F71;
  --color-accent-mid:  #8FAF94;
  --color-accent-pale: #2A3D2B;
  --color-border:      #333630;
  --color-border-2:    #44473F;
  --color-add-bg:      #1F2E20;
  --color-remove-bg:   #2E1F1F;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-raised: 0 4px 12px rgba(0,0,0,0.4);
}
```

---

### 3.2 Typography

**Install via Google Fonts** (add to `app.html` `<head>`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

| Role | Font | Weight | Usage |
|---|---|---|---|
| Serif display | Lora | 400 / 600 | Recipe titles, page headings (h1, h2) |
| Serif italic | Lora italic | 400 | Pull quotes, bylines, attribution |
| Sans body | Inter | 400 | Body text, ingredient lists, steps |
| Sans medium | Inter | 500 | Labels, tag pills, button text, nav |
| Sans semibold | Inter | 600 | Subheadings (h3, h4), metadata labels |

```css
:root {
  --font-serif: 'Lora', Georgia, serif;
  --font-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

body {
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.65;
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}
```

**Type scale:**
```css
h1 { font-family: var(--font-serif); font-size: 2.5rem;  font-weight: 600; line-height: 1.15; }
h2 { font-family: var(--font-serif); font-size: 1.75rem; font-weight: 400; line-height: 1.25; }
h3 { font-family: var(--font-sans);  font-size: 1.1rem;  font-weight: 600; letter-spacing: 0.01em; }
h4 { font-family: var(--font-sans);  font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-2); }

/* h4 is the "section label" style — used for INGREDIENTS, STEPS, VERSIONS etc. */
```

---

### 3.3 Spacing & Layout

Base unit: **8px**. All spacing, padding, gap, and margin values should be multiples of 8 (or 4 for tight internal spacing).

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  64px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 100px;

  --max-width: 1200px;
  --content-width: 720px;   /* recipe detail prose column */
}
```

---

### 3.4 Component Patterns

#### Recipe Card (feed)
```
┌─────────────────────────┐
│  [image 16:9]           │
│                         │
│  Breakfast · 20 min     │  ← h4 style, color-text-2
│  Brown Butter Cookies   │  ← h2 (Lora), 1.2rem
│  by @spencerfletcher    │  ← Inter 400, color-text-2, italic
│                         │
│  [Vegan] [Baking]       │  ← tag pills
│                    [♡]  │  ← save icon, accent color on hover
└─────────────────────────┘
```
- Background: `--color-surface`
- Border: `1px solid var(--color-border)`
- Border-radius: `--radius-lg`
- Box-shadow: `--shadow-card`
- On hover: `box-shadow: --shadow-raised`, subtle `translateY(-2px)` transition
- Image: `object-fit: cover`, aspect-ratio 16/9, border-radius top corners only

#### Tag Pill
```css
.tag {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-accent);
  background: var(--color-accent-pale);
  border-radius: var(--radius-pill);
  padding: 3px 10px;
  display: inline-block;
}
```

#### Primary Button (Fork CTA)
```css
.btn-primary {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 0.9rem;
  background: var(--color-accent);
  color: #FDFAF4;
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-primary:hover { background: var(--color-accent-mid); }
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--color-accent);
  border: 1.5px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: 9px 18px;
  font-weight: 500;
  font-size: 0.9rem;
}
.btn-ghost:hover {
  background: var(--color-accent-pale);
}
```

#### Recipe Detail Layout (desktop)
```
[Full-width hero image — max-height 480px, object-fit cover]

[Narrow centered column — max-width: 720px, margin: 0 auto]
  ├── Forked from [parent] by @author  ← italic Lora, text-2
  ├── h1: Recipe Title                  ← Lora 600, 2.5rem
  ├── by @author · October 2025         ← Inter, text-2
  ├── [Tag] [Tag] [Tag]
  ├── [FORK THIS RECIPE btn] [Save ♡]
  ├── ─────────────────────────────────
  ├── Prep 15 min  |  Cook 30 min  |  Serves 4
  ├── ─────────────────────────────────
  ├── INGREDIENTS  (h4 label)
  │     • 2 cups all-purpose flour
  │     • 1 tsp baking soda
  │     ...
  ├── STEPS  (h4 label)
  │     ① Preheat oven to 375°F ...
  │     ② Cream butter and sugar ...
  └── VERSION HISTORY  (h4 label, collapsible)
        v3 — "Brown butter swap" — Mar 12 — [Compare]
        v2 — "Reduced sugar" — Feb 28 — [Compare]
        v1 — "Initial recipe" — Oct 14 — [View]
```

#### Version History Entry
```
┌────────────────────────────────────────────────┐
│ v3   Brown butter swap        Mar 12, 2026     │
│      by @spencerfletcher      [View] [Compare] │
└────────────────────────────────────────────────┘
```
- Font: Inter 400 for description, Inter 500 for version number
- Version number: styled in `--color-accent`
- Buttons: ghost style, small (`padding: 4px 10px; font-size: 0.8rem`)
- Border-left: `3px solid var(--color-accent-pale)` on the entry row

#### Diff Row
```css
.diff-add    { background: var(--color-add-bg);    color: var(--color-add);    }
.diff-remove { background: var(--color-remove-bg); color: var(--color-remove); }
.diff-prefix { font-family: var(--font-sans); font-weight: 600; margin-right: 8px; }
/* prefix is "+" or "−", matching the row color */
```

---

### 3.5 Bits UI Usage

Install: `npm i bits-ui`

Use Bits UI **only** for interactive primitives that require accessibility behavior. Style everything with the CSS variables above — Bits UI is completely unstyled (headless).

| Component | Used for |
|---|---|
| `Dialog` | Fork confirmation modal, delete confirmation |
| `DropdownMenu` | Recipe action menu (edit, delete, share) |
| `Tooltip` | Version history timestamps, icon button labels |
| `Popover` | Diff selector (pick version A and version B) |
| `Select` | Unit toggle (metric/imperial), serves scaling |
| `Separator` | Horizontal rules between recipe sections |

Example usage pattern (Dialog for fork confirmation):
```svelte
<script>
  import { Dialog } from 'bits-ui';
</script>

<Dialog.Root>
  <Dialog.Trigger class="btn-primary">Fork this recipe</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="overlay" />
    <Dialog.Content class="dialog-content">
      <Dialog.Title class="dialog-title">Fork this recipe?</Dialog.Title>
      <Dialog.Description class="dialog-desc">
        A copy will be added to your recipes. You can edit it independently.
      </Dialog.Description>
      <div class="dialog-actions">
        <Dialog.Close class="btn-ghost">Cancel</Dialog.Close>
        <button class="btn-primary" on:click={handleFork}>Fork</button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

All class names on Bits UI components (`class="btn-primary"`, `class="dialog-content"`) are your own CSS — Bits UI passes them through to the underlying element unchanged.

---

### 3.6 Design Rules for Claude Code

These are hard constraints Claude Code must follow — not suggestions:

1. **No hardcoded colors anywhere.** Every color value must reference a CSS variable from section 3.1.
2. **Lora for h1 and h2 only.** All other text is Inter. Do not use Lora on labels, buttons, tags, or body text.
3. **The fork button is always green (`--color-accent`), always prominent.** It is the primary CTA on every recipe detail page. Never render it as a ghost or icon-only button.
4. **Tag pills always use `--color-accent-pale` background with `--color-accent` text.** Never grey tags.
5. **Whitespace is generous.** Minimum `--space-5` (24px) between sections. The page should breathe.
6. **No box shadows on buttons.** Shadow is reserved for cards and floating panels only.
7. **The recipe detail column max-width is 720px**, centered. Do not stretch ingredients and steps to full width on desktop.
8. **Version numbers are always rendered in `--color-accent`.** They are the visual anchor of the version history panel.
9. **Use `h4` (uppercase, small, letter-spaced) for section labels** like INGREDIENTS, STEPS, VERSION HISTORY. This is the NYT Cooking pattern.
10. **Inputs and textareas:** `background: var(--color-surface)`, `border: 1.5px solid var(--color-border)`, `border-radius: var(--radius-md)`, focus ring `outline: 2px solid var(--color-accent-pale)`.

---

## 4. Core Features

### 4.1 Already Implemented (as of Feb 2026)
- **Public recipe feed** — card grid layout with browsable recipes
- **Tag filtering** — filter by cuisine/diet/meal type tags
- **Search** — search recipes by name/ingredient
- **Recipe detail view** — hero image, ingredients list, numbered step circles
- **Save/favorites** — bookmark recipes to a personal collection
- **User authentication** — sign up, log in via Supabase Auth
- **Image storage** — recipe photos via Supabase Storage
- **Dummy recipe data** — several seeded recipes for demo purposes

### 4.2 Core Feature Gap (Must Be Built)
These are the features that make Fork distinctive. Without them it's just a CRUD recipe app. These MUST be visible to a recruiter or interviewer clicking around:

#### Fork Button
- Every recipe detail page has a prominent **"Fork this recipe"** button
- Forking creates a new copy of the recipe under the user's account
- The forked recipe stores a reference to the original (parent recipe ID + original author)
- Attribution is shown clearly: *"Forked from [Original Recipe Name] by [Username]"*

#### Version History
- Every save/edit to a recipe creates a new **version snapshot**
- Recipe detail page shows a **version history panel** (timeline or list)
- Each version entry shows: version number, timestamp, author, optional commit message ("what changed")
- Users can click a version to view that snapshot of the recipe

#### Diff View
- Side-by-side or inline diff between any two versions
- Highlight added ingredients (green), removed ingredients (red), changed steps
- Accessible from the version history panel ("Compare v2 → v3")

#### Recipe Lineage / Attribution
- Recipe detail shows a **lineage breadcrumb**: Original → Fork → Fork of Fork
- "Forked from X" appears as a subtitle or metadata line under the recipe title
- Clicking the parent recipe navigates to the original

---

## 5. Data Model

### recipes
```
id              uuid PK
title           text NOT NULL
description     text
author_id       uuid FK → users
parent_id       uuid FK → recipes (NULL if original)  ← enables fork lineage
forked_at       timestamp (NULL if original)
image_url       text
tags            text[]
servings        integer
prep_time_mins  integer
cook_time_mins  integer
is_public       boolean DEFAULT true
created_at      timestamp
updated_at      timestamp
```

### recipe_versions
```
id              uuid PK
recipe_id       uuid FK → recipes
version_number  integer NOT NULL
commit_message  text  (e.g. "Reduced sugar by 20g, added vanilla")
ingredients     jsonb  (snapshot of ingredients at this version)
steps           jsonb  (snapshot of steps at this version)
created_at      timestamp
created_by      uuid FK → users
```

### ingredients (normalized, part of version snapshot)
```json
[
  { "amount": "2", "unit": "cups", "name": "all-purpose flour" },
  { "amount": "1", "unit": "tsp", "name": "baking soda" }
]
```

### steps (normalized, part of version snapshot)
```json
[
  { "step": 1, "text": "Preheat oven to 375°F." },
  { "step": 2, "text": "Cream butter and sugar until fluffy." }
]
```

### saved_recipes (favorites)
```
user_id         uuid FK → users
recipe_id       uuid FK → recipes
saved_at        timestamp
PRIMARY KEY (user_id, recipe_id)
```

---

## 6. Page Structure / Routes

| Route | Description |
|---|---|
| `/` | Public recipe feed — card grid, search bar, tag filter pills |
| `/recipes/[id]` | Recipe detail — hero image, ingredients, steps, fork button, version history panel |
| `/recipes/[id]/versions` | Full version history for a recipe |
| `/recipes/[id]/diff?from=1&to=3` | Diff view between two versions |
| `/recipes/new` | Create new recipe (auth required) |
| `/recipes/[id]/edit` | Edit recipe, saves as new version (auth required, must be owner) |
| `/profile/[username]` | User's public recipe collection |
| `/profile/me` | Authenticated user's own recipes + saved |
| `/login` | Auth page |

---

## 7. UI Design

### General aesthetic
- Clean, food-forward design
- Card grid for the feed (3 columns desktop, 2 tablet, 1 mobile)
- Hero image at top of recipe detail
- Numbered step circles (e.g. ① ② ③) for recipe instructions
- Tag pills for filtering/display

### Feed page
- Search input at top
- Tag filter pills (scrollable row): "Breakfast", "Italian", "Vegan", "Quick", "Dessert", etc.
- Recipe cards: image thumbnail, title, author with avatar, tags, save button

### Recipe detail page
- Full-width hero image
- Recipe title (large, bold)
- Attribution line: *"by @username"* and optionally *"Forked from [parent recipe] by @originalauthor"*
- Metadata row: prep time, cook time, servings
- Tags
- **Fork button** (prominent, top of page — this is the key CTA)
- Two-column layout (desktop): ingredients left, steps right
- Version history section at bottom (collapsible or sidebar)

### Version history panel
- Shows list of versions, newest first
- Each entry: `v3 — "Reduced butter, added lemon zest" — March 12, 2026 — @spencerfletcher`
- "Compare" button between versions
- "View this version" link

### Diff view
- Two-column layout: "From version" left, "To version" right
- Ingredients: green highlight for additions, red for removals, unchanged is plain
- Steps: same diff coloring with changed text highlighted inline

---

## 8. Key User Flows

### Create a recipe
1. Auth user hits `/recipes/new`
2. Fills in title, description, image, tags, servings, time
3. Adds ingredients (dynamic list with amount, unit, name fields)
4. Adds steps (ordered list)
5. Optionally adds a commit message ("Initial recipe")
6. Saves → creates recipe row + version 1 snapshot

### Edit a recipe (version bump)
1. Owner visits `/recipes/[id]/edit`
2. Makes changes
3. Adds optional commit message describing what changed
4. Saves → creates new version snapshot, updates `updated_at` on recipe

### Fork a recipe
1. Any logged-in user clicks "Fork" on a public recipe
2. System creates a new recipe row with `parent_id` pointing to original
3. Copies v1 of the fork from the current latest version of the parent
4. User is redirected to their new forked recipe's edit page
5. Recipe page shows attribution back to original

### Browse and find recipes
1. User visits `/` (no auth required)
2. Searches or filters by tags
3. Clicks a recipe card → recipe detail
4. Sees ingredients, steps, fork lineage if applicable
5. Can save to favorites (auth required) or fork (auth required)

---

## 9. What Makes This Stand Out in Interviews

The git-style version control angle is the entire story. When a recruiter or interviewer looks at this, they should be able to:

1. **See the fork button immediately** on any recipe page
2. **See version history** showing at least 2–3 versions with commit messages
3. **See attribution/lineage** — at least one recipe that's forked from another
4. **See a diff** between two versions

Without these four things visible, it's just a CRUD app. With them, it's a portfolio piece with a unique technical angle (data modeling for diffs, tree-structured recipe lineage, snapshot versioning) that most SWE candidates don't have.

---

## 10. Seeded Demo Data (for portfolio purposes)

Should have at least 3 fully fleshed-out recipes with real ingredients and steps, demonstrating the fork/version features:

**Recipe 1:** "Classic Chocolate Chip Cookies" by @spencerfletcher  
- 2 versions (original + tweaked brown butter version with commit message)  
- Is public, has tags: Dessert, Baking, American

**Recipe 2:** "Brown Butter Chocolate Chip Cookies" by @demo_user  
- Forked from Recipe 1, with attribution shown  
- 1 additional version on top of the fork  
- Shows full lineage: Classic → Brown Butter fork

**Recipe 3:** "Chicken Tikka Masala" by @spencerfletcher  
- 3 versions showing incremental refinement  
- Tags: Dinner, Indian, Spicy

---

## 11. Feature Evaluation

The following features were evaluated against the current design. Each is tagged with a status and a version target.

**Status tags:** ✅ Already in app | ❌ Not a good idea | ➕ Should be added | 🔄 Should be updated  
**Version tags:** `v1` = this version (ship now) | `v2` = next version | `later` = future roadmap

---

### Grocery store API / manual price per ingredient
**➕ Should be added — `v3`**  
The goal isn't price precision — it's a rough ballpark ("~$13–$20/serving") so users can gauge cost before committing to a recipe. That framing makes this much more tractable. Delivery platforms like DoorDash, Instacart, and Kroger have grocery APIs or scrape-friendly storefronts that can give approximate ingredient prices. The UX should show an estimated price range with a clear disclaimer ("prices vary by location and store"). Manual price override per ingredient is a valid fallback for obscure items. This is a v3 feature because it requires API integration, price caching logic, and a geographic component (prices vary by market). Design the ingredient schema now with a nullable `price_cents` field so v3 doesn't require a migration.

---

### Display ingredients in metric / imperial (grams vs cups)
**➕ Should be added — `v1`**  
This is table stakes for a recipe app. The data model already has `amount` and `unit` as separate fields, which means unit conversion is a pure frontend concern — no schema changes needed. Store a user preference (or just toggle it inline on the recipe page). Should be in v1 because it's low-effort and immediately useful, and the ingredient schema already supports it.

**Implementation note:** Store canonical amounts in metric (grams, ml) and convert to imperial on display. Add `unit_type: "metric" | "imperial"` to user preferences or as a simple toggle on the recipe detail page.

---

### Display temps in Fahrenheit / Celsius
**➕ Should be added — `v1`**  
Same reasoning as unit conversion — this is a basic quality-of-life feature and the conversion logic is trivial. Temperature values appear in recipe steps (as freetext), so this requires either structured temp fields or a regex-based step parser to detect and convert temps on the fly. Simplest approach: add an optional `temperature` field to steps alongside the freetext. User preference toggle in settings or inline on the recipe page.

---

### Display price of items, recipes, and a planned week of meals
**➕ Should be added — `v3` (tied to grocery API)**  
Once the grocery API layer exists in v3, surfacing price estimates at the recipe level ("estimated $13–$20/serving") is a natural extension. The weekly meal plan price view is a further step that requires the meal planning feature. Sequence: grocery API first, then recipe-level price display, then weekly roll-up.

---

### Display macros (nutrition info)
**➕ Should be added — `v2`**  
Macros are genuinely valuable and a common user expectation. However, accurate macro data requires either a nutrition database API (USDA FoodData Central is free and excellent) or manual entry per ingredient. This is a real data modeling decision: add a `macros` object to the ingredient schema (`calories`, `protein_g`, `carbs_g`, `fat_g`) and source it either from the API on ingredient creation or let users override manually. Good v2 feature — don't block v1 on it, but design the ingredient schema now to leave room for it.

**Schema prep for v1:** Add nullable `macros` jsonb field to ingredients in the version snapshot so v2 can populate it without a migration.

---

### Pictures of recipes
**✅ Already in app**  
Hero image on recipe detail is already implemented via Supabase Storage. Recipe cards in the feed already show image thumbnails.

---

### Automatically account for prep time (e.g. chopping garlic = ~20 seconds)
**❌ Not a good idea**  
This is either a lookup table problem (mapping ingredient prep tasks to time estimates, which is a significant data project) or an AI inference problem (which adds latency and cost). The accuracy would be low — prep time varies enormously by skill level and recipe context. It's a clever idea but the implementation complexity vs. user value ratio is poor. The existing `prep_time_mins` field on the recipe is enough. Drop it.

---

### Integrated timer
**➕ Should be added — `v2`**  
A step-level timer is genuinely useful in-kitchen ("simmer for 20 minutes" → tap to start timer). This is a pure frontend feature — parse time expressions from step text, render a countdown button next to each step. No backend changes needed. The reason it's v2 and not v1 is that it requires a "cooking mode" UX (fullscreen, large text, step-by-step navigation) that's a meaningful UI effort. Worth doing, but don't block the core app on it.

---

### Non-intrusive ads
**❌ Not a good idea — definitely not now**  
Ads require an ad network integration, meaningful traffic to generate any revenue, and a privacy policy. For a portfolio project, ads look worse than no ads — they make it look like a content farm rather than a polished SWE project. If this ever becomes a real product, revisit. Cut it entirely from the design doc.

---

### Ability to make your own fork ("variants") of a recipe
**✅ Already in app (this is the core fork feature)**  
This is literally the central feature of Fork. The "Fork" button on every recipe creates your own variant. The word "variants" in your notes is the same concept — forking creates a copy you can modify independently.

---

### Ability to print recipes
**➕ Should be added — `v1`**  
Low effort, high utility. CSS `@media print` stylesheet + a clean print layout (no nav, no sidebar, just ingredients and steps in a readable format). Single afternoon of work. Add a "Print" button to the recipe detail page. Include it in v1 since it's a 1–2 hour task.

---

### Save recipe as PDF
**➕ Should be added — `v2`**  
Similar to print, but requires either a server-side PDF renderer (Puppeteer, or a library like `pdf-lib`) or a client-side approach. Slightly more involved than print CSS. Good v2 feature — once the print layout is solid in v1, PDF export is a natural follow-on.

---

### Filter by queries (search)
**✅ Already in app**  
Text search and tag filtering are already implemented on the feed page.

---

### Pantry inventory tracking + mark recipe as done removes items
**➕ Should be added — `v3`**  
Valid feature, just needs to be sequenced after the core app is solid. Requires its own data model (pantry items, quantities, units) and its own UI (pantry management page). The "mark recipe as done removes items" flow is satisfying when it works — it's essentially a lightweight grocery list that stays in sync with your cooking. The main gotcha is handling partial ingredient use (if you use half a bag of flour, does the pantry update correctly?). Pair this with the grocery API layer in v3 so pantry items can have prices attached. Schema prep: no changes needed now, the pantry table will be a separate migration in v3.

---

### Keep track of meal inventory / when meals are eaten
**➕ Should be added — `v3` (pairs with pantry)**  
Makes sense as part of the pantry system — when you log a meal as eaten, it can trigger pantry deductions and inform the weekly meal plan view. Sequence this alongside pantry tracking in v3.

---

### 3 kinds of recipes: import from web (scraper) / import from app DB / create from scratch
**Partial ✅ / ➕ Should be added**  
- **Create from scratch:** ✅ Already in app  
- **Import from app DB (fork others' recipes):** ✅ Already in app (this is the core fork feature)  
- **Import from URL (web scraper):** ➕ Should be added — `v2`  
  Web scraping recipe sites is genuinely valuable (no one wants to retype a recipe from AllRecipes). Libraries like `recipe-scraper` (Python) or `@extractus/article-extractor` (JS) handle the structured data extraction from common recipe sites. The implementation is: user pastes a URL → server fetches and parses the recipe → pre-fills the create form for review → user saves. Add in v2 since it requires a server-side fetch/parse step and error handling for sites that block scrapers.

---

### Copy-paste functionality for ingredients and steps
**➕ Should be added — `v1`**  
This means: in the recipe editor, the ingredient and step lists should support standard browser copy-paste behavior. Specifically — being able to reorder, duplicate, and paste rows between recipes. In the editor, ingredients and steps should be a draggable list (drag-to-reorder), with duplicate buttons per row. Browser-native copy-paste of the form fields themselves already works. Make sure the editor doesn't break native clipboard behavior. Low effort in v1.

---

### Filter recipes by available pantry ingredients
**➕ Should be added — `v3` (requires pantry system)**  
Once pantry tracking exists, "what can I make with what I have?" is a killer feature. Pairs naturally with the AI recipe generator too ("suggest a recipe using what's in my pantry"). Sequence after v3 pantry is live.

---

### AI recipe generator
**➕ Should be added — `v2`**  
Generate a recipe from a prompt ("make me a vegetarian pasta dish with what's in my pantry"). This is a natural fit given your existing LLM API experience from Spotify Magic Search. Use the Anthropic API with a structured output prompt to generate ingredient lists and steps in the app's schema format, then drop it into the create form for the user to review and edit before saving. Good v2 feature — it adds differentiation and is a talking point in interviews. Don't need pantry tracking for a basic version ("suggest a recipe using chicken, lemon, and capers").

---

### ChatGPT / AI: suggest recipes based on pantry or selected ingredients
**➕ Should be added — `v2` (same as above)**  
Fold this into the AI recipe generator feature above. The UX is: user selects or types a few ingredients → AI suggests a recipe → user can save/edit it. No pantry system required for the ingredient-selection version.

---

### Recipe data model: full field list
**🔄 Should be updated — `v1`**  
Your notes listed these fields for recipes. Here's the evaluation against the current schema:

| Your field | Status | Action |
|---|---|---|
| Ingredients | ✅ In schema | — |
| Name/title | ✅ In schema | — |
| Tags/Categories (Diet, Cuisine, Meal) | ✅ In schema (`tags text[]`) | Upgrade to structured tag taxonomy (enum categories) in v1 |
| Time to create | ✅ In schema (`prep_time_mins`, `cook_time_mins`) | — |
| Ingredient sum overrides (Price) | ❌ Dropped | tied to grocery API |
| Ingredient sum overrides (Macros) | ➕ Add | v2, nullable jsonb |
| Rating — crowd sourced | ➕ Add | v2 (requires ratings table) |
| Rating — personal | ➕ Add | v2 (user's own private star rating) |
| Short blurb / description | ✅ In schema (`description`) | — |
| Servings made | ✅ In schema (`servings`) | — |
| Grams made | ❌ Not a good idea | Too niche, adds friction to recipe creation. Skip. |

**Action for v1:** Upgrade `tags text[]` to a structured taxonomy with three tag categories: `diet[]`, `cuisine[]`, `meal_type[]`. This makes filtering more powerful and the UI cleaner (three separate filter rows).

---

### Ingredient data model: full field list
**🔄 Should be updated — `v1`**  

| Your field | Status | Action |
|---|---|---|
| Name | ✅ In schema | — |
| Price | ❌ Dropped | tied to grocery API |
| Macros | ➕ Add | v2, nullable on ingredient |
| Connection link to API (auto/manual) | ❌ Dropped | tied to grocery API |

**Action for v1:** No changes needed. **Action for v2:** Add nullable `macros` jsonb to ingredient schema when implementing nutrition display.

---

## 12. Out of Scope (for this MVP)

- Mobile app (web only)
- Merge requests / collaborative editing
- Comments / social features beyond attribution
- Paid tiers / subscriptions / ads

---

## 13. Version Roadmap Summary

### v1 (Ship now — core portfolio piece)
- ✅ All existing features (feed, search, tag filter, auth, images)
- Fork button + recipe forking with attribution/lineage
- Version history panel on recipe detail
- Diff view between versions
- Unit conversion toggle (metric / imperial) on recipe detail
- Temperature unit toggle (°C / °F) on recipe detail
- Print recipe (CSS `@media print` layout)
- Structured tag taxonomy: diet, cuisine, meal type (upgrade from flat `tags[]`)
- Copy-paste / drag-to-reorder in recipe editor
- Seeded demo data (3 real recipes, 1 fork, 2–3 versions, diffs visible)
- **Schema prep:** nullable `price_cents` on ingredients, nullable `macros` jsonb on ingredients (so v2/v3 don't require breaking migrations)

### v2 (Next sprint — after v1 is live and solid)
- Macros display (USDA FoodData Central API or manual entry)
- Crowd-sourced + personal recipe ratings
- Integrated step timer (cooking mode)
- PDF export
- Web scraper import (paste a URL, import a recipe)
- AI recipe generator (from prompt or selected ingredients)

### v3 (Full utility layer)
- Pantry inventory tracking (items, quantities, units)
- "Mark recipe as done" → deduct pantry items
- Meal logging (when meals are eaten, links to pantry deductions)
- Grocery store API integration (DoorDash, Instacart, or Kroger) for approximate ingredient pricing
- Recipe-level price estimate display ("~$13–$20/serving") with range disclaimer
- Filter recipes by available pantry ingredients
- Weekly meal plan price roll-up

### Later
- Mobile app
- Meal planning week view UI
- Merge requests / collaborative recipe editing

---

## 14. Environment / Secrets Needed

```
DATABASE_URL          # Supabase PostgreSQL connection string
PUBLIC_SUPABASE_URL   # Supabase project URL
PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY # For server-side auth operations
```
