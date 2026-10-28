<script lang="ts">
	// One look for a username wherever it appears: mono, linked to the profile.
	let {
		username,
		tone = 'paper',
		onclick
	}: { username: string; tone?: 'paper' | 'dark'; onclick?: () => void } = $props();
</script>

<a href="/users/{username}" class="username" class:on-dark={tone === 'dark'} {onclick}>
	@{username}
</a>

<style>
	.username {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-text-3);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.username:hover {
		color: var(--color-text);
	}

	.username.on-dark {
		color: var(--color-text-tan);
	}

	.username.on-dark:hover {
		color: var(--color-text-cream);
	}
</style>
