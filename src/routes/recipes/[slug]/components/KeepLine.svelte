<script lang="ts">
	import { enhance } from '$app/forms';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';

	let {
		slug,
		kept,
		viewing,
		latest
	}: {
		slug: string;
		/** The version the saver keeps; null follows the latest. */
		kept: number | null;
		/** The version on the page. */
		viewing: number;
		latest: number;
	} = $props();

	// Each applies in place and reloads the page's data, its query kept.
	const keep = pendingEnhance({ keepFailure: true });
	const follow = pendingEnhance({ keepFailure: true });
	const error = $derived(keep.error ?? follow.error);
</script>

<!-- Keep this version (roadmap, 11 November 2026): a saver's choice of which
     version the recipe opens on, the saver's alone. The separators are drawn
     by CSS, never typed. -->
<div class="keep">
	<div class="keep-line dot-list">
		{#if kept !== null}
			<span>
				Keeping
				{#if viewing === kept}
					<span class="vid">v{kept}</span>
				{:else}
					<a class="vid hit-link" href="/recipes/{slug}">v{kept}</a>
				{/if}
			</span>
		{/if}
		{#if viewing !== kept}
			<span>
				<form method="POST" action="?/keep" use:enhance={keep.submit}>
					<input type="hidden" name="version" value={viewing} />
					<!-- prettier-ignore -->
					<button type="submit" class="text-btn" disabled={keep.pending}>Keep this version<span class="sr-only">, v{viewing}</span></button>
				</form>
			</span>
		{/if}
		{#if kept !== null}
			<span>
				<form method="POST" action="?/follow" use:enhance={follow.submit}>
					<button type="submit" class="text-btn" disabled={follow.pending}>
						Follow latest version
					</button>
				</form>
			</span>
		{/if}
	</div>
	{#if kept !== null && viewing === kept && latest > kept}
		<!-- prettier-ignore -->
		<p class="keep-notice">The author's latest is <a class="vid hit-link" href="/recipes/{slug}?version={latest}">v{latest}</a>.</p>
	{/if}
	{#if error}
		<p class="form-error" role="alert">{error}</p>
	{/if}
</div>

<style>
	/* The personal line's size and Ink 2: the saver's own facts. */
	.keep {
		margin-top: 12px;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text-2);
	}

	.keep-line {
		--dot-space: 0 0.4em 0 0.15em;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		column-gap: 0.25em;
	}

	.keep-line form {
		display: inline;
	}

	.keep-line .text-btn {
		font-size: inherit;
	}

	.keep-notice {
		margin-top: 4px;
	}

	/* On a phone the buttons are 44px and the line wraps: the items sit 16px
	   apart with no dots, so no wrapped row starts with one. */
	@media (max-width: 699px) {
		.keep-line {
			column-gap: 16px;
		}

		.keep-line > span + span::before {
			content: none;
		}
	}
</style>
