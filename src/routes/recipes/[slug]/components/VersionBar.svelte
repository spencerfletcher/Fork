<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import type { Recipe, RecipeVersion } from '#lib/server/db/schema.js';

	type BarVersion = Pick<RecipeVersion, 'id' | 'versionNumber' | 'commitMessage'>;

	let {
		recipe,
		currentVersion,
		versions,
		isViewingHistory
	}: {
		recipe: Pick<Recipe, 'slug'>;
		currentVersion: BarVersion;
		/** Every version, newest first. */
		versions: BarVersion[];
		isViewingHistory: boolean;
	} = $props();

	const count = $derived(versions.length);
	const latest = $derived(Math.max(...versions.map((v) => v.versionNumber)));
	const n = $derived(currentVersion.versionNumber);
	let open = $state(false);
	let toggle: HTMLButtonElement | undefined = $state();
	let bar: HTMLElement | undefined = $state();

	// SvelteKit keeps this component mounted when only the query changes, so
	// the list's own links would otherwise leave it open over the next view.
	afterNavigate(() => (open = false));

	// Escape closes the list only while focus is inside the bar; from the
	// method below it is not the bar's to take, and taking it would scroll
	// the page back up to the toggle.
	function onWindowKeydown(event: KeyboardEvent) {
		if (!open || event.key !== 'Escape' || !bar?.contains(document.activeElement)) return;
		open = false;
		toggle?.focus();
	}

	const diff = (a: number, b: number) =>
		`/recipes/${recipe.slug}/diff?from=${Math.min(a, b)}&to=${Math.max(a, b)}`;
</script>

<svelte:window onkeydown={onWindowKeydown} />

<!-- The version bar: the hinge between the dish and the recipe, on lifted
     paper. One mono line names the version being read and its note; the
     toggle opens the other versions under it, each a link to itself with a
     compare against the one being read beside it; the current line carries
     no compare of its own. A recipe with one version has no bar. Decided 29
     October 2026 (board "Bar E"). -->
{#if count > 1}
	<section class="version-bar font-mono" aria-label="Version history" bind:this={bar}>
		<div class="current">
			<span class="version-number">
				<span class="sr-only">
					{isViewingHistory
						? `Version ${n} of ${count}, an older version`
						: `Version ${n}, the latest`}
				</span>
				<span aria-hidden="true">v{n}</span>
			</span>
			<span class="message text-text" class:clamped={!open}>{currentVersion.commitMessage}</span>
			<!-- The separators are drawn between items by CSS, never typed, so no
			     wrapped line can begin or end with one. -->
			<span class="controls text-text-2">
				{#if isViewingHistory}
					<span class="item">Older version</span>
					<span class="item"><a href="/recipes/{recipe.slug}">Back to v{latest}</a></span>
				{/if}
				<span class="item">
					<button
						type="button"
						class="versions-toggle"
						bind:this={toggle}
						aria-expanded={open}
						aria-controls="version-history"
						onclick={() => (open = !open)}>
						{count} versions
						<svg
							class="chevron"
							class:up={open}
							viewBox="0 0 12 12"
							aria-hidden="true"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							stroke-linecap="round"
							stroke-linejoin="round">
							<path d="M2.5 4.5 6 8l3.5-3.5" />
						</svg>
					</button>
				</span>
			</span>
		</div>

		<!-- The other versions, newest first. The whole row, number and message,
		     is the link to that version; the second link compares it with the
		     one being read. -->
		<ul id="version-history" class="history m-0 list-none p-0" hidden={!open}>
			{#each versions.filter((v) => v.versionNumber !== n) as version (version.id)}
				{@const v = version.versionNumber}
				<li>
					<a href="/recipes/{recipe.slug}?version={v}" class="version-link">
						<span class="version-number">v{v}</span>
						<span class="message text-text-2">{version.commitMessage}</span>
					</a>
					<a href={diff(v, n)} class="compare whitespace-nowrap">Compare with v{n}</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	/* Lifted paper, a rule, no shadow. */
	.version-bar {
		padding: 12px 16px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.current,
	.history li,
	.version-link {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.version-link {
		flex: 1 1 0;
		min-width: 0;
		color: inherit;
		text-decoration: none;
	}

	.version-link:hover .message {
		color: var(--color-text);
	}

	/* One column for every number, so the messages line up. The one being
	   read is the marigold chip; the others are clay. */
	.version-number {
		flex-shrink: 0;
		min-width: 26px;
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-accent);
	}

	.current .version-number {
		padding: 0 6px;
		border-radius: var(--radius-sm);
		background: var(--color-marigold);
		color: var(--color-text);
		line-height: 1.5;
	}

	.message {
		flex: 1 1 0;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	/* Closed, the note is one line; opening runs it in full. */
	.message.clamped {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.controls {
		flex-shrink: 0;
	}

	.item {
		white-space: nowrap;
	}

	.item + .item::before {
		content: '· ';
	}

	.version-bar a,
	.versions-toggle {
		color: var(--color-accent);
		text-decoration: none;
	}

	.version-bar a:hover,
	.versions-toggle:hover,
	.versions-toggle[aria-expanded='true'] {
		color: var(--color-text);
	}

	/* The toggle is a word in the line, not a button. */
	.versions-toggle {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		cursor: pointer;
	}

	.chevron {
		width: 12px;
		height: 12px;
		transition: transform 0.15s ease;
	}

	.chevron.up {
		transform: rotate(180deg);
	}

	.history {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid var(--color-border);
	}

	.history .compare {
		margin-left: auto;
		flex-shrink: 0;
	}

	/* Inline links reach a 24px hit without moving the text. Last, so nothing
	   above resets it. */
	.version-bar a,
	.versions-toggle {
		padding: 4px 0;
		margin: -4px 0;
	}

	/* Stacked widths: the controls drop under the note rather than crush it.
	   flex-shrink back on, or the basis plus the indent overflows the page. */
	@media (max-width: 1023px) {
		.current {
			flex-wrap: wrap;
			row-gap: 4px;
		}

		.controls {
			flex: 1 1 100%;
			margin-left: 36px;
		}
	}

	/* On a phone the compare drops under each row, and every link and the
	   toggle reach a thumb's height. */
	@media (max-width: 699px) {
		.history li {
			flex-wrap: wrap;
			row-gap: 4px;
		}

		/* The controls wrap as items 10px apart with no dots at all, so a line
		   that starts on "3 versions" does not start on a separator. */
		.controls {
			display: flex;
			flex-wrap: wrap;
			column-gap: 10px;
		}

		.item + .item::before {
			content: none;
		}

		/* Outranks the 4px hit rule above; inline-block so the padding counts. */
		.version-bar .controls a,
		.version-bar .versions-toggle,
		.version-bar .history .compare,
		.version-bar .version-link {
			display: inline-block;
			padding: 11px 0;
			margin-block: -11px;
		}

		.version-bar .versions-toggle,
		.version-bar .version-link {
			display: inline-flex;
		}

		.history {
			gap: 0;
		}

		.history li {
			padding: 11px 0;
		}

		.history .compare {
			flex: 1 1 100%;
			margin-left: 36px;
		}
	}
</style>
