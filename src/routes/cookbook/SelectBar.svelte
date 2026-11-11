<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { onMount, tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import Dropdown from '#lib/components/ui/Dropdown.svelte';
	import ConfirmStep from '#lib/components/ui/ConfirmStep.svelte';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import CollectionChecks, {
		type Collected
	} from '#lib/components/recipes/CollectionChecks.svelte';
	import { chevronIcon, moreIcon } from '#lib/components/Icons.svelte';
	import { plural } from '#lib/helpers.js';
	import { CAPS } from '#lib/recipes/validation.js';
	import type { TagChip } from '#lib/recipes/types.js';
	import { TRASH_DAYS } from '#lib/trash.js';
	import type { Selection } from './selection.svelte.js';

	// Select mode's bar, pinned to the screen's foot (on a phone in the tab
	// bar's place): the count, Select all, then the acts on the selection, each
	// one request to the Cookbook's bulk actions. Collections take every
	// recipe chosen; a tag and the Trash only the cook's own, so with none of
	// theirs chosen those two are not offered. Below 700 Select all and Move to
	// Trash go in the bar's ⋯.
	let {
		sel,
		chosen,
		shownIds,
		allTags,
		trashCount,
		onchanged,
		onleave
	}: {
		sel: Selection;
		/** The chosen cards among those shown, in their order. */
		chosen: { id: number; saved: boolean }[];
		/** Every card shown, for Select all (never the unseen rest). */
		shownIds: number[];
		allTags: TagChip[];
		/** The Trash's count, for the link after a move. */
		trashCount: number;
		/** Reload the page in place (pages shown, scroll and counts kept). */
		onchanged: () => Promise<void>;
		/** Cancel or Escape: the mode ends. */
		onleave: () => void;
	} = $props();

	const phone = new MediaQuery('(max-width: 699px)');

	const count = $derived(chosen.length);
	const own = $derived(chosen.filter((r) => !r.saved).length);
	const saved = $derived(count - own);
	const ids = $derived(chosen.map((r) => r.id).join(','));
	const allShown = $derived(shownIds.every((id) => sel.has(id)));

	let root: HTMLElement | undefined = $state();
	let height = $state(0);
	let step = $state<'tag' | null>(null);
	let confirming = $state(false);
	let error = $state('');
	let moreButton: HTMLButtonElement | undefined = $state();

	// A phone asks from the ⋯, then shows the step in the bar's row: focus to
	// the step, and back to the ⋯ once it closes (the step's own trigger is not drawn).
	async function confirmFromMenu(close: () => void) {
		close();
		confirming = true;
		await tick();
		root?.querySelector<HTMLElement>('.confirm-step [role="group"]')?.focus();
	}
	let wasConfirming = false;
	$effect(() => {
		if (wasConfirming && !confirming && phone.current) tick().then(() => moreButton?.focus());
		wasConfirming = confirming;
	});

	// The page ends clear of the bar and focus stops above it (app.css), by
	// its height: it wraps on a phone, and grows while a step is open.
	$effect(() => {
		document.documentElement.style.setProperty('--select-bar-height', `${height}px`);
	});
	onMount(() => {
		firstControl()?.focus();
		return () => document.documentElement.style.removeProperty('--select-bar-height');
	});

	const firstControl = () =>
		root?.querySelector<HTMLElement>('.bar-tools button:not(:disabled), .bar-tools a');

	// Escape leaves the mode, unless it is closing something inside the bar.
	function onkeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape' || step || confirming) return;
		const at = e.target instanceof Element ? e.target : null;
		if (at?.closest('.menu-panel, .confirm-step, [aria-expanded="true"]')) return;
		onleave();
	}

	const say = (text: string) => (sel.status = { text });

	/** "1 recipe is no longer in your Cookbook and was left out." */
	const leftOut = (skipped: number) =>
		skipped > 0
			? ` ${plural(skipped, 'recipe')} ${skipped === 1 ? 'is' : 'are'} no longer in your Cookbook and ${skipped === 1 ? 'was' : 'were'} left out.`
			: '';

	const counted = (data: Record<string, unknown> | undefined, key: string) =>
		typeof data?.[key] === 'number' ? data[key] : 0;

	async function collected({ name, member, data }: Collected) {
		const changed = counted(data, 'changed');
		const skipped = counted(data, 'skipped');
		say(
			(member
				? changed > 0
					? `Added ${plural(changed, 'recipe')} to ${name}.`
					: `Already in ${name}.`
				: `Removed ${plural(changed, 'recipe')} from ${name}.`) + leftOut(skipped)
		);
		await onchanged();
	}

	// ─── Add tag ────────────────────────────────────────────────────────────
	let tags = $state<string[]>([]);
	let tagError = $state<string | undefined>();
	let tagging = $state(false);
	let tagButton: HTMLButtonElement | undefined = $state();

	async function openTag() {
		tags = [];
		tagError = undefined;
		error = '';
		step = 'tag';
		await tick();
		root?.querySelector<HTMLInputElement>('[role="combobox"]')?.focus();
	}

	async function closeTag() {
		step = null;
		await tick();
		tagButton?.focus();
	}

	const quoted = (names: string[]) => names.map((n) => `“${n}”`).join(' and ');

	const addTags: SubmitFunction = () => {
		tagging = true;
		error = '';
		return async ({ result }) => {
			tagging = false;
			if (result.type !== 'success') return refused(result, 'Could not add that tag. Try again.');
			const data = result.data;
			const names = Array.isArray(data?.tagged) ? data.tagged.map(String) : tags;
			const changed = counted(data, 'changed');
			const already = counted(data, 'already');
			const full = counted(data, 'full');
			say(
				[
					changed > 0 && `Added ${quoted(names)} to ${plural(changed, 'recipe')}.`,
					already > 0 &&
						`${plural(already, 'recipe')} had ${names.length > 1 ? 'them' : 'it'} already.`,
					full > 0 && `${plural(full, 'recipe')} skipped: a recipe takes at most ${CAPS.tags} tags.`
				]
					.filter(Boolean)
					.join(' ')
			);
			await closeTag();
			await onchanged();
		};
	};

	// ─── Move to Trash ──────────────────────────────────────────────────────
	let trashing = $state(false);
	const trash: SubmitFunction = () => {
		trashing = true;
		error = '';
		return async ({ result }) => {
			trashing = false;
			if (result.type !== 'success')
				return refused(result, 'Could not move those to the Trash. Try again.');
			const moved = counted(result.data, 'moved');
			confirming = false;
			sel.clear();
			await onchanged();
			sel.status = { text: `${plural(moved, 'recipe')} moved to Trash.`, trash: true };
			await tick();
			firstControl()?.focus();
		};
	};

	function refused(result: { type: string; data?: Record<string, unknown> }, fallback: string) {
		const message = result.type === 'failure' ? result.data?.error : undefined;
		error = typeof message === 'string' ? message : fallback;
	}

	const trashLabel = $derived(`Move ${plural(own, 'recipe')} to Trash?`);
	const trashSentence = $derived(
		`Moves your ${plural(own, 'recipe')} to your Trash` +
			(saved > 0 ? `; the ${saved} saved ${saved === 1 ? 'one stays' : 'ones stay'}` : '') +
			`. You can restore ${own === 1 ? 'it' : 'them'} for ${TRASH_DAYS} days.`
	);
	const tagSentence = $derived(
		`Adds to your ${plural(own, 'recipe')}` +
			(saved > 0
				? `; the ${saved} saved ${saved === 1 ? 'one stays' : 'ones stay'} as ${saved === 1 ? 'it is' : 'they are'}`
				: '') +
			'.'
	);
</script>

<svelte:window {onkeydown} />

<section class="select-bar" aria-label="Selection" bind:this={root} bind:offsetHeight={height}>
	<div class="bar-in">
		<p class="bar-count" role="status">
			{count > 0 ? `${count} selected` : 'None selected'}
			{#if own > 0 && saved > 0}<span class="say">{own} yours, {saved} saved</span>{/if}
		</p>

		{#if step === 'tag'}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions (Escape bubbles up from the controls inside) -->
			<form
				class="tag-step"
				method="POST"
				action="/cookbook?/bulkTag"
				use:enhance={addTags}
				onkeydown={(e) => {
					if (e.key === 'Escape') closeTag();
				}}>
				<input type="hidden" name="ids" value={ids} />
				<p class="say">{tagSentence}</p>
				<div class="tag-box">
					<TagInput {allTags} bind:selected={tags} bind:error={tagError} above />
				</div>
				<button type="submit" class="btn-primary btn-sm" disabled={tags.length === 0 || tagging}>
					{tagging ? 'Adding…' : 'Add'}
				</button>
				<button type="button" class="btn-ghost btn-sm" disabled={tagging} onclick={closeTag}>
					Cancel
				</button>
			</form>
		{:else}
			<div class="bar-tools">
				{#if !phone.current && !confirming}
					<button
						type="button"
						class="text-btn"
						disabled={allShown}
						onclick={() => sel.add(shownIds)}>
						Select all {shownIds.length} shown
					</button>
				{/if}
				{#if !confirming}
					<Dropdown onopen={() => (error = '')}>
						{#snippet trigger(props)}
							<button
								type="button"
								class="btn-ghost btn-sm"
								aria-haspopup="menu"
								disabled={count === 0}
								{...props}>
								Add to collection
								{@render chevronIcon(false)}
							</button>
						{/snippet}
						{#snippet panel()}
							<div class="menu-panel bar-panel" role="menu" aria-label="Add to collection">
								<CollectionChecks
									collections="on-open"
									listAction="/cookbook?/bulkCollections"
									collectAction="/cookbook?/bulkCollect"
									newAction="/cookbook?/bulkNewCollection"
									fields={{ ids }}
									oncollected={collected} />
							</div>
						{/snippet}
					</Dropdown>
					{#if own > 0}
						<button type="button" class="btn-ghost btn-sm" bind:this={tagButton} onclick={openTag}>
							Add tag
						</button>
					{/if}
				{/if}
				{#if phone.current && !confirming}
					<Dropdown>
						{#snippet trigger(props)}
							<button
								type="button"
								class="more-button"
								aria-haspopup="menu"
								aria-label="More for the selection"
								bind:this={moreButton}
								{...props}>
								{@render moreIcon()}
							</button>
						{/snippet}
						{#snippet panel(close)}
							<div
								class="menu-panel bar-panel bar-panel--end"
								role="menu"
								aria-label="More for the selection">
								<button
									type="button"
									class="menu-row"
									role="menuitem"
									aria-disabled={allShown || undefined}
									onclick={() => {
										if (allShown) return;
										sel.add(shownIds);
										close();
									}}>
									Select all {shownIds.length} shown
								</button>
								{#if own > 0}
									<button
										type="button"
										class="menu-row danger"
										role="menuitem"
										onclick={() => confirmFromMenu(close)}>
										Move to Trash
									</button>
								{/if}
							</div>
						{/snippet}
					</Dropdown>
				{/if}
				{#if own > 0 && (!phone.current || confirming)}
					<ConfirmStep
						bind:open={confirming}
						trigger="Move to Trash"
						triggerClass="btn-ghost btn-sm"
						label={trashLabel}
						explanation={trashSentence}
						confirmLabel="Move to Trash"
						pendingLabel="Moving…"
						keepLabel="Keep recipes"
						action="/cookbook?/bulkTrash"
						enhance={trash}
						pending={trashing}>
						{#snippet fields()}<input type="hidden" name="ids" value={ids} />{/snippet}
					</ConfirmStep>
				{/if}
				{#if !confirming}
					<button type="button" class="text-btn text-btn--ink bar-cancel" onclick={onleave}>
						Cancel
					</button>
				{/if}
			</div>
		{/if}

		<p class="bar-status" class:quiet={!sel.status} role="status">
			{sel.status?.text}
			{#if sel.status?.trash && trashCount > 0}
				<a href="/cookbook/trash" class="arrow-link">Trash ({trashCount}) →</a>
			{/if}
		</p>
		<FieldError name="selection" {error} />
	</div>
</section>

<style>
	/* Fixed at the screen's foot at every width, the editor's save bar's
	   paper and rule, above the home indicator; its contents on the page's
	   column. On a phone the tab bar gives way to it (app.css). */
	.select-bar {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 40;
		padding: 12px 24px calc(12px + env(safe-area-inset-bottom));
		background: var(--color-surface);
		border-top: 1px solid var(--color-border);
	}

	.bar-in {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 16px;
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.bar-count {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 12px;
		font-weight: 600;
	}

	.say {
		font-size: 0.9375rem;
		font-weight: 400;
		color: var(--color-text-2);
	}

	.bar-tools,
	.tag-step {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		margin-left: auto;
	}

	.bar-tools :global(.btn-ghost) {
		gap: 6px;
	}

	/* :global, because the chevron comes from Icons.svelte. */
	.bar-tools :global(.chevron) {
		width: 12px;
		height: 12px;
	}

	.tag-box {
		flex: 1 1 18rem;
		min-width: 0;
	}

	/* The bar is at the foot, so its menus open upward, from its left edge. */
	.bar-panel {
		--menu-top: auto;
		--menu-right: auto;
		bottom: calc(100% + 4px);
		left: 0;
	}

	.bar-panel--end {
		--menu-right: 0;
		left: auto;
	}

	.bar-status {
		flex-basis: 100%;
		font-size: 0.9375rem;
		color: var(--color-text-2);
	}

	.bar-status.quiet {
		display: none;
	}

	.bar-status a {
		margin-left: 8px;
	}

	/* A phone: the count and Cancel on the first line, the acts under them. */
	@media (max-width: 699px) {
		.select-bar {
			padding: 10px 18px calc(12px + env(safe-area-inset-bottom));
		}

		.bar-in {
			gap: 8px;
		}

		/* The tools' items join the bar's own row: the count takes most of the
		   first line, so only Cancel fits beside it and the acts wrap under. */
		.bar-tools {
			display: contents;
		}

		.bar-count {
			flex: 1 0 60%;
		}

		.bar-tools > :global(*) {
			order: 2;
		}

		.bar-tools > .bar-cancel {
			order: 1;
			margin-left: auto;
		}

		.bar-status,
		.bar-in > :global(.field-error) {
			order: 3;
		}

		.tag-step {
			width: 100%;
			gap: 8px;
			margin-left: 0;
		}
	}
</style>
