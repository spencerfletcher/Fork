<script lang="ts">
	import { enhance } from '$app/forms';

	let { form, data }: { form: { message?: string } | null; data: { redirectTo: string | null } } =
		$props();

	// Disabled while the request is out, so a second press cannot send it twice.
	let pending = $state(false);

	// The email message shows once the user has typed in the field and left
	// it, or a submit was stopped, and follows the browser's own type="email"
	// check, so it clears as soon as the address is fixed.
	let emailEdited = $state(false);
	let emailLeft = $state(false);
	let emailValid = $state(true);
	const emailShown = $derived(emailLeft && !emailValid);
	// Set by a press on the submit button, which comes before the email's blur
	// in every browser; Safari gives the button no focus, so the blur names no
	// target. Cleared when the email gains focus, so a stray press holds back
	// nothing later.
	let submitPressed = false;

	// Sent here from a page that needs an account, the subtitle says why.
	const subtitle = $derived(
		!data.redirectTo
			? 'Log in to your cookbook'
			: data.redirectTo.split('?')[0] === '/favorites'
				? 'Log in to see your favorites'
				: 'Log in to continue'
	);
</script>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-header">
			<h1>Welcome back</h1>
			<p class="auth-subtitle">{subtitle}</p>
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
				};
			}}
			class="form">
			{#if data.redirectTo}
				<input type="hidden" name="redirectTo" value={data.redirectTo} />
			{/if}
			<div class="field">
				<label for="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
					placeholder="you@example.com"
					oninput={(e) => {
						emailEdited = true;
						emailValid = e.currentTarget.validity.valid;
					}}
					onfocus={() => (submitPressed = false)}
					onblur={(e) => {
						// Left for the submit button, the message waits for the stopped submit:
						// shown now, it would push the button from under the tap.
						const toSubmit =
							submitPressed ||
							e.relatedTarget === e.currentTarget.form?.querySelector('[type="submit"]');
						if (!toSubmit) emailLeft ||= emailEdited;
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

			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password" />
				<a href="/forgot-password" class="forgot-link">Forgot password?</a>
			</div>

			<button
				type="submit"
				class="btn-primary auth-submit"
				disabled={pending}
				onpointerdown={() => (submitPressed = true)}>
				{pending ? 'Logging in…' : 'Log in'}
			</button>
		</form>

		<p class="auth-switch">
			Don't have an account? <a
				href={data.redirectTo
					? `/signup?redirectTo=${encodeURIComponent(data.redirectTo)}`
					: '/signup'}>
				Create one
			</a>
		</p>
	</div>
</div>

<style>
	/* The switch link reaches 24px at desktop and 44px on a phone by padding
	   pulled back by margin, so the sentence does not move. */
	.auth-switch a {
		display: inline-block;
		padding-block: 2px;
		margin-block: -2px;
	}

	/* Supabase's own recovery flow, ahead of a settings page. Same hits as
	   the switch link. */
	.forgot-link {
		align-self: flex-end;
		font-size: 0.875rem;
		padding-block: 2px;
		margin-block: -2px;
	}

	@media (max-width: 699px) {
		.auth-switch a,
		.forgot-link {
			padding-block: 12px;
			margin-block: -12px;
		}
	}
</style>
