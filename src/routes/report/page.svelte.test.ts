import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ReportPage from './+page.svelte';
import { REPORT_HONEYPOT } from '#lib/moderation.js';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

// Not the real caps, so the test proves the boxes take them from the loader.
const DATA = {
	contact: 'cook@example.com',
	caps: { link: 11, what: 22, contact: 33 },
	meta: { title: 'Report a problem', noindex: true }
};

const renderReport = (form: unknown = null) =>
	render(ReportPage, { props: { data: DATA, form } as never });

const box = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement;

describe('/report', () => {
	test('three labelled, required boxes, each described by its hint, capped by the loader', () => {
		renderReport();
		const fields = [
			[box(/^Link on Fork/), 'link', DATA.caps.link],
			[box(/^What's wrong/), 'what', DATA.caps.what],
			[box(/^Your email/), 'contact', DATA.caps.contact]
		] as const;
		for (const [el, name, cap] of fields) {
			expect(el).toBeRequired();
			expect(el).toHaveAttribute('maxlength', String(cap));
			expect(el).toHaveAttribute('aria-describedby', `${name}-hint`);
			expect(document.getElementById(`${name}-hint`)).toBeInTheDocument();
			expect(el).not.toHaveAttribute('aria-invalid');
		}
		// A signed-in cook's address to start from.
		expect(box(/^Your email/).value).toBe(DATA.contact);
		expect(screen.getByRole('button', { name: 'Send report' })).toBeInTheDocument();
	});

	test('the trap field is out of reach: hidden, out of the tab order, never filled in for you', () => {
		renderReport();
		const trap = document.querySelector(`input[name="${REPORT_HONEYPOT}"]`);
		expect(trap).toHaveAttribute('tabindex', '-1');
		expect(trap).toHaveAttribute('autocomplete', 'off');
		expect(trap?.closest('[aria-hidden="true"]')).toHaveClass('sr-only');
	});

	test('a refusal shows each field its message, tied to the box, with what was typed kept', () => {
		const values = { link: 'https://elsewhere.example/x', what: '', contact: 'me@example.com' };
		renderReport({
			error: 'Link refused',
			code: 'invalid',
			errors: { link: 'Link refused', what: 'Say more' },
			values
		});
		const link = box(/^Link on Fork/);
		expect(link.value).toBe(values.link);
		expect(link).toHaveAttribute('aria-invalid', 'true');
		expect(link).toHaveAttribute('aria-describedby', 'link-hint link-error');
		expect(document.getElementById('link-error')).toHaveTextContent('Link refused');
		expect(document.getElementById('what-error')).toHaveTextContent('Say more');
		expect(box(/^Your email/)).not.toHaveAttribute('aria-invalid');
		// No message above the form repeats a field's.
		expect(screen.getAllByRole('alert')).toHaveLength(2);
	});

	test('a refusal of no one field (the rate limit) is said above the form, input kept', () => {
		const values = { link: '/recipes/soup', what: 'Mine', contact: 'me@example.com' };
		renderReport({ error: 'Try again later.', code: 'rate_limited', values });
		expect(screen.getByRole('alert')).toHaveTextContent('Try again later.');
		expect(box(/^What's wrong/).value).toBe('Mine');
	});

	test('once sent, the form gives way to a focused heading saying it was received', () => {
		renderReport({ sent: true });
		const heading = screen.getByRole('heading', { level: 1, name: 'Report sent' });
		expect(heading).toHaveFocus();
		expect(screen.queryByRole('button', { name: 'Send report' })).not.toBeInTheDocument();
		expect(document.title).toContain('Report sent');
	});
});
