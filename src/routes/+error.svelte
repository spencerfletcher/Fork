<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="py-20 text-center">
		<h1 class="mb-4 text-6xl text-gray-900">{$page.status}</h1>
		<h2 class="mb-4 text-2xl text-gray-800">{$page.error?.message || 'An error occurred'}</h2>
		<p class="mb-8 text-gray-600">
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
