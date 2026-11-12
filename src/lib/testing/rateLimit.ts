/** A mocked rateLimited's refusal: a message no limit has, so only the action's wiring can return it. */
export const LIMITED = 'Limited (test).';

/** What an action answers with that refusal. */
export const LIMITED_FAILURE = { status: 429, data: { error: LIMITED, code: 'rate_limited' } };
