<script lang="ts">
	import { enhance } from '$app/forms';
	import FieldError from '#lib/components/ui/FieldError.svelte';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import { EMAIL_MESSAGE, emailCheck } from '#lib/auth/emailCheck.svelte.js';
	import { authHref, loginHref } from '#lib/auth/loginHref.js';

	let {
		data,
		form
	}: {
		data: {
			state: 'sent' | 'expired' | 'confirmed';
			email: string | null;
			redirectTo: string | null;
		};
		form: { error?: string; sent?: boolean; email?: string } | null;
	} = $props();

	// Disabled while the request is out, so a second press cannot send it twice.
	const submit = pendingEnhance();

	const emailField = emailCheck();

	// The button was disabled while the request was out, so focus fell to the
	// body; the outcome takes it, read through `form` so a second identical
	// outcome takes it again.
	const focusOn = (show: (f: typeof form) => boolean | undefined) => (el: HTMLElement) => {
		if (show(form)) el.focus();
	};
</script>

<div class="auth-page">
	<div class="auth-card">
		{#if data.state === 'confirmed'}
			<div class="auth-header">
				<h1>Email confirmed</h1>
				<p class="auth-subtitle">Your account is ready. Log in to start your cookbook.</p>
			</div>
			<a href={loginHref(data.redirectTo)} class="btn-primary auth-submit">Log in</a>
		{:else}
			<div class="auth-header">
				{#if data.state === 'expired'}
					<h1>Link expired</h1>
					<p class="auth-subtitle">
						This confirmation link has expired or was already used. Ask for a new one below.
					</p>
				{:else}
					<h1>Check your email</h1>
					<p class="auth-subtitle">
						We sent a confirmation link to {data.email ?? 'the address you signed up with'}. Open it
						to finish creating your account.
					</p>
				{/if}
			</div>

			{#if form?.error}
				<div class="auth-error" role="alert" tabindex="-1" {@attach focusOn((f) => !!f?.error)}>
					{form.error}
				</div>
			{:else if form?.sent}
				<p class="auth-subtitle" role="status" tabindex="-1" {@attach focusOn((f) => f?.sent)}>
					If {form.email} is waiting to be confirmed, a new link is on its way.
				</p>
			{/if}

			<!-- With the address remembered, the server resends to it; otherwise it is asked for. -->
			<form method="POST" use:enhance={submit.submit} class="form">
				{#if !data.email}
					<div class="field">
						<label for="email">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							autocomplete="email"
							placeholder="you@example.com"
							value={form?.email ?? ''}
							{...emailField.field} />
						<FieldError name="email" error={emailField.shown ? EMAIL_MESSAGE : null} />
					</div>
				{/if}
				<button
					type="submit"
					class="btn-primary auth-submit"
					disabled={submit.pending}
					{...data.email ? {} : emailField.button}>
					{submit.pending ? 'Sending…' : 'Resend link'}
				</button>
			</form>

			{#if data.email}
				<p class="auth-switch">
					Wrong address? <a class="inline-action" href={authHref('/signup', data.redirectTo)}>
						Sign up again
					</a>
				</p>
			{/if}
			<p class="auth-switch">
				Already confirmed? <a class="inline-action" href={loginHref(data.redirectTo)}>Log in</a>
			</p>
		{/if}
	</div>
</div>

<style>
	[tabindex='-1']:focus {
		outline: none;
	}

	/* A long address breaks inside the card rather than widening it. */
	.auth-subtitle {
		overflow-wrap: anywhere;
	}
</style>
