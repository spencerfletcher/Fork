<script lang="ts">
	import type { Recipe } from '$lib/server/db/schema';

	// `fts` is a Postgres-generated search vector — never read by the card, and
	// callers building fixtures shouldn't have to supply one.
	interface CardRecipe extends Omit<Recipe, 'fts'> {
		recipesToTags?: { tag: { id: number; name: string; slug: string } }[];
		author?: { id: string; username: string } | null;
		versionCount?: number;
		forkCount?: number;
	}

	let { recipe }: { recipe: CardRecipe } = $props();

	const tags = recipe.recipesToTags?.map((r) => r.tag) ?? [];
	const href = `/recipes/${recipe.slug}`;

	/**
	 * The meta line, as data rather than nested markup. Building it as a list is
	 * what lets the separator be "not the first item" instead of a condition that
	 * restates every preceding field — the old version had three of those, each
	 * one term longer than the last.
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

	<div class="relative aspect-[16/9] overflow-hidden">
		<img src={recipe.imageUrl ?? '/None.png'} alt={recipe.title} loading="lazy" class="card-img" />
		{#if recipe.parentId}
			<span class="forked-badge">
				<svg
					class="h-[10px] w-[9px] shrink-0"
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
		{/if}
	</div>

	<div class="flex flex-col gap-2 p-5">
		<h3 class="card-title text-text m-0 font-serif text-[1.2rem] leading-[1.3] font-normal">
			{recipe.title}
		</h3>

		{#if recipe.description}
			<p class="card-desc text-text-2 m-0 text-sm leading-[1.5]">{recipe.description}</p>
		{/if}

		<div class="meta-row">
			{#each metaParts as part, i (part.text)}
				{#if i > 0}<span class="meta-sep">·</span>{/if}
				{#if part.href}
					<a class="meta-item meta-link" href={part.href}>{part.text}</a>
				{:else}
					<span class="meta-item" class:meta-item--accent={part.accent}>{part.text}</span>
				{/if}
			{/each}
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

	/* Overlaid on the photo rather than placed in the meta line, which already
	   carries author, time, version and fork count. The background is opaque,
	   not translucent: recipe photos are arbitrary user-supplied images, and a
	   scrim cannot guarantee contrast over all of them. */
	.meta-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.meta-item,
	.meta-sep {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--color-text-3);
	}

	.meta-item--accent {
		color: var(--color-accent);
	}

	.meta-link {
		/* Above the card's stretched link, so the author stays clickable. */
		position: relative;
		z-index: 2;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.meta-link:hover {
		color: var(--color-accent);
	}

	.forked-badge {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 600;
		background: var(--color-surface);
		color: var(--color-text-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		padding: 2px 7px;
	}
</style>
