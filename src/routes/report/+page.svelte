<script lang="ts">
	import { enhance } from '$app/forms';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import { REPORT_HONEYPOT } from '#lib/moderation.js';
	import { pageTitle } from '#lib/seo.js';
	import type { PageData } from './$types';

	type Field = 'link' | 'what' | 'contact';

	// The action's answers, as one shape: sent, or refused with what was typed.
	let {
		data,
		form
	}: {
		data: PageData;
		form: {
			sent?: boolean;
			error?: string;
			errors?: Partial<Record<Field, string>>;
			values?: Record<Field, string>;
		} | null;
	} = $props();

	// Disabled while the report is out, so a second press cannot send it twice.
	// keepOnError: a lost connection keeps what was typed, and says so above the form.
	const sending = pendingEnhance({ keepOnError: true });

	const values = $derived(form?.values ?? { link: '', what: '', contact: data.contact });
	const errors: Partial<Record<Field, string>> = $derived(form?.errors ?? {});
	// A refusal that is no one field's: the rate limit, or no connection.
	const formError = $derived(sending.error ?? (form?.errors ? null : form?.error));

	/** The hint, then the error once there is one; and the box marked invalid. */
	const described = (name: Field) =>
		errors[name]
			? { 'aria-invalid': 'true' as const, 'aria-describedby': `${name}-hint ${name}-error` }
			: { 'aria-describedby': `${name}-hint` };
</script>

<!-- The sent card is the action's answer, which the loader cannot see, so the
     tab title follows it here, as on Forgot password. -->
<svelte:head>
	<title>{pageTitle(form?.sent ? 'Report sent' : data.meta.title)}</title>
</svelte:head>

<div class="page">
	<div class="page-inner page-inner--narrow">
		{#if form?.sent}
			<!-- The form gives way to this heading; focus follows so a screen reader hears it. -->
			<h1 tabindex="-1" {@attach (heading) => heading.focus()}>Report sent</h1>
			<p class="lede">
				Thanks. Someone at Fork reads every report and will look at the page. If we need to know
				more, we'll write to the address you gave.
			</p>
			<p><a class="inline-action" href="/">Back to Fork</a></p>
		{:else}
			<div class="page-head">
				<h1>Report a problem</h1>
				<p class="page-sub">
					Something on Fork that shouldn't be there: your photo or writing used without asking, or
					anything unsafe. You don't need an account.
				</p>
			</div>

			<form method="POST" class="form" novalidate use:enhance={sending.submit}>
				{#if formError}
					<p class="form-error" role="alert">{formError}</p>
				{/if}

				<div class="field">
					<label for="link">
						Link on Fork <span class="field-required" aria-hidden="true">Required</span>
					</label>
					<input
						id="link"
						name="link"
						type="text"
						inputmode="url"
						autocomplete="off"
						required
						maxlength={data.caps.link}
						value={values.link}
						{...described('link')} />
					<p class="form-hint" id="link-hint">Copy it from the address bar on that page.</p>
					<FieldError name="link" error={errors.link} />
				</div>

				<div class="field">
					<label for="what">
						What's wrong <span class="field-required" aria-hidden="true">Required</span>
					</label>
					<textarea
						id="what"
						name="what"
						rows="5"
						required
						maxlength={data.caps.what}
						{...described('what')}>{values.what}</textarea>
					<p class="form-hint" id="what-hint">
						Say what it is and why it shouldn't be there. If it's your work or your photo, say so.
					</p>
					<FieldError name="what" error={errors.what} />
				</div>

				<div class="field">
					<label for="contact">
						Your email <span class="field-required" aria-hidden="true">Required</span>
					</label>
					<input
						id="contact"
						name="contact"
						type="email"
						autocomplete="email"
						required
						maxlength={data.caps.contact}
						value={values.contact}
						{...described('contact')} />
					<p class="form-hint" id="contact-hint">
						Only Fork's moderators see it, and only to reply to you.
					</p>
					<FieldError name="contact" error={errors.contact} />
				</div>

				<!-- A trap for form-filling bots: hidden from people and screen readers, out
				     of the tab order. A filled one is thanked and kept nowhere. -->
				<div class="sr-only" aria-hidden="true">
					<label for={REPORT_HONEYPOT}>Leave this empty</label>
					<input
						id={REPORT_HONEYPOT}
						name={REPORT_HONEYPOT}
						type="text"
						tabindex="-1"
						autocomplete="off" />
				</div>

				<div class="form-actions">
					<button type="submit" class="btn-primary" disabled={sending.pending}>
						{sending.pending ? 'Sending…' : 'Send report'}
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>

<style>
	h1:focus {
		outline: none;
	}

	.lede {
		margin: var(--space-3) 0 var(--space-5);
		font-size: 1.0625rem;
		line-height: 1.5;
	}
</style>
