<script lang="ts">
	import { loginHref } from '#lib/auth/loginHref.js';

	let { data }: { data: { redirectTo: string | null } } = $props();
</script>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-header">
			<h1>Confirm your email</h1>
			<p class="auth-subtitle">
				We've sent a confirmation link to your email address. Click it to complete your registration
				and log in.
			</p>
		</div>
		<a href={loginHref(data.redirectTo)} class="btn-primary auth-submit">Log in</a>
	</div>
</div>
