<script lang="ts">
	import Avatar from './Avatar.svelte';

	// A cook as one profile link, avatar to handle, over a card whose title link
	// is stretched across it: positioned above that link, so it stays clickable,
	// and placed before it in the markup so Tab reaches the profile first.
	let {
		username,
		size = 28,
		class: className = ''
	}: {
		username: string;
		size?: 28 | 32 | 36 | 72;
		/** The caller's hook, such as `card-cook`, for its own placement. */
		class?: string;
	} = $props();
</script>

<a class={['cook-link', className]} href="/users/{username}">
	<Avatar {username} {size} />
	<span class="handle">@{username}</span>
</a>

<style>
	/* As wide as avatar and handle and no wider: inline-flex in a block, and
	   flex-start when a flex column would stretch it. */
	.cook-link {
		position: relative;
		z-index: 2;
		display: inline-flex;
		align-self: flex-start;
		align-items: center;
		gap: 8px;
		min-width: 0;
		max-width: 100%;
		min-height: 24px;
		font-size: 0.9375rem;
	}

	/* `.handle` is app.css's; the hover is the link's, avatar included, and
	   underlines the handle only: its clay holds (the hover rule). */
	@media (hover: hover) {
		.cook-link:hover .handle {
			text-decoration-line: underline;
		}
	}

	/* A 44px hit on a phone without moving the line. */
	@media (max-width: 699px) {
		.cook-link {
			min-height: 44px;
			margin-block: -8px;
		}
	}
</style>
