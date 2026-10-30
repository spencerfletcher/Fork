<script lang="ts">
	import { enhance } from '$app/forms';

	import { pageTitle } from '#lib/seo.js';

	let {
		form,
		data
	}: {
		form: { message?: string; sent?: boolean; email?: string } | null;
		data: { meta: { title: string } };
	} = $props();

	// Disabled while the request is out, so a second press cannot send it twice.
	let pending = $state(false);

	// The email message shows once the user has typed in the field and left
	// it, or a submit was stopped, and follows the browser's own type="email"
	// check, so it clears as soon as the address is fixed.
	let emailEdited = $state(false);
	let emailLeft = $state(false);
	let emailValid = $state(true);
	const emailShown = $derived(emailLeft && !emailValid);

	// "Send again" brings the form back over the sent card, address kept.
	let again = $state(false);
	function sendAgain(e: MouseEvent) {
		e.preventDefault();
		again = true;
	}
</script>

<!-- The sent card is client state the loader cannot see, so the tab title
     follows it here. A <title> is safe beside the layout's: Svelte keeps one
     and the page's, written last, wins; the og tags stay with the layout. -->
<svelte:head>
	<title>{pageTitle(form?.sent && !again ? 'Check your email' : data.meta.title)}</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		{#if form?.sent && !again}
			<!-- The form gives way to this heading; focus follows so a screen reader hears it. -->
			<div class="auth-header">
				<h1 tabindex="-1" {@attach (heading) => heading.focus()}>Check your email</h1>
				<p class="auth-subtitle">
					If {form.email} has an account, a link to set a new password is on its way.
				</p>
				<!-- Without JavaScript the link still reaches the form, only empty.
				     Unformatted so no space opens before the full stop. -->
				<!-- prettier-ignore -->
				<p class="auth-subtitle">Didn't get it? <a href="/forgot-password" onclick={sendAgain}>Send again</a>.</p>
			</div>
		{:else}
			<div class="auth-header">
				<h1>Forgot your password?</h1>
				<p class="auth-subtitle">We'll email you a link to set a new one.</p>
			</div>

			{#if form?.message}
				<div class="auth-error" role="alert">{form.message}</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					pending = true;
					return async ({ update }) => {
						await update();
						pending = false;
						again = false;
					};
				}}
				class="form">
				<div class="field">
					<label for="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						autocomplete="email"
						placeholder="you@example.com"
						value={again ? form?.email : undefined}
						{@attach (field) => {
							if (again) field.focus();
						}}
						oninput={(e) => {
							emailEdited = true;
							emailValid = e.currentTarget.validity.valid;
						}}
						onblur={(e) => {
							// Left for the submit button, the message waits for the stopped submit:
							// shown now, it would push the button from under the tap.
							if (e.relatedTarget !== e.currentTarget.form?.querySelector('[type="submit"]'))
								emailLeft ||= emailEdited;
						}}
						oninvalid={() => {
							emailLeft = true;
							emailValid = false;
						}}
						aria-invalid={emailShown ? 'true' : undefined}
						aria-describedby={emailShown ? 'email-error' : undefined} />
					{#if emailShown}
						<p class="field-error" id="email-error">Enter an email address like name@example.com</p>
					{/if}
				</div>

				<button type="submit" class="btn-primary auth-submit" disabled={pending}>
					{pending ? 'Sending…' : 'Send reset link'}
				</button>
			</form>
		{/if}

		<p class="auth-switch">
			Remembered it? <a href="/login">Log in</a>
		</p>
	</div>
</div>

<style>
	h1:focus {
		outline: none;
	}

	/* A long address breaks inside the card rather than widening it. */
	.auth-subtitle {
		overflow-wrap: anywhere;
	}

	/* The switch link reaches 24px at desktop and 44px on a phone by padding
	   pulled back by margin, so the sentence does not move; as on login. */
	.auth-switch a,
	.auth-subtitle a {
		display: inline-block;
		padding-block: 2px;
		margin-block: -2px;
	}

	@media (max-width: 699px) {
		.auth-switch a,
		.auth-subtitle a {
			padding-block: 12px;
			margin-block: -12px;
		}
	}
</style>
