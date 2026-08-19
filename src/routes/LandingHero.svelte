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
			<a href="/search" class="hero-cta">Browse recipes</a>
			{#if !isLoggedIn}
				<a href="/signup" class="hero-cta-secondary">Sign up</a>
			{/if}
		</div>
	</div>
</section>

<style>
	.hero {
		background: var(--color-hero-bg);
		color: var(--color-text-cream);
	}

	/* Matches the diff section below. These were 900px and 1200px respectively,
	   which gave the page two different left edges 150px apart. */
	.hero-inner {
		max-width: 1200px;
		margin: 0 auto;
		/* 2rem horizontal, not 1.5rem: the section below uses px-6, which resolves
		   to --spacing-6 = 2rem in this project. Matching Tailwind's stock 1.5rem
		   here left the hero 8px inside everything under it. */
		padding: 4rem 2rem;
	}

	@media (min-width: 640px) {
		.hero-inner {
			padding: 5rem 2rem;
		}
	}

	.hero-title {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 2.75rem;
		line-height: 1.1;
		color: var(--color-text-cream);
		/* Without this the headline breaks as "Recipes, under / version / control."
		   at phone widths, stranding a word per line. Progressive enhancement —
		   browsers without it get the ragged break, not a broken layout. */
		text-wrap: balance;
	}

	@media (min-width: 640px) {
		.hero-title {
			font-size: 3.5rem;
		}
	}

	/* Spacing is set here rather than with mb-8, which resolves to 4rem in this
	   project — app.css overrides Tailwind's spacing steps 5 to 8 but not 1 to 4,
	   so the utility name understates the value by half. */
	.hero-lede {
		max-width: 62ch;
		margin: 1.25rem 0 2rem;
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--color-text-tan);
		text-wrap: pretty;
	}

	/*
		One line per sentence once there is room for it.

		Left to wrap on its own the copy broke as "...your changes keep / their
		attribution.", splitting a phrase across lines for no reason. text-wrap:
		pretty does not help — it fixes orphans, and a two-word last line is not an
		orphan, just a bad break.

		Below 768px the sentences run together as ordinary prose, because neither
		fits on one line at that width and forcing a block each would only add a
		ragged line.
	*/
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

	.hero-cta,
	.hero-cta-secondary {
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-pill);
		font-family: var(--font-sans);
		font-size: 0.95rem;
		text-decoration: none;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.hero-cta {
		background: var(--color-accent);
		color: var(--color-hero-bg);
		font-weight: 600;
	}

	/* Darkens rather than fading — an opacity transition washes the button toward
	   the background behind it, which reads as the control going inactive. */
	.hero-cta:hover {
		background: var(--color-accent-mid);
		color: var(--color-hero-bg);
	}

	.hero-cta-secondary {
		border: 1px solid rgb(255 255 255 / 0.25);
		color: var(--color-text-cream);
	}

	.hero-cta-secondary:hover {
		border-color: rgb(255 255 255 / 0.5);
		color: var(--color-text-cream);
	}
</style>
