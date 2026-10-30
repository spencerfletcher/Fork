<script lang="ts">
	import { enhance } from '$app/forms';

	let { form, data }: { form: { message?: string } | null; data: { linkValid: boolean } } =
		$props();

	// Disabled while the request is out, so a second press cannot send it twice.
	let pending = $state(false);
</script>

<div class="auth-page">
	<div class="auth-card">
		{#if data.linkValid}
			<div class="auth-header">
				<h1>Reset password</h1>
				<p class="auth-subtitle">You'll be logged in once it's set.</p>
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
				<div class="field">
					<label for="password">New password</label>
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
					{pending ? 'Setting password…' : 'Set password'}
				</button>
			</form>
		{:else}
			<div class="auth-header">
				<h1>Link expired</h1>
				<p class="auth-subtitle">A reset link works once, and not for long. Ask for a new one.</p>
			</div>
			<a href="/forgot-password" class="btn-primary auth-submit">Send a new link</a>

			<p class="auth-switch">
				Remembered it? <a href="/login">Log in</a>
			</p>
		{/if}
	</div>
</div>

<style>
	.form-hint {
		margin: 0;
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
