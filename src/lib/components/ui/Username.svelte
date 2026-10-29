<script lang="ts">
	// One look for a username wherever it appears: mono, linked to the profile,
	// one notch under the size of the line it sits in (Pencil Rule, 29 October
	// 2026): JetBrains Mono runs optically larger than the faces beside it.
	// `current` marks the link as the page being shown (the owner's own handle
	// in the bar, on their profile).
	let {
		username,
		tone = 'paper',
		current = false,
		onclick
	}: {
		username: string;
		tone?: 'paper' | 'dark';
		current?: boolean;
		onclick?: () => void;
	} = $props();
</script>

<a
	href="/users/{username}"
	class="username"
	class:on-dark={tone === 'dark'}
	aria-current={current ? 'page' : undefined}
	{onclick}>
	@{username}
</a>

<style>
	/* Clay like every other link in running text; ink on hover. */
	.username {
		font-family: var(--font-mono);
		font-size: 0.9375em;
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

	.username.on-dark:hover,
	.username.on-dark[aria-current='page'] {
		color: var(--color-text-cream);
	}
</style>
