<script lang="ts">
	import { enhance } from '$app/forms';

	let { form, data }: { form: { message?: string } | null; data: { redirectTo: string | null } } =
		$props();

	// Disabled while the request is out, so a second press cannot send it twice.
	let pending = $state(false);
</script>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-header">
			<h1>Welcome Back</h1>
			<p class="auth-subtitle">Log in to your cookbook</p>
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
					placeholder="you@example.com" />
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password" />
			</div>

			<button type="submit" class="btn-primary auth-submit" disabled={pending}>
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
