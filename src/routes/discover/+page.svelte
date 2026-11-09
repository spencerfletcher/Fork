<script lang="ts">
	import Discover from './Discover.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Discover {data} />
