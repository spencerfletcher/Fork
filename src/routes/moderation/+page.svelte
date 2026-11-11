<script lang="ts">
	import EmptyPanel from '#lib/components/ui/EmptyPanel.svelte';
	import Username from '#lib/components/ui/Username.svelte';
	import HideControl from '#lib/components/HideControl.svelte';
	import { dayLabel } from '#lib/journal.js';
	import { plural } from '#lib/helpers.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<!-- Reported and hidden recipes, for moderators only (isModerator); reached by
     its address, linked from nowhere. -->
<div class="page">
	<div class="page-inner">
		<div class="page-head">
			<h1>Moderation</h1>
			{#if data.recipes.length > 0}
				<p class="page-sub">Reported recipes, newest report first, then hidden ones.</p>
			{/if}
		</div>
		{#if data.recipes.length === 0}
			<EmptyPanel title="Nothing to review">No recipe is reported or hidden.</EmptyPanel>
		{:else}
			<ul class="row-list">
				{#each data.recipes as recipe (recipe.slug)}
					<li class="list-row">
						<div class="list-row-what">
							<h2 class="list-row-title">
								<a class="hit-link" href="/recipes/{recipe.slug}">{recipe.title}</a>
							</h2>
							<p class="list-row-meta dot-list">
								{#if recipe.author}<span><Username username={recipe.author} /></span>{/if}
								<span>{plural(recipe.reports.length, 'report')}</span>
								{#if recipe.hidden}<span>Hidden</span>{/if}
							</p>
							{#if recipe.reports.length > 0}
								<ul class="reports">
									{#each recipe.reports as report, i (i)}
										<li>
											<p class="reason">{report.reason}</p>
											<p class="list-row-meta dot-list">
												<span>
													{#if report.reporter}<Username
															username={report.reporter} />{:else}Anonymous{/if}
												</span>
												<span>{dayLabel(report.reportedAt)}</span>
											</p>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
						<div class="list-row-actions">
							<HideControl slug={recipe.slug} title={recipe.title} hidden={recipe.hidden} />
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.reports {
		margin-top: var(--space-3);
		display: grid;
		gap: var(--space-3);
	}

	.reason {
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
</style>
