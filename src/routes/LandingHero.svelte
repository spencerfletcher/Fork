<script lang="ts">
	let { isLoggedIn = false }: { isLoggedIn?: boolean } = $props();
</script>

<section class="hero">
	<div class="hero-inner">
		<h1 class="hero-title">Recipes, under version control.</h1>
		<!-- The third claim this used to make — that you can compare two versions and
		     see which ingredient moved — is cut deliberately. The diff immediately
		     below demonstrates it, and asserting what you are about to show reads as
		     padding. -->
		<p class="hero-lede">
			<span>Every edit is a version with a commit message.</span>
			<span>Fork any recipe and your changes keep their attribution.</span>
		</p>
		<div class="hero-actions">
			<a href="/search" class="btn-primary">Browse recipes</a>
			{#if !isLoggedIn}
				<a href="/signup" class="btn-ghost">Sign up</a>
			{/if}
		</div>
	</div>
</section>

<style>
	/* On the page's paper, like every other page: only the bar is espresso.
	   The headline takes the clay the other page titles use. */
	.hero-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 2rem 2.5rem;
	}

	@media (min-width: 640px) {
		.hero-inner {
			padding: 4rem 2rem 3rem;
		}
	}

	.hero-title {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 2.75rem;
		font-weight: 500;
		line-height: 1.1;
		color: var(--color-accent);
		/* Without this the headline breaks as "Recipes, under / version /
		   control." at phone widths, stranding a word per line. */
		text-wrap: balance;
	}

	@media (min-width: 640px) {
		.hero-title {
			font-size: 3.5rem;
		}
	}

	.hero-lede {
		max-width: 62ch;
		margin: 1.25rem 0 2rem;
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--color-text-2);
		text-wrap: pretty;
	}

	/* One line per sentence once there is room for it; below 768px the two
	   sentences run together as prose rather than adding a ragged line. */
	.hero-lede span {
		display: inline;
	}

	@media (min-width: 768px) {
		.hero-lede span {
			display: block;
		}
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}
</style>
