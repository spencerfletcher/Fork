<script lang="ts">
	let { title, body }: { title: string; body: string } = $props();
</script>

<section class="mb-12">
	<h1 class="text-foreground mb-3">{title}</h1>
	<p class="text-muted-foreground text-xl">
		{body}
	</p>
</section>
