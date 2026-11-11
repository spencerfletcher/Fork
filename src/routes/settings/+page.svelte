<script lang="ts">
	import { enhance } from '$app/forms';
	import { pendingEnhance } from '#lib/pendingEnhance.svelte.js';
	import ChoiceGroup from '#lib/components/ui/ChoiceGroup.svelte';
	import { audienceIcon } from '#lib/components/Icons.svelte';
	import { AUDIENCE_LABEL, AUDIENCE_NOTE } from '#lib/audience.js';
	import { USERNAME_MAX, USERNAME_MIN } from '#lib/auth/rules.js';
	import { VISIBILITIES, type Visibility } from '#lib/recipes/validation.js';
	import {
		AS_WRITTEN,
		MEASUREMENT_CHOICES,
		MEASUREMENT_LABEL,
		MEASUREMENT_NOTE,
		type MeasurementChoice
	} from '#lib/measurement.js';
	import type { PageData } from './$types';
	import type { Section } from './+page.server';

	let {
		data,
		form
	}: {
		data: PageData;
		form: {
			section: Section;
			saved?: true;
			error?: string;
			code?: string;
			username?: string;
		} | null;
	} = $props();

	// Each section is its own form: fields keep what was typed whatever another
	// section's save does, and a refusal is shown only where it belongs.
	const usernameSave = pendingEnhance({ reset: false, keepOnError: true });
	const audienceSave = pendingEnhance({ reset: false, keepOnError: true });
	const measurementSave = pendingEnhance({ reset: false, keepOnError: true });

	// svelte-ignore state_referenced_locally
	let username = $state(form?.username ?? data.settings.username);
	// svelte-ignore state_referenced_locally
	let defaultVisibility = $state<Visibility>(data.settings.defaultVisibility);
	// Unset is stored as null and posted as AS_WRITTEN.
	const storedMeasurement = $derived<MeasurementChoice>(data.settings.measurement ?? AS_WRITTEN);
	// svelte-ignore state_referenced_locally
	let measurement = $state<MeasurementChoice>(storedMeasurement);

	const resultFor = (section: Section) => (form?.section === section ? form : null);

	// The field owns a refusal of the name itself; anything else (a lapsed
	// session, an unreachable server) is the section's line.
	const usernameError = $derived(
		resultFor('username')?.code === 'invalid' ? resultFor('username')?.error : undefined
	);
	const usernameProblem = $derived(
		usernameSave.error ?? (usernameError ? undefined : resultFor('username')?.error)
	);
	const audienceProblem = $derived(audienceSave.error ?? resultFor('audience')?.error);
	const measurementProblem = $derived(measurementSave.error ?? resultFor('measurement')?.error);

	// "Saved." until the value moves away from what was saved.
	const usernameSaved = $derived(
		!!resultFor('username')?.saved && username.trim().toLowerCase() === data.settings.username
	);
	const audienceSaved = $derived(
		!!resultFor('audience')?.saved && defaultVisibility === data.settings.defaultVisibility
	);
	const measurementSaved = $derived(
		!!resultFor('measurement')?.saved && measurement === storedMeasurement
	);

	// Save was disabled while the request was out, so focus fell to the body;
	// the first error takes it. Read through `form`, so a second identical
	// refusal takes it again.
	let usernameInput: HTMLInputElement;
	const focusProblem = (section: Section) => document.getElementById(`${section}-problem`)?.focus();
	$effect(() => {
		if (!form?.error) return;
		if (usernameError) usernameInput.focus();
		else focusProblem(form.section);
	});
	$effect(() => {
		if (usernameSave.error) focusProblem('username');
	});
	$effect(() => {
		if (audienceSave.error) focusProblem('audience');
	});
	$effect(() => {
		if (measurementSave.error) focusProblem('measurement');
	});
</script>

{#snippet saveRow(pending: boolean, saved: boolean, problem: string | undefined, id: string)}
	<div class="save-row">
		<button class="btn-primary" type="submit" disabled={pending}>
			{pending ? 'Saving…' : 'Save'}
		</button>
		<!-- Always in the DOM, so the outcome is announced when it changes. -->
		<p class="save-state" role="status">{!pending && saved && !problem ? 'Saved.' : ''}</p>
	</div>
	{#if problem && !pending}
		<p class="field-error" role="alert" tabindex="-1" {id}>{problem}</p>
	{/if}
{/snippet}

<div class="page">
	<div class="page-inner page-inner--narrow settings">
		<h1>Settings</h1>

		<section aria-labelledby="account-heading">
			<h2 id="account-heading">Account</h2>
			<dl class="field">
				<dt class="eyebrow-label">Email</dt>
				<dd>{data.email}</dd>
			</dl>
			<p>
				<a href="/forgot-password" class="hit-link">Change password</a>
				<span class="form-hint">We'll email you a link to set a new one.</span>
			</p>
		</section>

		<section aria-labelledby="username-heading">
			<h2 id="username-heading">Username</h2>
			<form method="POST" action="?/username" class="form" use:enhance={usernameSave.submit}>
				<div class="field">
					<label for="username">
						Username <span class="field-required" aria-hidden="true">Required</span>
					</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						maxlength={USERNAME_MAX}
						autocomplete="username"
						spellcheck="false"
						bind:this={usernameInput}
						bind:value={username}
						aria-invalid={usernameError ? 'true' : undefined}
						aria-describedby={usernameError ? 'username-error username-hint' : 'username-hint'} />
					{#if usernameError}
						<p class="field-error" id="username-error">{usernameError}</p>
					{/if}
					<p class="form-hint" id="username-hint">
						{USERNAME_MIN} to {USERNAME_MAX} letters, digits, - or _. Old links to your profile keep working,
						and nobody else can take your old name.
					</p>
				</div>
				{@render saveRow(usernameSave.pending, usernameSaved, usernameProblem, 'username-problem')}
			</form>
		</section>

		<section aria-labelledby="audience-heading">
			<h2 id="audience-heading">Default audience</h2>
			<form method="POST" action="?/audience" class="form" use:enhance={audienceSave.submit}>
				<ChoiceGroup
					name="defaultVisibility"
					legend="New recipes start as"
					options={VISIBILITIES.map((value) => ({
						value,
						label: AUDIENCE_LABEL[value],
						note: AUDIENCE_NOTE[value]
					}))}
					icon={audienceIcon}
					hint="Forks start as Only me, and this never changes recipes you already have."
					bind:value={defaultVisibility} />
				{@render saveRow(audienceSave.pending, audienceSaved, audienceProblem, 'audience-problem')}
			</form>
		</section>

		<section aria-labelledby="measurement-heading">
			<h2 id="measurement-heading">Measurement</h2>
			<form method="POST" action="?/measurement" class="form" use:enhance={measurementSave.submit}>
				<ChoiceGroup
					name="measurement"
					legend="Show quantities in"
					options={MEASUREMENT_CHOICES.map((value) => ({
						value,
						label: MEASUREMENT_LABEL[value],
						note: MEASUREMENT_NOTE[value]
					}))}
					hint="Only the recipe page converts; recipes and their versions stay as written."
					bind:value={measurement} />
				{@render saveRow(
					measurementSave.pending,
					measurementSaved,
					measurementProblem,
					'measurement-problem'
				)}
			</form>
		</section>
	</div>
</div>

<style>
	h1 {
		margin: 0 0 var(--space-5);
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding-block: var(--space-5);
		border-top: 1px solid var(--color-border);
	}

	h2 {
		margin: 0;
		font-size: 1.375rem;
	}

	dl,
	dd {
		margin: 0;
	}

	dd {
		overflow-wrap: anywhere;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.save-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 14px;
	}

	.save-state {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-3);
	}

	.field-error:focus {
		outline: none;
	}

	.form-hint {
		margin: 0;
	}
</style>
