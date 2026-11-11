<script lang="ts">
	import { formatServes, scaleMakes } from '#lib/recipes/scale.js';
	import { timeSpans } from '#lib/recipes/times.js';
	import type { RecipeContent } from '#lib/recipes/types.js';

	// The recipe's head on paper (DESIGN.md, Print): what the band and the
	// version bar say, as plain lines, plus the address to find it again. The
	// screen never shows it; app.css's print block does.
	let {
		recipe,
		content,
		versionNumber,
		stored,
		serves,
		href
	}: {
		recipe: {
			author?: { username: string } | null;
			parent?: { title: string; author?: { username: string } | null } | null;
			parentId: number | null;
			parentVersion?: number | null;
			parentDeleted?: boolean;
		};
		content: Pick<
			RecipeContent,
			| 'title'
			| 'description'
			| 'makes'
			| 'prepTimeMinutes'
			| 'cookTimeMinutes'
			| 'restTimeMinutes'
			| 'sourceName'
			| 'sourceUrl'
		>;
		versionNumber: number;
		/** The version's own servings, 0 when it has none. */
		stored: number;
		/** The serves the list is scaled to. */
		serves: number;
		/** The page's address as printed: version and serves kept, cooking dropped. */
		href: string;
	} = $props();

	const factor = $derived(stored > 0 ? serves / stored : 1);

	// "v3 · Serves 6, scaled 1.5x · Makes 18 buns"
	const measure = $derived(
		[
			`v${versionNumber}`,
			stored > 0 &&
				`Serves ${formatServes(serves)}${factor !== 1 ? `, scaled ${formatServes(factor)}x` : ''}`,
			content.makes && `Makes ${scaleMakes(content.makes, factor).text}`
		].filter(Boolean)
	);

	const times = $derived(timeSpans(content).map(({ value, word }) => `${value} ${word}`));

	// Paper cannot follow a link, so the address prints in full after the name.
	const source = $derived([content.sourceName, content.sourceUrl].filter(Boolean).join(' · '));
</script>

<!-- Hidden from the accessibility tree as well as the screen: the band and
     the cooking header are the page's real head, so the title here is a
     paragraph and the page keeps one h1. -->
<div class="print-header" aria-hidden="true">
	<p class="title">{content.title}</p>
	<p>
		{#if recipe.author}By <span class="mono-id">@{recipe.author.username}</span>{/if}
		{#if recipe.parent}
			· forked from
			{#if recipe.parent.author}
				<!-- prettier-ignore -->
				<span><span class="mono-id">@{recipe.parent.author.username}</span>'s</span>
			{/if}
			{recipe.parent.title}{#if recipe.parentVersion}, v{recipe.parentVersion}{/if}
		{:else if recipe.parentDeleted}
			· original recipe deleted
		{:else if recipe.parentId}
			· forked from a private recipe
		{/if}
	</p>
	<p>{measure.join(' · ')}</p>
	{#if times.length > 0}<p>{times.join(' · ')}</p>{/if}
	{#if source}<p>Source: {source}</p>{/if}
	{#if content.description}<p class="print-description">{content.description}</p>{/if}
	<p class="address">{href}</p>
</div>

<style>
	.print-header {
		display: none;
		margin-bottom: 14pt;
		padding-bottom: 10pt;
		border-bottom: 1px solid #000;
		font-family: var(--font-sans);
		overflow-wrap: anywhere;
	}

	.title {
		margin-bottom: 4pt;
		font-family: var(--font-serif);
		font-size: 22pt;
		font-weight: 500;
		line-height: 1.15;
	}

	p:not(.title) {
		line-height: 1.4;
	}

	.print-description {
		margin-top: 6pt;
	}

	.address {
		margin-top: 6pt;
		font-size: 9pt;
	}
</style>
