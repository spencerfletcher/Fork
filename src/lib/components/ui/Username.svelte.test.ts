import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Username from './Username.svelte';
import source from './Username.svelte?raw';

describe('Username', () => {
	test('links to the profile and reads as @name', () => {
		render(Username, { props: { username: 'chefmaria' } });
		const link = screen.getByRole('link', { name: '@chefmaria' });
		expect(link).toHaveAttribute('href', '/users/chefmaria');
		expect(link).toHaveClass('username');
	});

	test('takes a dark tone for the bar', () => {
		render(Username, { props: { username: 'chefmaria', tone: 'dark' } });
		expect(screen.getByRole('link', { name: '@chefmaria' })).toHaveClass('on-dark');
	});
});

describe('Username face', () => {
	test('is mono at the size of the line it sits in: no size of its own', () => {
		// Usernames are identifiers, set in mono like version numbers and dates
		// (Pencil Rule, 29 October 2026). The size comes from the line: the
		// byline's 1rem, the card's 0.75rem, the bar's 0.875rem. jsdom applies
		// no component CSS, so the declaration is read from the source.
		render(Username, { props: { username: 'chefmaria' } });
		expect(screen.getByRole('link', { name: '@chefmaria' })).toHaveClass('username');
		const style = source.slice(source.indexOf('<style>'));
		expect(style).toMatch(/\.username\s*{[^}]*font-family:\s*var\(--font-mono\)/);
		expect(style).not.toMatch(/font-size/);
	});
});
