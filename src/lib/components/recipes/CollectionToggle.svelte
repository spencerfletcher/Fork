<script lang="ts">
	import { enhance } from '$app/forms';
	import { optimisticToggle } from '#lib/optimisticToggle.svelte.js';

	// One collection in Add to collection's menu: checked while the recipe is
	// in it. A press flips it at once and flips back if the server refuses.
	// For a selection it may be mixed (some of it in): a press puts all in.
	let {
		collection,
		action,
		fields = {},
		refresh,
		report,
		ondone
	}: {
		collection: { id: number; name: string; has?: boolean | 'mixed' };
		/** The recipe's collect action, by its full path. */
		action: string;
		/** More hidden fields the action reads (select mode's ids). */
		fields?: Record<string, string>;
		/** Reload the page's data after a press; off where the list is the menu's own. */
		refresh: boolean;
		report: (error: string) => void;
		/** After a press the server took: in or out now, and its answer. */
		ondone?: (change: { member: boolean; data?: Record<string, unknown> }) => void;
	} = $props();

	// `refresh` read once: a menu is either the page's or its own for its whole life.
	// svelte-ignore state_referenced_locally
	const member = optimisticToggle(() => collection.has === true, {
		failure: 'Could not change that collection. Try again.',
		report: (message) => report(message),
		refresh,
		done: (data) => ondone?.({ member: member.on, data })
	});

	// Mixed until a press says otherwise: a refused press flips back to it.
	const checked = $derived(member.on || (collection.has === 'mixed' ? 'mixed' : false));
</script>

<form method="POST" {action} role="none" use:enhance={member.submit}>
	{#each Object.entries(fields) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
	<input type="hidden" name="collectionId" value={collection.id} />
	<!-- Read when the form is sent, before the flip: the state this press asks for. -->
	<input type="hidden" name="member" value={member.on ? '0' : '1'} />
	<button type="submit" class="menu-row" role="menuitemcheckbox" aria-checked={checked}>
		<svg
			class="check"
			class:empty={checked === false}
			width="16"
			height="16"
			viewBox="0 0 16 16"
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round">
			{#if checked === 'mixed'}
				<path d="M4 8h8" />
			{:else if checked}
				<path d="m3.5 8.5 3 3 6-7" />
			{:else}
				<rect x="2.5" y="2.5" width="11" height="11" rx="2" />
			{/if}
		</svg>
		{collection.name}
	</button>
</form>

<style>
	/* A mark on every row, in one 16px box, so the names line up and the list
	   reads as a checklist: a tick, a dash for some, an empty box for none. */
	.menu-row {
		gap: 10px;
		overflow-wrap: anywhere;
	}

	.check {
		flex: none;
	}

	.check.empty {
		color: var(--color-text-3);
		stroke-width: 1.25;
	}
</style>
