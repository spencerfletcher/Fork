import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import SettingsPage from './+page.svelte';
import source from './+page.svelte?raw';
import { cssRule } from '#lib/testing/css.js';
import { AUDIENCE_LABEL, AUDIENCE_NOTE } from '#lib/audience.js';
import { FORMER_USERNAME_DAYS, USERNAME_TAKEN } from '#lib/auth/rules.js';
import { SESSION_ENDED } from '#lib/server/actions.js';
import { TYPE_USERNAME } from '#lib/account.js';
import { EXPORT_FORMATS, FORMAT_LABEL, exportHref } from '#lib/export/archive.js';
import { VISIBILITIES, type Visibility } from '#lib/recipes/validation.js';
import {
	AS_WRITTEN,
	MEASUREMENT_CHOICES,
	MEASUREMENT_LABEL,
	MEASUREMENT_NOTE,
	type Measurement
} from '#lib/measurement.js';

import { NOTIFICATION_KINDS, NOTIFICATION_LABEL, NOTIFICATION_NOTE } from '#lib/notifications.js';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const data = (defaultVisibility: Visibility = 'friends') =>
	({
		email: 'cook@example.com',
		settings: { username: 'cook', defaultVisibility, measurement: null, mutedNotifications: [] }
	}) as never;

const renderPage = (form: unknown = null, d = data()) =>
	render(SettingsPage, { props: { data: d, form: form as never } });

const section = (name: string) => screen.getByRole('region', { name });

describe('Settings page', () => {
	test('one h1 and a titled section per setting', () => {
		renderPage();
		expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
		for (const name of [
			'Account',
			'Username',
			'Default audience',
			'Measurement',
			'Your data',
			'Delete account'
		]) {
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

describe('Your data section', () => {
	test('a download per format, straight from the server, and a line on what is in it', () => {
		renderPage();
		const data = section('Your data');
		const links = within(data).getAllByRole('link');
		expect(links.map((a) => a.getAttribute('href'))).toEqual(
			EXPORT_FORMATS.map((f) => exportHref(f))
		);
		for (const link of links) {
			expect(link).toHaveAttribute('download');
			expect(link).toHaveClass('btn-ghost');
		}
		expect(links.map((a) => a.textContent?.trim())).toEqual(
			EXPORT_FORMATS.map((f) => `Download ${FORMAT_LABEL[f]}`)
		);
		expect(within(data).getByText(/every version/)).toHaveTextContent(
			/Photos are linked, not included/
		);
	});
});

describe('Notifications section', () => {
	const group = () => screen.getByRole('group', { name: 'Tell me about' });
	const withMuted = (mutedNotifications: string[]) =>
		({
			email: 'cook@example.com',
			settings: {
				username: 'cook',
				defaultVisibility: 'friends',
				measurement: null,
				mutedNotifications
			}
		}) as never;

	test('one box per kind, in its words and sentence, ticked unless muted', () => {
		const [muted] = NOTIFICATION_KINDS.slice(-1);
		renderPage(null, withMuted([muted]));
		expect(
			within(section('Notifications')).getByText('What shows as new on Friends.')
		).toBeInTheDocument();
		for (const kind of NOTIFICATION_KINDS) {
			const box = within(group()).getByRole('checkbox', { name: NOTIFICATION_LABEL[kind] });
			expect(box).toHaveAccessibleDescription(NOTIFICATION_NOTE[kind]);
			expect(box).toHaveProperty('checked', kind !== muted);
			expect(box).toHaveAttribute('name', 'heard');
			expect(box).toHaveAttribute('value', kind);
		}
		expect(group().closest('form')).toHaveAttribute('action', '?/notifications');
	});

	test('a save says Saved in this section only, until a box changes', async () => {
		renderPage({ section: 'notifications', saved: true }, withMuted([]));
		const saved = within(section('Notifications')).getByRole('status');
		expect(saved).toHaveTextContent('Saved.');
		expect(within(section('Measurement')).queryByText('Saved.')).toBeNull();
		await fireEvent.click(
			within(group()).getByRole('checkbox', { name: NOTIFICATION_LABEL[NOTIFICATION_KINDS[0]] })
		);
		expect(saved).toHaveTextContent('');
	});

	test('a refusal shows in this section, focused', async () => {
		renderPage(
			{ section: 'notifications', code: 'unauthenticated', error: SESSION_ENDED('save again') },
			withMuted([])
		);
		await tick();
		const alert = within(section('Notifications')).getByRole('alert');
		expect(alert).toHaveTextContent(SESSION_ENDED('save again'));
		expect(alert).toHaveFocus();
	});
});

describe('Measurement section', () => {
	const group = () => screen.getByRole('group', { name: 'Show quantities in' });
	const withMeasurement = (measurement: Measurement | null) =>
		({
			email: 'cook@example.com',
			settings: {
				username: 'cook',
				defaultVisibility: 'friends',
				measurement,
				mutedNotifications: []
			}
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
		// The one alert is the field's own line, not the section's.
		expect(within(section('Username')).getByRole('alert')).toHaveAttribute('id', 'username-error');
	});

	test('a refusal sits under the field, described, invalid and focused', async () => {
		renderPage({ section: 'username', code: 'invalid', error: USERNAME_TAKEN, username: 'maria' });
		await tick();
		expect(field()).toHaveValue('maria');
		expect(field()).toHaveAttribute('aria-invalid', 'true');
		expect(field()).toHaveAccessibleDescription(new RegExp(USERNAME_TAKEN));
		expect(within(section('Username')).getByRole('alert')).toHaveAttribute('id', 'username-error');
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

describe('Delete account section', () => {
	const del = () => section('Delete account');

	test('last, it says what goes for everyone and what others keep, and links the download first', () => {
		renderPage();
		const regions = screen.getAllByRole('region');
		expect(regions.at(-1)).toBe(del());
		for (const line of [
			'Your recipes and their history are deleted for everyone.',
			'People who saved one of your recipes keep their read-only copy, without your name.',
			'Forks of your recipes stay with the cooks who made them.',
			'Your Journal, collections, saves and friends are removed.',
			`Your username stays reserved for ${FORMER_USERNAME_DAYS} days, then anyone may take it.`,
			'This cannot be undone.'
		])
			expect(within(del()).getByText(line)).toBeInTheDocument();
		expect(within(del()).getByRole('link', { name: 'Download your data first' })).toHaveAttribute(
			'href',
			exportHref('json')
		);
	});

	test('the red trigger opens a step that asks for the username typed, posting to deleteAccount', async () => {
		renderPage();
		const trigger = within(del()).getByRole('button', { name: 'Delete account' });
		expect(trigger).toHaveClass('btn-ghost', 'danger');
		await fireEvent.click(trigger);
		const step = within(del()).getByRole('group', { name: 'Delete your account?' });
		const field = within(step).getByRole('textbox', {
			name: 'Type cook to confirm'
		});
		expect(field).toHaveAttribute('name', 'confirmUsername');
		expect(field).toBeRequired();
		const confirm = within(step).getByRole('button', { name: 'Delete my account' });
		expect(confirm).toHaveClass('danger');
		expect(confirm.closest('form')).toHaveAttribute('action', '?/deleteAccount');
		within(step).getByRole('button', { name: 'Keep account' });
	});

	test('a refusal shows in this section only', () => {
		renderPage({ section: 'delete', code: 'invalid', error: TYPE_USERNAME });
		expect(within(del()).getByRole('alert')).toHaveTextContent(TYPE_USERNAME);
		expect(within(section('Username')).queryByRole('alert')).toBeNull();
	});
});

describe('Delete account', () => {
	// The label is an uppercase eyebrow; the handle in it is typed as written.
	test('the handle to type keeps its case and spacing', () => {
		const rule = cssRule(source, '.confirm-name .handle');
		expect(rule).toContain('text-transform: none');
		expect(rule).toContain('letter-spacing: normal');
	});
});
