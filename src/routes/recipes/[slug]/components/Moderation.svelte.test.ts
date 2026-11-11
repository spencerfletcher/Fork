import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Moderation from './Moderation.svelte';
import { HIDDEN_NOTE, HIDDEN_NOTICE } from '#lib/moderation.js';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

const renderFor = (props: { hidden: boolean; moderator: boolean; isAuthor: boolean }) =>
	render(Moderation, { props: { slug: 'soup', title: 'Soup', ...props } });

describe('Moderation', () => {
	test('a hidden recipe tells its author so, and what they can still do', () => {
		renderFor({ hidden: true, moderator: false, isAuthor: true });
		expect(screen.getByText(HIDDEN_NOTICE)).toBeTruthy();
		expect(screen.getByText(HIDDEN_NOTE)).toBeTruthy();
		expect(screen.queryByRole('button')).toBeNull();
	});

	test('a moderator gets the control, and the notice too when the recipe is hidden', () => {
		renderFor({ hidden: false, moderator: true, isAuthor: false });
		expect(screen.getByRole('button', { name: 'Hide from others' })).toBeTruthy();
		expect(screen.queryByText(HIDDEN_NOTICE)).toBeNull();
		renderFor({ hidden: true, moderator: true, isAuthor: false });
		expect(screen.getByText(HIDDEN_NOTICE)).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Restore Soup for other cooks' })).toBeTruthy();
	});

	test('anyone else, or a recipe not hidden, shows nothing', () => {
		for (const props of [
			{ hidden: false, moderator: false, isAuthor: true },
			{ hidden: false, moderator: false, isAuthor: false }
		]) {
			const { container, unmount } = renderFor(props);
			expect(container.textContent?.trim()).toBe('');
			unmount();
		}
	});
});
