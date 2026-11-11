<script lang="ts">
	import {
		cardMenu,
		cookedFact,
		metaItem,
		metaPartsOf,
		nobody,
		sourceWords,
		type CardRecipe,
		type MetaPart
	} from './RecipeCard.svelte';
	import MoreActions from './MoreActions.svelte';

	// The Cookbook's list view of one recipe: RecipeCard's data, meta items and
	// ⋯ as a shared row (.row-list / .list-row), so the two views never drift.
	// A thumbnail, the title (the row's link, on as many lines as it needs),
	// one meta line, then the first three tags and the cook's own cooked fact
	// in columns; below 1024 the tags fold into the meta line, below 700 the
	// cooked fact too.
	let {
		recipe,
		saved = false,
		kept = false,
		onremoved,
		oncollected
	}: {
		recipe: CardRecipe;
		saved?: boolean;
		/** A saved recipe its author withdrew, kept as the saver's copy. */
		kept?: boolean;
		onremoved?: (how: 'trash' | 'copy') => void;
		oncollected?: () => void;
	} = $props();

	const cooked = $derived(cookedFact(recipe));
	const tagLine = $derived(recipe.tags?.join(', ') ?? '');

	// Whose it is leads the line here (the card gives it a line of its own);
	// the cooked fact moves last, after the tags, as the columns read.
	const parts: MetaPart[] = $derived.by(() => {
		const words = sourceWords(kept);
		const source: MetaPart[] = !saved
			? []
			: recipe.author
				? [
						{
							text: `${words} @${recipe.author.username}`,
							prefix: words,
							username: recipe.author.username
						}
					]
				: [{ text: `${words} ${nobody(kept)}` }];
		return [...source, ...metaPartsOf(recipe, false).filter((p) => !p.cooked)];
	});
</script>

<li class="list-row recipe-row">
	<div class="row-thumb">
		{#if recipe.imageUrl}
			<!-- Empty alt: the title beside it names the recipe. -->
			<img src={recipe.imageUrl} alt="" width="64" height="48" loading="lazy" />
		{/if}
	</div>
	<div class="row-what">
		<h3 class="row-title"><a href="/recipes/{recipe.slug}" class="row-link">{recipe.title}</a></h3>
		<p class="row-meta dot-list">
			{#each parts as part (part.text)}{@render metaItem(part)}{/each}
			{#if tagLine}{@render metaItem({ text: tagLine }, 'fold-tags')}{/if}
			{#if cooked}{@render metaItem({ text: cooked }, 'fold-cooked')}{/if}
		</p>
	</div>
	<p class="row-tags">{tagLine}</p>
	<p class="row-cooked">{cooked ?? 'Not cooked yet'}</p>
	<!-- Above the title's stretched link and after it in Tab order, as on the card. -->
	<div class="row-more">
		<MoreActions {...cardMenu(recipe, saved, kept)} {onremoved} {oncollected} />
	</div>
</li>

<style>
	/* The shared row's rule and place in the list, laid out as columns. */
	.recipe-row {
		position: relative;
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr) 190px 250px 44px;
		align-items: center;
		column-gap: 20px;
		padding: 12px 0;
	}

	.row-thumb {
		width: 64px;
		height: 48px;
		overflow: hidden;
		border-radius: 4px;
		background: var(--color-tint);
	}

	.row-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.row-what {
		min-width: 0;
	}

	/* The card's title face, on every line it needs. */
	.row-title {
		font-family: var(--font-serif);
		font-weight: 500;
		font-size: 1.0625rem;
		line-height: 1.3;
		color: var(--color-text);
		overflow-wrap: anywhere;
	}

	/* The title is the row's one link, stretched over the row as a card's is. */
	.row-link {
		color: inherit;
	}

	.row-link::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.recipe-row:has(.row-link:hover) .row-title {
		color: var(--color-accent);
	}

	/* The card's meta row: its items carry the card's own styles. */
	.row-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 5px;
		margin-top: 2px;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--color-text-3);
		--dot-space: 0 5px 0 0;
	}

	.row-meta > :global(.fold-tags),
	.row-meta > :global(.fold-cooked) {
		display: none;
	}

	.row-tags,
	.row-cooked {
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--color-text-3);
	}

	.row-more {
		position: relative;
		z-index: 2;
		justify-self: end;
	}

	.row-more:has(:global([aria-expanded='true'])) {
		z-index: 3;
	}

	/* Below 1024 the tags column would squeeze the title: the tags fold into the meta line. */
	@media (max-width: 1023px) {
		.recipe-row {
			grid-template-columns: 64px minmax(0, 1fr) 200px 44px;
		}

		.row-tags {
			display: none;
		}

		.row-meta > :global(.fold-tags) {
			display: inline;
		}
	}

	/* A phone: the title takes the width, the cooked fact folds in too. */
	@media (max-width: 699px) {
		.recipe-row {
			grid-template-columns: 56px minmax(0, 1fr) 44px;
			align-items: start;
			column-gap: 12px;
		}

		.row-thumb {
			width: 56px;
			height: 42px;
			margin-top: 2px;
		}

		.row-title {
			font-size: 1rem;
		}

		.row-tags,
		.row-cooked {
			display: none;
		}

		.row-meta > :global(.fold-cooked) {
			display: inline;
		}

		.row-more {
			margin-top: -2px;
		}
	}
</style>
