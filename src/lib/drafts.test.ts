import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { draftOf } from '#lib/recipes/validation.js';
import {
	clearDraft,
	clearDrafts,
	DRAFT_MAX_AGE_MS,
	draftAge,
	draftKey,
	listDrafts,
	loadDraft,
	saveDraft,
	type StoredDraft
} from './drafts.js';

// A Storage that keeps what it is given, optionally full.
function memoryStorage(limit = Infinity): Storage {
	const items = new Map<string, string>();
	return {
		get length() {
			return items.size;
		},
		key: (i) => [...items.keys()][i] ?? null,
		getItem: (k) => items.get(k) ?? null,
		setItem: (k, v) => {
			if (v.length > limit) throw new DOMException('full', 'QuotaExceededError');
			items.set(k, v);
		},
		removeItem: (k) => void items.delete(k),
		clear: () => items.clear()
	};
}

const NOW = Date.UTC(2026, 10, 11, 12);

function stored(title: string, savedAt = NOW): StoredDraft {
	const form = new FormData();
	form.set('title', title);
	return { draft: draftOf(form), savedAt, photoLost: false };
}

beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));
afterEach(() => vi.unstubAllGlobals());

describe('drafts', () => {
	test('round trip: what is saved loads back', () => {
		const key = draftKey('user-a', 'new');
		const value = { ...stored('Soup'), photoLost: true };
		expect(saveDraft(key, value)).toBe(true);
		expect(loadDraft(key, NOW)).toEqual(value);
	});

	test('one user never loads another user’s draft for the same recipe', () => {
		saveDraft(draftKey('user-a', 'recipe-1'), stored('Mine'));
		expect(draftKey('user-a', 'recipe-1')).not.toBe(draftKey('user-b', 'recipe-1'));
		expect(loadDraft(draftKey('user-b', 'recipe-1'), NOW)).toBeNull();
	});

	test('logging out clears every draft of that user and nobody else’s', () => {
		saveDraft(draftKey('user-a', 'new'), stored('Soup'));
		saveDraft(draftKey('user-a', 'recipe-1'), stored('Stew'));
		saveDraft(draftKey('user-ab', 'new'), stored('Theirs'));
		clearDrafts('user-a');
		expect(loadDraft(draftKey('user-a', 'new'), NOW)).toBeNull();
		expect(loadDraft(draftKey('user-a', 'recipe-1'), NOW)).toBeNull();
		expect(loadDraft(draftKey('user-ab', 'new'), NOW)).not.toBeNull();
	});

	test('clear removes it', () => {
		const key = draftKey('user-a', 'new');
		saveDraft(key, stored('Soup'));
		clearDraft(key);
		expect(loadDraft(key, NOW)).toBeNull();
	});

	test('a draft past the age limit is dropped on load, every key with it', () => {
		const old = NOW - DRAFT_MAX_AGE_MS - 1;
		saveDraft(draftKey('user-a', 'new'), stored('Old', old));
		saveDraft(draftKey('user-b', 'recipe-2'), stored('Also old', old));
		saveDraft(draftKey('user-a', 'recipe-3'), stored('Fresh', NOW - DRAFT_MAX_AGE_MS));
		expect(loadDraft(draftKey('user-a', 'new'), NOW)).toBeNull();
		expect(localStorage.length).toBe(1);
		expect(loadDraft(draftKey('user-a', 'recipe-3'), NOW)?.draft.title).toBe('Fresh');
	});

	test('unreadable storage reads as no draft and saves as false', () => {
		const throwing = () => {
			throw new DOMException('denied', 'SecurityError');
		};
		vi.stubGlobal('localStorage', {
			...memoryStorage(),
			getItem: throwing,
			setItem: throwing,
			removeItem: throwing,
			key: throwing
		});
		const key = draftKey('user-a', 'new');
		expect(saveDraft(key, stored('Soup'))).toBe(false);
		expect(loadDraft(key, NOW)).toBeNull();
		expect(() => clearDraft(key)).not.toThrow();
	});

	test('no storage at all (the server) reads as no draft', () => {
		vi.stubGlobal('localStorage', undefined);
		const key = draftKey('user-a', 'new');
		expect(saveDraft(key, stored('Soup'))).toBe(false);
		expect(loadDraft(key, NOW)).toBeNull();
	});

	test('a full storage refuses the save and keeps nothing half-written', () => {
		vi.stubGlobal('localStorage', memoryStorage(10));
		const key = draftKey('user-a', 'new');
		expect(saveDraft(key, stored('Soup'))).toBe(false);
		expect(loadDraft(key, NOW)).toBeNull();
	});

	test('a value that is not a draft reads as none', () => {
		const key = draftKey('user-a', 'new');
		localStorage.setItem(key, '{not json');
		expect(loadDraft(key, NOW)).toBeNull();
		localStorage.setItem(key, JSON.stringify({ savedAt: 'soon' }));
		expect(loadDraft(key, NOW)).toBeNull();
	});
});

describe('listDrafts', () => {
	const cookies = { slug: 'cookies', title: 'Cookies' };

	test('the new-recipe draft and each edit draft of this user, newest first', () => {
		saveDraft(draftKey('user-a', 'new'), stored('', NOW - 3000));
		saveDraft(draftKey('user-a', '7'), { ...stored('Chewy cookies', NOW - 1000), recipe: cookies });
		expect(listDrafts('user-a', NOW)).toEqual([
			{
				key: draftKey('user-a', '7'),
				title: 'Chewy cookies',
				savedAt: NOW - 1000,
				recipe: cookies
			},
			{ key: draftKey('user-a', 'new'), title: '', savedAt: NOW - 3000, recipe: null }
		]);
	});

	test('another user’s drafts on the device are never listed', () => {
		saveDraft(draftKey('user-b', 'new'), stored('Theirs'));
		saveDraft(draftKey('user-ab', '7'), { ...stored('Also theirs'), recipe: cookies });
		expect(listDrafts('user-a', NOW)).toEqual([]);
	});

	test('a draft past the age limit is not listed', () => {
		saveDraft(draftKey('user-a', 'new'), stored('Old', NOW - DRAFT_MAX_AGE_MS - 1));
		saveDraft(draftKey('user-a', '7'), {
			...stored('Fresh', NOW - DRAFT_MAX_AGE_MS),
			recipe: cookies
		});
		expect(listDrafts('user-a', NOW).map((d) => d.title)).toEqual(['Fresh']);
	});

	test('corrupt entries, and edit drafts that do not say which recipe, are skipped', () => {
		localStorage.setItem(draftKey('user-a', 'new'), '{not json');
		localStorage.setItem(draftKey('user-a', '8'), JSON.stringify({ savedAt: 'soon' }));
		saveDraft(draftKey('user-a', '9'), stored('Before the link was kept'));
		saveDraft(draftKey('user-a', '10'), {
			...stored('Half a link'),
			recipe: { slug: 3 } as never
		});
		saveDraft(draftKey('user-a', '7'), { ...stored('Chewy cookies'), recipe: cookies });
		expect(listDrafts('user-a', NOW).map((d) => d.title)).toEqual(['Chewy cookies']);
	});

	test('storage that throws, or none at all, lists nothing', () => {
		vi.stubGlobal('localStorage', {
			...memoryStorage(),
			key: () => {
				throw new DOMException('denied', 'SecurityError');
			}
		});
		expect(listDrafts('user-a', NOW)).toEqual([]);
		vi.stubGlobal('localStorage', undefined);
		expect(listDrafts('user-a', NOW)).toEqual([]);
	});

	test('the recipe an edit draft belongs to round-trips through load', () => {
		const key = draftKey('user-a', '7');
		saveDraft(key, { ...stored('Chewy cookies'), recipe: cookies });
		expect(loadDraft(key, NOW)?.recipe).toEqual(cookies);
	});
});

describe('draftAge', () => {
	test.each([
		[30 * 1000, 'just now'],
		[5 * 60 * 1000, '5 minutes ago'],
		[3 * 60 * 60 * 1000, '3 hours ago'],
		[24 * 60 * 60 * 1000, 'yesterday'],
		[4 * 24 * 60 * 60 * 1000, '4 days ago']
	])('%i ms reads "%s"', (ago, words) => {
		expect(draftAge(NOW - ago, NOW)).toBe(words);
	});
});
