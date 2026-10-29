import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ErrorPage from './+error.svelte';

// The error page reads the status and the thrown message from page state.
const state = vi.hoisted(() => ({
	page: { status: 500, error: { message: 'Internal Error' } as { message: string } | null }
}));
vi.mock('$app/state', () => state);

function renderError(status: number, message: string | null) {
	state.page.status = status;
	state.page.error = message === null ? null : { message };
	return render(ErrorPage);
}

describe('error page', () => {
	test('a 500 titles itself Error 500 with the message, says Fork broke, and leads home', () => {
		renderError(500, 'Internal Error');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Error 500 – Internal Error'
		);
		expect(screen.getByText(/on Fork's side/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
	});

	test('a 404 keeps the thrown message in its title and explains what a missing page can mean', () => {
		renderError(404, 'Recipe not found');
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Error 404 – Recipe not found'
		);
		expect(screen.getByText(/old link|private/)).toBeInTheDocument();
	});

	test('a 404 with no message says Page not found', () => {
		renderError(404, null);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Error 404 – Page not found'
		);
	});

	test('the title is the page h1 at the site size, not a display number', () => {
		const { container } = renderError(500, 'Internal Error');
		expect(container.querySelector('h1')!.className).not.toMatch(/rem/);
		expect(container.querySelector('.font-mono')).toBeNull();
	});
});
