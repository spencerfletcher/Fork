<script lang="ts">
	import RecipeCard from '#lib/components/recipes/RecipeCard.svelte';
	import SearchFilters from '#lib/components/ui/SearchFilters.svelte';
	import { formatTime, plural } from '#lib/helpers.js';
	import type { loadDiscover } from './discover.server.js';

	// One page for /discover and the signed-out home.
	let { data }: { data: Awaited<ReturnType<typeof loadDiscover>> } = $props();

	const lead = $derived(data.lead);
	const total = $derived(data.recipes.length + (lead ? 1 : 0));
	const filtered = $derived(
		!!data.searchQuery || data.selectedTags.length > 0 || !!data.friendsOnly
	);

	const leadTime = $derived.by(() => {
		if (!lead) return '';
		const { prepTimeMinutes: prep, cookTimeMinutes: cook } = lead;
		if (prep && cook) return formatTime(prep + cook);
		if (prep) return `${formatTime(prep)} prep`;
		if (cook) return `${formatTime(cook)} cook`;
		return '';
	});
</script>

<div class="page">
	<div class="page-inner">
		<h1>Discover</h1>
		<p class="lede">Recipes from every cook on Fork.</p>

		<div class="discover-filters">
			<SearchFilters
				initialQuery={data.searchQuery}
				initialTags={data.selectedTags}
				availableTags={data.allTags}
				friendsOnly={data.friendsOnly} />
		</div>

		<!-- Always in the DOM so screen readers announce the count when it changes. -->
		<p class="sr-only" role="status">
			{#if filtered}{plural(total, 'recipe')} found{/if}
		</p>

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
						<a class="lead-cook" href="/users/{lead.author.username}">
							<span class="lead-avatar" aria-hidden="true">
								{lead.author.username.charAt(0).toUpperCase()}
							</span>
							<span class="lead-handle">@{lead.author.username}</span>
						</a>
					{/if}
					<h2 class="lead-title">
						<a class="lead-link" href="/recipes/{lead.slug}">{lead.title}</a>
					</h2>
					<p class="lead-measure">
						{#if leadTime}<span>{leadTime}</span>{/if}
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
									{#if change.username}<span class="change-handle">@{change.username}</span>
									{/if}{change.commitMessage}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if data.recipes.length > 0}
			<section class="grid-section">
				<p class="order">
					<span class="eyebrow-label">Newest first</span>
					<span>{plural(total, 'recipe')}</span>
				</p>
				<div class="discover-grid">
					{#each data.recipes as recipe, i (recipe.id)}
						<!-- Offset by the lead, which takes the high-priority fetch. -->
						<RecipeCard {recipe} index={i + 1} variant="discover" />
					{/each}
				</div>
			</section>
		{:else if !lead}
			<p class="empty">
				{#if filtered}
					No recipes match. Try another search or fewer filters.
					<a href="?">Clear filters</a>
				{:else}
					No recipes yet.
				{/if}
			</p>
		{/if}
	</div>
</div>

<style>
	h1 {
		margin: 0;
	}

	.lede {
		margin: 4px 0 0;
		color: var(--color-text-2);
	}

	.discover-filters {
		margin: 22px 0 28px;
	}

	/* The lead: photo 7, words 5, side by side from 900. */
	.lead {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		gap: 40px;
		align-items: center;
		color: var(--color-text);
		text-decoration: none;
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
		text-decoration: none;
	}

	.lead-link::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	/* Above the stretched title link, as wide as avatar and handle. */
	.lead-cook {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 24px;
		font-size: 0.9375rem;
		text-decoration: none;
	}

	.lead-cook:hover .lead-handle {
		color: var(--color-text);
	}

	.lead-avatar {
		display: inline-flex;
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
		line-height: 1;
	}

	.lead-handle,
	.change-handle {
		font-family: var(--font-mono);
		font-size: 0.9375em;
		color: var(--color-accent);
	}

	.lead-title {
		margin: 12px 0 0;
		font-family: var(--font-serif);
		font-weight: 500;
		font-size: clamp(1.5rem, 1.1rem + 1.4vw, 2.25rem);
		line-height: 1.15;
		text-wrap: balance;
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

	.lead-measure > span + span::before {
		content: '·' / '';
		padding: 0 0.45em;
		color: var(--color-text-3);
	}

	.vid {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color-accent);
	}

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

		/* A 44px hit on a phone without moving the line. */
		.lead-cook {
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
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 600px) {
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
		text-decoration: none;
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

	.change-handle {
		margin-right: 0.4em;
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
