import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ReportStep from './ReportStep.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

describe('ReportStep', () => {
	test('opens with the box focused and the whole form, Send report included, scrolled into view', () => {
		// jsdom has no scrollIntoView; the step must work without it too.
		const scrollIntoView = vi.fn();
		Element.prototype.scrollIntoView = scrollIntoView;
		render(ReportStep, { props: { target: { type: 'recipe', id: '7' } } });
		expect(screen.getByRole('textbox', { name: "What's wrong?" })).toHaveFocus();
		const form = screen.getByRole('button', { name: 'Send report' }).closest('form');
		expect(scrollIntoView.mock.contexts).toEqual([form]);
		// Instant, the default: nothing smooth for a reader who asked for less motion.
		expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
		delete (Element.prototype as Partial<Element>).scrollIntoView;
	});
});
