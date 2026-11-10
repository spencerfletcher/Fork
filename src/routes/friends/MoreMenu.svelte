<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { moreIcon } from '#lib/components/Icons.svelte';
	import Dropdown from '#lib/components/ui/Dropdown.svelte';
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

	let step = $state<'menu' | 'report' | 'block' | 'reported'>('menu');
	let panelEl: HTMLElement | undefined = $state();

	async function go(next: typeof step) {
		step = next;
		await tick();
		panelEl?.querySelector<HTMLElement>('textarea, button[type="submit"]')?.focus();
	}

	const target = $derived(report ?? { type: 'user' as const, id: userId });

	// A refusal (a lapsed session) is shown in the panel, where the press was.
	const acting = pendingEnhance({ keepFailure: true });
	const reporting = pendingEnhance({ keepFailure: true, done: () => (step = 'reported') });
	const refusal = $derived(acting.error ?? reporting.error);
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
						<button type="submit" class="menu-row" role="menuitem">Mute @{username}</button>
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
				<form method="POST" action="/friends?/report" class="step" use:enhance={reporting.submit}>
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
					<button type="submit" class="btn-ghost">Send report</button>
				</form>
			{:else if step === 'reported'}
				<p class="step" role="status">Reported. Thanks; someone will read it.</p>
			{:else}
				<form method="POST" action="/friends?/block" class="step" use:enhance={acting.submit}>
					<input type="hidden" name="userId" value={userId} />
					<p>{BLOCK_SENTENCE}</p>
					<button type="submit" class="btn-ghost danger">Block @{username}</button>
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

	/* Dropdown draws the overlay. Its top meets the button's bottom edge: the
	   button's -10px top margin plus its 44px; its right edge, the button's. */
	.panel {
		--menu-top: 34px;
		--menu-right: -12px;
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

	@media (max-width: 699px) {
		.panel {
			--menu-right: -6px;
		}
	}
</style>
