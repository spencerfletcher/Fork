<script lang="ts">
	let { title, body }: { title: string; body: string } = $props();
</script>

<section class="mb-6">
	<h2 class="mb-3 text-5xl text-foreground">{title}</h2>
	<p class="text-xl text-muted-foreground">
		{body}
	</p>
</section>
