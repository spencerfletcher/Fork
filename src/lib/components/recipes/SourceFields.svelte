<script lang="ts">
	import { MAX_SOURCE_URL, TEXT_LIMITS } from '#lib/recipes/limits.js';
	import type { RecipeDraft } from '#lib/recipes/validation.js';
	import { typedMessage } from '#lib/recipes/fieldErrors.svelte.js';
	import FieldError from '#lib/components/ui/FieldError.svelte';

	let {
		draft = $bindable(),
		errors
	}: {
		/** The editor's draft; only the source's name and link are read and written. */
		draft: RecipeDraft;
		/** Inline errors by field name. */
		errors: Record<string, string>;
	} = $props();
</script>

<!-- Where it came from outside Fork, apart from who wrote it here. -->
<div class="field">
	<label for="sourceName">Source</label>
	<input
		id="sourceName"
		name="sourceName"
		type="text"
		maxlength={TEXT_LIMITS.sourceName.max}
		placeholder="A cookbook, a person, a website"
		bind:value={draft.sourceName}
		aria-invalid={errors.sourceName ? 'true' : undefined}
		aria-describedby={errors.sourceName ? 'sourceName-error' : undefined} />
	<FieldError name="sourceName" error={errors.sourceName} />
</div>
<div class="field">
	<label for="sourceUrl">Source link</label>
	<input
		id="sourceUrl"
		name="sourceUrl"
		type="text"
		inputmode="url"
		autocomplete="off"
		maxlength={MAX_SOURCE_URL}
		placeholder="https://"
		bind:value={draft.sourceUrl}
		{@attach (el) => el.setCustomValidity(typedMessage('sourceUrl', draft.sourceUrl))}
		aria-invalid={errors.sourceUrl ? 'true' : undefined}
		aria-describedby={errors.sourceUrl ? 'sourceUrl-error' : undefined} />
	<FieldError name="sourceUrl" error={errors.sourceUrl} />
</div>
