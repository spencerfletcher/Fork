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
	test('is mono one notch under the line it sits in, never a size of its own', () => {
		// Usernames are identifiers, set in mono like version numbers and dates
		// (Pencil Rule, 29 October 2026). The size follows the line, in em, with
		// a 0.9375 step down because JetBrains Mono runs optically larger than
		// the sans and serif beside it at the same size (Spencer, 29 October
		// 2026: the byline's handle read bigger than the words around it). jsdom
		// applies no component CSS, so the declaration is read from the source.
		render(Username, { props: { username: 'chefmaria' } });
		expect(screen.getByRole('link', { name: '@chefmaria' })).toHaveClass('username');
		const style = source.slice(source.indexOf('<style>'));
		expect(style).toMatch(/\.username\s*{[^}]*font-family:\s*var\(--font-mono\)/);
		expect(style).toMatch(/\.username\s*{[^}]*font-size:\s*0\.9375em/);
		expect(style).not.toMatch(/font-size:\s*[\d.]+(rem|px)/);
	});
});
