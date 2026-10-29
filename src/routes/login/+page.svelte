<script lang="ts">
	import { enhance } from '$app/forms';

	let { form, data }: { form: { message?: string } | null; data: { redirectTo: string | null } } =
		$props();

	// Disabled while the request is out, so a second press cannot send it twice.
	let pending = $state(false);

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
			<h1>Welcome Back</h1>
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
				<a href="/forgot-password" class="forgot-link">Forgot password?</a>
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
