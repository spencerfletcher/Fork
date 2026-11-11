import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import KeepLine from './KeepLine.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const renderLine = (kept: number | null, viewing: number, latest = 5) =>
	render(KeepLine, { props: { slug: 'soup', kept, viewing, latest } });

/** The form a button posts, and the version it sends. */
const formOf = (name: RegExp) => {
	const form = screen.getByRole('button', { name }).closest('form')!;
	return { action: form.getAttribute('action'), version: form.querySelector('input')?.value };
};

const words = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();

describe('KeepLine', () => {
	test('following the latest, it offers to keep the version being read', () => {
		const { container } = renderLine(null, 5);
		expect(formOf(/^Keep this version/)).toEqual({ action: '?/keep', version: '5' });
		expect(container.textContent).not.toContain('Keeping');
		expect(screen.queryByRole('button', { name: 'Follow latest version' })).toBeNull();
	});

	test('keeping v3 and reading it: "Keeping v3 · Follow latest version", and a notice of the newer latest', () => {
		const { container } = renderLine(3, 3);
		expect(words(container.querySelector('.keep-line'))).toBe('Keeping v3 Follow latest version');
		expect(formOf(/Follow latest version/)).toEqual({ action: '?/follow', version: undefined });
		expect(screen.queryByRole('button', { name: /^Keep this version/ })).toBeNull();
		const latest = screen.getByRole('link', { name: 'v5' });
		expect(words(latest.closest('p'))).toBe("The author's latest is v5.");
		expect(latest.getAttribute('href')).toBe('/recipes/soup?version=5');
	});

	test('keeping the latest itself, there is no notice', () => {
		renderLine(5, 5);
		expect(screen.queryByText(/The author's latest/)).toBeNull();
	});

	test('keeping v3 while browsing v5: v3 links back, and v5 can be kept instead', () => {
		renderLine(3, 5);
		expect(screen.getByRole('link', { name: 'v3' }).getAttribute('href')).toBe('/recipes/soup');
		expect(formOf(/^Keep this version/)).toEqual({ action: '?/keep', version: '5' });
		expect(screen.getByRole('button', { name: 'Follow latest version' })).toBeTruthy();
		expect(screen.queryByText(/The author's latest/)).toBeNull();
	});

	test('the keep button names the version for a screen reader', () => {
		renderLine(null, 4);
		expect(screen.getByRole('button', { name: 'Keep this version, v4' })).toBeTruthy();
	});
});
