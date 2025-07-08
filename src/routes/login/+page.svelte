<script lang="ts">
	import { enhance } from '$app/forms';

	// This `form` prop will receive any error messages returned from the action
	let { form } = $props();
</script>

<div class="container mx-auto max-w-sm px-4 py-8">
	<h1 class="text-2xl font-bold text-gray-900">Login</h1>

	<form method="POST" use:enhance class="mt-6 space-y-4">
		<div>
			<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				required
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
			/>
		</div>

		<div>
			<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				required
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
			/>
		</div>

		<button
			type="submit"
			class="w-full rounded-md bg-green-600 py-2 text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
		>
			Login
		</button>

		<p class="text-center text-sm text-gray-600">
			Don't have an account?
			<a href="/signup" class="font-medium text-green-600 hover:underline">Sign up</a>
		</p>
	</form>
</div>
