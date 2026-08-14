<script lang="ts">
	let { sampleSlug = null }: { sampleSlug?: string | null } = $props();
</script>

<section class="bg-hero-bg text-text-cream">
	<div class="mx-auto max-w-[900px] px-6 py-16 sm:py-20">
		<h1 class="text-text-cream m-0 font-serif text-[2.75rem] leading-[1.1] sm:text-[3.5rem]">
			Recipes, under version control.
		</h1>
		<p class="text-text-tan mt-5 mb-8 max-w-[46ch] text-[1.05rem] leading-[1.6]">
			Every edit is a version with a commit message. Fork anyone's recipe and your changes keep
			their attribution. Compare any two versions and see exactly which ingredient moved.
		</p>
		<div class="flex flex-wrap items-center gap-4">
			<a
				href="/search"
				class="bg-accent text-hero-bg rounded-pill px-6 py-3 font-sans text-[0.95rem] font-semibold no-underline transition-opacity duration-150 hover:opacity-90"
			>
				Browse recipes
			</a>
			{#if sampleSlug}
				<a
					href="/recipes/{sampleSlug}/diff"
					class="text-text-cream rounded-pill border border-white/25 px-6 py-3 font-sans text-[0.95rem] no-underline transition-colors duration-150 hover:border-white/50"
				>
					See a diff →
				</a>
			{/if}
		</div>
	</div>
</section>
