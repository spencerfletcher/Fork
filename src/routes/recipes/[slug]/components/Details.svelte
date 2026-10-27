<script lang="ts">
	import type { RecipeContent } from '#lib/recipes/types.js';
	import { formatTime } from '#lib/helpers.js';

	let {
		content
	}: { content: Pick<RecipeContent, 'prepTimeMinutes' | 'cookTimeMinutes' | 'servings'> } =
		$props();
</script>

{#if content.prepTimeMinutes || content.cookTimeMinutes || content.servings}
	<div class="border-border-2 bg-surface rounded-lg border p-5">
		<h4 class="eyebrow-label mb-4">Details</h4>
		<dl class="m-0 flex flex-col gap-3 p-0">
			{#if content.prepTimeMinutes}
				<div class="flex items-baseline justify-between gap-3">
					<dt class="text-text-3 font-sans text-[0.75rem] font-medium">Prep</dt>
					<dd class="text-text m-0 font-mono text-[0.85rem] font-medium">
						{formatTime(content.prepTimeMinutes)}
					</dd>
				</div>
			{/if}
			{#if content.cookTimeMinutes}
				<div class="flex items-baseline justify-between gap-3">
					<dt class="text-text-3 font-sans text-[0.75rem] font-medium">Cook</dt>
					<dd class="text-text m-0 font-mono text-[0.85rem] font-medium">
						{formatTime(content.cookTimeMinutes)}
					</dd>
				</div>
			{/if}
			{#if content.servings}
				<div class="flex items-baseline justify-between gap-3">
					<dt class="text-text-3 font-sans text-[0.75rem] font-medium">Serves</dt>
					<dd class="text-text m-0 font-mono text-[0.85rem] font-medium">{content.servings}</dd>
				</div>
			{/if}
		</dl>
	</div>
{/if}
