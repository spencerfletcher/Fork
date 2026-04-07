<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props<{ form: { message?: string } | null }>();
</script>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-header">
			<h1>Welcome back</h1>
			<p class="auth-subtitle">Sign in to your cookbook</p>
		</div>

		{#if form?.message}
			<div class="auth-error">{form.message}</div>
		{/if}

		<form method="POST" use:enhance class="form">
			<div class="field">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" required placeholder="you@example.com" />
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" required placeholder="••••••••" />
			</div>

			<button type="submit" class="btn-primary auth-submit">Sign in</button>
		</form>

		<p class="auth-switch">
			Don't have an account? <a href="/signup">Create one</a>
		</p>
	</div>
</div>
