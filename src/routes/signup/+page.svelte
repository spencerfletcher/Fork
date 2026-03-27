<script lang="ts">
	import { enhance } from '$app/forms';

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
				<h1 class="text-foreground mb-2 font-serif text-4xl font-bold">Join Us</h1>
				<p class="text-muted-foreground">Start building your personal cookbook</p>
			</div>

			<!-- Error Message -->
			{#if form?.message}
				<div class="bg-secondary border-border mb-6 rounded-lg border p-4">
					<p class="text-foreground font-medium">{form.message}</p>
				</div>
			{/if}

			<!-- Sign Up Form -->
			<form method="POST" use:enhance class="space-y-6">
				<div>
					<label for="email" class="text-foreground mb-2 block font-medium">Email</label>
					<input id="email" name="email" type="email" required placeholder="you@example.com" />
				</div>

				<div>
					<label for="password" class="text-foreground mb-2 block font-medium">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						minlength="6"
						placeholder="At least 6 characters"
					/>
				</div>

				<button type="submit">Create Account</button>
			</form>

			<!-- Log In Link -->
			<p class="text-muted-foreground mt-6 text-center">
				Already have an account?
				<a
					href="/login"
					class="font-semibold text-amber-700 transition-colors hover:text-amber-800"
				>
					Sign in
				</a>
			</p>
		</div>
	</div>
</div>
