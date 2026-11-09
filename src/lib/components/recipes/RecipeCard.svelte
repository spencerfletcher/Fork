<script lang="ts">
	import type { Recipe } from '#lib/server/db/schema.js';
	import { formatTime, plural } from '#lib/helpers.js';

	// Only what the card renders, so a column added to the table does not ripple
	// into every card fixture.
	interface CardRecipe extends Pick<
		Recipe,
		| 'slug'
		| 'title'
		| 'description'
		| 'imageUrl'
		| 'parentId'
		| 'prepTimeMinutes'
		| 'cookTimeMinutes'
	> {
		visibility?: Recipe['visibility'];
		author?: { id: string; username: string } | null;
		versionCount?: number;
		forkCount?: number;
	}

	// Position in the grid, when the page knows it: the first row's photos are
	// fetched eagerly and the very first ahead of everything else. Without it
	// the photo is lazy (decided 29 October 2026). alwaysShowAuthor keeps the
	// author on a phone, for a list whose point is who made each one (forks).
	// showDescription off leaves the line under the meta row to the page (the
	// forks list puts each fork's commit note there).
	// variant: 'list' is every browse list. 'cookbook' is your shelf: no owner
	// line, no fork count, no description, and `saved` names whose a saved one
	// is. 'discover' names the cook above the photo instead of in the meta row.
	let {
		recipe,
		index,
		alwaysShowAuthor = false,
		showDescription = true,
		variant = 'list',
		saved = false
	}: {
		recipe: CardRecipe;
		index?: number;
		alwaysShowAuthor?: boolean;
		showDescription?: boolean;
		variant?: 'list' | 'cookbook' | 'discover';
		saved?: boolean;
	} = $props();

	const isList = $derived(variant === 'list');

	const description = $derived(showDescription && isList ? recipe.description?.trim() : '');

	const eager = $derived(index !== undefined && index < 4);

	const href = $derived(`/recipes/${recipe.slug}`);

	/**
	 * The meta line, as data rather than nested markup. The dots between items
	 * are drawn by CSS, so the list carries only the items.
	 */
	type MetaPart = { text: string; href?: string; accent?: boolean; icon?: 'lock' | 'friends' };

	// Non-public recipes say who can see them; public is the default and says nothing.
	const AUDIENCE = {
		private: { text: 'Only me', icon: 'lock' },
		friends: { text: 'Friends', icon: 'friends' }
	} as const;

	const metaParts: MetaPart[] = $derived.by(() => {
		const parts: MetaPart[] = [];

		if (recipe.visibility && recipe.visibility !== 'public') {
			parts.push(AUDIENCE[recipe.visibility]);
		}

		if (recipe.author && isList) {
			parts.push({ text: `@${recipe.author.username}`, href: `/users/${recipe.author.username}` });
		}

		const { prepTimeMinutes: prep, cookTimeMinutes: cook } = recipe;
		if (prep && cook) parts.push({ text: formatTime(prep + cook) });
		else if (prep) parts.push({ text: `${formatTime(prep)} prep` });
		else if (cook) parts.push({ text: `${formatTime(cook)} cook` });

		// From v2 only: v1 is every unedited recipe and says nothing.
		if ((recipe.versionCount ?? 0) > 1) {
			parts.push({ text: `v${recipe.versionCount}`, accent: true });
		}

		if (recipe.forkCount && isList) {
			parts.push({ text: plural(recipe.forkCount, 'fork') });
		}

		return parts;
	});
</script>

<div class="recipe-card" class:author-always={alwaysShowAuthor} class:recipe-card--roomy={!isList}>
	<a {href} class="card-stretched-link" aria-label={recipe.title}></a>

	{#if variant === 'discover' && recipe.author}
		<p class="card-cook">
			<span class="card-avatar" aria-hidden="true">
				{recipe.author.username.charAt(0).toUpperCase()}
			</span>
			<a class="card-handle" href="/users/{recipe.author.username}">@{recipe.author.username}</a>
		</p>
	{/if}

	{#if recipe.imageUrl}
		<div class="card-img-wrap">
			<!-- alt is empty: the heading names the recipe and the stretched link
			     carries it as its label, so a third announcement would be noise. -->
			<img
				src={recipe.imageUrl}
				alt=""
				loading={eager ? 'eager' : 'lazy'}
				fetchpriority={index === 0 ? 'high' : undefined}
				class="card-img" />
		</div>
		<h3 class="card-title">{recipe.title}</h3>
	{:else}
		<!-- No photo: the title stands in for it, inside the same 4:3 block, so a
		     mixed grid keeps its rhythm and the title is not printed twice. -->
		<div class="card-panel">
			<h3 class="card-panel-title">{recipe.title}</h3>
		</div>
	{/if}

	<div class="meta-row">
		{#each metaParts as part (part.text)}
			{#if part.href}
				<a class="meta-item meta-author" href={part.href}>{part.text}</a>
			{:else if part.icon}
				<span class="meta-item meta-audience">
					<svg
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true">
						{#if part.icon === 'lock'}
							<rect x="3" y="7" width="10" height="7" rx="1.5" />
							<path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
						{:else}
							<circle cx="6" cy="5.5" r="2.5" />
							<path d="M1.5 14a4.5 4.5 0 0 1 9 0" />
							<circle cx="11.5" cy="6.5" r="1.75" />
							<path d="M11.5 10.25A3.5 3.5 0 0 1 14.5 13.5" />
						{/if}
					</svg>
					{part.text}
				</span>
			{:else}
				<span class="meta-item" class:meta-item--accent={part.accent}>{part.text}</span>
			{/if}
		{/each}
	</div>

	{#if saved && variant === 'cookbook'}
		<p class="card-source">
			Saved from
			{#if recipe.author}
				<a class="card-handle" href="/users/{recipe.author.username}">@{recipe.author.username}</a>
			{:else}
				another cook
			{/if}
		</p>
	{/if}

	<!-- At most one extra line: no description, no line (Spencer, 31 October 2026). -->
	{#if description}
		<p class="card-description">{description}</p>
	{/if}
</div>

<style>
	/* The card is content on the page's paper, not a tile: no surface, border or
	   shadow. The photo or panel is the only shape, so the whole grid reads as
	   one page rather than a wall of boxes. */
	.recipe-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.card-stretched-link {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.card-img-wrap,
	.card-panel {
		aspect-ratio: 4 / 3;
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.card-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.recipe-card:has(.card-stretched-link:hover) .card-img {
		transform: scale(1.03);
	}

	/* The panel title grows the way a photo does, from its own corner so
	   nothing reflows. */
	.card-panel-title {
		transform-origin: left bottom;
		transition: transform 0.3s ease;
	}

	.recipe-card:has(.card-stretched-link:hover) .card-panel-title {
		transform: scale(1.03);
	}

	.card-title,
	.card-panel-title {
		margin: 0;
		font-family: var(--font-serif);
		font-weight: 500;
		font-size: 1.0625rem;
		line-height: 1.25;
	}

	.card-title {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		line-clamp: 3;
		overflow: hidden;
		color: var(--color-text);
		/* No one-word last line ("Cookies"). The stretched link's label still
		   carries the whole title. */
		text-wrap: balance;
	}

	/* :has() targeting ancestor — no Tailwind equivalent */
	.recipe-card:has(.card-stretched-link:hover) .card-title {
		color: var(--color-accent);
	}

	.card-panel {
		display: flex;
		align-items: flex-end;
		/* 16px inside the border, which shows only under forced colours, where
		   the tint goes and the border keeps the panel a box. */
		padding: 15px;
		border: 1px solid transparent;
		background: var(--color-tint);
	}

	/* line-clamp requires the -webkit-box multi-property combo */
	.card-panel-title {
		display: -webkit-box;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
		line-clamp: 4;
		overflow: hidden;
		color: var(--color-accent);
		text-wrap: balance;
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 5px;
	}

	/* One line, Ink 3 sans at the meta size, 4px under the meta row. */
	.card-description {
		margin: -6px 0 0;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		line-clamp: 1;
		overflow: hidden;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--color-text-3);
	}

	.meta-item {
		font-family: var(--font-sans);
		font-size: 0.8125rem;
		color: var(--color-text-3);
	}

	/* The dot is drawn as part of the item it precedes, never typed, so a
	   wrapped row never ends with one (decided 29 October 2026). It keeps the
	   row's face whatever the item's own. */
	.meta-item + .meta-item::before {
		content: '·';
		margin-right: 5px;
		font-family: var(--font-sans);
		font-size: 0.8125rem;
		font-weight: 400;
		color: var(--color-text-3);
	}

	/* Below 1024 the row wraps more often, so the dots go and the items sit
	   10px apart instead; no wrapped line ever starts with a dot (the version
	   bar does the same on a phone). */
	@media (max-width: 1023px) {
		.meta-row {
			column-gap: 10px;
		}

		.meta-item + .meta-item::before {
			display: none;
		}
	}

	.meta-audience {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.meta-audience svg {
		width: 12px;
		height: 12px;
	}

	/* "Saved from @handle": the meta row's size and ink, under it. */
	.card-source {
		margin: -6px 0 0;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--color-text-3);
		overflow-wrap: anywhere;
	}

	/* Discover's cook line, above the photo: a small initial avatar and the handle. */
	.card-cook {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		margin: 0;
		font-size: 0.9375rem;
	}

	.card-avatar {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 1px solid transparent;
		border-radius: 50%;
		background: var(--color-tint);
		color: var(--color-accent);
		font-family: var(--font-serif);
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1;
	}

	/* Handles are identifiers: mono, one notch under the line, clay; above the
	   stretched link so they stay their own link. */
	.card-handle {
		position: relative;
		z-index: 2;
		font-family: var(--font-mono);
		font-size: 0.9375em;
		color: var(--color-accent);
		text-decoration: none;
		overflow-wrap: anywhere;
		transition: color 0.15s ease;
	}

	.card-handle:hover {
		color: var(--color-text);
	}

	.meta-item--accent {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color-accent);
	}

	a.meta-author {
		/* Above the card's stretched link, so the author stays clickable. */
		position: relative;
		z-index: 2;
		font-family: var(--font-mono);
		/* Username's one step under the line (0.9375), taken off the meta size:
		   an em would resolve against the row, not this item's 13px. */
		font-size: calc(0.8125rem * 0.9375);
		color: var(--color-accent);
		text-decoration: none;
		transition: color 0.15s ease;
		/* A 24px hit at desktop without moving the text (decided 29 October 2026). */
		padding-block: 3px;
		margin-block: -3px;
	}

	a.meta-author:hover {
		color: var(--color-text);
	}

	/* Phone: two columns leave no room for the author; the recipe page has it.
	   A page whose list is about who made each recipe keeps it. */
	@media (max-width: 699px) {
		.card-title,
		.card-panel-title {
			font-size: 0.9375rem;
		}

		.recipe-card:not(.author-always) .meta-author {
			display: none;
		}

		/* Cookbook and Discover are two wide from 600, so they keep the list's size. */
		.recipe-card--roomy .card-title,
		.recipe-card--roomy .card-panel-title {
			font-size: 1.0625rem;
		}
	}

	/* One column: the photo is full width, so the title steps up with it. */
	@media (max-width: 599px) {
		.recipe-card--roomy .card-title,
		.recipe-card--roomy .card-panel-title {
			font-size: 1.1875rem;
		}
	}
</style>
