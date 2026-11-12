// The varied seed's people around the recipes: friendships in every state,
// saves and kept copies, collections, a year of the Journal, reports and the
// small settings a cook leaves behind. spencerfletcher is the main account:
// a full library, friends with news for him (For you), and the moderator's
// list when MODERATOR_IDS names him.
import type {
	VariedCollection,
	VariedEntry,
	VariedFriendship,
	VariedMute,
	VariedProfile,
	VariedReport,
	VariedSave
} from './types.js';

export const PROFILES: VariedProfile[] = [
	// He last looked at his notifications three days ago: what came since is new.
	{ cook: 'spencerfletcher', seenDaysAgo: 3 },
	{ cook: 'grace_bakes', muted: ['like', 'save'], startersDaysAgo: 150, measurement: 'us' },
	{ cook: 'oskar_nord', measurement: 'metric', defaultVisibility: 'public' },
	{ cook: 'nate_smokes', measurement: 'us' },
	{
		cook: 'sofia_sourdough',
		startersDaysAgo: 300,
		former: [{ username: 'sofia_bakes', daysAgo: 90 }]
	},
	{ cook: 'mei_lin', startersDaysAgo: 200, defaultVisibility: 'friends' },
	{ cook: 'tomasz-bakes', former: [{ username: 'tomek_bakes', daysAgo: 10 }] }
];

export const FRIENDSHIPS: VariedFriendship[] = [
	// spencerfletcher's friends (devcooks is the base's).
	{
		from: 'mei_lin',
		to: 'spencerfletcher',
		status: 'accepted',
		daysAgo: 320,
		acceptedDaysAgo: 319
	},
	{
		from: 'spencerfletcher',
		to: 'sofia_sourdough',
		status: 'accepted',
		daysAgo: 300,
		acceptedDaysAgo: 298
	},
	{
		from: 'leo_ferments',
		to: 'spencerfletcher',
		status: 'accepted',
		daysAgo: 250,
		acceptedDaysAgo: 250
	},
	{
		from: 'grace_bakes',
		to: 'spencerfletcher',
		status: 'accepted',
		daysAgo: 280,
		acceptedDaysAgo: 279
	},
	{
		from: 'spencerfletcher',
		to: 'lucia_dolci',
		status: 'accepted',
		daysAgo: 200,
		acceptedDaysAgo: 195
	},
	{
		from: 'hannah_k',
		to: 'spencerfletcher',
		status: 'accepted',
		daysAgo: 240,
		acceptedDaysAgo: 238
	},
	{
		from: 'spencerfletcher',
		to: 'ben_and_flour',
		status: 'accepted',
		daysAgo: 220,
		acceptedDaysAgo: 219
	},
	{
		from: 'zainab_spice',
		to: 'spencerfletcher',
		status: 'accepted',
		daysAgo: 180,
		acceptedDaysAgo: 180
	},
	{
		from: 'spencerfletcher',
		to: 'yuki_tanaka',
		status: 'accepted',
		daysAgo: 160,
		acceptedDaysAgo: 158
	},
	{
		from: 'theo_vegan',
		to: 'spencerfletcher',
		status: 'accepted',
		daysAgo: 140,
		acceptedDaysAgo: 139
	},
	{
		from: 'spencerfletcher',
		to: 'dario_pasta',
		status: 'accepted',
		daysAgo: 120,
		acceptedDaysAgo: 118
	},
	// His request, accepted yesterday: For you says so.
	{
		from: 'spencerfletcher',
		to: 'wren_preserves',
		status: 'accepted',
		daysAgo: 6,
		acceptedDaysAgo: 1
	},
	// Requests to him: one new, one waiting a while; and his own, unanswered.
	{ from: 'kofi_mensah', to: 'spencerfletcher', status: 'pending', daysAgo: 1 },
	{ from: 'nate_smokes', to: 'spencerfletcher', status: 'pending', daysAgo: 20 },
	{ from: 'spencerfletcher', to: 'hugo_bistro', status: 'pending', daysAgo: 12 },
	// He blocked the cook whose recipe a moderator hid.
	{ from: 'spencerfletcher', to: 'jamie_grills', status: 'blocked', daysAgo: 4 },
	// Among the others.
	{ from: 'mei_lin', to: 'yuki_tanaka', status: 'accepted', daysAgo: 330, acceptedDaysAgo: 329 },
	{ from: 'min_jun_kim', to: 'mei_lin', status: 'accepted', daysAgo: 210, acceptedDaysAgo: 205 },
	{
		from: 'sofia_sourdough',
		to: 'leo_ferments',
		status: 'accepted',
		daysAgo: 380,
		acceptedDaysAgo: 380
	},
	{
		from: 'ben_and_flour',
		to: 'sofia_sourdough',
		status: 'accepted',
		daysAgo: 260,
		acceptedDaysAgo: 255
	},
	{
		from: 'grace_bakes',
		to: 'lucia_dolci',
		status: 'accepted',
		daysAgo: 360,
		acceptedDaysAgo: 359
	},
	{ from: 'hannah_k', to: 'grace_bakes', status: 'accepted', daysAgo: 300, acceptedDaysAgo: 300 },
	{
		from: 'wren_preserves',
		to: 'hannah_k',
		status: 'accepted',
		daysAgo: 270,
		acceptedDaysAgo: 268
	},
	{
		from: 'ben_and_flour',
		to: 'grace_bakes',
		status: 'accepted',
		daysAgo: 230,
		acceptedDaysAgo: 229
	},
	{
		from: 'priti_patel',
		to: 'zainab_spice',
		status: 'accepted',
		daysAgo: 340,
		acceptedDaysAgo: 338
	},
	{
		from: 'arjun_cooks',
		to: 'zainab_spice',
		status: 'accepted',
		daysAgo: 150,
		acceptedDaysAgo: 149
	},
	{ from: 'amara_eats', to: 'kofi_mensah', status: 'accepted', daysAgo: 310, acceptedDaysAgo: 310 },
	{
		from: 'freya_garden',
		to: 'theo_vegan',
		status: 'accepted',
		daysAgo: 190,
		acceptedDaysAgo: 188
	},
	{
		from: 'marisol_cocina',
		to: 'rafael_tacos',
		status: 'accepted',
		daysAgo: 400,
		acceptedDaysAgo: 399
	},
	{
		from: 'olga_pierogi',
		to: 'tomasz-bakes',
		status: 'accepted',
		daysAgo: 350,
		acceptedDaysAgo: 350
	},
	{
		from: 'dario_pasta',
		to: 'lucia_dolci',
		status: 'accepted',
		daysAgo: 290,
		acceptedDaysAgo: 287
	},
	{
		from: 'ines_lisboa',
		to: 'ana_ferreira',
		status: 'accepted',
		daysAgo: 270,
		acceptedDaysAgo: 270
	},
	{
		from: 'oskar_nord',
		to: 'freya_garden',
		status: 'accepted',
		daysAgo: 170,
		acceptedDaysAgo: 160
	},
	{
		from: 'sam_weeknights',
		to: 'jamie_grills',
		status: 'accepted',
		daysAgo: 100,
		acceptedDaysAgo: 99
	},
	{ from: 'nate_smokes', to: 'jamie_grills', status: 'accepted', daysAgo: 90, acceptedDaysAgo: 90 },
	{ from: 'elena_r', to: 'noor_kitchen', status: 'pending', daysAgo: 15 },
	{ from: 'olga_pierogi', to: 'nate_smokes', status: 'blocked', daysAgo: 60 }
];

export const MUTES: VariedMute[] = [{ muter: 'hannah_k', muted: 'ben_and_flour', daysAgo: 45 }];

/** spencerfletcher's saves fill out his Cookbook to about sixty recipes with his own. */
export const SAVES: VariedSave[] = [
	{
		cook: 'spencerfletcher',
		recipe: 'pork-and-chive-dumplings',
		daysAgo: 150,
		keep: 3,
		note: 'v3 is the fold I can actually do; v4 pleats are beyond me.'
	},
	{ cook: 'spencerfletcher', recipe: 'mapo-tofu', daysAgo: 140 },
	{ cook: 'spencerfletcher', recipe: 'miso-soup', daysAgo: 130 },
	{ cook: 'spencerfletcher', recipe: 'borshch', daysAgo: 125 },
	{ cook: 'spencerfletcher', recipe: 'pierogi-ruskie', daysAgo: 120 },
	{
		cook: 'spencerfletcher',
		recipe: 'chickpea-spinach-curry',
		daysAgo: 115,
		note: 'Good with frozen spinach straight from the bag.'
	},
	{ cook: 'spencerfletcher', recipe: 'kanelbullar', daysAgo: 110 },
	{ cook: 'spencerfletcher', recipe: 'gravlax', daysAgo: 105 },
	{ cook: 'spencerfletcher', recipe: 'tacos-al-pastor', daysAgo: 100 },
	{ cook: 'spencerfletcher', recipe: 'salsa-verde-cruda', daysAgo: 95 },
	{ cook: 'spencerfletcher', recipe: 'jollof-rice', daysAgo: 90 },
	{
		cook: 'spencerfletcher',
		recipe: 'dal-makhani',
		daysAgo: 85,
		note: 'Start the soak Friday night for Saturday.'
	},
	{ cook: 'spencerfletcher', recipe: 'masala-chai', daysAgo: 80 },
	{ cook: 'spencerfletcher', recipe: 'spanakopita', daysAgo: 75 },
	{ cook: 'spencerfletcher', recipe: 'napa-kimchi', daysAgo: 70 },
	{ cook: 'spencerfletcher', recipe: 'mujadara', daysAgo: 65 },
	{
		cook: 'spencerfletcher',
		recipe: 'country-sourdough',
		daysAgo: 200,
		keep: 3,
		note: 'Keeping v3: the schedule fits a work week.'
	},
	{ cook: 'spencerfletcher', recipe: 'rye-country-sourdough', daysAgo: 60 },
	{ cook: 'spencerfletcher', recipe: 'overnight-focaccia', daysAgo: 58 },
	{ cook: 'spencerfletcher', recipe: 'new-york-bagels', daysAgo: 55 },
	{ cook: 'spencerfletcher', recipe: 'banana-bread', daysAgo: 52 },
	{
		cook: 'spencerfletcher',
		recipe: 'cassoulet',
		daysAgo: 50,
		note: 'Winter project. Order the duck legs a week ahead.'
	},
	{ cook: 'spencerfletcher', recipe: 'french-onion-soup', daysAgo: 48 },
	{ cook: 'spencerfletcher', recipe: 'tiramisu', daysAgo: 46 },
	{ cook: 'spencerfletcher', recipe: 'sauerkraut', daysAgo: 44 },
	{ cook: 'spencerfletcher', recipe: 'quick-pickled-red-onions', daysAgo: 42 },
	{ cook: 'spencerfletcher', recipe: 'apple-pie', daysAgo: 40 },
	{ cook: 'spencerfletcher', recipe: 'smoked-brisket', daysAgo: 38 },
	{ cook: 'spencerfletcher', recipe: 'classic-shortbread', daysAgo: 36 },
	{ cook: 'spencerfletcher', recipe: 'cacio-e-pepe', daysAgo: 34 },
	{ cook: 'spencerfletcher', recipe: 'sunday-ragu', daysAgo: 32 },
	{ cook: 'spencerfletcher', recipe: 'tamagoyaki', daysAgo: 30 },
	{ cook: 'spencerfletcher', recipe: 'chicken-biryani', daysAgo: 28 },
	{ cook: 'spencerfletcher', recipe: 'brown-butter-banana-bread', daysAgo: 26 },
	// Saved while they could be seen: the author later withdrew both, so he keeps copies.
	{
		cook: 'spencerfletcher',
		recipe: 'lemon-drizzle-cake',
		daysAgo: 60,
		note: 'The one Hannah brought to the picnic.'
	},
	{ cook: 'spencerfletcher', recipe: 'west-african-peanut-stew', daysAgo: 25 },
	{ cook: 'spencerfletcher', recipe: 'crisp-brown-butter-shortbread', daysAgo: 2 },

	// The featured adaptation, saved most this week, leads Discover.
	{ cook: 'grace_bakes', recipe: 'crisp-brown-butter-shortbread', daysAgo: 3 },
	{ cook: 'hannah_k', recipe: 'crisp-brown-butter-shortbread', daysAgo: 2 },
	{ cook: 'ben_and_flour', recipe: 'crisp-brown-butter-shortbread', daysAgo: 1 },
	{ cook: 'sofia_sourdough', recipe: 'crisp-brown-butter-shortbread', daysAgo: 4 },
	{ cook: 'wren_preserves', recipe: 'crisp-brown-butter-shortbread', daysAgo: 2 },
	{ cook: 'dario_pasta', recipe: 'crisp-brown-butter-shortbread', daysAgo: 1 },

	// Saves of his recipes: three since he last looked.
	{ cook: 'mei_lin', recipe: 'sheet-pan-lemon-chicken', daysAgo: 1 },
	{ cook: 'sofia_sourdough', recipe: 'roasted-tomato-sauce', daysAgo: 2 },
	{ cook: 'lucia_dolci', recipe: 'lemon-bars', daysAgo: 1 },
	{
		cook: 'hannah_k',
		recipe: 'sunday-roast-chicken',
		daysAgo: 40,
		keep: 4,
		note: 'v4 timings; the v5 brine is a weekend thing.'
	},
	{ cook: 'ben_and_flour', recipe: 'buttermilk-pancakes', daysAgo: 60, keep: 2 },
	{ cook: 'lucia_dolci', recipe: 'basil-pesto', daysAgo: 30 },
	{ cook: 'theo_vegan', recipe: 'chilli-con-carne', daysAgo: 100 },
	// Saved before he moved it to the Trash: they keep copies.
	{ cook: 'grace_bakes', recipe: 'microwave-mug-cake', daysAgo: 60 },
	{ cook: 'ben_and_flour', recipe: 'microwave-mug-cake', daysAgo: 50 },

	// Others' saves, for counts on cards.
	{ cook: 'yuki_tanaka', recipe: 'pork-and-chive-dumplings', daysAgo: 90 },
	{ cook: 'min_jun_kim', recipe: 'mapo-tofu', daysAgo: 80 },
	{ cook: 'leo_ferments', recipe: 'country-sourdough', daysAgo: 240 },
	{ cook: 'ben_and_flour', recipe: 'country-sourdough', daysAgo: 230 },
	{ cook: 'grace_bakes', recipe: 'country-sourdough', daysAgo: 100 },
	{ cook: 'sofia_sourdough', recipe: 'new-york-bagels', daysAgo: 70 },
	{ cook: 'priti_patel', recipe: 'chickpea-spinach-curry', daysAgo: 110 },
	{ cook: 'arjun_cooks', recipe: 'dal-makhani', daysAgo: 60 },
	{ cook: 'lucia_dolci', recipe: 'classic-shortbread', daysAgo: 100 },
	{ cook: 'hannah_k', recipe: 'apple-pie', daysAgo: 45 },
	{ cook: 'wren_preserves', recipe: 'sauerkraut', daysAgo: 80 },
	{ cook: 'marisol_cocina', recipe: 'tacos-al-pastor', daysAgo: 120 },
	{ cook: 'kofi_mensah', recipe: 'west-african-peanut-stew', daysAgo: 40 },
	{ cook: 'freya_garden', recipe: 'three-bean-vegan-chili', daysAgo: 30 },
	{ cook: 'tomasz-bakes', recipe: 'pierogi-ruskie', daysAgo: 200 },
	{ cook: 'ana_ferreira', recipe: 'bacalhau-a-bras', daysAgo: 100 },
	{ cook: 'noor_kitchen', recipe: 'cassoulet', daysAgo: 20 },
	{ cook: 'elena_r', recipe: 'tiramisu', daysAgo: 25 },
	{ cook: 'amara_eats', recipe: 'jollof-rice', daysAgo: 70 }
];

export const COLLECTIONS: VariedCollection[] = [
	// His starters and Weeknight exist (the base); these fill them out.
	{
		cook: 'spencerfletcher',
		name: 'Weeknight',
		recipes: [
			'sheet-pan-lemon-chicken',
			'weeknight-fried-rice',
			'chickpea-spinach-curry',
			'mapo-tofu',
			'cacio-e-pepe',
			'mujadara',
			'garlic-green-beans',
			'smash-burgers',
			'chilli-con-carne'
		]
	},
	{
		cook: 'spencerfletcher',
		name: 'To cook',
		recipes: [
			'cassoulet',
			'kanelbullar',
			'napa-kimchi',
			'gravlax',
			'pierogi-ruskie',
			'smoked-brisket',
			'tiramisu'
		]
	},
	{
		cook: 'spencerfletcher',
		name: 'Favorites',
		recipes: [
			'sunday-roast-chicken',
			'country-sourdough',
			'dal-makhani',
			'crisp-brown-butter-shortbread',
			'basil-pesto'
		]
	},
	{
		cook: 'spencerfletcher',
		name: 'Baking projects',
		recipes: [
			'country-sourdough',
			'rye-country-sourdough',
			'seeded-rye-sourdough',
			'new-york-bagels',
			'overnight-focaccia',
			'kanelbullar',
			'apple-pie',
			'banana-bread',
			'classic-shortbread',
			'lemon-bars',
			'cornbread-with-honey-butter',
			'brown-butter-banana-bread'
		]
	},
	{
		cook: 'spencerfletcher',
		name: 'Sunday dinners',
		recipes: [
			'sunday-roast-chicken',
			'braised-short-ribs-red-wine',
			'sunday-ragu',
			'cassoulet',
			'chicken-tikka-masala'
		]
	},
	{
		cook: 'spencerfletcher',
		name: 'Ferments',
		recipes: ['napa-kimchi', 'sauerkraut', 'country-sourdough']
	},
	{ cook: 'spencerfletcher', name: 'Party food', recipes: [] },
	{
		cook: 'grace_bakes',
		name: 'Holiday baking',
		recipes: ['classic-shortbread', 'apple-pie', 'crisp-brown-butter-shortbread']
	},
	{
		cook: 'grace_bakes',
		name: 'Favorites',
		recipes: ['country-sourdough', 'brown-butter-banana-bread']
	},
	{ cook: 'mei_lin', name: 'Dumpling night', recipes: ['pork-and-chive-dumplings', 'mapo-tofu'] },
	{
		cook: 'sofia_sourdough',
		name: 'To cook',
		recipes: ['new-york-bagels', 'crisp-brown-butter-shortbread']
	}
];

/** A year of cooking: spencerfletcher's most, then his friends' for the feed. */
export const ENTRIES: VariedEntry[] = [
	// ── spencerfletcher ──
	{
		cook: 'spencerfletcher',
		recipe: 'sheet-pan-lemon-chicken',
		version: 1,
		dish: 'Lemon chicken traybake',
		daysAgo: 300,
		servings: 4,
		caption: 'First go. Potatoes needed longer.',
		note: 'Cut the potatoes smaller.',
		audience: 'private'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'sheet-pan-lemon-chicken',
		dish: 'Sheet-pan lemon chicken',
		daysAgo: 150,
		servings: 4,
		caption: null,
		note: 'Hotter oven was right. Skin crackled.',
		audience: 'friends'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'sheet-pan-lemon-chicken',
		dish: 'Lemon chicken for six',
		daysAgo: 90,
		servings: 6,
		caption: 'Scaled up for the neighbours; two trays.',
		note: 'Two trays need swapping halfway.',
		audience: 'friends'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'sheet-pan-lemon-chicken',
		dish: 'Sheet-pan lemon chicken',
		daysAgo: 40,
		servings: 2,
		caption: null,
		note: 'Half batch, same timing.',
		audience: 'private'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'sheet-pan-lemon-chicken',
		dish: 'Sheet-pan lemon chicken',
		daysAgo: 6,
		servings: 4,
		caption: 'Tuesday standby, with the last of the green beans.',
		note: null,
		audience: 'friends',
		likedBy: [
			{ cook: 'mei_lin', daysAgo: 1 },
			{ cook: 'sofia_sourdough', daysAgo: 2 }
		]
	},
	{
		cook: 'spencerfletcher',
		recipe: 'red-lentil-dal',
		dish: 'Red lentil dal',
		daysAgo: 250,
		servings: 4,
		caption: null,
		note: 'More lemon at the end.',
		audience: 'private'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'red-lentil-dal',
		dish: 'Dal for a cold night',
		daysAgo: 30,
		servings: 6,
		caption: 'Doubled the tarka.',
		note: null,
		audience: 'friends',
		likedBy: [{ cook: 'zainab_spice', daysAgo: 29 }]
	},
	{
		cook: 'spencerfletcher',
		recipe: 'country-sourdough',
		version: 3,
		dish: 'First sourdough loaf',
		daysAgo: 190,
		servings: null,
		caption: 'Flat but delicious.',
		note: 'Starter wasn’t ready: wait for it to double.',
		audience: 'friends',
		likedBy: [{ cook: 'sofia_sourdough', daysAgo: 189 }]
	},
	{
		cook: 'spencerfletcher',
		recipe: 'country-sourdough',
		version: 3,
		dish: 'Sourdough, attempt two',
		daysAgo: 120,
		servings: null,
		caption: 'Actual ear this time.',
		note: 'Score deeper, at a shallower angle.',
		audience: 'friends'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'country-sourdough',
		version: 3,
		dish: 'Weekend sourdough',
		daysAgo: 20,
		servings: null,
		caption: null,
		note: 'Retard went 16 hours; still fine.',
		audience: 'private'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'sunday-roast-chicken',
		version: 2,
		dish: 'Roast chicken',
		daysAgo: 270,
		servings: 4,
		caption: null,
		note: 'Rest it longer than feels right.',
		audience: 'private'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'sunday-roast-chicken',
		dish: 'Sunday roast',
		daysAgo: 13,
		servings: 6,
		caption: 'Dry-brined overnight. Best one yet.',
		note: 'Buy a bigger bird for six.',
		audience: 'friends',
		likedBy: [{ cook: 'hannah_k', daysAgo: 12 }]
	},
	{
		cook: 'spencerfletcher',
		recipe: 'buttermilk-pancakes',
		version: 1,
		dish: 'Pancakes',
		daysAgo: 330,
		servings: null,
		caption: null,
		note: 'Batter too thick.',
		audience: 'private'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'buttermilk-pancakes',
		dish: 'Saturday pancakes',
		daysAgo: 160,
		servings: null,
		caption: 'Milk and lemon instead of buttermilk; nobody noticed.',
		note: null,
		audience: 'friends'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'buttermilk-pancakes',
		dish: 'Pancakes for the crew',
		daysAgo: 45,
		servings: null,
		caption: 'Tripled it.',
		note: 'Keep them warm in a low oven.',
		audience: 'friends'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'weeknight-fried-rice',
		version: 1,
		dish: 'Fried rice',
		daysAgo: 230,
		servings: 2,
		caption: null,
		note: null,
		audience: 'private'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'weeknight-fried-rice',
		version: 2,
		dish: 'Fried rice, new way',
		daysAgo: 100,
		servings: 2,
		caption: null,
		note: 'Liked the old way better.',
		audience: 'private'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'chickpea-spinach-curry',
		dish: 'Chickpea curry',
		daysAgo: 110,
		servings: 4,
		caption: null,
		note: 'Two cans was right for four.',
		audience: 'friends'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'chickpea-spinach-curry',
		dish: 'Chickpea curry',
		daysAgo: 8,
		servings: 2,
		caption: 'Half batch for lunch boxes.',
		note: null,
		audience: 'private'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'kanelbullar',
		dish: 'Kanelbullar',
		daysAgo: 70,
		servings: null,
		caption: 'Kitchen smelled like cardamom for a day.',
		note: 'Knots are easier than snails.',
		audience: 'friends'
	},
	{
		cook: 'spencerfletcher',
		recipe: 'cassoulet',
		dish: 'Cassoulet',
		daysAgo: 35,
		servings: 10,
		caption: 'Three days, ten people, worth it.',
		note: 'Make the confit the weekend before.',
		audience: 'friends',
		likedBy: [
			{ cook: 'lucia_dolci', daysAgo: 34 },
			{ cook: 'dario_pasta', daysAgo: 33 }
		]
	},
	{
		cook: 'spencerfletcher',
		recipe: 'crisp-brown-butter-shortbread',
		dish: 'Brown butter shortbread',
		daysAgo: 1,
		servings: null,
		caption: 'Lucia’s version. The rice flour snap is real.',
		note: 'Chill the butter fully or it spreads.',
		audience: 'friends'
	},
	{
		cook: 'spencerfletcher',
		dish: 'Fridge-clearing frittata',
		daysAgo: 200,
		servings: 3,
		caption: 'Half a leek, three potatoes, the end of the cheddar.',
		note: null,
		audience: 'private'
	},
	{
		cook: 'spencerfletcher',
		dish: 'Pad thai',
		daysAgo: 140,
		servings: 2,
		sourceUrl: 'https://en.wikipedia.org/wiki/Pad_thai',
		caption: 'Takeout night at home.',
		note: 'Soak the noodles in warm, not hot, water.',
		audience: 'friends'
	},
	{
		cook: 'spencerfletcher',
		dish: 'Grilled cheese and tomato soup',
		daysAgo: 60,
		servings: 2,
		caption: null,
		note: null,
		audience: 'private'
	},

	// ── His friends, for the feed ──
	{
		cook: 'mei_lin',
		recipe: 'pork-and-chive-dumplings',
		dish: 'Dumpling party',
		daysAgo: 5,
		servings: null,
		caption: 'Eighty folded, eighty gone.',
		note: 'Double the chives.',
		audience: 'friends',
		likedBy: [
			{ cook: 'spencerfletcher', daysAgo: 4 },
			{ cook: 'yuki_tanaka', daysAgo: 4 }
		]
	},
	{
		cook: 'mei_lin',
		recipe: 'mapo-tofu',
		dish: '麻婆豆腐',
		daysAgo: 60,
		servings: 3,
		caption: null,
		note: 'Less doubanjiang for Mum.',
		audience: 'friends'
	},
	{
		cook: 'mei_lin',
		dish: 'Congee with leftover chicken',
		daysAgo: 22,
		servings: 2,
		caption: 'Sick day food.',
		note: null,
		audience: 'friends'
	},
	{
		cook: 'sofia_sourdough',
		recipe: 'country-sourdough',
		dish: 'Country loaf',
		daysAgo: 3,
		servings: null,
		caption: 'Bake number 200-something.',
		note: 'Starter sluggish in the cold; warmer spot.',
		audience: 'friends',
		likedBy: [
			{ cook: 'spencerfletcher', daysAgo: 2 },
			{ cook: 'leo_ferments', daysAgo: 3 }
		]
	},
	{
		cook: 'sofia_sourdough',
		recipe: 'overnight-focaccia',
		dish: 'Focaccia',
		daysAgo: 18,
		servings: null,
		caption: 'Rosemary from the step.',
		note: null,
		audience: 'friends'
	},
	{
		cook: 'grace_bakes',
		recipe: 'apple-pie',
		dish: 'Apple pie',
		daysAgo: 9,
		servings: 8,
		caption: 'Lattice, finally even.',
		note: 'Mix of Bramley and Cox next time.',
		audience: 'friends',
		likedBy: [{ cook: 'spencerfletcher', daysAgo: 8 }]
	},
	{
		cook: 'grace_bakes',
		recipe: 'classic-shortbread',
		dish: 'Shortbread',
		daysAgo: 7,
		servings: null,
		caption: 'Lucia’s rice flour idea is tempting.',
		note: null,
		audience: 'friends'
	},
	{
		cook: 'zainab_spice',
		recipe: 'chicken-biryani',
		dish: 'Biryani for Eid',
		daysAgo: 150,
		servings: 12,
		caption: 'Doubled, two pots.',
		note: 'Fry twice as many onions as seems sane.',
		audience: 'friends'
	},
	{
		cook: 'zainab_spice',
		recipe: 'chickpea-spinach-curry',
		dish: 'Chickpea curry',
		daysAgo: 11,
		servings: 4,
		caption: null,
		note: null,
		audience: 'friends'
	},
	{
		cook: 'yuki_tanaka',
		recipe: 'miso-soup',
		dish: '味噌汁',
		daysAgo: 4,
		servings: 2,
		caption: 'Breakfast.',
		note: null,
		audience: 'friends'
	},
	{
		cook: 'yuki_tanaka',
		recipe: 'tamagoyaki',
		dish: 'Tamagoyaki',
		daysAgo: 16,
		servings: 2,
		caption: 'Bento season.',
		note: 'Lower heat for the last roll.',
		audience: 'friends'
	},
	{
		cook: 'hannah_k',
		recipe: 'sticky-toffee-pudding',
		dish: 'Sticky toffee pudding',
		daysAgo: 14,
		servings: 8,
		caption: 'Birthday request.',
		note: null,
		audience: 'friends',
		likedBy: [{ cook: 'grace_bakes', daysAgo: 13 }]
	},
	{
		cook: 'ben_and_flour',
		recipe: 'new-york-bagels',
		dish: 'Bagels',
		daysAgo: 10,
		servings: null,
		caption: 'Everything seasoning, obviously.',
		note: 'Boil 1 minute a side, not 2.',
		audience: 'friends',
		likedBy: [{ cook: 'sofia_sourdough', daysAgo: 9 }]
	},
	{
		cook: 'lucia_dolci',
		recipe: 'tiramisu',
		dish: 'Tiramisù',
		daysAgo: 21,
		servings: 8,
		caption: null,
		note: 'Rum this time; Marsala next.',
		audience: 'friends'
	},
	{
		cook: 'dario_pasta',
		recipe: 'sunday-ragu',
		dish: 'Ragù',
		daysAgo: 6,
		servings: 6,
		caption: 'Three hours, one wooden spoon.',
		note: null,
		audience: 'friends'
	},
	{
		cook: 'theo_vegan',
		recipe: 'three-bean-vegan-chili',
		dish: 'Three-bean chili',
		daysAgo: 12,
		servings: 6,
		caption: 'Batch for the week.',
		note: null,
		audience: 'friends'
	},
	{
		cook: 'wren_preserves',
		recipe: 'strawberry-jam',
		dish: 'Strawberry jam',
		daysAgo: 160,
		servings: null,
		caption: 'Six jars from the pick-your-own.',
		note: 'Set test on a frozen saucer, every time.',
		audience: 'friends'
	},
	{
		cook: 'jamie_grills',
		recipe: 'grilled-corn-chili-lime-butter',
		dish: 'Block party corn',
		daysAgo: 5,
		servings: 12,
		caption: 'Corn for the whole street.',
		note: null,
		audience: 'friends'
	}
];

export const REPORTS: VariedReport[] = [
	{
		by: 'hannah_k',
		target: 'recipe',
		recipe: 'grilled-corn-chili-lime-butter',
		reason: 'The method reads word for word like a magazine page I have.',
		daysAgo: 4
	},
	{
		by: 'ben_and_flour',
		target: 'recipe',
		recipe: 'grilled-corn-chili-lime-butter',
		reason: 'Copied text, I think. Same wording as a cookbook on my shelf.',
		daysAgo: 4
	},
	{
		by: 'sam_weeknights',
		target: 'log_entry',
		entryOf: 'jamie_grills',
		dish: 'Block party corn',
		reason: 'The caption names my neighbour’s address. Please take it down.',
		daysAgo: 3
	},
	{
		by: 'nate_smokes',
		target: 'user',
		cook: 'jamie_grills',
		reason: 'Posting other people’s recipes as their own.',
		daysAgo: 3
	},
	{
		by: 'olga_pierogi',
		target: 'user',
		cook: 'nate_smokes',
		reason: 'Keeps sending requests after I declined.',
		daysAgo: 61
	},
	{
		by: null,
		target: 'link',
		path: { recipe: 'grilled-corn-chili-lime-butter' },
		contact: 'reader@example.org',
		reason: 'This is my recipe from my blog, copied without credit.',
		daysAgo: 5
	},
	{
		by: 'freya_garden',
		target: 'link',
		path: '/users/jamie_grills',
		contact: 'freya_garden@example.com',
		reason: 'Profile seems to exist only to repost other people’s work.',
		daysAgo: 2
	}
];
