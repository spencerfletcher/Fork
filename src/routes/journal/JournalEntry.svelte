<script lang="ts">
	import type { LogEntry } from '#lib/server/db/schema.js';
	import type { EntrySource } from '#lib/server/journal.js';
	import { AUDIENCE_LABEL, PRIVATE_RECIPE_HINT, marginDay } from '#lib/journal.js';
	import { audienceIcon, lockIcon } from '#lib/components/journal/Icons.svelte';

	let { entry }: { entry: LogEntry & { source: EntrySource } } = $props();

	const [dayNumber, weekday] = $derived(marginDay(entry.cookedOn));
	const source = $derived(entry.source);
	const privateRecipe = $derived(source.kind === 'recipe' && source.visibility === 'private');
</script>

<article class="jentry" id="entry-{entry.id}" class:jentry--text={!entry.photoUrl}>
	<p class="jday">
		<time datetime={entry.cookedOn}>
			<b>{dayNumber}</b>
			<span>{weekday}</span>
		</time>
	</p>
	<div class="jhead">
		<h3 class="jdish">{entry.dish}</h3>
		<!-- A recipe the reader may no longer see (an unfriend) shows no source at all. -->
		{#if source.kind === 'recipe'}
			<p class="jsource">
				<a
					href="/recipes/{source.slug}{source.versionNumber
						? `?version=${source.versionNumber}`
						: ''}">
					{source.title}
					{#if source.versionNumber}<span class="mono-id">v{source.versionNumber}</span>{/if}
				</a>
				{#if privateRecipe}
					· <span class="aud-inline">{@render lockIcon()}Only me recipe</span>
				{/if}
			</p>
		{:else if source.kind === 'improvised'}
			<p class="jsource">Improvised</p>
		{:else if source.kind === 'deleted'}
			<p class="jsource">Recipe deleted</p>
		{/if}
		<p class="jmeta">
			{#if entry.servings}<span>Served {entry.servings}</span>{/if}
			<span class="aud">
				{@render audienceIcon(entry.audience)}{AUDIENCE_LABEL[entry.audience]}
			</span>
			<a class="edit" href="/journal/{entry.id}/edit">
				Edit
				<span class="sr-only">{entry.dish}</span>
			</a>
		</p>
		{#if privateRecipe && entry.audience === 'friends'}
			<p class="aud-hint">{PRIVATE_RECIPE_HINT}</p>
		{/if}
	</div>
	{#if entry.photoUrl}
		<figure class="jphoto"><img src={entry.photoUrl} alt="" loading="lazy" /></figure>
	{/if}
	{#if entry.caption || entry.note}
		<div class="jbody">
			{#if entry.caption}<p class="caption">{entry.caption}</p>{/if}
			{#if entry.note}
				<!-- The page's one lifted paper: the note is the owner's alone. -->
				<div class="lock-note">
					<p class="lock-note__label">{@render lockIcon()}Note for next time · only you</p>
					<!-- A div, not a p: the Fork form cannot sit inside a paragraph. -->
					<div>
						{entry.note}
						{#if source.kind === 'recipe' && source.own}
							<a class="arrow-link" href="/recipes/{source.slug}/edit">Change the recipe →</a>
						{:else if source.kind === 'recipe'}
							<!-- Fork is a POST on the recipe; it lands in the new fork's editor. -->
							<form class="fork" method="POST" action="/recipes/{source.slug}?/fork">
								<button type="submit" class="arrow-link">Fork →</button>
							</form>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</article>

<style>
	/* Day | words | photo; the day in Bitter in the margin. */
	.jentry {
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr) 200px;
		grid-template-areas: 'day head photo' 'day body photo';
		grid-template-rows: auto 1fr;
		column-gap: 24px;
		padding: 24px 0;
		border-top: 1px solid var(--color-border);
	}

	.jentry--text {
		grid-template-columns: 64px minmax(0, 1fr);
		grid-template-areas: 'day head' 'day body';
	}

	.jday {
		grid-area: day;
		margin: 0;
		font-family: var(--font-serif);
		text-align: center;
	}

	.jday time {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.jday b {
		font-weight: 500;
		font-size: 2rem;
		line-height: 1;
	}

	.jday span {
		margin-top: 4px;
		font-family: var(--font-sans);
		font-size: 0.8125rem;
		color: var(--color-text-3);
	}

	.jhead {
		grid-area: head;
		min-width: 0;
	}

	.jbody {
		grid-area: body;
		min-width: 0;
	}

	.jphoto {
		grid-area: photo;
		margin: 0;
	}

	.jphoto img {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 2;
		object-fit: cover;
		border-radius: var(--radius-md);
	}

	.jdish {
		margin: 0;
		font-family: var(--font-serif);
		font-weight: 500;
		font-size: 1.25rem;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}

	.jsource,
	.jmeta {
		margin: 4px 0 0;
		font-size: 0.9375rem;
		color: var(--color-text-2);
		overflow-wrap: anywhere;
	}

	.jsource a {
		font-weight: 600;
		padding: 4px 0;
		margin: -4px 0;
	}

	.jmeta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 2px 16px;
	}

	.aud,
	.aud-inline {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.aud {
		font-weight: 600;
		color: var(--color-text);
	}

	.aud-inline :global(.icon) {
		color: var(--color-text-3);
	}

	.edit {
		padding: 4px 0;
		margin-block: -4px;
		font-weight: 600;
	}

	.aud-hint {
		margin: 2px 0 0;
		font-size: 0.875rem;
		color: var(--color-text-3);
	}

	.caption {
		margin: 10px 0 0;
		font-size: 1.0625rem;
		line-height: 1.55;
		max-width: 60ch;
	}

	/* The only lifted paper on the page. */
	.lock-note {
		margin-top: 12px;
		max-width: 60ch;
		padding: 12px 14px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.lock-note__label {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0 0 4px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-2);
	}

	.lock-note .arrow-link {
		margin-left: 4px;
		white-space: nowrap;
		font-weight: 600;
		color: var(--color-accent);
	}

	.fork {
		display: inline;
	}

	.fork button {
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		cursor: pointer;
	}

	.fork button:hover,
	.lock-note a.arrow-link:hover {
		color: var(--color-text);
	}

	/* Phone: the day goes inline above the dish and the photo becomes a
	   thumbnail beside the heading, so it never outgrows the words. */
	@media (max-width: 699px) {
		.jentry,
		.jentry--text {
			grid-template-columns: minmax(0, 1fr) 112px;
			grid-template-areas: 'day day' 'head photo' 'body body';
			grid-template-rows: auto;
			column-gap: 14px;
			padding: 20px 0;
		}

		.jentry--text {
			grid-template-columns: minmax(0, 1fr);
			grid-template-areas: 'day' 'head' 'body';
		}

		.jday {
			text-align: left;
			margin-bottom: 4px;
		}

		.jday time {
			flex-direction: row-reverse;
			justify-content: flex-end;
			align-items: baseline;
			gap: 6px;
			font-family: var(--font-sans);
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--color-text-2);
		}

		.jday b,
		.jday span {
			margin: 0;
			font-size: inherit;
			font-weight: inherit;
			color: inherit;
		}

		.jdish {
			font-size: 1.125rem;
		}

		/* A thumb's 44px on the links, without moving the text. */
		.jsource a,
		.edit {
			display: inline-block;
			padding-block: 11px;
			margin-block: -11px;
		}
	}
</style>
