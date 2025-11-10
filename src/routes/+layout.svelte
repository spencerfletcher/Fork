<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { createBrowserClient } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	// This is the key change:
	// We destructure BOTH `data` and `children` from the top-level props.
	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	// Create the Supabase client on the client side
	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch,
		},
	});

	// Make the Supabase client and verified user available to all child components
	// through Svelte's context API.
	setContext('supabase', supabase);
	setContext('user', data.user);
</script>

<div class="flex min-h-screen flex-col">
	<Navbar user={data.user} />

	<main class="flex-grow">
		{@render children()}
	</main>
</div>
