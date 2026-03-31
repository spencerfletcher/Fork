<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="page">
	<div class="page-inner">
		<div class="error-body">
			<p class="error-status">{$page.status}</p>
			<h1 class="error-message">{$page.error?.message || 'An error occurred'}</h1>
			<p class="error-desc">The page you're looking for doesn't exist or something went wrong.</p>
			<a href="/" class="btn-primary">Go Home</a>
		</div>
	</div>
</div>

<style>
	.error-body {
		text-align: center;
		padding: var(--space-8) 0;
	}

	.error-status {
		font-family: var(--font-mono);
		font-size: 4rem;
		font-weight: 700;
		color: var(--color-accent);
		margin: 0 0 var(--space-3);
		line-height: 1;
	}

	.error-message {
		font-size: 1.5rem;
		margin: 0 0 var(--space-3);
	}

	.error-desc {
		color: var(--color-text-3);
		margin: 0 0 var(--space-6);
	}
</style>
