<script lang="ts">
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import type { Session } from '@supabase/supabase-js';

	let { session }: { session: Session | null } = $props();
</script>

<nav class="bg-gray-800 text-white shadow-md">
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<!-- Left side: Title and Navigation Links -->
		<div class="flex items-center gap-8">
			<a href="/" class="text-xl font-bold text-green-400 hover:text-green-300">
				{m.app_title()}
			</a>
			<ul class="hidden items-center space-x-6 md:flex">
				<li>
					<a
						href="/new"
						class="hover:text-green-300"
						class:font-bold={$page.url.pathname === '/recipes/new'}
					>
						{m.navbar_new()}
					</a>
				</li>
			</ul>
		</div>

		<!-- Right side: Language Switcher and Auth Status -->
		<div class="flex items-center gap-6">
			<!-- Language Switcher 
			<div class="flex items-center space-x-3 text-sm">
				{#each locales as tag}
					<button
						type="button"
						onclick={() => setLocale(tag)}
						class="uppercase transition-colors hover:text-green-300"
						class:font-bold={tag === getLocale()}
						class:text-gray-400={tag !== getLocale()}
					>
						{tag}
					</button>
				{/each}
			</div>
			-->

			<!-- Auth Status -->
			<div class="flex items-center space-x-4 text-sm">
				{#if session}
					<span class="hidden sm:inline">{session.user.email}</span>
					<form action="/logout" method="POST" use:enhance>
						<button type="submit" class="hover:text-green-300">Logout</button>
					</form>
				{:else}
					<a href="/login" class="hover:text-green-300">Login</a>
					<a
						href="/signup"
						class="rounded-md bg-green-600 px-3 py-1.5 text-white hover:bg-green-700">Sign Up</a
					>
				{/if}
			</div>
		</div>
	</div>
</nav>
