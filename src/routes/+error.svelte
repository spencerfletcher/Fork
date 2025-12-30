<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
	<div class="py-20 text-center">
		<h1 class="text-foreground mb-4 text-6xl">{$page.status}</h1>
		<h2 class="text-foreground mb-4 text-2xl">{$page.error?.message || 'An error occurred'}</h2>
		<p class="text-muted-foreground mb-8">
			The page you're looking for doesn't exist or something went wrong.
		</p>
		<a
			href="/"
			class="inline-block rounded-md bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
		>
			Go Home
		</a>
	</div>
</div>
