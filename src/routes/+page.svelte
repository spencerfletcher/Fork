<script lang="ts">
	import { page } from '$app/state';
	import Discover from './discover/Discover.svelte';
	import { ACCOUNT_DELETED, GOODBYE } from '#lib/account.js';
	import type { PageData } from './$types';

	// Signed out, home is Discover (signed in, the loader sends you to your
	// Cookbook).
	let { data }: { data: PageData } = $props();

	// Where Delete account lands, signed out.
	const goodbye = $derived(page.url.pathname + page.url.search === ACCOUNT_DELETED);
</script>

<Discover {data} notice={goodbye ? GOODBYE : undefined} />
