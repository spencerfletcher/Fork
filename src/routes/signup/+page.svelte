<script lang="ts">
	import { enhance } from '$app/forms';
	import { EMAIL_MESSAGE, emailCheck, firstInvalid } from '#lib/auth/emailCheck.svelte.js';
	import { loginHref } from '#lib/auth/loginHref.js';
	import {
		PASSWORD_MIN,
		USERNAME_MAX,
		USERNAME_MESSAGE,
		USERNAME_MIN,
		USERNAME_PATTERN,
		suggestUsername
	} from '#lib/auth/rules.js';

	let {
		form,
		data
	}: {
		form: { message?: string; registered?: boolean; errors?: { username?: string } } | null;
		data: { redirectTo: string | null };
	} = $props();

	// Disabled while the request is out, so a second press cannot send it twice.
	let pending = $state(false);

	// A stopped submit fires invalid on every failing field in order, and the
	// browser bubbles over the first one not cancelled. The email and username
	// have their own messages, so they cancel and the first takes the focus
	// itself; the password cancels when it is not first, so its bubble cannot
	// cover their messages.
	const emailField = emailCheck();

	let email = $state('');
	let username = $state('');
	// Once the user has typed a handle of their own, the email stops suggesting one.
	let usernameEdited = $state(false);

	// The email prefix under the server's rules.
	function suggest() {
		if (usernameEdited) return;
		username = suggestUsername(email);
	}

	const usernameError = $derived(form?.errors?.username);

	// One pattern for the attribute and the rule line. Browsers compile the
	// attribute with the v flag, so the page reads it the same way.
	const usernameRule = new RegExp(`^(?:${USERNAME_PATTERN})$`, 'v');

	// The rule line shows once the user has left the field or a submit was
	// stopped, as :user-invalid would, and screen readers are told too. It
	// follows the value, so an email prefill that fixes the handle clears it.
	let usernameLeft = $state(false);
	const ruleShown = $derived(!usernameError && usernameLeft && !usernameRule.test(username));
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
					<a href={loginHref(data.redirectTo)}>Log in</a>
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
					{...emailField.field}
					oninput={(e) => {
						emailField.field.oninput(e);
						suggest();
					}} />
				{#if emailField.shown}
					<p class="field-error" id="email-error">{EMAIL_MESSAGE}</p>
				{/if}
			</div>

			<div class="field">
				<label for="username">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					required
					minlength={USERNAME_MIN}
					maxlength={USERNAME_MAX}
					pattern={USERNAME_PATTERN}
					autocomplete="username"
					spellcheck="false"
					bind:value={username}
					oninput={() => (usernameEdited = true)}
					onblur={() => (usernameLeft = true)}
					oninvalid={(e) => {
						e.preventDefault();
						if (firstInvalid(e.currentTarget)) e.currentTarget.focus();
						usernameLeft = true;
					}}
					aria-invalid={usernameError || ruleShown ? 'true' : undefined}
					aria-describedby={usernameError
						? 'username-error username-hint'
						: ruleShown
							? 'username-rule username-hint'
							: 'username-hint'} />
				{#if usernameError}
					<p class="field-error" id="username-error">{usernameError}</p>
				{:else if ruleShown}
					<!-- The server's wording. -->
					<p class="field-error" id="username-rule">{USERNAME_MESSAGE}</p>
				{/if}
				<!-- While the rule line shows, the hint does not repeat it. -->
				<p class="form-hint" id="username-hint">
					{#if !ruleShown}{USERNAME_MIN} to {USERNAME_MAX} letters, digits, - or _.{/if}
					Your public handle, shown on every recipe.
				</p>
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					minlength={PASSWORD_MIN}
					autocomplete="new-password"
					oninvalid={(e) => {
						if (!firstInvalid(e.currentTarget)) e.preventDefault();
					}}
					aria-describedby="password-hint" />
				<p class="form-hint" id="password-hint">At least {PASSWORD_MIN} characters</p>
			</div>

			<button
				type="submit"
				class="btn-primary auth-submit"
				disabled={pending}
				{...emailField.button}>
				{pending ? 'Creating account…' : 'Create account'}
			</button>
			<p class="form-hint confirm-note">We'll email you a link to confirm.</p>
		</form>

		<p class="auth-switch">
			Already have an account? <a href={loginHref(data.redirectTo)}>Log in</a>
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
</style>
