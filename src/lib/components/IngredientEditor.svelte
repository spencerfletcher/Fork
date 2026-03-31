<script lang="ts">
	import type { Ingredient } from '$lib/server/db/schema';

	let { ingredients = $bindable() }: { ingredients: Ingredient[] } = $props();

	let dragIndex = $state<number | null>(null);

	function add() {
		ingredients = [...ingredients, { amount: '', unit: '', name: '' }];
	}

	function remove(i: number) {
		ingredients = ingredients.filter((_, idx) => idx !== i);
	}

	function onDragStart(i: number) {
		dragIndex = i;
	}

	function onDrop(i: number) {
		if (dragIndex === null || dragIndex === i) return;
		const updated = [...ingredients];
		const [moved] = updated.splice(dragIndex, 1);
		updated.splice(i, 0, moved);
		ingredients = updated;
		dragIndex = null;
	}
</script>

<div class="field">
	<h4 class="editor-section-heading">Ingredients</h4>
	<div class="editor-list" role="list">
		{#each ingredients as ingredient, i (i)}
			<div
				class="editor-row"
				role="listitem"
				draggable="true"
				ondragstart={() => onDragStart(i)}
				ondragover={(e) => e.preventDefault()}
				ondrop={() => onDrop(i)}
			>
				<span class="drag-handle" title="Drag to reorder">⠿</span>
				<input
					type="text"
					placeholder="Amount"
					bind:value={ingredient.amount}
					class="input-amount"
				/>
				<input type="text" placeholder="Unit" bind:value={ingredient.unit} class="input-unit" />
				<input
					type="text"
					placeholder="Ingredient name"
					bind:value={ingredient.name}
					class="input-name"
				/>
				<button
					type="button"
					onclick={() => remove(i)}
					class="remove-btn"
					aria-label="Remove ingredient">×</button
				>
			</div>
		{/each}
	</div>
	<button type="button" onclick={add} class="btn-ghost add-btn">+ Add ingredient</button>
</div>

<style>
	.editor-section-heading {
		margin: 0 0 var(--space-2);
	}

	.add-btn {
		margin-top: var(--space-1);
	}

	.input-amount {
		max-width: 80px;
	}

	.input-unit {
		max-width: 80px;
	}

	.input-name {
		flex: 1;
	}
</style>
