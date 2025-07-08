<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';

	// This is the key change:
	// We destructure BOTH `data` and `children` from the top-level props.
	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	// Make the Supabase client and session available to all child components
	// through Svelte's context API.
	setContext('supabase', data.supabase);
	setContext('session', data.session);
</script>

<div class="flex min-h-screen flex-col">
	<Navbar session={data.session} />

	<main class="flex-grow">
		{@render children()}
	</main>
</div>
