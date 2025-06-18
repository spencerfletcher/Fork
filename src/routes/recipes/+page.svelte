<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	let { data } = $props();

	/*onMount(async () => {
		const response = await fetch('/api/recipes');
		if (response.ok) {
			recipes = await response.json();
		} else {
			console.error('Failed to fetch recipes');
		}
	});*/
</script>

{#each data.summaries as { id, title }}
	<div class="recipe-card">
		<h2><a href="/recipes/{id}">{title}</a></h2>
	</div>
{/each}
