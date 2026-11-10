import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import CookLink from './CookLink.svelte';

describe('CookLink', () => {
	test('one profile link holding the avatar and the handle, named by the handle', () => {
		const { getByRole, container } = render(CookLink, {
			props: { username: 'maria', size: 36, class: 'lead-cook' }
		});
		const link = getByRole('link', { name: '@maria' });
		expect(link).toHaveAttribute('href', '/users/maria');
		expect(link).toHaveClass('lead-cook');
		expect(link.querySelector('.avatar')).toHaveStyle('--avatar-size: 36px');
		expect(link.querySelector('.handle')).toHaveTextContent('@maria');
		expect(container.querySelectorAll('a')).toHaveLength(1);
	});
});
