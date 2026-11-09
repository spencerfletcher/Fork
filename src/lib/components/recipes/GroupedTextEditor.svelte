<script lang="ts">
	import { onMount } from 'svelte';
	import { lineKind, headingInsert, SECTION_NAME } from '#lib/recipes/editorLines.js';

	let {
		id,
		label,
		value = $bindable(),
		rows,
		placeholder,
		invalid = false,
		describedBy,
		disabled = false
	}: {
		/** The form field's name, and the box's id. */
		id: string;
		label: string;
		value: string;
		/** The empty box's height in lines. */
		rows: number;
		placeholder: string;
		invalid?: boolean;
		describedBy: string;
		/** Saving: the box takes no typing, as the disabled fieldset's fields do. */
		disabled?: boolean;
	} = $props();

	// The textarea is the form field: it is what submits, what the browser
	// validates and what bind:value reads. Without JavaScript it is the box.
	// Once mounted it hides behind a contenteditable with one div per line, so
	// a "# Name" line can draw as a heading while it is typed. The script only
	// toggles a class and one CSS variable on a line, never its text, so the
	// native caret, selection, copy, paste and undo survive.
	let enhanced = $state(false);
	onMount(() => {
		enhanced = true;
	});

	let textarea: HTMLTextAreaElement | undefined = $state();
	let box: HTMLDivElement | undefined = $state();
	let open = $state(false);
	let toggle: HTMLButtonElement | undefined = $state();

	const BLOCK = /^(DIV|P|LI|PRE|BLOCKQUOTE|H[1-6])$/;

	// The box as lines of plain text: each block is a line, a <br> ends one,
	// and a trailing <br> in a block is only its placeholder.
	function linesOf(root: Node): string[] {
		const out: string[] = [];
		let cur: string | null = null;
		const join = (parts: string[]) =>
			parts.forEach((part, i) => {
				if (i > 0) {
					out.push(cur ?? '');
					cur = null;
				}
				cur = (cur ?? '') + part;
			});
		for (const n of root.childNodes) {
			if (n.nodeType === Node.TEXT_NODE) {
				if ((n as Text).data) join((n as Text).data.split('\n'));
			} else if (n.nodeName === 'BR') {
				out.push(cur ?? '');
				cur = null;
			} else if (BLOCK.test(n.nodeName)) {
				if (cur !== null) out.push(cur);
				cur = null;
				const inner = linesOf(n);
				out.push(...(inner.length ? inner : ['']));
			} else if (n.nodeType === Node.ELEMENT_NODE) {
				join(linesOf(n));
			}
		}
		if (cur !== null) out.push(cur);
		return out;
	}

	// contenteditable types a trailing space as a no-break space; the server gets a space.
	const textOf = (root: HTMLElement) =>
		linesOf(root)
			.join('\n')
			.replace(/\u00a0/g, ' ');

	function fill(root: HTMLElement, text: string) {
		root.textContent = '';
		for (const line of text.split('\n')) {
			const div = document.createElement('div');
			if (line) div.textContent = line;
			else div.append(document.createElement('br'));
			root.append(div);
		}
	}

	// A range over characters [start, end) of a line's text.
	function rangeIn(el: Node, start: number, end: number): Range | null {
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		const r = document.createRange();
		let at = 0;
		let started = false;
		for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
			if (!started && start <= at + n.length) {
				r.setStart(n, start - at);
				started = true;
			}
			if (started && end <= at + n.length) {
				r.setEnd(n, end - at);
				return r;
			}
			at += n.length;
		}
		return null;
	}

	// Attributes only, and only when the value changes: an unchanged line is
	// not written to at all, as any write ends Chrome's run of typing and
	// Cmd+Z would then undo a letter at a time. --mk is where the # ends, so
	// the background clipped to the text paints the # in Ink 3.
	function style(root: HTMLElement) {
		for (const line of root.children) {
			if (!(line instanceof HTMLElement) || !BLOCK.test(line.nodeName)) continue;
			const text = line.textContent ?? '';
			const kind = lineKind(text);
			const want = kind === 'heading' ? 'heading' : kind === 'unnamed' ? 'unnamed' : '';
			if ((line.getAttribute('class') ?? '') !== want) {
				if (want) line.setAttribute('class', want);
				else line.removeAttribute('class');
			}
			let mk = '';
			if (kind === 'heading') {
				const r = rangeIn(line, text.indexOf('#'), text.indexOf('#') + 1);
				if (r) {
					const right = r.getBoundingClientRect().right - line.getBoundingClientRect().left;
					mk = `${right.toFixed(1)}px`;
				}
			}
			if (line.style.getPropertyValue('--mk') !== mk) {
				if (mk) line.style.setProperty('--mk', mk);
				else line.removeAttribute('style');
			}
		}
	}

	// The box is filled when it appears and whenever the value changes from
	// outside (a failed save hands back the draft). Typing never refills it:
	// sync() has already made the value the box's own text.
	$effect(() => {
		if (box && (box.childNodes.length === 0 || value !== textOf(box))) {
			fill(box, value);
			style(box);
		}
	});

	// Bitter changes the #'s width once it loads, and a wrap moves it.
	$effect(() => {
		if (!box) return;
		const el = box;
		void document.fonts?.ready.then(() => style(el));
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => style(el));
		observer.observe(el);
		return () => observer.disconnect();
	});

	// The box's text goes to the textarea as an input event from it, so
	// bind:value, the form's dirty check and its error re-check all see the
	// field they always have.
	let pending = false;
	function sync() {
		if (!pending || !box || !textarea) return;
		pending = false;
		textarea.value = textOf(box);
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
	}

	// Every redraw waits a task. Chrome ends its run of typing (one Cmd+Z per
	// run) when the page changes the DOM inside the input event itself, even
	// outside the box; a moment later, it keeps the run.
	function oninput() {
		pending = true;
		if (composing) return;
		setTimeout(() => {
			if (composing) return;
			sync();
			if (box) style(box);
		});
	}

	// An IME's word in progress is lost if the box is written to, so nothing
	// is wrapped, styled or synced until it is committed, then all of it once.
	let composing = false;
	function oncompositionend() {
		composing = false;
		ensureLine();
		pending = true;
		sync();
		if (box) style(box);
	}

	// The last caret in the box, so Insert works once focus has moved to it.
	let lastRange: Range | null = null;

	// Leaving the box is leaving the field: the form checks it as it would the textarea.
	function onfocusout() {
		const sel = getSelection();
		if (box && sel?.rangeCount && box.contains(sel.anchorNode)) {
			lastRange = sel.getRangeAt(0).cloneRange();
		}
		sync();
		textarea?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
	}

	function lineOf(node: Node | null): HTMLElement | null {
		while (node && node.parentNode !== box) node = node.parentNode;
		return node instanceof HTMLElement && BLOCK.test(node.nodeName) ? node : null;
	}

	// Select-all and delete leaves Chrome's box with no line at all, and text
	// typed then is a bare text node no class can reach. Before anything more
	// lands, an empty box gets one empty line back and bare text is wrapped in
	// one, the caret kept where it was. Only a box with no line is written to,
	// so no run of typing is cut short.
	function ensureLine() {
		if (!box || [...box.children].some((c) => BLOCK.test(c.nodeName))) return;
		const sel = getSelection();
		let caret: [Node, number] | null = null;
		if (box.textContent === '') {
			fill(box, '');
			caret = [box.firstChild!, 0];
		} else {
			// Moving nodes resets a range inside them, so the caret is read first.
			if (sel?.rangeCount && box.contains(sel.anchorNode)) {
				caret = [sel.anchorNode!, sel.anchorOffset];
			}
			const line = document.createElement('div');
			line.append(...box.childNodes);
			// The box's lines are never Svelte's: it renders the box empty and leaves them alone.
			// eslint-disable-next-line svelte/no-dom-manipulating
			box.append(line);
			if (!caret || caret[0] === box) caret = [line, line.childNodes.length];
		}
		const r = document.createRange();
		r.setStart(...caret);
		sel?.removeAllRanges();
		sel?.addRange(r);
	}

	// Plain text through the editing command, so it lands on the undo stack.
	// Where the command is refused, the text goes in by hand (off the undo
	// stack) and is synced at once, as no input event follows.
	const insertText = (text: string) => {
		ensureLine();
		if (document.execCommand('insertText', false, text)) return;
		const sel = getSelection();
		if (!box || !sel?.rangeCount) return;
		const r = sel.getRangeAt(0);
		r.deleteContents();
		const node = document.createTextNode(text);
		r.insertNode(node);
		r.setStartAfter(node);
		r.collapse(true);
		sel.removeAllRanges();
		sel.addRange(r);
		pending = true;
		sync();
		style(box);
	};

	// "# Section name" on its own line with the name selected, so typing
	// replaces it. One insertText call: one step on the undo stack.
	function insertHeading() {
		if (!box || disabled) return;
		const sel = getSelection();
		if (!sel) return;
		// Closed again, so Tab still runs label, Insert, box.
		open = false;
		box.focus();
		ensureLine();
		// The caret where the box was left, else the end of its last line.
		const saved = lastRange && box.contains(lastRange.startContainer);
		const r = saved ? lastRange!.cloneRange() : document.createRange();
		if (!saved) r.selectNodeContents(box.lastElementChild ?? box);
		r.collapse(!!saved);
		const line = lineOf(r.startContainer);
		let caret = 0;
		if (line) {
			const before = document.createRange();
			before.setStart(line, 0);
			before.setEnd(r.startContainer, r.startOffset);
			caret = before.toString().length;
		}
		const plan = headingInsert(line?.textContent ?? '', caret);
		if (plan.at === 'lineEnd' && line) {
			r.selectNodeContents(line);
			r.collapse(false);
		}
		sel.removeAllRanges();
		sel.addRange(r);
		insertText(plan.text);

		const heading = `# ${SECTION_NAME}`;
		const at = lineOf(getSelection()?.anchorNode ?? null);
		let target = plan.above && at ? at.previousElementSibling : at;
		if (!target?.textContent?.includes(heading)) {
			target = [...box.children].findLast((l) => l.textContent?.includes(heading)) ?? null;
		}
		if (!target) return;
		const start = target.textContent!.indexOf(heading) + 2;
		const name = rangeIn(target, start, start + SECTION_NAME.length);
		if (name) {
			sel.removeAllRanges();
			sel.addRange(name);
		}
	}

	function onpaste(e: ClipboardEvent) {
		e.preventDefault();
		const text = e.clipboardData?.getData('text/plain');
		if (text) insertText(text.replace(/\r\n?/g, '\n'));
	}

	// A drop is plain text too, so dragging inside the box copies rather than moves.
	function ondrop(e: DragEvent) {
		const text = e.dataTransfer?.getData('text/plain');
		if (!text) return;
		e.preventDefault();
		const point = document.caretPositionFromPoint?.(e.clientX, e.clientY);
		if (point) {
			const r = document.createRange();
			r.setStart(point.offsetNode, point.offset);
			getSelection()?.removeAllRanges();
			getSelection()?.addRange(r);
		}
		insertText(text.replace(/\r\n?/g, '\n'));
	}
</script>

<div class="grouped" style:--rows={rows}>
	<div class="field-head">
		<!-- Names the textarea without JavaScript, the live box (by aria-labelledby) with it.
		     A div is no labelable control, so a press on the label focuses it by hand;
		     the keyboard reaches the box by Tab. -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
		<label for={id} id="{id}-label" onclick={() => box?.focus()}>
			{label}
			<span class="required" aria-hidden="true">*</span>
		</label>
		{#if enhanced}
			<button
				type="button"
				class="insert-toggle"
				bind:this={toggle}
				{disabled}
				aria-expanded={open}
				aria-controls="{id}-insert"
				onclick={() => (open = !open)}>
				Insert
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true">
					<path d="M4 6l4 4 4-4" />
				</svg>
			</button>
		{/if}
	</div>
	{#if enhanced}
		<!-- Escape closes the menu, back to its toggle, as a disclosure does. -->
		<div
			class="insert-row"
			id="{id}-insert"
			hidden={!open}
			role="presentation"
			onkeydown={(e) => {
				if (e.key !== 'Escape') return;
				open = false;
				toggle?.focus();
			}}>
			<!-- mousedown would take the caret out of the box. -->
			<button
				type="button"
				class="btn-ghost insert-item"
				{disabled}
				onmousedown={(e) => e.preventDefault()}
				onclick={insertHeading}>
				<span class="mark" aria-hidden="true">#</span>
				Section heading
			</button>
		</div>
		<div
			bind:this={box}
			{id}
			class="ed"
			class:empty={value === ''}
			contenteditable={disabled ? 'false' : 'true'}
			role="textbox"
			tabindex="0"
			aria-multiline="true"
			aria-required="true"
			aria-labelledby="{id}-label"
			data-placeholder={placeholder}
			aria-disabled={disabled ? 'true' : undefined}
			aria-invalid={invalid ? 'true' : undefined}
			aria-describedby={describedBy}
			spellcheck="true"
			{oninput}
			{onfocusout}
			{onpaste}
			{ondrop}
			oncompositionstart={() => (composing = true)}
			{oncompositionend}
			onbeforeinput={(e) => {
				// No bold, italic or other rich formatting from shortcuts.
				if (e.inputType.startsWith('format')) e.preventDefault();
				else if (e.inputType.startsWith('insert') && !composing) ensureLine();
			}}>
		</div>
	{/if}
	<textarea
		bind:this={textarea}
		id={enhanced ? undefined : id}
		name={id}
		{rows}
		required
		hidden={enhanced}
		bind:value
		{placeholder}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedBy}>
	</textarea>
</div>

<style>
	.grouped {
		display: contents;
	}

	/* The label left, Insert right, on one line. */
	.field-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 24px;
	}

	/* A 24px hit (44px on a phone) grown outward, so the text stays put. */
	.insert-toggle {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.875rem;
		line-height: 1.2;
		font-weight: 600;
		color: var(--color-text-2);
		background: none;
		border: 0;
		padding: 10px 6px;
		margin: -10px -6px;
		border-radius: var(--radius-sm);
	}

	.insert-toggle:hover {
		color: var(--color-text);
	}

	.insert-toggle svg {
		width: 14px;
		height: 14px;
		transition: transform 0.15s ease;
	}

	.insert-toggle[aria-expanded='true'] svg {
		transform: rotate(180deg);
	}

	.insert-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.insert-row[hidden] {
		display: none;
	}

	.insert-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 0.875rem;
	}

	.mark {
		font-weight: 600;
		color: var(--color-text-3);
	}

	/* field-sizing: content ignores rows; this keeps an empty box typeable. */
	textarea,
	.ed {
		min-height: calc(var(--rows) * 1lh + 20px);
	}

	/* The live box reads like the textarea it replaces (app.css's inputs). */
	.ed {
		position: relative;
		display: block;
		width: 100%;
		box-sizing: border-box;
		background: var(--color-surface);
		border: 1px solid var(--color-input-border);
		border-radius: var(--radius-md);
		padding: 9px 12px;
		color: var(--color-text);
		caret-color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		line-height: 1.4;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		cursor: text;
	}

	.ed[aria-invalid='true'] {
		border-color: var(--color-remove);
	}

	.ed[aria-disabled='true'] {
		opacity: 0.6;
	}

	.ed.empty::before {
		content: attr(data-placeholder);
		position: absolute;
		inset: 9px 12px auto;
		color: var(--color-text-3);
		pointer-events: none;
	}

	/* A "# Name" line: Bitter 600, a step larger, the # in Ink 3. The # is a
	   background clipped to the text (Ink 3 up to --mk, the #'s right edge,
	   ink after it, first visual line only), so no text node is split. */
	.ed :global(.heading) {
		font-family: var(--font-serif);
		font-weight: 600;
		font-size: 1.1875rem;
		line-height: 1.35;
		margin-top: 0.2em;
		color: transparent;
		background-image:
			linear-gradient(90deg, var(--color-text-3) var(--mk, 0px), var(--color-text) var(--mk, 0px)),
			linear-gradient(var(--color-text), var(--color-text));
		background-size:
			100% 1.35em,
			100% 100%;
		background-repeat: no-repeat;
		-webkit-background-clip: text;
		background-clip: text;
	}

	/* "#" or "# " while the name is still to come: the mark goes soft, no jump in size. */
	.ed :global(.unnamed) {
		color: var(--color-text-3);
	}

	/* The browser's own editing can wrap moved text in an inline-styled span
	   (Chrome does when a line is merged into a heading). Inert here, and the
	   text is read as text only, so nothing styled is ever sent. */
	.ed :global(:not(div, br)) {
		all: unset !important;
	}

	@media (forced-colors: active) {
		.ed :global(.heading) {
			color: CanvasText;
			background: none;
		}
	}

	@media (max-width: 699px) {
		.ed {
			font-size: 1rem;
			line-height: 1.5;
		}

		.insert-toggle {
			padding: 14px 8px;
			margin: -14px -8px;
		}
	}
</style>
