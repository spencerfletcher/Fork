import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Avatar from './Avatar.svelte';
import source from './Avatar.svelte?raw';
import { cssRule } from '#lib/testing/css.js';

describe('Avatar', () => {
	test.each([28, 32, 36, 72] as const)(
		'the initial, capitalised and hidden from readers, at %ipx',
		(size) => {
			const { container } = render(Avatar, { props: { username: 'maria', size } });
			const disc = container.querySelector('.avatar') as HTMLElement;
			expect(disc).toHaveTextContent(/^M$/);
			expect(disc).toHaveAttribute('aria-hidden', 'true');
			expect(disc.style.getPropertyValue('--avatar-size')).toBe(`${size}px`);
		}
	);

	test('ink tone in the bar; clay otherwise', () => {
		const { container } = render(Avatar, { props: { username: 'maria', size: 32, tone: 'ink' } });
		expect(container.querySelector('.avatar')).toHaveClass('ink');
	});

	test('forced colours keep the circle; the profile steps down on a phone', () => {
		// jsdom applies no component CSS, so the rules are read from the source.
		expect(cssRule(source, '.avatar')).toMatch(/border: 1px solid transparent/);
		const phone = source.slice(source.indexOf('@media (max-width: 699px)'));
		expect(cssRule(phone, '.responsive')).toMatch(/width: 56px/);
	});
});
