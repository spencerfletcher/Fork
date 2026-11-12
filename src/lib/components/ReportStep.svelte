<script lang="ts">
	import { enhance } from '$app/forms';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { MAX_REPORT } from '#lib/moderation.js';
	import type { ReportTarget } from '#lib/server/db/schema.js';

	// Report's step inside a ⋯ menu (the Friends feed's MoreMenu, a recipe's
	// MoreActions): what's wrong, filed by the Friends route's report action,
	// then the thanks in its place. The box takes focus as the step opens. A
	// refusal (a lapsed session) is shown above the form, where the press was.
	let { target }: { target: { type: ReportTarget; id: string } } = $props();

	let reported = $state(false);
	const reporting = pendingEnhance({ keepFailure: true, done: () => (reported = true) });
</script>

{#if reported}
	<p class="report-step" role="status">Reported. Thanks; someone will read it.</p>
{:else}
	{#if reporting.error}
		<p class="form-error" role="alert">{reporting.error}</p>
	{/if}
	<form method="POST" action="/friends?/report" class="report-step" use:enhance={reporting.submit}>
		<input type="hidden" name="targetType" value={target.type} />
		<input type="hidden" name="targetId" value={target.id} />
		<label for="reason-{target.type}-{target.id}">What's wrong?</label>
		<textarea
			id="reason-{target.type}-{target.id}"
			name="reason"
			rows="3"
			required
			maxlength={MAX_REPORT}
			{@attach (el) => el.focus()}>
		</textarea>
		<button type="submit" class="btn-ghost">Send report</button>
	</form>
{/if}

<style>
	.report-step {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 6px;
	}

	p.report-step {
		font-size: 0.875rem;
		color: var(--color-text-2);
	}

	label {
		font-size: 0.875rem;
		font-weight: 600;
	}
</style>
