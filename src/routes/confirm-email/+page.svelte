<div class="from-secondary flex min-h-[60vh] items-center justify-center bg-gradient-to-b to-white">
	<div class="border-border max-w-md rounded-lg border bg-white p-8 text-center shadow-md">
		<!-- Email Icon -->
		<div class="bg-secondary mx-auto flex h-12 w-12 items-center justify-center rounded-full">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-primary h-6 w-6"
			>
				<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
				></path>
				<polyline points="22,6 12,13 2,6"></polyline>
			</svg>
		</div>

		<!-- TODO:
		 - Add a link to allow users to request a resend of the email
		 - Add text saying what the email is
		 - Don't allow the user to access the page without an email param (i.e. they shouldn't be able to just type in the URL)
		-->
		<h1 class="text-foreground mt-4 font-serif text-2xl font-bold">Confirm your email</h1>
		<p class="text-muted-foreground mt-2">
			We've sent a confirmation link to your email address. Please click the link in the email to
			complete your registration and log in.
		</p>

		<div class="mt-6">
			<a
				href="/login"
				class="inline-block rounded-lg bg-amber-800 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-900"
			>
				Back to Login
			</a>
		</div>
	</div>
</div>
