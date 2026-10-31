import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Username from './Username.svelte';

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
