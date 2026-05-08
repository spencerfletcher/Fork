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

	<div class="aspect-[16/9] overflow-hidden">
		<img src={recipe.imageUrl ?? '/None.png'} alt={recipe.title} loading="lazy" class="card-img" />
	</div>

	<div class="flex flex-col gap-2 p-5">
		<h3 class="card-title m-0 font-serif text-[1.2rem] font-normal leading-[1.3] text-text">
			{recipe.title}
		</h3>

		{#if recipe.description}
			<p class="card-desc m-0 text-sm leading-[1.5] text-text-2">{recipe.description}</p>
		{/if}

		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				{#if recipe.author}
					<a
						href="/users/{recipe.author.username}"
						class="relative z-[2] font-mono text-[0.72rem] text-text-3 no-underline transition-colors duration-150 hover:text-accent"
					>
						@{recipe.author.username}
					</a>
				{/if}
				{#if recipe.author && (recipe.prepTimeMinutes || recipe.cookTimeMinutes)}
					<span class="font-mono text-[0.72rem] text-text-3">·</span>
				{/if}
				{#if recipe.prepTimeMinutes || recipe.cookTimeMinutes}
					<span class="font-mono text-[0.72rem] text-text-3">
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
					class="w-[9px] h-[10px] shrink-0"
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
			<div class="relative z-[2] flex flex-wrap gap-1 self-start">
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

	.card-stretched-link {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.recipe-card:hover {
		box-shadow: var(--shadow-raised);
		transform: translateY(-2px);
	}

	/* :has() targeting ancestor — no Tailwind equivalent */
	.recipe-card:has(.card-stretched-link:hover) .card-title {
		color: var(--color-accent);
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

	/* line-clamp requires the -webkit-box multi-property combo */
	.card-desc {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
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
</style>
