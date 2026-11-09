<script lang="ts">
	import Discover from './discover/Discover.svelte';
	import type { PageData } from './$types';

	// Signed out, home is Discover (signed in, the loader sends you to your
	// Cookbook).
	let { data }: { data: PageData } = $props();
</script>

<Discover {data} />
