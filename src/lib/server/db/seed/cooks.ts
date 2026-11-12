// The varied seed's invented cooks. Each signs in with nothing: its login has a
// random password that is never stored or printed. Each address is the cook's
// name on SEEDED_EMAIL_DOMAIN (an RFC 2606 reserved name nobody can receive
// mail at, and not example.com, which the e2e suite signs up with), which is
// how `pnpm db:seed:clear` finds them again without touching a real cook.
export const SEEDED_EMAIL_DOMAIN = 'fork-seed.example';

export const VARIED_COOKS = [
	'ana_ferreira',
	'marisol_cocina',
	'tomasz-bakes',
	'hannah_k',
	'leo_ferments',
	'yuki_tanaka',
	'amara_eats',
	'ben_and_flour',
	'ines_lisboa',
	'oskar_nord',
	'priti_patel',
	'jamie_grills',
	'noor_kitchen',
	'sam_weeknights',
	'elena_r',
	'dario_pasta',
	'mei_lin',
	'grace_bakes',
	'kofi_mensah',
	'lucia_dolci',
	'arjun_cooks',
	'freya_garden',
	'hugo_bistro',
	'zainab_spice',
	'nate_smokes',
	'olga_pierogi',
	'rafael_tacos',
	'sofia_sourdough',
	'theo_vegan',
	'wren_preserves',
	'min_jun_kim'
] as const;

export type VariedCook = (typeof VARIED_COOKS)[number];

/** An invented cook's login address. */
export const seededEmail = (cook: VariedCook) => `${cook}@${SEEDED_EMAIL_DOMAIN}`;

const SEEDED_EMAILS = new Set<string>(VARIED_COOKS.map(seededEmail));

/** Whether an address is one of the invented cooks'. */
export const isSeededEmail = (email: string | undefined) =>
	SEEDED_EMAILS.has(email?.toLowerCase() ?? '');
