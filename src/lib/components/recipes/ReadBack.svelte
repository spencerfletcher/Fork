<script lang="ts">
	import type { readBack } from '#lib/recipes/groups.js';

	let { id, value }: { id: string; value: NonNullable<ReturnType<typeof readBack>> } = $props();
</script>

<!-- How the box will be read, in the hint's voice with group names in ink, so
     a heading typed in the wrong place is seen before the save. -->
<p class="readback" {id}>
	<span class="lead">{value.lead}</span>
	{#each value.parts as part, i (i)}
		<!-- A real space between parts, for a screen reader and a copy; the flex row drops it. -->
		<!-- eslint-disable-next-line svelte/no-useless-mustaches -- a bare space between blocks is dropped -->
		{#if i > 0}{' '}{/if}
		<span class="part">
			{#if part.name === undefined}Ungrouped{:else}<b>{part.name}</b>{/if}
			{part.detail}
		</span>
	{/each}
</p>

<style>
	.readback {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-text-3);
	}

	.readback b {
		color: var(--color-text);
		font-weight: 600;
	}

	.lead {
		margin-right: 0.4em;
	}

	/* The dot between parts is drawn, never typed, as on the measure line. */
	.part + .part::before {
		content: '·' / '';
		padding: 0 0.5em;
	}
</style>
