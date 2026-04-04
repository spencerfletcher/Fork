<script lang="ts">
	import type { Recipe } from '$lib/server/db/schema';

	interface CardRecipe extends Recipe {
		recipesToTags?: { tag: { id: number; name: string; slug: string } }[];
		author?: { id: string; username: string } | null;
	}

	let { recipe }: { recipe: CardRecipe } = $props();

	const tags = recipe.recipesToTags?.map((r) => r.tag) ?? [];
	const href = `/recipes/${recipe.slug}`;
</script>

<div class="recipe-card">
	<a {href} class="card-stretched-link" aria-label={recipe.title} tabindex="0"></a>

	<div class="card-image">
		<img src={recipe.imageUrl ?? '/None.png'} alt={recipe.title} loading="lazy" />
	</div>

	<div class="card-body">
		<h3 class="card-title">{recipe.title}</h3>

		{#if recipe.description}
			<p class="card-description">{recipe.description}</p>
		{/if}

		<div class="card-meta-row">
			<div class="card-meta-left">
				{#if recipe.author}
					<a href="/users/{recipe.author.username}" class="card-author"
						>@{recipe.author.username}
					</a>
				{/if}
				{#if recipe.author && (recipe.prepTimeMinutes || recipe.cookTimeMinutes)}
					<span class="card-meta-sep">·</span>
				{/if}
				{#if recipe.prepTimeMinutes || recipe.cookTimeMinutes}
					<span class="card-meta">
						{#if recipe.prepTimeMinutes && recipe.cookTimeMinutes}
							{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
						{:else if recipe.prepTimeMinutes}
							{recipe.prepTimeMinutes} min prep
						{:else if recipe.cookTimeMinutes}
							{recipe.cookTimeMinutes} min cook
						{/if}
					</span>
				{/if}
			</div>
			<span
				class="forked-badge"
				class:forked-badge--hidden={!recipe.parentId}
				aria-hidden={!recipe.parentId}
			>
				<svg
					class="fork-icon"
					viewBox="0 0 12 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<circle cx="2" cy="2" r="1.5" stroke="currentColor" stroke-width="1" />
					<circle cx="10" cy="2" r="1.5" stroke="currentColor" stroke-width="1" />
					<circle cx="6" cy="12" r="1.5" stroke="currentColor" stroke-width="1" />
					<path
						d="M2 3.5V6C2 7.1 2.9 8 4 8H6M10 3.5V6C10 7.1 9.1 8 8 8H6M6 8V10.5"
						stroke="currentColor"
						stroke-width="1"
						stroke-linecap="round"
					/>
				</svg>
				Forked
			</span>
		</div>

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
		position: relative;
		display: block;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
		transition:
			box-shadow 0.2s ease,
			transform 0.2s ease;
	}

	/* Stretched link covers the whole card; inner <a> tags sit above it via z-index */
	.card-stretched-link {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.recipe-card:hover {
		box-shadow: var(--shadow-raised);
		transform: translateY(-2px);
	}

	.recipe-card:has(.card-stretched-link:hover) .card-title {
		color: var(--color-accent);
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

	.recipe-card:has(.card-stretched-link:hover) .card-image img {
		transform: scale(1.03);
	}

	.card-body {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.forked-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 600;
		background: var(--color-accent-pale);
		color: var(--color-accent);
		border: 1px solid rgba(232, 168, 58, 0.35);
		border-radius: var(--radius-pill);
		padding: 3px 8px;
		align-self: flex-start;
	}

	.forked-badge--hidden {
		visibility: hidden;
	}

	.fork-icon {
		width: 9px;
		height: 10px;
		flex-shrink: 0;
	}

	.card-meta-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
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

	.card-meta-left {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.card-meta-sep {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--color-text-3);
	}

	.card-author {
		position: relative;
		z-index: 2;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--color-text-3);
		text-decoration: none;
		transition: color 0.15s;
	}

	.card-author:hover {
		color: var(--color-accent);
	}

	.card-tags {
		position: relative;
		z-index: 2;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		align-self: flex-start;
	}
</style>
