<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { moreIcon } from '#lib/components/Icons.svelte';
	import Dropdown from '#lib/components/ui/Dropdown.svelte';
	import ReportStep from '#lib/components/ReportStep.svelte';
	import { BLOCK_SENTENCE } from '#lib/journal.js';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import type { ReportTarget } from '#lib/server/db/schema.js';

	// The ⋯ overlay: Mute, Unfriend, Report, Block for a friend's feed item.
	// A menu on Dropdown, like the avatar menu: the arrow keys walk its items;
	// Escape and a press outside close it. Report and Block open a second step
	// in place (a form, no longer a menu), so neither happens on one stray press.
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

	let step = $state<'menu' | 'report' | 'block'>('menu');
	let panelEl: HTMLElement | undefined = $state();

	async function go(next: typeof step) {
		step = next;
		await tick();
		panelEl?.querySelector<HTMLElement>('textarea, button[type="submit"]')?.focus();
	}

	const target = $derived(report ?? { type: 'user' as const, id: userId });

	// A refusal (a lapsed session) is shown in the panel, where the press was.
	const acting = pendingEnhance({ keepFailure: true });
	const refusal = $derived(acting.error);
</script>

<Dropdown onopen={() => (step = 'menu')}>
	{#snippet trigger(props)}
		<button type="button" class="more-button" aria-haspopup="menu" aria-label={label} {...props}>
			{@render moreIcon()}
		</button>
	{/snippet}
	{#snippet panel()}
		<div
			class="menu-panel panel"
			role={step === 'menu' && !refusal ? 'menu' : undefined}
			bind:this={panelEl}>
			{#if refusal}
				<p class="form-error" role="alert">{refusal}</p>
			{/if}
			{#if step === 'menu'}
				{#if items.includes('mute')}
					<form method="POST" action="/friends?/mute" role="none" use:enhance={acting.submit}>
						<input type="hidden" name="userId" value={userId} />
						<button type="submit" class="menu-row" role="menuitem">
							Mute <span class="handle">@{username}</span>
						</button>
					</form>
				{/if}
				{#if items.includes('unfriend')}
					<form method="POST" action="/friends?/unfriend" role="none" use:enhance={acting.submit}>
						<input type="hidden" name="userId" value={userId} />
						<button type="submit" class="menu-row" role="menuitem">Unfriend</button>
					</form>
				{/if}
				{#if items.includes('report')}
					<button type="button" class="menu-row" role="menuitem" onclick={() => go('report')}>
						Report
					</button>
				{/if}
				{#if items.includes('block')}
					<button type="button" class="menu-row danger" role="menuitem" onclick={() => go('block')}>
						Block
					</button>
				{/if}
			{:else if step === 'report'}
				<ReportStep {target} />
			{:else}
				<form method="POST" action="/friends?/block" class="step" use:enhance={acting.submit}>
					<input type="hidden" name="userId" value={userId} />
					<p>{BLOCK_SENTENCE}</p>
					<button type="submit" class="btn-ghost danger">
						Block <span class="handle">@{username}</span>
					</button>
				</form>
			{/if}
		</div>
	{/snippet}
</Dropdown>

<style>
	/* Pulled into the feed item's corner; the look is app.css's .more-button. */
	.more-button {
		margin: -10px -12px -10px 0;
	}

	/* Dropdown draws the overlay. Its top meets the button's bottom edge: the
	   button's -10px top margin plus its 44px; its right edge, the button's. */
	.panel {
		--menu-top: 34px;
		--menu-right: -12px;
	}

	/* Mono like every handle, in the row's colour: a danger row stays danger. */
	.handle {
		color: inherit;
	}

	.step {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 6px;
	}

	.step p {
		font-size: 0.875rem;
		color: var(--color-text-2);
	}

	@media (max-width: 699px) {
		.panel {
			--menu-right: -6px;
		}
	}
</style>
