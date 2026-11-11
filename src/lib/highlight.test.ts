import { describe, test, expect } from 'vitest';
import { MARK_START, MARK_END, segments } from './highlight.js';

const marked = (s: string) => s.replaceAll('[', MARK_START).replaceAll(']', MARK_END);

describe('segments', () => {
	test('splits marked text into plain and marked runs', () => {
		expect(segments(marked('Fresh [ginger], [ginger] root'))).toEqual([
			{ text: 'Fresh ', mark: false },
			{ text: 'ginger', mark: true },
			{ text: ', ', mark: false },
			{ text: 'ginger', mark: true },
			{ text: ' root', mark: false }
		]);
	});

	test('unmarked text is one plain run; empty text is none', () => {
		expect(segments('Plain')).toEqual([{ text: 'Plain', mark: false }]);
		expect(segments('')).toEqual([]);
	});

	test('a stray marker never leaks into the text', () => {
		expect(
			segments(marked('a]b[c'))
				.map((s) => s.text)
				.join('')
		).toBe('abc');
	});
});
