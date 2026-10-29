<script lang="ts">
	import { enhance } from '$app/forms';

	let {
		form
	}: {
		form: { message?: string; registered?: boolean; errors?: { username?: string } } | null;
	} = $props();

	let email = $state('');
	let username = $state('');
	// Once the user has typed a handle of their own, the email stops suggesting one.
	let usernameEdited = $state(false);

	// The email prefix under the server's rules: lowercase, allowed characters, 30 at most.
	function suggest() {
		if (usernameEdited) return;
		username = email
			.split('@')[0]
			.toLowerCase()
			.replace(/[^a-z0-9_-]/g, '')
			.slice(0, 30);
	}

	const usernameError = $derived(form?.errors?.username);
</script>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-header">
			<h1>Create an account</h1>
			<p class="auth-subtitle">Start building your personal cookbook</p>
		</div>

		{#if form?.message}
			<div class="auth-error" role="alert">
				{form.message}
				{#if form.registered}
					<a href="/login">Sign in</a>
				{/if}
			</div>
		{/if}

		<form method="POST" use:enhance class="form">
			<div class="field">
				<label for="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					placeholder="you@example.com"
					bind:value={email}
					oninput={suggest} />
			</div>

			<div class="field">
				<label for="username">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					required
					minlength="3"
					maxlength="30"
					autocomplete="username"
					spellcheck="false"
					bind:value={username}
					oninput={() => (usernameEdited = true)}
					aria-invalid={usernameError ? 'true' : undefined}
					aria-describedby={usernameError ? 'username-error username-hint' : 'username-hint'} />
				{#if usernameError}
					<p class="field-error" id="username-error">{usernameError}</p>
				{/if}
				<p class="form-hint" id="username-hint">Your public handle, shown on every recipe.</p>
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					minlength="6"
					autocomplete="new-password"
					aria-describedby="password-hint" />
				<p class="form-hint" id="password-hint">At least 6 characters</p>
			</div>

			<button type="submit" class="btn-primary auth-submit">Create account</button>
			<p class="form-hint confirm-note">We'll email you a link to confirm.</p>
		</form>

		<p class="auth-switch">
			Already have an account? <a href="/login">Sign in</a>
		</p>
	</div>
</div>

<style>
	/* The editor's mono rule catches every text input inside .form; the handle
	   sits between two sans inputs and takes their face. */
	.form input[type='text'] {
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		line-height: normal;
	}

	@media (max-width: 699px) {
		.form input[type='text'] {
			font-size: 1rem;
		}
	}

	.form-hint {
		margin: 0;
	}

	.confirm-note {
		text-align: center;
	}
</style>
