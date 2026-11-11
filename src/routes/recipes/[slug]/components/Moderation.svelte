<script lang="ts">
	import HideControl from '#lib/components/HideControl.svelte';
	import { HIDDEN_NOTE, HIDDEN_NOTICE } from '#lib/moderation.js';

	// The recipe page's moderation: a hidden recipe's notice for its author
	// (and a moderator), and a moderator's Hide from others or Restore.
	let {
		slug,
		title,
		hidden,
		moderator,
		isAuthor
	}: { slug: string; title: string; hidden: boolean; moderator: boolean; isAuthor: boolean } =
		$props();
</script>

{#if (hidden && isAuthor) || moderator}
	<div class="moderation" class:lock-note={hidden}>
		{#if hidden}
			<p class="lock-note__label">{HIDDEN_NOTICE}</p>
			<p>{HIDDEN_NOTE}</p>
		{/if}
		{#if moderator}
			<HideControl {slug} {title} {hidden} />
		{/if}
	</div>
{/if}

<style>
	.moderation {
		margin-bottom: 16px;
	}
</style>
