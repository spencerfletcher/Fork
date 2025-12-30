<script lang="ts">
	import { enhance } from '$app/forms';

	// This `form` prop will receive any error messages returned from the action
	let { form } = $props<{ form: any }>();
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-white px-4"
>
	<div class="w-full max-w-md">
		<!-- Card Container -->
		<div class="rounded-lg border border-amber-100 bg-white p-8 shadow-md">
			<!-- Header -->
			<div class="mb-8 text-center">
				<h1 class="mb-2 font-serif text-4xl font-bold text-amber-900">Welcome Back</h1>
				<p class="text-gray-600">Sign in to access your cookbook</p>
			</div>

			<!-- Error Message -->
			{#if form?.message}
				<div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
					<p class="font-medium text-amber-900">{form.message}</p>
				</div>
			{/if}

			<!-- Login Form -->
			<form method="POST" use:enhance class="space-y-6">
				<div>
					<label for="email" class="mb-2 block font-medium text-gray-900">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						placeholder="you@example.com"
						class="w-full"
					/>
				</div>

				<div>
					<label for="password" class="mb-2 block font-medium text-gray-900">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						placeholder="••••••••"
						class="w-full"
					/>
				</div>

				<button
					type="submit"
					class="w-full rounded-lg bg-amber-800 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-900"
				>
					Sign In
				</button>
			</form>

			<!-- Sign Up Link -->
			<p class="mt-6 text-center text-gray-600">
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
