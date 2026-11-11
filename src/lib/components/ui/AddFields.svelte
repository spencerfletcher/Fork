<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import { plusIcon } from '#lib/components/Icons.svelte';

	// Optional fields offered as "Add …" text buttons until wanted (a1). A press
	// turns its button into the field and puts the cursor there in the same
	// action. A field opens by itself when it holds text (an existing recipe, a
	// restored draft) or the server refused it, and once open it stays open, so
	// clearing it never pulls the box from under the cursor. Open fields come
	// first, in order, then one line of the buttons still closed, so the Tab
	// order is the order on screen.
	let {
		fields,
		value,
		errors,
		field
	}: {
		/** Each field's name (also its box's id) and the words on its button. */
		fields: readonly { name: string; label: string }[];
		/** A field's current text. */
		value: (name: string) => string;
		/** Inline errors by field name. */
		errors: Record<string, string | undefined>;
		/** Draws an open field: its label, a box with the id `name`, its error. */
		field: Snippet<[name: string]>;
	} = $props();

	const pressed = $state<Record<string, boolean>>({});
	const held = (name: string) => value(name).trim() !== '' || !!errors[name];
	const open = (name: string) => pressed[name] || held(name);

	// The latch: what opened by holding text stays open once it is cleared.
	$effect(() => {
		for (const { name } of fields) if (held(name)) pressed[name] = true;
	});

	async function add(name: string) {
		pressed[name] = true;
		await tick();
		document.getElementById(name)?.focus();
	}
</script>

{#each fields as { name } (name)}
	{#if open(name)}{@render field(name)}{/if}
{/each}
{#if fields.some(({ name }) => !open(name))}
	<div class="add-line">
		{#each fields as { name, label } (name)}
			{#if !open(name)}
				<!-- Submitted empty, as the closed field would be. -->
				<input type="hidden" {name} value="" />
				<button type="button" class="text-btn" onclick={() => add(name)}>
					{@render plusIcon()}
					<span class="sr-only">Add</span>
					{label}
				</button>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.add-line {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0 18px;
	}
</style>
