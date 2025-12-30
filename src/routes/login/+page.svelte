<script lang="ts">
	import { enhance } from '$app/forms';

	// This `form` prop will receive any error messages returned from the action
	let { form } = $props<{ form: any }>();
</script>

<div
	class="from-secondary flex min-h-screen items-center justify-center bg-gradient-to-b to-white px-4"
>
	<div class="w-full max-w-md">
		<!-- Card Container -->
		<div class="border-border rounded-lg border bg-white p-8 shadow-md">
			<!-- Header -->
			<div class="mb-8 text-center">
				<h1 class="text-foreground mb-2 font-serif text-4xl font-bold">Welcome Back</h1>
				<p class="text-muted-foreground">Sign in to access your cookbook</p>
			</div>

			<!-- Error Message -->
			{#if form?.message}
				<div class="border-border bg-secondary mb-6 rounded-lg border p-4">
					<p class="text-foreground font-medium">{form.message}</p>
				</div>
			{/if}

			<!-- Login Form -->
			<form method="POST" use:enhance class="space-y-6">
				<div>
					<label for="email" class="text-foreground mb-2 block font-medium">Email</label>
					<input id="email" name="email" type="email" required placeholder="you@example.com" />
				</div>

				<div>
					<label for="password" class="text-foreground mb-2 block font-medium">Password</label>
					<input id="password" name="password" type="password" required placeholder="••••••••" />
				</div>

				<button type="submit">Sign In</button>
			</form>

			<!-- Sign Up Link -->
			<p class="text-muted-foreground mt-6 text-center">
				Don't have an account?
				<a
					href="/signup"
					class="font-semibold text-amber-700 transition-colors hover:text-amber-800"
				>
					Create one
				</a>
			</p>
		</div>
	</div>
</div>
