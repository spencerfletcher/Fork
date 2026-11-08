import { test, expect } from 'vitest';
import { load } from './+page.server';

const run = (query = '') => load({ url: new URL(`http://x/confirm-email${query}`) } as never);

test('the tab title matches the h1', async () => {
	expect(await run()).toMatchObject({ meta: { title: 'Confirm your email' } });
});

test('carries a local redirectTo from signup and drops an off-site one', async () => {
	expect(await run('?redirectTo=%2Ffavorites')).toMatchObject({ redirectTo: '/favorites' });
	expect(await run('?redirectTo=%2F%2Fevil.example')).toMatchObject({ redirectTo: null });
});
