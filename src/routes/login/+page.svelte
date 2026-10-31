<script lang="ts">
	import { enhance } from '$app/forms';
	import { EMAIL_MESSAGE, emailCheck, firstInvalid } from '#lib/auth/emailCheck.svelte.js';

	let { form, data }: { form: { message?: string } | null; data: { redirectTo: string | null } } =
		$props();

	// Disabled while the request is out, so a second press cannot send it twice.
	let pending = $state(false);

	// A stopped submit fires invalid on every failing field in order, and the
	// browser bubbles over the first one not cancelled. The email has its own
	// message, so it cancels and takes the focus itself; a later field cancels
	// too, so its bubble cannot cover the email's message.
	const emailField = emailCheck();

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
					{...emailField.field} />
				{#if emailField.shown}
					<p class="field-error" id="email-error">{EMAIL_MESSAGE}</p>
				{/if}
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password"
					oninvalid={(e) => {
						if (!firstInvalid(e.currentTarget)) e.preventDefault();
					}} />
				<a href="/forgot-password" class="forgot-link">Forgot password?</a>
			</div>

			<button
				type="submit"
				class="btn-primary auth-submit"
				disabled={pending}
				{...emailField.button}>
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
	/* Supabase's own recovery flow, ahead of a settings page. Same hits as
	   the switch link (app.css). */
	.forgot-link {
		align-self: flex-end;
		font-size: 0.875rem;
		padding-block: 2px;
		margin-block: -2px;
	}

	@media (max-width: 699px) {
		.forgot-link {
			padding-block: 12px;
			margin-block: -12px;
		}
	}
</style>
