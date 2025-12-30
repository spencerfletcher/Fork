<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props<{ form: any }>();
</script>

<div class="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4">
	<div class="w-full max-w-md">
		<!-- Card Container -->
		<div class="bg-white rounded-lg border border-amber-100 shadow-md p-8">
			<!-- Header -->
			<div class="text-center mb-8">
				<h1 class="font-serif text-4xl font-bold text-amber-900 mb-2">Join Us</h1>
				<p class="text-gray-600">Start building your personal cookbook</p>
			</div>

			<!-- Error Message -->
			{#if form?.message}
				<div class="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
					<p class="text-amber-900 font-medium">{form.message}</p>
				</div>
			{/if}

			<!-- Sign Up Form -->
			<form method="POST" use:enhance class="space-y-6">
				<div>
					<label for="email" class="block font-medium text-gray-900 mb-2">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label for="password" class="block font-medium text-gray-900 mb-2">Password</label>
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
			<p class="text-center text-gray-600 mt-6">
				Already have an account?
				<a href="/login" class="font-semibold text-amber-700 hover:text-amber-800 transition-colors">
					Sign in
				</a>
			</p>
		</div>
	</div>
</div>
