import { describe, test, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import SettingsPage from './+page.svelte';
import { AUDIENCE_LABEL, AUDIENCE_NOTE } from '#lib/audience.js';
import { FORMER_USERNAME_DAYS, USERNAME_TAKEN } from '#lib/auth/rules.js';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { VISIBILITIES, type Visibility } from '#lib/recipes/validation.js';
import {
	AS_WRITTEN,
	MEASUREMENT_CHOICES,
	MEASUREMENT_LABEL,
	MEASUREMENT_NOTE,
	type Measurement
} from '#lib/measurement.js';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const data = (defaultVisibility: Visibility = 'friends') =>
	({
		email: 'cook@example.com',
		settings: { username: 'cook', defaultVisibility, measurement: null }
	}) as never;

const renderPage = (form: unknown = null, d = data()) =>
	render(SettingsPage, { props: { data: d, form: form as never } });

const section = (name: string) => screen.getByRole('region', { name });

describe('Settings page', () => {
	test('one h1 and a titled section per setting', () => {
		renderPage();
		expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
		for (const name of ['Account', 'Username', 'Default audience', 'Measurement']) {
			expect(section(name)).toBeInTheDocument();
		}
	});

	test('Account shows the sign-in email as text and links into the password reset flow', () => {
		renderPage();
		const account = section('Account');
		expect(within(account).getByText('cook@example.com')).toBeInTheDocument();
		expect(within(account).queryByRole('textbox')).toBeNull();
		expect(within(account).getByRole('link', { name: 'Change password' })).toHaveAttribute(
			'href',
			'/forgot-password'
		);
	});
});

describe('Measurement section', () => {
	const group = () => screen.getByRole('group', { name: 'Show quantities in' });
	const withMeasurement = (measurement: Measurement | null) =>
		({
			email: 'cook@example.com',
			settings: { username: 'cook', defaultVisibility: 'friends', measurement }
		}) as never;

	test('As written, Metric and US, in their words and sentences; unset is As written', () => {
		renderPage();
		for (const value of MEASUREMENT_CHOICES) {
			const radio = within(group()).getByRole('radio', { name: MEASUREMENT_LABEL[value] });
			expect(radio).toHaveAccessibleDescription(new RegExp(MEASUREMENT_NOTE[value]));
			expect(radio).toHaveProperty('checked', value === AS_WRITTEN);
		}
	});

	test('a stored preference starts checked and posts as its own form', () => {
		renderPage(null, withMeasurement('us'));
		const us = within(group()).getByRole('radio', { name: MEASUREMENT_LABEL.us });
		expect(us).toHaveProperty('checked', true);
		expect(us).toHaveAttribute('name', 'measurement');
		expect(us.closest('form')).toHaveAttribute('action', '?/measurement');
		expect(
			within(section('Measurement')).getByRole('button', { name: 'Save' })
		).toBeInTheDocument();
	});

	test('a save says Saved in this section only', () => {
		renderPage({ section: 'measurement', saved: true });
		expect(within(section('Measurement')).getByText('Saved.')).toHaveRole('status');
		expect(within(section('Default audience')).queryByText('Saved.')).toBeNull();
	});

	test('a refusal shows in this section, focused', async () => {
		renderPage({
			section: 'measurement',
			code: 'unauthenticated',
			error: SESSION_ENDED('save again')
		});
		await tick();
		const alert = within(section('Measurement')).getByRole('alert');
		expect(alert).toHaveTextContent(SESSION_ENDED('save again'));
		expect(alert).toHaveFocus();
	});
});

describe('Username section', () => {
	const field = () => screen.getByRole('textbox', { name: 'Username' });

	test('the field holds the current name, is required, and says so in small text', () => {
		renderPage();
		expect(field()).toHaveValue('cook');
		expect(field()).toBeRequired();
		const mark = document.querySelector(`label[for="${field().id}"] .field-required`);
		expect(mark).toHaveTextContent('Required');
		expect(mark).toHaveAttribute('aria-hidden', 'true');
		expect(field()).toHaveAccessibleDescription(
			new RegExp(
				`Old links to your profile work for ${FORMER_USERNAME_DAYS} days\\. You can change it \\w+ in ${FORMER_USERNAME_DAYS} days\\.`
			)
		);
	});

	test('a change past the limit is refused on the field, with the day it is allowed again', async () => {
		const error = 'You can change your username again on Mon 14 Dec.';
		renderPage({ section: 'username', code: 'rate_limited', error, username: 'maria' });
		await tick();
		expect(field()).toHaveAttribute('aria-invalid', 'true');
		expect(field()).toHaveAccessibleDescription(new RegExp(error));
		expect(within(section('Username')).queryByRole('alert')).toBeNull();
	});

	test('a refusal sits under the field, described, invalid and focused', async () => {
		renderPage({ section: 'username', code: 'invalid', error: USERNAME_TAKEN, username: 'maria' });
		await tick();
		expect(field()).toHaveValue('maria');
		expect(field()).toHaveAttribute('aria-invalid', 'true');
		expect(field()).toHaveAccessibleDescription(new RegExp(USERNAME_TAKEN));
		expect(field()).toHaveFocus();
	});

	test('a save says Saved in place, in this section only', () => {
		renderPage({ section: 'username', saved: true });
		expect(within(section('Username')).getByText('Saved.')).toHaveRole('status');
		expect(within(section('Default audience')).queryByText('Saved.')).toBeNull();
	});
});

describe('Default audience section', () => {
	test('the three audiences, in their words and sentences, start at the stored default', () => {
		renderPage(null, data('public'));
		const group = screen.getByRole('group', { name: 'New recipes start as' });
		for (const value of VISIBILITIES) {
			const radio = within(group).getByRole('radio', { name: AUDIENCE_LABEL[value] });
			expect(radio).toHaveAccessibleDescription(new RegExp(AUDIENCE_NOTE[value]));
			expect(radio).toHaveProperty('checked', value === 'public');
		}
		expect(
			within(section('Default audience')).getByText(/never changes recipes you already have/)
		).toBeInTheDocument();
	});

	test('a failure shows in this section, focused, and leaves the username section alone', async () => {
		renderPage({
			section: 'audience',
			code: 'unauthenticated',
			error: SESSION_ENDED('save again')
		});
		await tick();
		const alert = within(section('Default audience')).getByRole('alert');
		expect(alert).toHaveTextContent(SESSION_ENDED('save again'));
		expect(alert).toHaveFocus();
		expect(within(section('Username')).queryByRole('alert')).toBeNull();
		expect(screen.getByRole('textbox', { name: 'Username' })).not.toHaveAttribute('aria-invalid');
	});
});
