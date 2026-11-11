<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { clearDraft, draftAge, listDrafts, type ListedDraft } from '#lib/drafts.js';

	// The editor drafts this device holds for the signed-in cook, so a draft is
	// found without reopening its editor. Drafts live in localStorage only, so
	// the server renders nothing and the section appears once mounted.
	let { userId }: { userId: string } = $props();

	let drafts = $state<ListedDraft[]>([]);
	let now = $state(Date.now());

	onMount(() => {
		now = Date.now();
		drafts = listDrafts(userId, now);
	});

	const titleOf = (d: ListedDraft) => d.title.trim() || 'Untitled recipe';
	const hrefOf = (d: ListedDraft) => (d.recipe ? `/recipes/${d.recipe.slug}/edit` : '/recipes/new');

	let list: HTMLUListElement | undefined = $state();

	// The cook's own act on a copy only this device holds, so no confirm step.
	// Focus goes to the next row's Continue, or the page title once none is left.
	async function discard(index: number) {
		clearDraft(drafts[index].key);
		drafts = drafts.filter((_, i) => i !== index);
		await tick();
		const links = list?.querySelectorAll<HTMLAnchorElement>('a') ?? [];
		const next = links[Math.min(index, links.length - 1)];
		(next ?? document.querySelector<HTMLElement>('h1'))?.focus();
	}
</script>

{#if drafts.length > 0}
	<section class="cookbook-drafts" aria-labelledby="drafts-heading">
		<h2 id="drafts-heading">Drafts</h2>
		<p class="drafts-note">Kept on this device only.</p>
		<ul class="row-list" bind:this={list}>
			{#each drafts as draft, i (draft.key)}
				<li class="list-row">
					<div class="list-row-what">
						<h3 class="list-row-title">{titleOf(draft)}</h3>
						<p class="dot-list list-row-meta">
							<span>{draft.recipe ? `Changes to ${draft.recipe.title}` : 'New recipe'}</span>
							<span>edited {draftAge(draft.savedAt, now)}</span>
						</p>
					</div>
					<div class="list-row-actions">
						<a href={hrefOf(draft)} class="text-btn" aria-label="Continue {titleOf(draft)}">
							Continue
						</a>
						<button
							type="button"
							class="text-btn text-btn--ink"
							aria-label="Discard {titleOf(draft)}"
							onclick={() => discard(i)}>
							Discard
						</button>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.cookbook-drafts {
		margin-bottom: var(--space-6);
	}

	.drafts-note {
		margin: 4px 0 var(--space-2);
		color: var(--color-text-2);
	}
</style>
