import { describe, test, expect, vi } from 'vitest';

const { goto, page } = vi.hoisted(() => ({
	goto: vi.fn(),
	page: {
		url: new URL('http://localhost/recipes/cookies?version=2'),
		state: { kept: true },
		shallow: null as { url: URL } | null
	}
}));
vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$app/state', () => ({ page }));

import { setShallowParam } from './shallowParam';

const last = () => {
	const [url, opts] = goto.mock.lastCall!;
	return { url: new URL(url), opts };
};

describe('setShallowParam', () => {
	test('sets the param by a shallow replace that keeps the page state', () => {
		setShallowParam('serves', '8');
		const { url, opts } = last();
		expect(url.search).toBe('?version=2&serves=8');
		expect(opts).toEqual({ shallow: true, replace: true, state: page.state });
	});

	test("builds on the last shallow URL, so one control keeps the other's param, and null drops it", () => {
		page.shallow = { url: new URL('http://localhost/recipes/cookies?version=2&cook=1') };
		setShallowParam('serves', '8');
		expect(last().url.search).toBe('?version=2&cook=1&serves=8');
		setShallowParam('cook', null);
		expect(last().url.search).toBe('?version=2');
	});
});
