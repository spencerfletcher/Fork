<script lang="ts">
	import { enhance } from '$app/forms';

	let {
		form,
		data
	}: {
		form: { message?: string; registered?: boolean; errors?: { username?: string } } | null;
		data: { redirectTo: string | null };
	} = $props();

	// Back to login with the page the visitor was headed for, if any.
	const loginHref = $derived(
		data.redirectTo ? `/login?redirectTo=${encodeURIComponent(data.redirectTo)}` : '/login'
	);

	// Disabled while the request is out, so a second press cannot send it twice.
	let pending = $state(false);

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
			<h1>Create an Account</h1>
			<p class="auth-subtitle">Start building your personal cookbook</p>
		</div>

		{#if form?.message}
			<div class="auth-error" role="alert">
				{form.message}
				{#if form.registered}
					<a href={loginHref}>Log in</a>
				{/if}
			</div>
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
			<div class="field">
				<label for="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
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
					pattern={'[A-Za-z0-9_-]{3,30}'}
					autocomplete="username"
					spellcheck="false"
					bind:value={username}
					oninput={() => (usernameEdited = true)}
					aria-invalid={usernameError ? 'true' : undefined}
					aria-describedby={usernameError ? 'username-error username-hint' : 'username-hint'} />
				{#if usernameError}
					<p class="field-error" id="username-error">{usernameError}</p>
				{:else}
					<!-- Shown by CSS once the browser judges the field invalid after the
					     user has left it; the server's wording. -->
					<p class="field-error username-rule">
						Usernames are 3 to 30 characters: letters, digits, - or _
					</p>
				{/if}
				<p class="form-hint" id="username-hint">
					3 to 30 letters, digits, - or _. Your public handle, shown on every recipe.
				</p>
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

			<button type="submit" class="btn-primary auth-submit" disabled={pending}>
				{pending ? 'Creating account…' : 'Create account'}
			</button>
			<p class="form-hint confirm-note">We'll email you a link to confirm.</p>
		</form>

		<p class="auth-switch">
			Already have an account? <a href={loginHref}>Log in</a>
		</p>
	</div>
</div>

<style>
	.form-hint {
		margin: 0;
	}

	.confirm-note {
		text-align: center;
	}

	.username-rule {
		display: none;
	}

	.field:has(input:user-invalid) .username-rule {
		display: block;
	}
</style>
