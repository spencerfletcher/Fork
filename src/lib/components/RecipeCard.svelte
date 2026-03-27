<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Recipe } from '$lib/server/db/schema';

	interface CardRecipe extends Recipe {
		recipesToTags?: { tag: { id: number; name: string; slug: string } }[];
	}

	let { recipe }: { recipe: CardRecipe } = $props();

	const tags = recipe.recipesToTags?.map((r) => r.tag) ?? [];
	const href = `/recipes/${recipe.slug}`;
</script>

<!-- Use div + JS navigation so tag <a> links inside are valid HTML (no nested anchors) -->
<div
	class="recipe-card"
	role="link"
	tabindex="0"
	onclick={() => goto(href)}
	onkeydown={(e) => e.key === 'Enter' && goto(href)}
>
	<div class="card-image">
		<img src={recipe.imageUrl ?? '/None.png'} alt={recipe.title} loading="lazy" />
	</div>

	<div class="card-body">
		{#if recipe.parentId}
			<span class="forked-badge">Forked</span>
		{/if}

		{#if recipe.prepTimeMinutes || recipe.cookTimeMinutes}
			<p class="card-meta">
				{#if recipe.prepTimeMinutes && recipe.cookTimeMinutes}
					{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
				{:else if recipe.prepTimeMinutes}
					{recipe.prepTimeMinutes} min prep
				{:else if recipe.cookTimeMinutes}
					{recipe.cookTimeMinutes} min cook
				{/if}
			</p>
		{/if}

		<h3 class="card-title">{recipe.title}</h3>

		{#if recipe.description}
			<p class="card-description">{recipe.description}</p>
		{/if}

		{#if tags.length > 0}
			<div class="card-tags">
				{#each tags.slice(0, 3) as tag (tag.id)}
					<a href="/tags/{tag.slug}" class="tag">{tag.name}</a>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.recipe-card {
		display: block;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
		text-decoration: none;
		cursor: pointer;
		transition:
			box-shadow 0.2s ease,
			transform 0.2s ease;
	}

	.recipe-card:hover {
		box-shadow: var(--shadow-raised);
		transform: translateY(-2px);
	}

	.card-image {
		aspect-ratio: 16 / 9;
		overflow: hidden;
	}

	.card-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.recipe-card:hover .card-image img {
		transform: scale(1.03);
	}

	.card-body {
		padding: var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.forked-badge {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 500;
		background: var(--color-accent-pale);
		color: var(--color-accent);
		border-radius: var(--radius-pill);
		padding: 2px 8px;
		align-self: flex-start;
	}

	.card-meta {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--color-text-3);
		margin: 0;
	}

	.card-title {
		font-family: var(--font-serif);
		font-size: 1.2rem;
		font-weight: 400;
		color: var(--color-text);
		margin: 0;
		line-height: 1.3;
	}

	.recipe-card:hover .card-title {
		color: var(--color-accent);
	}

	.card-description {
		font-size: 0.875rem;
		color: var(--color-text-2);
		margin: 0;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
	}

	.card-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin-top: var(--space-1);
	}
</style>
