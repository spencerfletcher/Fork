// Sign-up and password rules, shared by the pages and their actions so the
// browser's checks and the server's cannot drift apart.

// The handle is a URL segment and a byline: lowercase, URL-safe, bounded.
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
// A regex character class body, valid under the v flag browsers use for `pattern`.
const USERNAME_CHARS = 'a-z0-9_\\-';

/** The input's `pattern`: any case, since the handle is stored lowercased. */
export const USERNAME_PATTERN = `[A-Z${USERNAME_CHARS}]{${USERNAME_MIN},${USERNAME_MAX}}`;

export const USERNAME_MESSAGE = `Usernames are ${USERNAME_MIN} to ${USERNAME_MAX} characters: letters, digits, - or _`;

const USERNAME = new RegExp(`^[${USERNAME_CHARS}]{${USERNAME_MIN},${USERNAME_MAX}}$`, 'v');

/** The stored form of a typed handle. */
export function normalizeUsername(raw: string): string {
	return raw.trim().toLowerCase();
}

/** Whether a stored-form handle is allowed. */
export function validUsername(username: string): boolean {
	return USERNAME.test(username);
}

/** The email's prefix under the rule: lowercase, allowed characters, the maximum at most. */
export function suggestUsername(email: string): string {
	return email
		.split('@')[0]
		.toLowerCase()
		.replace(new RegExp(`[^${USERNAME_CHARS}]`, 'gv'), '')
		.slice(0, USERNAME_MAX);
}

export const PASSWORD_MIN = 6;
