<script lang="ts">
	import { enhance } from '$app/forms';
	import { optimisticToggle } from '#lib/optimisticToggle.svelte.js';

	// One collection in Add to collection's menu: checked while the recipe is
	// in it. A press flips it at once and flips back if the server refuses.
	let {
		collection,
		report
	}: {
		collection: { id: number; name: string; has?: boolean };
		report: (error: string) => void;
	} = $props();

	const member = optimisticToggle(() => !!collection.has, {
		failure: 'Could not change that collection. Try again.',
		report: (message) => report(message),
		refresh: true
	});
</script>

<form method="POST" action="?/collect" role="none" use:enhance={member.submit}>
	<input type="hidden" name="collectionId" value={collection.id} />
	<!-- Read when the form is sent, before the flip: the state this press asks for. -->
	<input type="hidden" name="member" value={member.on ? '0' : '1'} />
	<button type="submit" class="menu-row" role="menuitemcheckbox" aria-checked={member.on}>
		<svg
			class="check"
			class:on={member.on}
			width="16"
			height="16"
			viewBox="0 0 16 16"
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round">
			<path d="m3.5 8.5 3 3 6-7" />
		</svg>
		{collection.name}
	</button>
</form>

<style>
	/* The check's room is kept while unchecked, so the names line up. */
	.menu-row {
		gap: 10px;
		overflow-wrap: anywhere;
	}

	.check {
		flex: none;
		visibility: hidden;
	}

	.check.on {
		visibility: visible;
	}
</style>
