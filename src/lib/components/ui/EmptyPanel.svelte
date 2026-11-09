<script lang="ts">
	import type { Snippet } from 'svelte';

	// A list page with nothing in it: a heading, one sentence, the way out.
	// Ruled at the top and left-aligned, or centred with no rule and the
	// page's h2 size (Cookbook).
	let {
		title,
		children,
		action,
		centered = false
	}: { title: string; children: Snippet; action?: Snippet; centered?: boolean } = $props();
</script>

<section class="empty-panel" class:centered>
	<h2>{title}</h2>
	<p>{@render children()}</p>
	{#if action}<div class="actions">{@render action()}</div>{/if}
</section>

<style>
	.empty-panel {
		max-width: 560px;
		padding: var(--space-6) 0;
		border-top: 1px solid var(--color-border);
	}

	.empty-panel:not(.centered) h2 {
		margin: 0;
		font-size: 1.375rem;
	}

	p {
		margin: 8px 0 0;
		color: var(--color-text-2);
	}

	.actions {
		margin-top: 20px;
	}

	.centered {
		max-width: 46ch;
		margin: 0 auto;
		padding: 56px 0 24px;
		border-top: 0;
		text-align: center;
	}

	.centered .actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 12px 24px;
		margin-top: 24px;
	}
</style>
