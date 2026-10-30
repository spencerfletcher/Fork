import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import source from './RecipeForm.svelte?raw';
import { readFileSync } from 'node:fs';
import RecipeForm from './RecipeForm.svelte';
import { draftOf } from '#lib/recipes/validation.js';

vi.mock('$app/navigation', () => ({ beforeNavigate: () => {} }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

// jsdom has no layout or scrolling: the rects are set by hand and the scroll recorded.
const scrollIntoView = vi.fn();
const reduced = { matches: false };

// jsdom applies no component CSS, so the declarations are read from the source.
const style = source.slice(source.indexOf('<style>'));

describe('RecipeForm photo buttons', () => {
	test('reach 44px on a phone or under a coarse pointer', () => {
		const media = style.slice(style.indexOf('@media (max-width: 699px), (pointer: coarse)'));
		const block = media.slice(0, media.indexOf('\n\t}\n'));
		expect(block).toMatch(/\.photo-choose,\s*\.photo-keep\s*{[^}]*min-height:\s*44px/);
	});
});

describe('RecipeForm Choose photo', () => {
	// The label takes back a button's voice, so its weight is the ghost button's, as Cancel's is.
	test('is set at the ghost button weight', () => {
		const weight = (css: string, selector: string) => {
			const at = css.indexOf(`${selector} {`);
			return css.slice(at, css.indexOf('}', at)).match(/font-weight:\s*(\d+)/)?.[1];
		};
		const appCss = readFileSync('src/app.css', 'utf8');
		const ghost = weight(appCss, '.btn-ghost');
		expect(ghost).toBeDefined();
		expect(weight(style, '.photo-choose')).toBe(ghost);
	});
});

describe('RecipeForm actions on a phone', () => {
	// Every phone-only block, joined, so the test does not care which one holds a rule.
	const phone = style
		.split('@media (max-width: 699px) {')
		.slice(1)
		.map((rest) => rest.slice(0, rest.indexOf('\n\t}\n')))
		.join('\n');
	const rule = (selector: string) => {
		const at = phone.indexOf(`${selector} {`);
		return at < 0 ? '' : phone.slice(at, phone.indexOf('}', at));
	};

	test('Save and Cancel sit in a bar pinned to the bottom of the screen, clear of the home indicator', () => {
		const bar = rule('.form-actions');
		expect(bar).toMatch(/position:\s*sticky/);
		expect(bar).toMatch(/bottom:\s*0/);
		expect(bar).toMatch(/background:\s*var\(--color-surface\)/);
		expect(bar).toMatch(/border-top:\s*1px solid var\(--color-border\)/);
		expect(bar).toMatch(/padding(-bottom)?:[^;]*env\(safe-area-inset-bottom\)/);
	});

	test('a field focused near the bottom scrolls clear of the bar', () => {
		expect(rule(':global(html:has(.form-actions))')).toMatch(
			/scroll-padding-bottom:[^;]*env\(safe-area-inset-bottom\)/
		);
	});
});

describe('RecipeForm invalid fields', () => {
	// app.css styles every invalid field (red border and text, no fill); the
	// editor adds nothing, so the placeholder keeps its own colour.
	test('the editor does not restyle an invalid box or its placeholder', () => {
		expect(style).not.toMatch(/user-invalid|aria-invalid/);
	});
});

describe('RecipeForm field focused under the phone bar', () => {
	beforeEach(() => {
		scrollIntoView.mockClear();
		Element.prototype.scrollIntoView = scrollIntoView;
		reduced.matches = false;
		window.matchMedia = ((query: string) => ({
			matches: query.includes('reduce') && reduced.matches
		})) as never;
	});

	// The box itself always clears the bar here; only its block (label, box,
	// hint) reaches under it, so a scroll of the box alone would not count.
	function setup(fieldBottom: number, barTop: number) {
		render(RecipeForm, {
			props: {
				baseline: draftOf(new FormData()),
				form: null,
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});
		const box = screen.getByLabelText('Ingredients');
		const bar = screen.getByRole('button', { name: 'Create recipe' }).parentElement!;
		box.getBoundingClientRect = () => ({ bottom: barTop - 40 }) as DOMRect;
		fieldOf(box).getBoundingClientRect = () => ({ bottom: fieldBottom }) as DOMRect;
		bar.getBoundingClientRect = () => ({ top: barTop }) as DOMRect;
		return box;
	}

	const fieldOf = (box: HTMLElement) => box.closest('.field')!;

	test('scrolls a field whose hint is hidden by the bar to the nearest edge, box and hint together', () => {
		setup(1000, 780).focus();
		expect(scrollIntoView).toHaveBeenCalledTimes(1);
		const field = fieldOf(screen.getByLabelText('Ingredients'));
		expect(field).toContainElement(screen.getByText(/^One per line/));
		expect(scrollIntoView.mock.contexts[0]).toBe(field);
		expect(scrollIntoView.mock.calls[0][0]).toEqual({ block: 'nearest', behavior: 'smooth' });
	});

	test('jumps without animation under reduced motion', () => {
		reduced.matches = true;
		setup(1000, 780).focus();
		expect(scrollIntoView.mock.calls[0][0]).toEqual({ block: 'nearest', behavior: 'instant' });
	});

	test('leaves a field clear of the bar where it is', () => {
		setup(780, 780).focus();
		expect(scrollIntoView).not.toHaveBeenCalled();
	});

	test("leaves the bar's own buttons where they are", () => {
		setup(0, 780);
		screen.getByRole('button', { name: 'Create recipe' }).getBoundingClientRect = () =>
			({ bottom: 830 }) as DOMRect;
		screen.getByRole('button', { name: 'Create recipe' }).focus();
		expect(scrollIntoView).not.toHaveBeenCalled();
	});
});

describe('RecipeForm title box', () => {
	const renderForm = () =>
		render(RecipeForm, {
			props: {
				baseline: draftOf(new FormData()),
				form: null,
				allTags: [],
				submitLabel: 'Create recipe',
				cancelHref: '/recipes'
			}
		});

	// A long title wraps on a phone instead of scrolling out of a 352px box.
	test('is a one-row textarea named title, required', () => {
		renderForm();
		const title = screen.getByRole('textbox', { name: 'Title' });
		expect(title.tagName).toBe('TEXTAREA');
		expect(title).toHaveAttribute('name', 'title');
		expect(title).toHaveAttribute('rows', '1');
		expect(title).toBeRequired();
	});

	test('Enter cannot type a newline', () => {
		renderForm();
		const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true });
		screen.getByRole('textbox', { name: 'Title' }).dispatchEvent(enter);
		expect(enter.defaultPrevented).toBe(true);
	});

	test('a pasted newline is flattened to a space', async () => {
		renderForm();
		const title = screen.getByRole('textbox', { name: 'Title' });
		await fireEvent.input(title, { target: { value: 'Brown butter\ncookies\r\n' } });
		expect(title).toHaveValue('Brown butter cookies ');
	});

	// field-sizing grows it; without it, rows="1" and this floor keep the input's height.
	test("keeps the single-line boxes' height where field-sizing is unsupported, and no resize grip", () => {
		const at = style.indexOf("textarea[name='title'] {");
		const rule = style.slice(at, style.indexOf('}', at));
		expect(rule).toMatch(/min-height:\s*calc\(1lh \+ 20px\)/);
		expect(rule).toMatch(/resize:\s*none/);
	});
});
