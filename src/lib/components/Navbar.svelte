<!-- This is the Navbar component that displays the application navigation -->
<script lang="ts">
	// This is the correct import statement based on your runtime.js file.
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';

	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages.js';
</script>

<nav class="bg-gray-800 text-white shadow-md">
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<div class="flex items-center gap-8">
			<a href="/" class="text-xl font-bold text-green-400 hover:text-green-300">
				{m.app_title()}
			</a>

			<ul class="hidden items-center space-x-6 md:flex">
				<li>
					<a
						href="/new"
						class="hover:text-green-300"
						class:font-bold={$page.url.pathname === '/new'}
					>
						{m.navbar_new()}
					</a>
				</li>
			</ul>
		</div>
		<div class="flex items-center space-x-3 text-sm">
			{#each locales as tag}
				<button
					type="button"
					on:click={() => setLocale(tag)}
					class="uppercase transition-colors hover:text-green-300"
					class:font-bold={tag === getLocale()}
					class:text-gray-400={tag !== getLocale()}
				>
					{tag}
				</button>
			{/each}
		</div>
	</div>
</nav>
