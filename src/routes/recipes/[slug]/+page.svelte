<script lang="ts">
	let { data } = $props();
</script>

<h1>{data.recipe.title}</h1>
<p>{data.recipe.description}</p>
<ul>
	{#each data.recipe.ingredients as ingredient}
		<li>{ingredient}</li>
	{/each}
</ul>
