<script lang="ts">
	/**
	 * The two selects that choose which versions a compare view spans.
	 *
	 * `from` and `to` are bindable so the parent owns the range and decides what a
	 * change means — this page navigates, but a pull-request view would recompute
	 * a diff in place.
	 */
	interface VersionOption {
		versionNumber: number;
		commitMessage: string | null;
	}

	let {
		versions,
		from = $bindable(),
		to = $bindable(),
		onchange
	}: {
		versions: VersionOption[];
		from: number;
		to: number;
		onchange: () => void;
	} = $props();
</script>

{#snippet picker(id: string, label: string, value: number, set: (v: number) => void)}
	<div class="version-picker__field">
		<label class="version-picker__label" for={id}>{label}</label>
		<select
			{id}
			{value}
			onchange={(e) => {
				set(Number(e.currentTarget.value));
				onchange();
			}}
		>
			{#each versions as v (v.versionNumber)}
				<option value={v.versionNumber}>v{v.versionNumber}: {v.commitMessage}</option>
			{/each}
		</select>
	</div>
{/snippet}

<div class="version-picker">
	{@render picker('from-select', 'From', from, (v) => (from = v))}
	<span class="version-picker__arrow">→</span>
	{@render picker('to-select', 'To', to, (v) => (to = v))}
</div>

<style>
	.version-picker {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.version-picker__field {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.25rem;
		/* Without this a long commit message in an <option> sets the select's
		   intrinsic width and the two fields stop being equal. */
		min-width: 0;
	}

	.version-picker__label {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text-3);
	}

	.version-picker__arrow {
		padding-bottom: 0.5rem;
		font-size: 1.25rem;
		color: var(--color-text-3);
	}
</style>
