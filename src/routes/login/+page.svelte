<script lang="ts">
	import { enhance } from '$app/forms';

	// This `form` prop will receive any error messages returned from the action
	let { form } = $props<{ form: any }>();
</script>

<div class="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4">
	<div class="w-full max-w-md">
		<!-- Card Container -->
		<div class="bg-white rounded-lg border border-amber-100 shadow-md p-8">
			<!-- Header -->
			<div class="text-center mb-8">
				<h1 class="font-serif text-4xl font-bold text-amber-900 mb-2">Welcome Back</h1>
				<p class="text-gray-600">Sign in to access your cookbook</p>
			</div>

			<!-- Error Message -->
			{#if form?.message}
				<div class="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
					<p class="text-amber-900 font-medium">{form.message}</p>
				</div>
			{/if}

			<!-- Login Form -->
			<form method="POST" use:enhance class="space-y-6">
				<div>
					<label for="email" class="block font-medium text-gray-900 mb-2">Email</label>
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
					<label for="password" class="block font-medium text-gray-900 mb-2">Password</label>
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
					class="w-full bg-amber-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-900 transition-colors"
				>
					Sign In
				</button>
			</form>

			<!-- Sign Up Link -->
			<p class="text-center text-gray-600 mt-6">
				Don't have an account?
				<a href="/signup" class="font-semibold text-amber-700 hover:text-amber-800 transition-colors">
					Create one
				</a>
			</p>
		</div>
	</div>
</div>
