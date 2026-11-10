<script lang="ts">
	import { page } from '$app/state';
	import RootError from '../../+error.svelte';
	import { VERSION_NOT_FOUND } from './versionError.js';

	// An unknown ?version= is a 404 on a recipe that exists, so the way back
	// is to it, as the compare page's error does. Every other error here (a
	// missing recipe, the edit and forks pages) answers as the root page does.
	const versionMissing = $derived(page.status === 404 && page.error?.message === VERSION_NOT_FOUND);
</script>

{#if versionMissing}
	<!-- The root error page's format: the code and the message in the h1 at
	     the site size, centred on the screen, nothing boxed. -->
	<div class="auth-page">
		<div class="error-page text-center">
			<h1>Error {page.status} – {page.error?.message}</h1>
			<div class="actions">
				<a href="/recipes/{page.params.slug}" class="btn-primary">Back to the recipe</a>
			</div>
		</div>
	</div>
{:else}
	<RootError />
{/if}
