<script lang="ts">
	import { goto, preloadData } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import { plural, wholeNumber } from '#lib/helpers.js';
	import { withoutPlace } from '#lib/listPage.js';
	import type { PagedList } from '#lib/pagedList.svelte.js';

	// The end of a paged list. A real link to every page up to the next
	// (`?page=N+1`), so it works before JavaScript; with it, a press fetches the
	// next page alone by its cursor, appends it, moves focus to its first item,
	// and writes the link's URL by a shallow replace, so Back and a reload ask
	// for every page now shown. `items` picks the list's items in `container`.
	let {
		list,
		container,
		noun,
		nouns = `${noun}s`,
		items = ':scope > *'
	}: {
		list: PagedList;
		container: HTMLElement | undefined;
		noun: string;
		nouns?: string;
		items?: string;
	} = $props();

	let pending = $state(false);
	let error = $state('');
	let status = $state('');

	// A press writes the URL shallowly, which page.url does not follow.
	const url = $derived(page.shallow?.url ?? page.url);
	const pages = $derived(wholeNumber(url.searchParams.get('page') ?? '') || 1);

	function at(key: 'page' | 'after', value: string) {
		const params = withoutPlace(url.searchParams);
		params.set(key, value);
		return `${url.pathname}?${params}`;
	}

	const nextHref = $derived(at('page', String(pages + 1)));

	async function more(event: MouseEvent) {
		// A new tab or window is the browser's to open, at the link.
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !list.next) return;
		event.preventDefault();
		if (pending) return;
		pending = true;
		error = '';
		try {
			const result = await preloadData(at('after', list.next));
			if (result.type !== 'loaded' || result.status !== 200) throw new Error(result.type);
			const before = container?.querySelectorAll(items).length ?? 0;
			const added = list.append(result.data);
			const href = nextHref;
			status = plural(added, `more ${noun}`, `more ${nouns}`);
			await tick();
			const first = container?.querySelectorAll<HTMLElement>(items)[before];
			if (first) {
				if (!first.hasAttribute('tabindex')) first.tabIndex = -1;
				first.focus();
			}
			await goto(href, { shallow: true, replace: true, state: page.state });
		} catch {
			error = `Could not load more ${nouns}. Try again.`;
		} finally {
			pending = false;
		}
	}
</script>

{#if list.next}
	<p class="show-more">
		<a class="btn-ghost" href={nextHref} onclick={more} aria-busy={pending || undefined}>
			{pending ? 'Loading…' : 'Show more'}
		</a>
	</p>
{/if}
{#if error}<p class="form-error show-more-error" role="alert">{error}</p>{/if}
<p class="sr-only" role="status" aria-live="polite">{status}</p>

<style>
	/* Under the grid, a row gap below its last cards, centred on the column. */
	.show-more {
		display: flex;
		justify-content: center;
		margin: var(--space-6) 0 0;
	}

	.show-more a {
		min-width: 12rem;
	}

	.show-more-error {
		margin: var(--space-4) auto 0;
		max-width: 36rem;
		text-align: center;
	}
</style>
