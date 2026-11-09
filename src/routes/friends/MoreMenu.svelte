<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { moreIcon } from '#lib/components/Icons.svelte';
	import Dropdown from '#lib/components/ui/Dropdown.svelte';
	import { BLOCK_SENTENCE } from '#lib/journal.js';
	import type { ReportTarget } from '#lib/server/db/schema.js';

	// The ⋯ overlay: Mute, Unfriend, Report, Block for a friend's feed item.
	// A disclosure (Dropdown: a button and the list it shows), so Tab walks it;
	// Escape and a press outside close it. Report and Block open a second step
	// in place, so neither happens on one stray press.
	let {
		userId,
		username,
		report,
		label,
		items = ['mute', 'unfriend', 'report', 'block']
	}: {
		userId: string;
		username: string;
		/** What Report files; the person when absent. */
		report?: { type: ReportTarget; id: string };
		/** The button's name, saying whose item it is for. */
		label: string;
		/** Which items it offers; the profile's Friends ✓ offers Unfriend and Block only. */
		items?: ('mute' | 'unfriend' | 'report' | 'block')[];
	} = $props();

	let step = $state<'menu' | 'report' | 'block' | 'reported'>('menu');
	let panelEl: HTMLElement | undefined = $state();

	async function go(next: typeof step) {
		step = next;
		await tick();
		panelEl?.querySelector<HTMLElement>('textarea, button[type="submit"]')?.focus();
	}

	const target = $derived(report ?? { type: 'user' as const, id: userId });
</script>

<Dropdown onopen={() => (step = 'menu')}>
	{#snippet trigger(props)}
		<button type="button" class="more-button" aria-label={label} {...props}>
			{@render moreIcon()}
		</button>
	{/snippet}
	{#snippet panel()}
		<div class="panel" bind:this={panelEl}>
			{#if step === 'menu'}
				{#if items.includes('mute')}
					<form method="POST" action="/friends?/mute" use:enhance>
						<input type="hidden" name="userId" value={userId} />
						<button type="submit">Mute @{username}</button>
					</form>
				{/if}
				{#if items.includes('unfriend')}
					<form method="POST" action="/friends?/unfriend" use:enhance>
						<input type="hidden" name="userId" value={userId} />
						<button type="submit">Unfriend</button>
					</form>
				{/if}
				{#if items.includes('report')}
					<button type="button" onclick={() => go('report')}>Report</button>
				{/if}
				{#if items.includes('block')}
					<button type="button" class="danger" onclick={() => go('block')}>Block</button>
				{/if}
			{:else if step === 'report'}
				<form
					method="POST"
					action="/friends?/report"
					class="step"
					use:enhance={() =>
						async ({ result, update }) => {
							if (result.type === 'success') step = 'reported';
							else await update();
						}}>
					<input type="hidden" name="targetType" value={target.type} />
					<input type="hidden" name="targetId" value={target.id} />
					<label for="reason-{target.type}-{target.id}">What's wrong?</label>
					<textarea
						id="reason-{target.type}-{target.id}"
						name="reason"
						rows="3"
						required
						maxlength="1000">
					</textarea>
					<button type="submit" class="confirm">Send report</button>
				</form>
			{:else if step === 'reported'}
				<p class="step" role="status">Reported. Thanks; someone will read it.</p>
			{:else}
				<form method="POST" action="/friends?/block" class="step" use:enhance>
					<input type="hidden" name="userId" value={userId} />
					<p>{BLOCK_SENTENCE}</p>
					<button type="submit" class="confirm danger">Block @{username}</button>
				</form>
			{/if}
		</div>
	{/snippet}
</Dropdown>

<style>
	.more-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		margin: -10px -12px -10px 0;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--color-text-2);
		cursor: pointer;
	}

	.more-button:hover,
	.more-button[aria-expanded='true'] {
		color: var(--color-text);
		background: var(--color-tint);
	}

	/* The one overlay on the page, and so the one shadow. */
	.panel {
		position: absolute;
		right: -12px;
		top: 40px;
		z-index: 6;
		display: flex;
		flex-direction: column;
		width: max-content;
		min-width: 200px;
		max-width: min(300px, calc(100vw - 36px));
		padding: 6px;
		background: var(--color-surface);
		border: 1px solid var(--color-border-2);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-raised);
	}

	.panel button {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 44px;
		padding: 0 12px;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		font: inherit;
		font-weight: 600;
		color: var(--color-text);
		text-align: left;
		cursor: pointer;
	}

	.panel button:hover {
		background: var(--color-tint);
	}

	.panel .danger {
		color: var(--color-remove);
	}

	.step {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 0;
		padding: 6px;
	}

	.step p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-2);
	}

	.step label {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.panel .confirm {
		justify-content: center;
		border: 1px solid var(--color-input-border);
	}

	@media (max-width: 699px) {
		.panel {
			right: -6px;
		}
	}
</style>
