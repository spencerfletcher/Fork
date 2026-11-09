import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import GroupedTextEditor from './GroupedTextEditor.svelte';
import { SECTION_NAME } from '#lib/recipes/editorLines.js';

// jsdom has no editing commands or layout: insertText is recorded, and the
// real caret, undo and paste are checked in a browser.
const execCommand = vi.fn();
const original = document.execCommand;
beforeEach(() => {
	document.execCommand = execCommand;
});
afterEach(() => {
	document.execCommand = original;
});

const props = (value: string, extra: Record<string, unknown> = {}) => ({
	props: {
		id: 'ingredients',
		label: 'Ingredients',
		value,
		rows: 11,
		placeholder: '2 eggs',
		describedBy: 'ingredients-hint',
		...extra
	}
});

const box = () => screen.getByRole('textbox', { name: 'Ingredients' });
const field = () => document.querySelector<HTMLTextAreaElement>('textarea[name="ingredients"]')!;
const lines = () => [...box().children] as HTMLElement[];
// Redraws wait a task, as they do in the browser.
const nextTask = async () => {
	await new Promise((r) => setTimeout(r));
	await tick();
};

function caretAt(node: Node, offset: number) {
	const r = document.createRange();
	r.setStart(node, offset);
	getSelection()!.removeAllRanges();
	getSelection()!.addRange(r);
}

describe('GroupedTextEditor', () => {
	test('once mounted, a multi-line textbox named by its label replaces the textarea, which stays the form field', () => {
		render(GroupedTextEditor, props('1 cup flour\n2 eggs'));
		expect(box()).toHaveAttribute('contenteditable', 'true');
		expect(box()).toHaveAttribute('aria-multiline', 'true');
		expect(box()).toHaveAttribute('aria-labelledby', 'ingredients-label');
		expect(box()).toHaveAttribute('id', 'ingredients');
		expect(box()).toBeRequired();
		expect(box()).toHaveAccessibleDescription('');
		expect(field()).not.toBeVisible();
		expect(field()).toBeRequired();
		expect(field().value).toBe('1 cup flour\n2 eggs');
		expect(lines().map((l) => l.textContent)).toEqual(['1 cup flour', '2 eggs']);
	});

	test('a "# Name" line draws as a heading; a bare # only goes soft; "#2 can" stays a line', () => {
		render(GroupedTextEditor, props('# Dough\n1 cup flour\n#\n#2 can tomatoes\n\n# Glaze'));
		expect(lines().map((l) => l.className)).toEqual(['heading', '', 'unnamed', '', '', 'heading']);
	});

	test('a typed heading is styled a task later, and the textarea gets the text with \\n between lines', async () => {
		render(GroupedTextEditor, props('1 cup flour\npinch of salt'));
		const heard = vi.fn();
		field().addEventListener('input', heard);
		const line = document.createElement('div');
		line.textContent = '# Spice';
		box().append(line);
		await fireEvent.input(box());
		// Chrome keeps its run of typing only if nothing is written in the input event.
		expect(line.className).toBe('');
		expect(heard).not.toHaveBeenCalled();
		await nextTask();
		expect(line.className).toBe('heading');
		expect(field().value).toBe('1 cup flour\npinch of salt\n# Spice');
		expect(heard).toHaveBeenCalledTimes(1);
	});

	test('reads <br> lines and no-break spaces as the plain text the server parses', async () => {
		render(GroupedTextEditor, props(''));
		box().innerHTML =
			'<div>#\u00a0Dough</div><div>flour<br>eggs</div><div><br></div><div>salt</div>';
		await fireEvent.input(box());
		await nextTask();
		expect(field().value).toBe('# Dough\nflour\neggs\n\nsalt');
	});

	test('a value changed from outside, as a failed save hands back, refills the box', async () => {
		const { rerender } = render(GroupedTextEditor, props('1 cup flour'));
		await rerender(props('# Filling\nsugar').props);
		expect(lines().map((l) => [l.textContent, l.className])).toEqual([
			['# Filling', 'heading'],
			['sugar', '']
		]);
	});

	test('paste goes in as plain text through insertText, so undo covers it', async () => {
		render(GroupedTextEditor, props(''));
		const text = '1 egg\r\n# Drizzle\r\nhoney';
		const pasted = await fireEvent.paste(box(), {
			clipboardData: { getData: (type: string) => (type === 'text/plain' ? text : '<b>x</b>') }
		});
		expect(pasted).toBe(false);
		expect(execCommand).toHaveBeenCalledWith('insertText', false, '1 egg\n# Drizzle\nhoney');
	});

	// Chrome empties the box on select-all and delete; text typed then would be
	// a bare text node, a line no class can reach.
	test('an emptied box gets a line back before typing or a paste lands in it', async () => {
		render(GroupedTextEditor, props('flour'));
		for (const land of [
			() =>
				box().dispatchEvent(
					new InputEvent('beforeinput', { inputType: 'insertText', data: '#', bubbles: true })
				),
			() => fireEvent.paste(box(), { clipboardData: { getData: () => '# Dough' } })
		]) {
			box().textContent = '';
			await land();
			expect(lines().map((l) => l.nodeName)).toEqual(['DIV']);
			expect(lines()[0].contains(getSelection()!.anchorNode)).toBe(true);
		}
	});

	test('rich-text shortcuts do nothing', async () => {
		render(GroupedTextEditor, props('flour'));
		const bold = new InputEvent('beforeinput', {
			inputType: 'formatBold',
			cancelable: true,
			bubbles: true
		});
		box().dispatchEvent(bold);
		expect(bold.defaultPrevented).toBe(true);
	});

	test('leaving the box syncs it and is heard as leaving the field', async () => {
		render(GroupedTextEditor, props('flour'));
		const left = vi.fn(() => field().value);
		field().addEventListener('focusout', left);
		lines()[0].textContent = 'rye flour';
		await fireEvent.input(box());
		await fireEvent.focusOut(box());
		expect(left).toHaveReturnedWith('rye flour');
	});

	test('takes no typing while saving', () => {
		render(GroupedTextEditor, props('flour', { disabled: true }));
		expect(box()).toHaveAttribute('contenteditable', 'false');
		expect(box()).toHaveAttribute('aria-disabled', 'true');
	});

	test('shows the placeholder only while empty', async () => {
		render(GroupedTextEditor, props(''));
		expect(box()).toHaveAttribute('aria-placeholder', '2 eggs');
		expect(box()).toHaveClass('empty');
		lines()[0].textContent = '2 eggs';
		await fireEvent.input(box());
		await nextTask();
		expect(box()).not.toHaveClass('empty');
	});

	describe('Insert', () => {
		const toggle = () => screen.getByRole('button', { name: 'Insert' });
		const item = () => screen.getByRole('button', { name: 'Section heading' });

		test('sits after the label and before the box, collapsed, and opens to one item', async () => {
			render(GroupedTextEditor, props(''));
			const label = document.getElementById('ingredients-label')!;
			expect(
				label.compareDocumentPosition(toggle()) & Node.DOCUMENT_POSITION_FOLLOWING
			).toBeTruthy();
			expect(
				toggle().compareDocumentPosition(box()) & Node.DOCUMENT_POSITION_FOLLOWING
			).toBeTruthy();
			expect(toggle()).toHaveAttribute('aria-expanded', 'false');
			expect(screen.queryByRole('button', { name: 'Section heading' })).toBeNull();
			await fireEvent.click(toggle());
			expect(toggle()).toHaveAttribute('aria-expanded', 'true');
			const row = document.getElementById(toggle().getAttribute('aria-controls')!)!;
			expect(row.querySelectorAll('button')).toHaveLength(1);
			expect(item()).toBeVisible();
		});

		test('mid-line, the heading goes on a new line below and its name is selected, in the box', async () => {
			render(GroupedTextEditor, props('1 cup flour\n2 eggs'));
			const first = lines()[0];
			caretAt(first.firstChild!, 4);
			await fireEvent.focusOut(box());
			// What Chrome's insertText does here: a new line after this one, the caret at its end.
			execCommand.mockImplementation((_c: string, _u: boolean, text: string) => {
				const line = document.createElement('div');
				line.textContent = text.slice(1);
				first.after(line);
				caretAt(line.firstChild!, text.length - 1);
			});
			await fireEvent.click(toggle());
			await fireEvent.click(item());
			const insertedAt = execCommand.mock.calls[0];
			expect(insertedAt).toEqual(['insertText', false, `\n# ${SECTION_NAME}`]);
			expect(getSelection()!.toString()).toBe(SECTION_NAME);
			expect(box()).toHaveFocus();
			// Closed again, so Tab still runs label, Insert, box.
			expect(toggle()).toHaveAttribute('aria-expanded', 'false');
		});

		test('at the start of a line, the heading goes above it', async () => {
			render(GroupedTextEditor, props('1 cup flour\n2 eggs'));
			caretAt(lines()[1].firstChild!, 0);
			await fireEvent.focusOut(box());
			await fireEvent.click(toggle());
			await fireEvent.click(item());
			expect(execCommand).toHaveBeenCalledWith('insertText', false, `# ${SECTION_NAME}\n`);
		});

		test('a mouse press on the item keeps the caret in the box', async () => {
			render(GroupedTextEditor, props(''));
			await fireEvent.click(toggle());
			expect(await fireEvent.mouseDown(item())).toBe(false);
		});
	});
});
