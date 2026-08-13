<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="page">
	<div class="page-inner">
		<div class="py-8 text-center">
			<p class="text-accent mb-3 font-mono text-[4rem] leading-none font-bold">
				{$page.status}
			</p>
			<h1 class="m-0 mb-3 text-[1.5rem]">{$page.error?.message || 'An error occurred'}</h1>
			<p class="text-text-3 m-0 mb-6">
				The page you're looking for doesn't exist or something went wrong.
			</p>
			<a href="/" class="btn-primary">Go Home</a>
		</div>
	</div>
</div>
