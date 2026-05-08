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
	<h4 class="m-0 mb-2">Ingredients</h4>
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
				<input type="text" placeholder="Amount" bind:value={ingredient.amount} />
				<input type="text" placeholder="Unit" bind:value={ingredient.unit} />
				<input type="text" placeholder="Ingredient name" bind:value={ingredient.name} />
				<button
					type="button"
					onclick={() => remove(i)}
					class="remove-btn"
					aria-label="Remove ingredient">×</button
				>
			</div>
		{/each}
	</div>
	<button type="button" onclick={add} class="btn-ghost mt-1">+ Add ingredient</button>
</div>
