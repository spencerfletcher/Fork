<script lang="ts">
	// One look for a username wherever it appears: mono, linked to the profile,
	// at the size of the line it sits in (Pencil Rule, 29 October 2026).
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
	/* Clay like every other link in running text; ink on hover. */
	.username {
		font-family: var(--font-mono);
		color: var(--color-accent);
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
