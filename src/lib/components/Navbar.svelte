<script lang="ts">
	// For internationalization with Paraglide
	import { languageTag, setLanguageTag, availableLanguageTags } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	// For active link styling
	import { page } from '$app/stores';
</script>

<nav class="bg-gray-800 text-white shadow-md">
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<a href="/" class="text-xl font-bold text-green-400 hover:text-green-300">
			{m.app_title()}
		</a>

		<ul class="hidden items-center space-x-6 md:flex">
			<li>
				<a
					href="/recipes"
					class="hover:text-green-300"
					class:font-bold={$page.url.pathname.startsWith('/recipes')}
				>
					{m.navbar_recipes()}
				</a>
			</li>
			<li>
				<a
					href="/about"
					class="hover:text-green-300"
					class:font-bold={$page.url.pathname === '/about'}
				>
					{m.navbar_about()}
				</a>
			</li>
		</ul>

		<div class="flex items-center space-x-3 text-sm">
			{#each availableLanguageTags as tag}
				<button
					on:click={() => setLanguageTag(tag)}
					class="uppercase transition-colors hover:text-green-300"
					class:font-bold={tag === languageTag()}
					class:text-gray-400={tag !== languageTag()}
				>
					{tag}
				</button>
			{/each}
		</div>
	</div>
</nav>
