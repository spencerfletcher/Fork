import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { draftOf } from '#lib/recipes/validation.js';
import {
	clearDraft,
	DRAFT_MAX_AGE_MS,
	draftAge,
	draftKey,
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
