import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { cssRule } from '#lib/testing/css.js';
import { PHOTO_HINT, PHOTO_MAX_BYTES, PHOTO_TYPES } from '#lib/recipes/validation.js';
import PhotoField from './PhotoField.svelte';

const STORED = 'https://cdn/stored.jpg';
const appCss = readFileSync('src/app.css', 'utf8');

// jsdom has no DataTransfer; the field builds one to put a removed file back.
class FakeDataTransfer {
	list: File[] = [];
	items = { add: (file: File) => this.list.push(file) };
	get files() {
		return this.list;
	}
}

// FileReader in jsdom is real but asynchronous; the chosen preview lands a moment later.
const previewed = () =>
	vi.waitFor(() => expect(preview()?.getAttribute('src')).toMatch(/^data:image\/png/));

function setup(props: Partial<{ imageUrl: string | null; removeImage: boolean }> = {}) {
	render(PhotoField, {
		props: {
			imageUrl: props.imageUrl ?? null,
			removeImage: props.removeImage ?? false,
			chosen: false,
			hadPhoto: false
		}
	});
}

const input = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;
const removeFlag = () => document.querySelector('input[name="removeImage"]');
const preview = () => screen.queryByRole('img', { name: 'Preview' });
const removeButton = () => screen.queryByRole('button', { name: 'Remove photo' });
const undoButton = () => screen.queryByRole('button', { name: 'Undo photo removal' });
const status = () => screen.getByRole('status');

async function choose(name = 'a.png') {
	const file = new File(['x'], name, { type: PHOTO_TYPES[1] });
	const el = input();
	Object.defineProperty(el, 'files', { value: [file], writable: true, configurable: true });
	// As a browser does: clearing the value empties the selection.
	vi.spyOn(el, 'value', 'set').mockImplementation((v: string) => {
		if (v === '') el.files = [] as unknown as FileList;
	});
	await fireEvent.change(el);
	await previewed();
	return file;
}

beforeEach(() => {
	vi.stubGlobal('DataTransfer', FakeDataTransfer);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('PhotoField, empty', () => {
	test('a compact row: the tile, an Add photo pill naming the input, and the format hint', () => {
		setup();
		expect(document.querySelector('.photo-slot svg')).not.toBeNull();
		const pill = input().closest('label')!;
		expect(pill).toHaveClass('pill-btn');
		expect(pill).not.toHaveClass('pill-btn--paper');
		expect(pill.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
		expect(input()).toHaveAccessibleName('Add photo');
		expect(screen.getByText(PHOTO_HINT)).toHaveClass('form-hint');
		expect(preview()).toBeNull();
		expect(removeButton()).toBeNull();
		expect(undoButton()).toBeNull();
	});

	test('the hint names the limit the save enforces', () => {
		expect(PHOTO_HINT).toContain(`${PHOTO_MAX_BYTES / 1024 / 1024} MB`);
	});
});

describe('PhotoField, with a photo', () => {
	test('the photo with Replace then Remove, paper pills grouped over it', () => {
		setup({ imageUrl: STORED });
		expect(preview()).toHaveAttribute('src', STORED);
		const replace = input().closest('label')!;
		expect(input()).toHaveAccessibleName('Replace photo');
		expect(replace).toHaveClass('pill-btn', 'pill-btn--paper');
		expect(removeButton()).toHaveClass('pill-btn', 'pill-btn--paper');
		expect(removeButton()).toHaveAttribute('type', 'button');
		const group = replace.parentElement!;
		expect([...group.children]).toEqual([replace, removeButton()]);
		expect(screen.queryByText(PHOTO_HINT)).toBeNull();
	});

	test('stored → Replace: the chosen file previews in its place', async () => {
		setup({ imageUrl: STORED });
		await choose();
		expect(removeFlag()).toBeNull();
	});
});

describe('PhotoField, removal is undone until save', () => {
	test('stored → Remove → Undo: the stored photo, flag on then off, focus to Undo then Replace', async () => {
		setup({ imageUrl: STORED });
		removeButton()!.focus();
		await fireEvent.click(removeButton()!);
		await tick();
		expect(preview()).toBeNull();
		expect(removeFlag()).toHaveValue('on');
		expect(screen.getByText('Photo removed')).toBeInTheDocument();
		expect(undoButton()).toHaveClass('text-btn');
		expect(undoButton()).toHaveFocus();
		expect(status()).toHaveTextContent('Photo removed.');
		// The tile and the Add photo pill stay, to choose a different one.
		expect(document.querySelector('.photo-slot')).not.toBeNull();
		expect(input()).toHaveAccessibleName('Add photo');

		await fireEvent.click(undoButton()!);
		await tick();
		expect(preview()).toHaveAttribute('src', STORED);
		expect(removeFlag()).toBeNull();
		expect(undoButton()).toBeNull();
		expect(input()).toHaveFocus();
		expect(input()).toHaveAccessibleName('Replace photo');
		expect(status()).toHaveTextContent('Photo restored.');
	});

	test('empty → chosen → Remove → Undo: the same file back in the input, previewed', async () => {
		setup();
		const file = await choose();
		await fireEvent.click(removeButton()!);
		await tick();
		expect(preview()).toBeNull();
		expect(input().files).toHaveLength(0);
		// Nothing stored to drop: the flag stays off, the row still offers Undo.
		expect(removeFlag()).toBeNull();
		expect(undoButton()).toHaveFocus();

		await fireEvent.click(undoButton()!);
		await previewed();
		expect(input().files![0]).toBe(file);
		expect(input()).toHaveFocus();
	});

	test('stored → chosen → Remove → Undo: the chosen file comes back, not the stored one', async () => {
		setup({ imageUrl: STORED });
		const file = await choose();
		await fireEvent.click(removeButton()!);
		await tick();
		expect(removeFlag()).toHaveValue('on');
		await fireEvent.click(undoButton()!);
		await previewed();
		expect(input().files![0]).toBe(file);
		expect(removeFlag()).toBeNull();
	});

	test('removed → choose another: the new photo shows and the Undo is gone', async () => {
		setup({ imageUrl: STORED });
		await fireEvent.click(removeButton()!);
		await tick();
		await choose('b.png');
		expect(removeFlag()).toBeNull();
		expect(undoButton()).toBeNull();
		expect(screen.queryByText('Photo removed')).toBeNull();
	});

	test('a restored draft or failed save marked removed still says so, and Undo brings the stored photo', async () => {
		setup({ imageUrl: STORED, removeImage: true });
		expect(preview()).toBeNull();
		expect(screen.getByText('Photo removed')).toBeInTheDocument();
		await fireEvent.click(undoButton()!);
		await tick();
		expect(preview()).toHaveAttribute('src', STORED);
	});
});

describe('the photo pill, a member of the closed set', () => {
	// jsdom applies no app.css, so the rules are read from it; e2e reads the computed style.
	test('36px at desktop, 44px on a phone or under a coarse pointer', () => {
		expect(cssRule(appCss, '.pill-btn')).toMatch(/min-height:\s*36px/);
		const coarse = appCss.match(
			/@media \(max-width: 699px\), \(pointer: coarse\) \{\s*\.pill-btn\s*\{([^{}]*)\}/
		);
		expect(coarse?.[1]).toMatch(/min-height:\s*44px/);
	});

	test('the field label rule never restyles it', () => {
		// The eyebrow (small caps, Ink 3) outranked .text-btn on the old Choose a photo label.
		const label = appCss.match(/([^{}]*\.field-legend[^{}]*)\{/)![1];
		expect(label).toMatch(/\.field label:not\(:where\(\.pill-btn\)\)/);
		expect(label).not.toMatch(/\.field label\s*,/);
	});

	test('paper at rest, the band on hover, a paper halo round the focus ring', () => {
		expect(cssRule(appCss, '.pill-btn--paper')).toMatch(/background:\s*var\(--color-bg\)/);
		expect(cssRule(appCss, '.pill-btn:hover')).toMatch(/background:\s*var\(--color-band\)/);
		const focus = cssRule(appCss, '.pill-btn:is(:focus-visible, :has(:focus-visible))');
		expect(focus).toMatch(/outline:\s*2px solid var\(--color-accent\)/);
		expect(focus).toMatch(/box-shadow:\s*0 0 0 6px var\(--color-bg\)/);
	});
});
