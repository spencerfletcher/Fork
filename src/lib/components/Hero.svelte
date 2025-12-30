<script lang="ts">
	let { title, body }: { title: string; body: string } = $props();
</script>

<section class="mb-6">
	<h2 class="mb-3 text-5xl">{title}</h2>
	<p class="text-xl text-gray-600">
		{body}
	</p>
</section>
