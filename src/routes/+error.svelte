<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="page">
	<div class="page-inner">
		<div class="py-8 text-center">
			<p class="mb-3 font-mono text-[4rem] font-bold leading-none text-accent">
				{$page.status}
			</p>
			<h1 class="m-0 mb-3 text-[1.5rem]">{$page.error?.message || 'An error occurred'}</h1>
			<p class="m-0 mb-6 text-text-3">
				The page you're looking for doesn't exist or something went wrong.
			</p>
			<a href="/" class="btn-primary">Go Home</a>
		</div>
	</div>
</div>
