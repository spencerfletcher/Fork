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

	// The email message shows once the user has typed in the field and left
	// it, or a submit was stopped, and follows the browser's own type="email"
	// check, so it clears as soon as the address is fixed.
	let emailEdited = $state(false);
	let emailLeft = $state(false);
	let emailValid = $state(true);
	const emailShown = $derived(emailLeft && !emailValid);

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

	// One pattern for the attribute and the rule line. Browsers compile the
	// attribute with the v flag, so the page reads it the same way.
	const USERNAME_PATTERN = '[A-Za-z0-9_\\-]{3,30}';
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
					oninput={(e) => {
						emailEdited = true;
						emailValid = e.currentTarget.validity.valid;
						suggest();
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

			<div class="field">
				<label for="username">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					required
					minlength="3"
					maxlength="30"
					pattern={USERNAME_PATTERN}
					autocomplete="username"
					spellcheck="false"
					bind:value={username}
					oninput={() => (usernameEdited = true)}
					onblur={() => (usernameLeft = true)}
					oninvalid={() => (usernameLeft = true)}
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
					<p class="field-error" id="username-rule">
						Usernames are 3 to 30 characters: letters, digits, - or _
					</p>
				{/if}
				<!-- While the rule line shows, the hint does not repeat it. -->
				<p class="form-hint" id="username-hint">
					{#if !ruleShown}3 to 30 letters, digits, - or _.{/if}
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

	/* The switch link reaches 24px at desktop and 44px on a phone by padding
	   pulled back by margin, so the sentence does not move; as on login. */
	.auth-switch a {
		display: inline-block;
		padding-block: 2px;
		margin-block: -2px;
	}

	@media (max-width: 699px) {
		.auth-switch a {
			padding-block: 12px;
			margin-block: -12px;
		}
	}
</style>
