<script lang="ts">
	import type { Recipe } from '#lib/server/db/schema.js';

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
		recipesToTags?: { tag: { id: number; name: string; slug: string } }[];
		author?: { id: string; username: string } | null;
		versionCount?: number;
		forkCount?: number;
	}

	let { recipe }: { recipe: CardRecipe } = $props();

	const href = $derived(`/recipes/${recipe.slug}`);

	/**
	 * The meta line, as data rather than nested markup. The dots between items
	 * are drawn by CSS, so the list carries only the items.
	 */
	type MetaPart = { text: string; href?: string; accent?: boolean };

	const metaParts: MetaPart[] = $derived.by(() => {
		const parts: MetaPart[] = [];

		if (recipe.author) {
			parts.push({ text: `@${recipe.author.username}`, href: `/users/${recipe.author.username}` });
		}

		const { prepTimeMinutes: prep, cookTimeMinutes: cook } = recipe;
		if (prep && cook) parts.push({ text: `${prep + cook} min` });
		else if (prep) parts.push({ text: `${prep} min prep` });
		else if (cook) parts.push({ text: `${cook} min cook` });

		if (recipe.versionCount) parts.push({ text: `v${recipe.versionCount}`, accent: true });

		if (recipe.forkCount) {
			parts.push({ text: `${recipe.forkCount} ${recipe.forkCount === 1 ? 'fork' : 'forks'}` });
		}

		return parts;
	});
</script>

<div class="recipe-card">
	<a {href} class="card-stretched-link" aria-label={recipe.title} tabindex="0"></a>

	{#if recipe.imageUrl}
		<div class="card-img-wrap">
			<img src={recipe.imageUrl} alt={recipe.title} loading="lazy" class="card-img" />
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
			{:else}
				<span class="meta-item" class:meta-item--accent={part.accent}>{part.text}</span>
			{/if}
		{/each}
	</div>
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
		color: var(--color-text);
		/* No one-word last line ("Cookies"). */
		text-wrap: balance;
	}

	/* :has() targeting ancestor — no Tailwind equivalent */
	.recipe-card:has(.card-stretched-link:hover) .card-title {
		color: var(--color-accent);
	}

	.card-panel {
		display: flex;
		align-items: flex-end;
		padding: 16px;
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
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 5px;
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
		font-size: 0.75rem;
		color: var(--color-accent);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	a.meta-author:hover {
		color: var(--color-text);
	}

	/* Phone: two columns leave no room for the author; the recipe page has it. */
	@media (max-width: 699px) {
		.card-title,
		.card-panel-title {
			font-size: 0.9375rem;
		}

		.meta-author {
			display: none;
		}

		.meta-author + .meta-item::before {
			display: none;
		}
	}
</style>
