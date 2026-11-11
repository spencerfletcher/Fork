<script lang="ts">
	import CookLink from '#lib/components/ui/CookLink.svelte';
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import SearchFilters from '#lib/components/ui/SearchFilters.svelte';
	import ResultStatus from '#lib/components/ui/ResultStatus.svelte';
	import ShowMore from '#lib/components/ui/ShowMore.svelte';
	import { plural } from '#lib/helpers.js';
	import { pagedList } from '#lib/pagedList.svelte.js';
	import { timeSpans } from '#lib/recipes/times.js';
	import type { loadDiscover } from './discover.server.js';

	// One page for /discover and the signed-out home.
	type DiscoverData = Awaited<ReturnType<typeof loadDiscover>>;
	let { data }: { data: DiscoverData } = $props();

	const list = pagedList(
		() => data,
		(d: DiscoverData) => ({ items: d.recipes, next: d.next })
	);
	let grid = $state<HTMLElement>();

	const lead = $derived(data.lead);
	const filtered = $derived(
		!!data.searchQuery || data.selectedTags.length > 0 || !!data.friendsOnly
	);

	// Each time its own pair: they can overlap, so no total.
	const leadTimes = $derived(lead ? timeSpans(lead) : []);
</script>

<div class="page">
	<div class="page-inner">
		<div class="page-head">
			<h1>Discover</h1>
			<p class="page-sub">Recipes from every cook on Fork.</p>
		</div>

		<div class="discover-filters">
			<SearchFilters
				initialQuery={data.searchQuery}
				initialTags={data.selectedTags}
				availableTags={data.allTags}
				friendsOnly={data.friendsOnly} />
		</div>

		<ResultStatus count={data.total} {filtered} />

		{#if lead}
			<!-- The title link stretches over the card; the cook link sits above it,
			     first in Tab order. Siblings, never nested. -->
			<div class="lead">
				{#if lead.imageUrl}
					<div class="lead-media">
						<img src={lead.imageUrl} alt="" fetchpriority="high" />
					</div>
				{:else}
					<div class="lead-media lead-media--panel" aria-hidden="true"></div>
				{/if}
				<div>
					{#if lead.author}
						<CookLink username={lead.author.username} class="lead-cook" />
					{/if}
					<h2 class="lead-title">
						<a class="lead-link" href="/recipes/{lead.slug}">{lead.title}</a>
					</h2>
					<p class="lead-measure dot-list">
						{#each leadTimes as { value, word } (word)}<span>{value} {word}</span>{/each}
						{#if lead.servings}<span>Serves {lead.servings}</span>{/if}
						{#if lead.versionCount > 1}<span class="vid">v{lead.versionCount}</span>{/if}
					</p>
				</div>
			</div>
		{/if}

		{#if data.recentChanges.length > 0}
			<section class="recent">
				<h2 class="eyebrow-label section-heading">Recent changes</h2>
				<ul class="recent-row">
					{#each data.recentChanges as change (change.href)}
						<li>
							<a class="change" href={change.href}>
								<span class="change-title">
									<span class="vid">v{change.versionNumber}</span>
									of {change.title}
								</span>
								<span class="change-note">
									{#if change.username}<span class="handle change-handle">@{change.username}</span>
									{/if}{change.commitMessage}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if list.items.length > 0}
			<section class="grid-section">
				<p class="order">
					<span class="eyebrow-label">Newest first</span>
					<span>{plural(data.total, 'recipe')}</span>
				</p>
				<div class="discover-grid" bind:this={grid}>
					{#each list.items as recipe, i (recipe.id)}
						<!-- Offset by the lead, which takes the high-priority fetch. -->
						<RecipeCard {recipe} index={i + 1} variant="discover" />
					{/each}
				</div>
				<ShowMore {list} container={grid} noun="recipe" />
			</section>
		{:else}
			<p class="empty">
				{#if filtered}
					No recipes match. Try another search or fewer filters.
					<a class="inline-action" href="?">Clear filters</a>
				{:else}
					No recipes yet.
				{/if}
			</p>
		{/if}
	</div>
</div>

<style>
	.discover-filters {
		margin: 0 0 28px;
	}

	/* The lead: photo 7, words 5, side by side from 900. */
	.lead {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		gap: 40px;
		align-items: center;
		color: var(--color-text);
	}

	.lead-media {
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-radius: var(--radius-md);
	}

	.lead-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.lead:hover .lead-media img {
		transform: scale(1.02);
	}

	.lead-media--panel {
		border: 1px solid transparent;
		background: var(--color-tint);
	}

	.lead-link {
		color: inherit;
	}

	.lead-link::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.lead-title {
		margin: 12px 0 0;
		font-family: var(--font-serif);
		font-weight: 500;
		font-size: clamp(1.5rem, 1.1rem + 1.4vw, 2.25rem);
		line-height: 1.15;
		text-wrap: pretty;
	}

	.lead:hover .lead-title {
		color: var(--color-accent);
	}

	.lead-measure {
		display: flex;
		flex-wrap: wrap;
		margin: 12px 0 0;
		color: var(--color-text-2);
	}

	/* .vid is the shared chip (app.css). */
	.lead-measure .vid {
		align-self: center;
	}

	@media (max-width: 899px) {
		.lead {
			grid-template-columns: minmax(0, 1fr);
			gap: 14px;
		}

		.lead-title {
			margin-top: 4px;
		}

		/* The lead is one column from here, so its cook link takes the phone's
		   44px hit early; CookLink owns it below 700. */
		.lead :global(.lead-cook) {
			min-height: 44px;
			margin-block: -8px;
		}
	}

	.recent {
		margin-top: 40px;
	}

	.recent-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 12px;
	}

	@media (min-width: 700px) {
		.recent-row {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 16px;
		}
	}

	/* A small change card: the version and title, then whose and why. */
	.change {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-height: 44px;
		height: 100%;
		padding: 12px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
	}

	.change:hover .change-title {
		color: var(--color-accent);
	}

	.change-title {
		font-family: var(--font-serif);
		font-weight: 500;
		line-height: 1.3;
	}

	.change-note {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--color-text-3);
	}

	/* Identifiers inline with their text: the version chip's modifier, at the
	   title's own size a notch down for mono's taller x-height instead of the
	   chip's 0.75rem; the handle at the message's. */
	.change-title .vid {
		font-size: 0.9375em;
	}

	.change-handle {
		margin-right: 0.4em;
		font-size: 1em;
	}

	.grid-section {
		margin-top: 40px;
	}

	.order {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin: 0 0 16px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.8125rem;
		color: var(--color-text-3);
	}

	.empty {
		color: var(--color-text-3);
	}

	.empty a {
		display: inline-block;
		padding-block: 10px;
	}
</style>
