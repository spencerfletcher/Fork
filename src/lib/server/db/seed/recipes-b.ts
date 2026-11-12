// Varied seed recipes, part B: dumplings and their fork, Sichuan, Japanese,
// Ukrainian, Polish, Indian, Swedish, Portuguese, Mexican, Ghanaian, Greek,
// Korean, Levantine and Puerto Rican home cooking. Changes edit steps in place,
// since diffs match steps by position.
import { content, type VariedRecipe } from './types.js';

/** `text` with each `from` replaced by its `to`; throws when `from` is missing, so a change cannot quietly do nothing. */
function swap(text: string, ...pairs: [from: string, to: string][]): string {
	return pairs.reduce((out, [from, to]) => {
		if (!out.includes(from)) throw new Error(`swap: "${from}" not found`);
		return out.replace(from, to);
	}, text);
}

// ─── Pork and chive dumplings, and the napa cabbage fork ─────────────────────

const PORK_INGREDIENTS = `# Dough
300 g plain flour
½ tsp salt
160 ml cold water

# Filling
400 g minced pork, not too lean
150 g garlic chives, finely chopped
2 tbsp light soy sauce
1 tbsp Shaoxing wine
1 tsp grated ginger
½ tsp ground white pepper
½ tsp salt
60 ml water
1 tbsp sesame oil

# To cook
3 tbsp Chinese black vinegar
1 tbsp light soy sauce
1 tsp chilli oil`;

const PORK_STEPS = `# Dough
Mix the flour and salt in a bowl, then pour in the water a little at a time, stirring with chopsticks until it comes together in shaggy lumps. Knead for 5 minutes until smooth. Cover and rest for 30 minutes.

# Filling
Put the pork in a bowl with the soy sauce, wine, ginger, pepper and salt. Stir hard in one direction, adding the water a spoonful at a time, until the meat turns sticky and has taken up all the water.

Fold in the chives and sesame oil without overworking them.
tip: Add the chives last; the salt in the meat draws water out of them if they sit.

# To cook
Roll the dough into a long log and cut it into 40 pieces. Flatten each piece and roll it into an 8 cm round, thinner at the edge than the middle. Put a heaped teaspoon of filling in the centre, fold the round in half and pleat it closed. Keep the shaped dumplings on a floured tray under a cloth.

Bring a large pot of water to a rolling boil. Drop in about 15 dumplings and stir once so none stick. Each time the water returns to the boil, add a splash of cold water; after the third time the dumplings float and the filling is cooked, about 8 minutes in all. Lift out and repeat with the rest.

Stir the vinegar, soy sauce and chilli oil together and serve with the hot dumplings.`;

const PORK_INGREDIENTS_V2 = swap(PORK_INGREDIENTS, ['60 ml water', '90 ml water']);

const PORK_INGREDIENTS_V3 = swap(PORK_INGREDIENTS_V2, [
	'1 tbsp Shaoxing wine',
	'1 tbsp Shaoxing wine\n1 tbsp oyster sauce'
]);
const PORK_STEPS_V3 = swap(PORK_STEPS, [
	'with the soy sauce, wine, ginger',
	'with the soy sauce, wine, oyster sauce, ginger'
]);

const NAPA_INGREDIENTS = swap(
	PORK_INGREDIENTS_V2,
	['150 g garlic chives, finely chopped', '75 g garlic chives, finely chopped'],
	[
		'400 g minced pork, not too lean',
		'400 g minced pork, not too lean\n300 g napa cabbage, finely chopped\n1 tsp salt, for the cabbage'
	]
);
const NAPA_STEPS = swap(
	PORK_STEPS,
	[
		'Put the pork in a bowl',
		'Toss the cabbage with its salt and leave it for 15 minutes, then squeeze it hard in a cloth until no more water runs out. Put the pork in a bowl'
	],
	['Fold in the chives and sesame oil', 'Fold in the squeezed cabbage, chives and sesame oil']
);

const NAPA_INGREDIENTS_FRIED = swap(NAPA_INGREDIENTS, [
	'# To cook\n',
	'# To cook\n3 tbsp neutral oil\n'
]);
const NAPA_STEPS_FRIED = swap(NAPA_STEPS, [
	`Bring a large pot of water to a rolling boil. Drop in about 15 dumplings and stir once so none stick. Each time the water returns to the boil, add a splash of cold water; after the third time the dumplings float and the filling is cooked, about 8 minutes in all. Lift out and repeat with the rest.`,
	`Heat 1 tbsp of the oil in a large non-stick frying pan with a lid over medium-high heat. Set in about 13 dumplings, flat side down, and fry for 2 minutes until the bases are golden. Pour in 80 ml water and cover at once. Steam for 8 minutes, then uncover and fry until the water is gone and the bases crackle, about 2 minutes. Repeat with the rest.`
]);

// ─── Kanelbullar ─────────────────────────────────────────────────────────────

const BULLAR_INGREDIENTS = `# Dough
75 g butter
2,5 dl whole milk
25 g fresh yeast
0,5 dl caster sugar
¼ tsp salt
1,5 tsp ground cardamom
about 7 dl plain flour

# Filling
100 g soft butter
½ dl caster sugar
1½ tbsp ground cinnamon

# To finish
1 egg, beaten
pearl sugar, for sprinkling`;

const BULLAR_STEPS = `# Dough
Melt the butter, pour in the milk and warm it to 37°C, finger-warm. Crumble the yeast into a large bowl, stir in a little of the warm milk until it dissolves, then add the rest with the sugar, salt and cardamom.

Work in most of the flour, then knead for 10 minutes until smooth, elastic and only slightly tacky, adding the last of the flour only if it sticks to your hands.

Cover the bowl and let the dough rise for 45 minutes, until doubled.

# Filling
Beat the butter, sugar and cinnamon to a smooth paste.

Tip the dough onto a floured worktop and halve it. Roll each half to a 25 × 40 cm rectangle, spread with half the filling and roll up tightly from a long side. Cut each roll into 12 slices and set them in paper cases on two baking trays.

# To finish
Cover with a cloth and let the buns rise for 45 minutes, until puffy.

Heat the oven to 225°C. Brush the buns with beaten egg and sprinkle generously with pearl sugar.

Bake one tray at a time on the middle shelf for 7 to 8 minutes, until golden. Cool on a rack under a cloth so they stay soft.`;

// ─── Dal makhani ─────────────────────────────────────────────────────────────

const MAKHANI_INGREDIENTS = `# Dal
250 g whole black urad dal
50 g dried red kidney beans
1.5 litres water
1½ tsp salt

# Masala
3 tbsp butter
1 tbsp neutral oil
1 tsp cumin seeds
1 onion, finely chopped
1 tbsp ginger-garlic paste
1 green chilli, slit
250 ml tomato purée
1 tsp Kashmiri chilli powder

# To finish
100 ml double cream
1 tbsp kasuri methi, crushed
½ tsp garam masala
¼ tsp sugar
2 tbsp cold butter`;

const MAKHANI_STEPS = `# Dal
Rinse the urad dal and kidney beans together, cover with plenty of cold water and soak overnight.

Drain, then put them in a heavy pot with the 1.5 litres of fresh water and the salt. Boil hard for 10 minutes, which the kidney beans need, then lower the heat and simmer, partly covered, for 2 hours, until a grain of urad crushes easily between your fingers. Top up with hot water whenever it looks thick.

# Masala
Heat the butter and oil in a frying pan and let the cumin seeds crackle. Add the onion and cook for 10 minutes until golden, then the ginger-garlic paste and chilli for a minute more.

Stir in the tomato purée and chilli powder and cook for 10 minutes, until thick and the butter separates at the edges.

Tip the masala into the dal and simmer on the lowest heat for 1 hour, stirring often and pressing some of the dal against the side of the pot, until it turns creamy. Loosen with hot water if it catches.

# To finish
Stir in the cream, the methi rubbed between your palms, the garam masala, sugar and cold butter. Simmer for 5 minutes and taste for salt.`;

const MAKHANI_INGREDIENTS_V2 = swap(MAKHANI_INGREDIENTS, [
	'2 tbsp cold butter',
	'2 tbsp cold butter\na small lump of natural charcoal\n1 tsp ghee'
]);
const MAKHANI_STEPS_V2 = swap(MAKHANI_STEPS, [
	'Simmer for 5 minutes and taste for salt.',
	'Simmer for 5 minutes and taste for salt. Hold the charcoal in a flame until it glows, set it in a small steel bowl on top of the dal, pour the ghee over it and clamp the lid on for 2 minutes to smoke.'
]);
const MAKHANI_STEPS_V3 = swap(MAKHANI_STEPS_V2, [
	'simmer, partly covered, for 2 hours',
	'simmer, partly covered, for 3 hours'
]);

export const RECIPES_B: VariedRecipe[] = [
	{
		key: 'pork-and-chive-dumplings',
		author: 'mei_lin',
		tags: ['Chinese', 'Dumplings', 'Pork'],
		visibility: 'public',
		daysAgo: 360,
		first: content({
			title: 'Pork and Chive Dumplings',
			description:
				'Boiled jiaozi with a hand-rolled wrapper and a juicy pork and garlic chive filling, beaten until it holds its water.',
			makes: 'about 40 dumplings',
			prepTimeMinutes: 60,
			cookTimeMinutes: 25,
			restTimeMinutes: 30,
			ingredientsText: PORK_INGREDIENTS,
			stepsText: PORK_STEPS,
			storage:
				'Freeze shaped, uncooked dumplings on the tray, then bag them; boil from frozen for 2 minutes longer.'
		}),
		changes: [
			{
				ingredientsText: PORK_INGREDIENTS_V2,
				message: 'Beat 90 ml water into the filling instead of 60 so it stays juicy after boiling',
				daysAgo: 300
			},
			{
				ingredientsText: PORK_INGREDIENTS_V3,
				stepsText: PORK_STEPS_V3,
				message: 'A spoon of oyster sauce in the filling for a rounder, savoury depth',
				daysAgo: 240
			},
			{
				ingredientsText: swap(PORK_INGREDIENTS_V3, [
					'1 tsp chilli oil',
					'1 tsp chilli oil\n1 clove garlic, grated'
				]),
				stepsText: swap(PORK_STEPS_V3, [
					'Stir the vinegar, soy sauce and chilli oil together',
					'Stir the vinegar, soy sauce, chilli oil and grated garlic together'
				]),
				message: 'Grated raw garlic in the dipping sauce, the way my grandmother served them',
				daysAgo: 150
			}
		]
	},
	{
		key: 'napa-cabbage-dumplings',
		author: 'spencerfletcher',
		tags: ['Chinese', 'Dumplings', 'Pork'],
		visibility: 'friends',
		daysAgo: 280,
		forkOf: { key: 'pork-and-chive-dumplings', version: 2 },
		changes: [
			{
				title: 'Pork and Napa Cabbage Dumplings',
				description:
					'Mei’s jiaozi with half the chives swapped for salted, squeezed napa cabbage: lighter and sweeter.',
				ingredientsText: NAPA_INGREDIENTS,
				stepsText: NAPA_STEPS,
				prepTimeMinutes: 75,
				message:
					'Napa cabbage for half the chives, salted and squeezed so it does not water the filling',
				daysAgo: 260
			},
			{
				description:
					'Mei’s jiaozi with salted napa cabbage in the filling, pan-fried and steamed potsticker-style for crisp bases.',
				ingredientsText: NAPA_INGREDIENTS_FRIED,
				stepsText: NAPA_STEPS_FRIED,
				cookTimeMinutes: 40,
				message: 'Pan-fry and steam instead of boiling, for golden, crackling bases',
				daysAgo: 200
			}
		]
	},
	{
		key: 'mapo-tofu',
		author: 'mei_lin',
		tags: ['四川菜', 'Spicy', 'Dinner'],
		visibility: 'public',
		daysAgo: 330,
		first: content({
			title: '麻婆豆腐',
			description:
				'Mapo tofu: soft tofu in a red, numbing sauce of chilli bean paste, fermented black beans and crisp minced beef.',
			servings: 3,
			prepTimeMinutes: 15,
			cookTimeMinutes: 15,
			ingredientsText: `500 g soft tofu, cut into 2 cm cubes
150 g minced beef
3 tbsp neutral oil
2 tbsp doubanjiang (Pixian chilli bean paste)
1 tbsp fermented black beans, rinsed
1 tbsp Sichuan chilli flakes
3 cloves garlic, minced
1 tbsp minced ginger
250 ml chicken stock
1 tsp light soy sauce
1 tsp sugar
2 tsp cornflour mixed with 2 tbsp water
1 tsp ground roasted Sichuan peppercorns
2 spring onions, sliced`,
			stepsText: `Bring a pan of salted water to a bare simmer, slip in the tofu and poach for 3 minutes to firm it. Drain gently.

Heat the oil in a wok over high heat and fry the beef, breaking it up, until browned and crisp at the edges, about 4 minutes.

Lower the heat, add the doubanjiang and fry for a minute until the oil turns red. Add the black beans, chilli flakes, garlic and ginger and stir until fragrant.

Pour in the stock with the soy sauce and sugar, slide in the tofu and simmer for 5 minutes. Nudge the tofu with the back of a ladle rather than stirring, so the cubes stay whole.

Stir the cornflour mixture and add it in two or three goes, until the sauce clings to the tofu. Scatter over the Sichuan pepper and spring onions and serve with rice.`
		}),
		changes: [
			{
				ingredientsText: `500 g soft tofu, cut into 2 cm cubes
150 g minced beef
3 tbsp neutral oil
2 tbsp doubanjiang (Pixian chilli bean paste)
1 tbsp fermented black beans, rinsed
1 tbsp Sichuan chilli flakes
3 cloves garlic, minced
1 tbsp minced ginger
250 ml chicken stock
1 tsp light soy sauce
1 tsp sugar
2 tsp cornflour mixed with 2 tbsp water
1½ tsp ground roasted Sichuan peppercorns
2 spring onions, sliced`,
				stepsText: `Bring a pan of salted water to a bare simmer, slip in the tofu and poach for 3 minutes to firm it. Drain gently.

Heat the oil in a wok over high heat and fry the beef, breaking it up, until browned and crisp at the edges, about 4 minutes.

Lower the heat, add the doubanjiang and fry for a minute until the oil turns red. Add the black beans, chilli flakes, garlic, ginger and half the Sichuan pepper and stir until fragrant.

Pour in the stock with the soy sauce and sugar, slide in the tofu and simmer for 5 minutes. Nudge the tofu with the back of a ladle rather than stirring, so the cubes stay whole.

Stir the cornflour mixture and add it in two or three goes, until the sauce clings to the tofu. Scatter over the rest of the Sichuan pepper and the spring onions and serve with rice.`,
				message:
					'More Sichuan pepper (1½ tsp), half fried with the chilli so the numbing runs through the sauce',
				daysAgo: 120
			}
		]
	},
	{
		key: 'miso-soup',
		author: 'yuki_tanaka',
		tags: ['和食', 'Soup'],
		visibility: 'public',
		daysAgo: 310,
		first: content({
			title: '味噌汁',
			description:
				'Everyday miso soup on a dashi of kombu and bonito flakes, with silken tofu, wakame and spring onion.',
			servings: 4,
			prepTimeMinutes: 10,
			cookTimeMinutes: 20,
			restTimeMinutes: 30,
			ingredientsText: `1 litre water
10 g kombu
15 g katsuobushi (bonito flakes)
1 tbsp dried wakame
150 g silken tofu, cut into 1.5 cm cubes
3 tbsp awase miso
2 spring onions, thinly sliced`,
			stepsText: `Put the kombu in a pan with the water and let it soak for 30 minutes.

Set the pan over medium-low heat and bring it slowly to just below a simmer, about 10 minutes. Lift out the kombu before the water boils, or the dashi turns slimy and bitter.

Add the katsuobushi, bring to a boil, then turn off the heat. Let the flakes sink for 2 minutes and strain through a fine sieve.

Cover the wakame with cold water for 5 minutes, then drain.

Return the dashi to a low heat, add the tofu and wakame and warm through for 2 minutes. Turn the heat right down, then dissolve the miso into the pot through a small sieve or ladle. Do not let it boil once the miso is in.

Serve at once, scattered with spring onion.`
		}),
		changes: [
			{
				ingredientsText: `1 litre water
10 g kombu
15 g katsuobushi (bonito flakes)
1 tbsp dried wakame
150 g silken tofu, cut into 1.5 cm cubes
100 g shimeji mushrooms, separated
3 tbsp awase miso
2 spring onions, thinly sliced`,
				stepsText: `Put the kombu in a pan with the water and let it soak for 30 minutes.

Set the pan over medium-low heat and bring it slowly to just below a simmer, about 10 minutes. Lift out the kombu before the water boils, or the dashi turns slimy and bitter.

Add the katsuobushi, bring to a boil, then turn off the heat. Let the flakes sink for 2 minutes and strain through a fine sieve.

Cover the wakame with cold water for 5 minutes, then drain.

Return the dashi to a low heat, add the shimeji and simmer for 3 minutes, then the tofu and wakame for 2 minutes more. Turn the heat right down, then dissolve the miso into the pot through a small sieve or ladle. Do not let it boil once the miso is in.

Serve at once, scattered with spring onion.`,
				message: 'Shimeji mushrooms, simmered in the dashi before the tofu goes in',
				daysAgo: 200
			},
			{
				ingredientsText: `1 litre water
10 g kombu
15 g katsuobushi (bonito flakes)
1 tbsp dried wakame
150 g silken tofu, cut into 1.5 cm cubes
100 g shimeji mushrooms, separated
2½ tbsp awase miso
2 spring onions, thinly sliced`,
				message: '2½ tbsp miso: the mushrooms add their own savour and 3 tbsp tasted salty',
				daysAgo: 45
			}
		]
	},
	{
		key: 'tamagoyaki',
		author: 'yuki_tanaka',
		tags: ['和食', 'Breakfast'],
		visibility: 'friends',
		daysAgo: 150,
		first: content({
			title: 'Tamagoyaki',
			description:
				'Sweet-savoury rolled omelette, cooked in thin layers in a square pan. Good warm or in a bento.',
			servings: 2,
			prepTimeMinutes: 5,
			cookTimeMinutes: 10,
			restTimeMinutes: 5,
			equipment: 'A rectangular tamagoyaki pan and a bamboo sushi mat',
			ingredientsText: `4 eggs
2 tbsp dashi
1 tbsp sugar
1 tsp usukuchi (light) soy sauce
1 tsp mirin
a pinch of salt
neutral oil, for the pan`,
			stepsText: `Beat the eggs gently with chopsticks, cutting through the whites rather than whisking in air. Stir in the dashi, sugar, soy sauce, mirin and salt until the sugar dissolves.

Heat the pan over medium heat and wipe it with a folded paper towel dipped in oil.

Pour in a thin layer of egg. When the edges are set but the top is still wet, roll it up from the far side towards you. Push the roll back to the far end, oil the pan again and pour in another layer, lifting the roll so egg runs underneath. Roll again, and repeat until the egg is used up, four or five layers.

Tip the omelette onto the bamboo mat, roll it up tightly and leave it to rest for 5 minutes to hold its shape. Slice into six.`
		}),
		changes: [
			{
				stepsText: `Beat the eggs gently with chopsticks, cutting through the whites rather than whisking in air. Stir in the dashi, sugar, soy sauce, mirin and salt until the sugar dissolves, then pass it through a sieve so no streaks of white show in the roll.

Heat the pan over medium heat and wipe it with a folded paper towel dipped in oil.

Pour in a thin layer of egg. When the edges are set but the top is still wet, roll it up from the far side towards you. Push the roll back to the far end, oil the pan again and pour in another layer, lifting the roll so egg runs underneath. Roll again, and repeat until the egg is used up, four or five layers.

Tip the omelette onto the bamboo mat, roll it up tightly and leave it to rest for 5 minutes to hold its shape. Slice into six.`,
				message: 'Sieve the beaten egg for an even yellow roll without white streaks',
				daysAgo: 60
			}
		]
	},
	{
		key: 'borshch',
		author: 'olga_pierogi',
		tags: ['Українська кухня', 'Soup'],
		visibility: 'public',
		daysAgo: 390,
		first: content({
			title: 'Борщ',
			description:
				'Ukrainian red borshch on a beef broth, the beetroot braised separately with vinegar so the soup stays ruby. Serve with smetana and dill.',
			servings: 8,
			prepTimeMinutes: 30,
			cookTimeMinutes: 160,
			restTimeMinutes: 20,
			ingredientsText: `1 kg beef shin on the bone
3 litres water
2 onions, 1 halved and 1 finely chopped
2 bay leaves
6 black peppercorns
3 medium beetroot (about 500 g), cut into matchsticks
1 tbsp white wine vinegar
2 tbsp sunflower oil
1 carrot, grated
2 tbsp tomato paste
4 potatoes, diced
400 g white cabbage, shredded
3 cloves garlic
1 tsp sugar
salt to taste
smetana or sour cream, to serve
a handful of dill, chopped`,
			stepsText: `Put the beef in a large pot with the water, bring to a boil and skim off the grey foam. Add the halved onion, bay leaves and peppercorns, then simmer gently, partly covered, for 2 hours, until the meat falls from the bone.

Lift out the beef and strain the broth back into the pot. Shred the meat and discard the bones.

While the broth simmers, fry the chopped onion and carrot in the oil for 5 minutes. Add the beetroot, vinegar, tomato paste and a ladle of broth, then cover and braise for 15 minutes, until the beetroot is tender but still bright.

Bring the broth back to a boil, add the potatoes and cook for 10 minutes, then the cabbage for 5 minutes more.

Stir in the beetroot and the meat and simmer for 5 minutes. Crush the garlic with a pinch of salt, stir it in with the sugar and season to taste.

Turn off the heat, cover and let it stand for 20 minutes so the flavours settle. Serve with a spoon of smetana and plenty of dill.`
		}),
		changes: [
			{
				ingredientsText: `1 kg beef shin on the bone
3 litres water
2 onions, 1 halved and 1 finely chopped
2 bay leaves
6 black peppercorns
3 medium beetroot (about 500 g), cut into matchsticks
1 tbsp white wine vinegar
2 tbsp sunflower oil
1 carrot, grated
2 tbsp tomato paste
4 potatoes, diced
400 g white cabbage, shredded
400 g can white beans, drained
3 cloves garlic
1 tsp sugar
salt to taste
smetana or sour cream, to serve
a handful of dill, chopped`,
				stepsText: `Put the beef in a large pot with the water, bring to a boil and skim off the grey foam. Add the halved onion, bay leaves and peppercorns, then simmer gently, partly covered, for 2 hours, until the meat falls from the bone.

Lift out the beef and strain the broth back into the pot. Shred the meat and discard the bones.

While the broth simmers, fry the chopped onion and carrot in the oil for 5 minutes. Add the beetroot, vinegar, tomato paste and a ladle of broth, then cover and braise for 15 minutes, until the beetroot is tender but still bright.

Bring the broth back to a boil, add the potatoes and cook for 10 minutes, then the cabbage and beans for 5 minutes more.

Stir in the beetroot and the meat and simmer for 5 minutes. Crush the garlic with a pinch of salt, stir it in with the sugar and season to taste.

Turn off the heat, cover and let it stand for 20 minutes so the flavours settle. Serve with a spoon of smetana and plenty of dill.`,
				message: 'White beans with the cabbage, as my mother made it in winter',
				daysAgo: 100
			}
		]
	},
	{
		key: 'pierogi-ruskie',
		author: 'olga_pierogi',
		tags: ['Polish', 'Dumplings', 'Vegetarian'],
		visibility: 'public',
		daysAgo: 270,
		first: content({
			title: 'Pierogi ruskie',
			description:
				'Potato, twaróg and fried onion pierogi in a soft dough, boiled and finished with butter-fried onions.',
			makes: 'about 40 pierogi',
			prepTimeMinutes: 90,
			cookTimeMinutes: 50,
			restTimeMinutes: 30,
			ingredientsText: `# Dough
500 g plain flour
1 tsp salt
1 egg
2 tbsp sunflower oil
250 ml warm water

# Filling
700 g floury potatoes, peeled
250 g twaróg (dry curd cheese)
2 onions, finely chopped
2 tbsp butter
1 tsp salt
½ tsp ground black pepper

# To serve
1 onion, sliced
50 g butter
sour cream`,
			stepsText: `# Filling
Boil the potatoes in salted water until tender, about 20 minutes. Drain well, mash and leave to cool.

Fry the chopped onions in the butter over medium-low heat until soft and golden, about 15 minutes. Mix them into the potatoes with the crumbled twaróg, salt and pepper, and taste: the filling should be well seasoned.

# Dough
Mix the flour and salt, add the egg, oil and warm water and knead for 8 minutes into a soft, smooth dough. Cover and rest for 30 minutes.

Roll half the dough out to 2 mm on a floured worktop and cut 7 cm rounds. Put a heaped teaspoon of filling on each, fold in half and pinch the edges firmly shut. Repeat with the rest, rerolling the scraps once.

# To serve
Boil the pierogi in batches of 10 to 12 in a large pot of salted water. Once they float, cook for 2 minutes more and lift out with a slotted spoon.

Fry the sliced onion in the butter until golden, about 10 minutes, and spoon it over the pierogi. Serve with sour cream.`
		}),
		changes: [
			{
				ingredientsText: `# Dough
500 g plain flour
1 tsp salt
1 egg
2 tbsp sunflower oil
250 ml warm water

# Filling
700 g floury potatoes, peeled
300 g twaróg (dry curd cheese)
2 onions, finely chopped
2 tbsp butter
1 tsp salt
½ tsp ground black pepper

# To serve
1 onion, sliced
50 g butter
sour cream`,
				message: 'More twaróg (300 g) for a tangier filling that holds together when bitten',
				daysAgo: 180
			},
			{
				restTimeMinutes: 60,
				stepsText: `# Filling
Boil the potatoes in salted water until tender, about 20 minutes. Drain well, mash and leave to cool.

Fry the chopped onions in the butter over medium-low heat until soft and golden, about 15 minutes. Mix them into the potatoes with the crumbled twaróg, salt and pepper, and taste: the filling should be well seasoned.

# Dough
Mix the flour and salt, add the egg, oil and warm water and knead for 8 minutes into a soft, smooth dough. Wrap and rest for 1 hour.

Roll half the dough out to 2 mm on a floured worktop and cut 7 cm rounds. Put a heaped teaspoon of filling on each, fold in half and pinch the edges firmly shut. Repeat with the rest, rerolling the scraps once.

# To serve
Boil the pierogi in batches of 10 to 12 in a large pot of salted water. Once they float, cook for 2 minutes more and lift out with a slotted spoon.

Fry the sliced onion in the butter until golden, about 10 minutes, and spoon it over the pierogi. Serve with sour cream.`,
				message: 'Rest the dough a full hour: it rolls to 2 mm without shrinking back',
				daysAgo: 40
			}
		]
	},
	{
		key: 'chickpea-spinach-curry',
		author: 'zainab_spice',
		tags: ['Indian', 'Vegan', 'Weeknight'],
		visibility: 'public',
		daysAgo: 300,
		first: content({
			title: 'Chickpea and Spinach Curry',
			description:
				'A weeknight chana saag from tins: onion and tomato masala, chickpeas and a lot of spinach.',
			servings: 4,
			prepTimeMinutes: 10,
			cookTimeMinutes: 40,
			ingredientsText: `2 tbsp neutral oil
1 tsp cumin seeds
1 large onion, finely chopped
4 cloves garlic, grated
20 g fresh ginger, grated
1 green chilli, slit
1 tsp ground turmeric
2 tsp ground coriander
1 tsp ground cumin
1 tsp Kashmiri chilli powder
400 g can chopped tomatoes
2 × 400 g cans chickpeas, drained
200 ml water
200 g baby spinach
1 tsp garam masala
juice of ½ lemon
salt to taste`,
			stepsText: `Heat the oil in a wide pan over medium heat and let the cumin seeds sizzle for a few seconds. Add the onion and cook for 10 minutes, until golden.

Add the garlic, ginger and chilli and cook for a minute. Stir in the ground spices with a splash of water so they do not scorch, and cook for a minute more.

Add the tomatoes and cook for 8 minutes, until thick and the oil shows at the edges.

Tip in the chickpeas and water and simmer for 15 minutes.

Stir in the spinach a handful at a time until it wilts, about 2 minutes. Finish with the garam masala, lemon juice and salt to taste.`
		}),
		changes: [
			{
				cookTimeMinutes: 45,
				stepsText: `Heat the oil in a wide pan over medium heat and let the cumin seeds sizzle for a few seconds. Add the onion and cook for 10 minutes, until golden.

Add the garlic, ginger and chilli and cook for a minute. Stir in the ground spices with a splash of water so they do not scorch, and cook for a minute more.

Add the tomatoes and cook for 8 minutes, until thick and the oil shows at the edges.

Tip in the chickpeas and water and simmer for 20 minutes, mashing a ladleful of chickpeas against the pan so the sauce thickens.

Stir in the spinach a handful at a time until it wilts, about 2 minutes. Finish with the garam masala, lemon juice and salt to taste.`,
				message:
					'Simmer 20 minutes and mash some chickpeas, so the sauce thickens instead of staying thin',
				daysAgo: 250
			},
			{
				ingredientsText: `2 tbsp neutral oil
1 tsp cumin seeds
a pinch of asafoetida
1 large onion, finely chopped
4 cloves garlic, grated
20 g fresh ginger, grated
1 green chilli, slit
1 tsp ground turmeric
2 tsp ground coriander
1 tsp ground cumin
1 tsp Kashmiri chilli powder
400 g can chopped tomatoes
2 × 400 g cans chickpeas, drained
200 ml water
200 g baby spinach
1 tsp garam masala
juice of ½ lemon
salt to taste`,
				stepsText: `Heat the oil in a wide pan over medium heat and let the cumin seeds and asafoetida sizzle for a few seconds. Add the onion and cook for 10 minutes, until golden.

Add the garlic, ginger and chilli and cook for a minute. Stir in the ground spices with a splash of water so they do not scorch, and cook for a minute more.

Add the tomatoes and cook for 8 minutes, until thick and the oil shows at the edges.

Tip in the chickpeas and water and simmer for 20 minutes, mashing a ladleful of chickpeas against the pan so the sauce thickens.

Stir in the spinach a handful at a time until it wilts, about 2 minutes. Finish with the garam masala, lemon juice and salt to taste.`,
				message:
					'A pinch of asafoetida with the cumin seeds, for the savoury depth onion alone does not give',
				daysAgo: 90
			}
		]
	},
	{
		key: 'coconut-chickpea-curry',
		author: 'arjun_cooks',
		tags: ['Indian', 'Vegan', 'Weeknight'],
		visibility: 'public',
		daysAgo: 230,
		forkOf: { key: 'chickpea-spinach-curry', version: 2 },
		changes: [
			{
				title: 'Coconut Chickpea and Spinach Curry',
				description:
					'Zainab’s chana saag simmered in coconut milk instead of water: richer, rounder and a little sweet.',
				ingredientsText: `2 tbsp neutral oil
1 tsp cumin seeds
1 large onion, finely chopped
4 cloves garlic, grated
20 g fresh ginger, grated
1 green chilli, slit
1 tsp ground turmeric
2 tsp ground coriander
1 tsp ground cumin
1 tsp Kashmiri chilli powder
400 g can chopped tomatoes
2 × 400 g cans chickpeas, drained
400 ml can coconut milk
200 g baby spinach
1 tsp garam masala
juice of ½ lemon
salt to taste`,
				stepsText: `Heat the oil in a wide pan over medium heat and let the cumin seeds sizzle for a few seconds. Add the onion and cook for 10 minutes, until golden.

Add the garlic, ginger and chilli and cook for a minute. Stir in the ground spices with a splash of water so they do not scorch, and cook for a minute more.

Add the tomatoes and cook for 8 minutes, until thick and the oil shows at the edges.

Tip in the chickpeas and coconut milk and simmer gently for 20 minutes, mashing a ladleful of chickpeas against the pan; keep it below a boil so the coconut milk does not split.

Stir in the spinach a handful at a time until it wilts, about 2 minutes. Finish with the garam masala, lemon juice and salt to taste.`,
				message: 'A can of coconut milk instead of the water, simmered gently so it does not split',
				daysAgo: 210
			}
		]
	},
	{
		key: 'chicken-biryani',
		author: 'zainab_spice',
		tags: ['Indian', 'Rice', 'Chicken'],
		visibility: 'friends',
		daysAgo: 280,
		first: content({
			title: 'Chicken Biryani',
			description:
				'Overnight-marinated chicken under par-boiled basmati, deep-brown onions, mint and saffron milk, sealed and cooked on dum.',
			servings: 6,
			prepTimeMinutes: 45,
			cookTimeMinutes: 70,
			restTimeMinutes: 510,
			ingredientsText: `# Marinade
1.2 kg bone-in chicken thighs, skinned and halved
250 g plain yogurt
2 tbsp ginger-garlic paste
2 tsp Kashmiri chilli powder
1 tsp ground turmeric
2 tsp garam masala
1 tsp salt
juice of 1 lemon

# Rice
500 g basmati rice
3 litres water
2 tbsp salt
4 green cardamom pods
4 cloves
1 bay leaf
1 cinnamon stick

# Layering
4 onions, thinly sliced
100 ml neutral oil
3 tbsp ghee
a pinch of saffron, soaked in 4 tbsp warm milk
a handful of mint leaves
a handful of coriander leaves`,
			stepsText: `# Marinade
Mix the chicken with everything else in the marinade, cover and refrigerate overnight.

# Rice
Rinse the rice until the water runs clear, then cover with fresh water and soak for 30 minutes.

Bring the 3 litres of water to a boil with the salt and whole spices. Drain the rice, add it and boil for 5 minutes, until a grain breaks with a firm white core. Drain at once.

# Layering
While the rice soaks, fry the onions in the oil over medium heat, stirring more often as they darken, until deep brown, about 20 minutes. Lift them onto paper and keep 3 tbsp of the oil.

Spread the chicken and its marinade in a heavy pot with half the onions and the reserved oil. Cook over medium heat, uncovered and stirring, for 15 minutes, until the chicken is opaque and the sauce has thickened.

Spread the rice over the chicken. Scatter with the mint, coriander and remaining onions, then drizzle over the saffron milk and ghee. Seal the pot with foil and the lid and cook on the lowest heat for 25 minutes.

Leave it off the heat for 10 minutes before opening. Serve by digging down to the bottom, so every plate gets rice and chicken.`
		}),
		changes: [
			{
				cookTimeMinutes: 75,
				stepsText: `# Marinade
Mix the chicken with everything else in the marinade, cover and refrigerate overnight.

# Rice
Rinse the rice until the water runs clear, then cover with fresh water and soak for 30 minutes.

Bring the 3 litres of water to a boil with the salt and whole spices. Drain the rice, add it and boil for 5 minutes, until a grain breaks with a firm white core. Drain at once.

# Layering
While the rice soaks, fry the onions in the oil over medium heat, stirring more often as they darken, until deep brown, about 20 minutes. Lift them onto paper and keep 3 tbsp of the oil.

Spread the chicken and its marinade in a heavy pot with half the onions and the reserved oil. Cook over medium heat, uncovered and stirring, for 15 minutes, until the chicken is opaque and the sauce has thickened.

Spread the rice over the chicken and sprinkle with 3 tbsp of hot water. Scatter with the mint, coriander and remaining onions, then drizzle over the saffron milk and ghee. Seal the pot with foil and the lid and cook on the lowest heat for 30 minutes.

Leave it off the heat for 10 minutes before opening. Serve by digging down to the bottom, so every plate gets rice and chicken.`,
				message:
					'Dum 30 minutes with a splash of water over the rice: the top grains were still firm at 25',
				daysAgo: 110
			}
		]
	},
	{
		key: 'kanelbullar',
		author: 'oskar_nord',
		tags: ['Nordic', 'Baking', 'Fika'],
		visibility: 'public',
		daysAgo: 350,
		first: content({
			title: 'Kanelbullar',
			description:
				'Swedish cardamom dough rolled around cinnamon butter, topped with pearl sugar. For fika.',
			makes: '24 buns',
			prepTimeMinutes: 40,
			cookTimeMinutes: 16,
			restTimeMinutes: 90,
			ingredientsText: BULLAR_INGREDIENTS,
			stepsText: BULLAR_STEPS,
			storage: 'Freeze the cooled buns in a bag; warm from frozen for 5 minutes in a low oven.'
		}),
		changes: [
			{
				ingredientsText: swap(BULLAR_INGREDIENTS, [
					'1,5 tsp ground cardamom',
					'2 tsp ground cardamom'
				]),
				message: 'More cardamom (2 tsp): at 1,5 it disappeared behind the cinnamon',
				daysAgo: 300
			},
			{
				restTimeMinutes: 105,
				stepsText: swap(BULLAR_STEPS, [
					'let the dough rise for 45 minutes, until doubled',
					'let the dough rise for 1 hour, until doubled'
				]),
				message:
					'First rise 1 hour: my kitchen is cool in winter and 45 minutes was not enough to double',
				daysAgo: 30
			}
		]
	},
	{
		key: 'gravlax',
		author: 'oskar_nord',
		tags: ['Nordic', 'Fish', 'Make ahead'],
		visibility: 'public',
		daysAgo: 240,
		first: content({
			title: 'Gravlax with Mustard Sauce',
			description:
				'Salmon cured for two days under salt, sugar, white pepper and dill, with a sweet dill and mustard sauce.',
			servings: 8,
			prepTimeMinutes: 30,
			restTimeMinutes: 2880,
			ingredientsText: `# Gravlax
1 kg very fresh salmon fillet, skin on and pin-boned (frozen and thawed if not sushi grade)
50 g coarse sea salt
50 g caster sugar
1 tbsp white peppercorns, crushed
1 large bunch dill, chopped stalks and all

# Mustard sauce
3 tbsp Swedish mustard
1 tbsp caster sugar
1 tbsp white wine vinegar
100 ml rapeseed oil
3 tbsp chopped dill`,
			stepsText: `# Gravlax
Cut the fillet across into two equal pieces. Mix the salt, sugar and pepper.

Lay one piece skin side down in a dish that just fits it. Cover with the cure and the dill, then lay the other piece on top, flesh to flesh.

Wrap tightly in clingfilm, put a board and a couple of cans on top and refrigerate for 48 hours, turning the parcel and spooning the brine over it every 12 hours.

Scrape off the cure and dill and pat the salmon dry. Slice thinly on the diagonal, away from the skin.

# Mustard sauce
Whisk the mustard, sugar and vinegar, then whisk in the oil in a thin stream until thick. Stir in the dill and serve with the salmon.`
		}),
		changes: [
			{
				ingredientsText: `# Gravlax
1 kg very fresh salmon fillet, skin on and pin-boned (frozen and thawed if not sushi grade)
50 g coarse sea salt
50 g caster sugar
1 tbsp white peppercorns, crushed
2 tbsp aquavit
1 large bunch dill, chopped stalks and all

# Mustard sauce
3 tbsp Swedish mustard
1 tbsp caster sugar
1 tbsp white wine vinegar
100 ml rapeseed oil
3 tbsp chopped dill`,
				stepsText: `# Gravlax
Cut the fillet across into two equal pieces. Mix the salt, sugar and pepper.

Lay one piece skin side down in a dish that just fits it. Sprinkle the flesh with the aquavit, cover with the cure and the dill, then lay the other piece on top, flesh to flesh.

Wrap tightly in clingfilm, put a board and a couple of cans on top and refrigerate for 48 hours, turning the parcel and spooning the brine over it every 12 hours.

Scrape off the cure and dill and pat the salmon dry. Slice thinly on the diagonal, away from the skin.

# Mustard sauce
Whisk the mustard, sugar and vinegar, then whisk in the oil in a thin stream until thick. Stir in the dill and serve with the salmon.`,
				message:
					'A splash of aquavit on the flesh before the cure, for a caraway note under the dill',
				daysAgo: 25
			}
		]
	},
	{
		key: 'bacalhau-a-bras',
		author: 'ines_lisboa',
		tags: ['Portuguese', 'Fish', 'Eggs'],
		visibility: 'public',
		daysAgo: 260,
		first: content({
			title: 'Bacalhau à Brás',
			description:
				'Lisbon’s salt cod scramble: shredded bacalhau, fried matchstick potatoes and soft onions bound with barely set egg.',
			servings: 4,
			prepTimeMinutes: 30,
			cookTimeMinutes: 30,
			restTimeMinutes: 2880,
			ingredientsText: `400 g thick salt cod
600 g waxy potatoes
sunflower oil, for frying
4 tbsp olive oil
2 onions, thinly sliced
2 cloves garlic, sliced
1 bay leaf
6 eggs
black pepper
2 tbsp chopped parsley
12 black olives`,
			stepsText: `Rinse the cod, then soak it in a large bowl of cold water in the fridge for 24–48 hours, depending on thickness, changing the water every 8 hours. Taste a flake: it should be pleasantly salty, not harsh.

Skin and bone the cod and shred it into fine flakes with your fingers.

Cut the potatoes into fine matchsticks, rinse and dry them well. Fry in batches in hot sunflower oil until golden, 3 to 4 minutes, and drain on paper.

Warm the olive oil in a wide pan and cook the onions, garlic and bay leaf over medium-low heat until soft and golden, about 15 minutes. Add the cod and cook for 5 minutes, stirring.

Fold in the potatoes. Beat the eggs with plenty of pepper, pour them in and stir over low heat until just creamy, about 2 minutes. Scatter with parsley and olives and serve straight away.`
		}),
		changes: [
			{
				stepsText: `Rinse the cod, then soak it in a large bowl of cold water in the fridge for 24–48 hours, depending on thickness, changing the water every 8 hours. Taste a flake: it should be pleasantly salty, not harsh.

Skin and bone the cod and shred it into fine flakes with your fingers.

Cut the potatoes into fine matchsticks, rinse and dry them well. Fry in batches in hot sunflower oil until golden, 3 to 4 minutes, and drain on paper.

Warm the olive oil in a wide pan and cook the onions, garlic and bay leaf over medium-low heat until soft and golden, about 15 minutes. Add the cod and cook for 5 minutes, stirring.

Fold in the potatoes. Beat the eggs with plenty of pepper, take the pan off the heat and stir them in; they set in the pan’s warmth and stay creamy. Scatter with parsley and olives and serve straight away.`,
				message: 'Stir the eggs in off the heat so they set creamy instead of dry',
				daysAgo: 80
			}
		]
	},
	{
		key: 'caldo-verde',
		author: 'ines_lisboa',
		tags: ['Portuguese', 'Soup'],
		visibility: 'private',
		daysAgo: 120,
		first: content({
			title: 'Caldo Verde',
			description:
				'Potato soup blended smooth, with ribbons of shredded greens and a slice of chouriço in every bowl.',
			servings: 6,
			prepTimeMinutes: 15,
			cookTimeMinutes: 35,
			ingredientsText: `3 tbsp olive oil, plus more to finish
1 onion, chopped
2 cloves garlic, chopped
800 g floury potatoes, peeled and cut into chunks
1.5 litres water
1 tsp salt
250 g couve galega or kale, stalks removed
150 g chouriço, sliced`,
			stepsText: `Warm the oil in a large pot and soften the onion and garlic for 5 minutes without colouring.

Add the potatoes, water and salt and simmer for 20 minutes, until the potatoes fall apart. Blend until smooth.

Roll the greens up tightly and slice them as thinly as you can, into fine ribbons.

Brown the chouriço in a dry pan for 3 minutes.

Bring the soup back to a simmer, add the greens and cook uncovered for 5 minutes, until bright and just tender. Serve with a few slices of chouriço and a thread of olive oil on each bowl.`
		})
	},
	{
		key: 'tacos-al-pastor',
		author: 'rafael_tacos',
		tags: ['Mexican', 'Pork', 'Tacos'],
		visibility: 'public',
		daysAgo: 340,
		first: content({
			title: 'Tacos al Pastor',
			description:
				'Pork shoulder marinated overnight in guajillo, ancho and achiote, charred hot in a skillet and served with grilled pineapple.',
			makes: '16 tacos',
			prepTimeMinutes: 30,
			cookTimeMinutes: 30,
			restTimeMinutes: 480,
			ingredientsText: `# Marinade
4 guajillo chiles, stemmed and seeded
2 ancho chiles, stemmed and seeded
½ cup pineapple juice or orange juice
¼ cup white vinegar
3 cloves garlic
3 tbsp achiote paste
½ tsp ground cumin
1 tsp dried Mexican oregano
1½ tsp salt
2 lb boneless pork shoulder, sliced ¼ inch thick

# To serve
4 fresh pineapple rings, ½ inch thick
16 small corn tortillas
1 white onion, finely chopped
a handful of cilantro, chopped
2 limes, cut into wedges
salsa verde`,
			stepsText: `# Marinade
Toast the chiles in a dry skillet over medium heat until they smell fragrant, a few seconds a side. Cover with hot water and leave for 15 minutes to soften, then drain.

Blend the chiles with the juice, vinegar, garlic, achiote, cumin, oregano and salt to a smooth paste.

Coat the pork slices in the paste, stack them in a container, cover and refrigerate overnight.

# To serve
Heat a cast-iron skillet or grill pan until very hot. Grill the pineapple for 3 minutes a side, until charred, then chop it.

Cook the pork in batches in a single layer, 2 to 3 minutes a side, until charred at the edges. Let it sit for a few minutes, then chop finely.

Warm the tortillas and fill each with pork, pineapple, onion and cilantro. Serve with lime wedges and salsa verde.`
		}),
		changes: [
			{
				ingredientsText: `# Marinade
4 guajillo chiles, stemmed and seeded
2 ancho chiles, stemmed and seeded
1 chipotle chile in adobo
½ cup pineapple juice or orange juice
¼ cup white vinegar
3 cloves garlic
3 tbsp achiote paste
½ tsp ground cumin
1 tsp dried Mexican oregano
1½ tsp salt
2 lb boneless pork shoulder, sliced ¼ inch thick

# To serve
4 fresh pineapple rings, ½ inch thick
16 small corn tortillas
1 white onion, finely chopped
a handful of cilantro, chopped
2 limes, cut into wedges
salsa verde`,
				stepsText: `# Marinade
Toast the chiles in a dry skillet over medium heat until they smell fragrant, a few seconds a side. Cover with hot water and leave for 15 minutes to soften, then drain.

Blend the chiles with the chipotle, juice, vinegar, garlic, achiote, cumin, oregano and salt to a smooth paste.

Coat the pork slices in the paste, stack them in a container, cover and refrigerate overnight.

# To serve
Heat a cast-iron skillet or grill pan until very hot. Grill the pineapple for 3 minutes a side, until charred, then chop it.

Cook the pork in batches in a single layer, 2 to 3 minutes a side, until charred at the edges. Let it sit for a few minutes, then chop finely.

Warm the tortillas and fill each with pork, pineapple, onion and cilantro. Serve with lime wedges and salsa verde.`,
				message: 'A chipotle in the marinade for the smoke a skillet cannot give',
				daysAgo: 220
			},
			{
				prepTimeMinutes: 60,
				ingredientsText: `# Marinade
4 guajillo chiles, stemmed and seeded
2 ancho chiles, stemmed and seeded
1 chipotle chile in adobo
½ cup pineapple juice or orange juice
¼ cup white vinegar
3 cloves garlic
3 tbsp achiote paste
½ tsp ground cumin
1 tsp dried Mexican oregano
1½ tsp salt
2 lb boneless pork shoulder, sliced ⅛ inch thick

# To serve
4 fresh pineapple rings, ½ inch thick
16 small corn tortillas
1 white onion, finely chopped
a handful of cilantro, chopped
2 limes, cut into wedges
salsa verde`,
				stepsText: `# Marinade
Toast the chiles in a dry skillet over medium heat until they smell fragrant, a few seconds a side. Cover with hot water and leave for 15 minutes to soften, then drain.

Blend the chiles with the chipotle, juice, vinegar, garlic, achiote, cumin, oregano and salt to a smooth paste.

Firm the pork in the freezer for 30 minutes so it slices cleanly, then slice it ⅛ inch thick. Coat the slices in the paste, stack them in a container, cover and refrigerate overnight.

# To serve
Heat a cast-iron skillet or grill pan until very hot. Grill the pineapple for 3 minutes a side, until charred, then chop it.

Cook the pork in batches in a single layer, 1 to 2 minutes a side, until charred at the edges. Let it sit for a few minutes, then chop finely.

Warm the tortillas and fill each with pork, pineapple, onion and cilantro. Serve with lime wedges and salsa verde.`,
				message: 'Slice the pork ⅛ inch from half-frozen, so it chars before it dries out',
				daysAgo: 70
			}
		]
	},
	{
		key: 'salsa-verde-cruda',
		author: 'rafael_tacos',
		tags: ['Mexican', 'Salsa', 'Vegan'],
		visibility: 'public',
		daysAgo: 330,
		first: content({
			title: 'Salsa Verde Cruda',
			description:
				'Raw tomatillo salsa, sharp and bright, blended with serrano, onion and cilantro.',
			makes: 'about 500 ml',
			prepTimeMinutes: 10,
			restTimeMinutes: 10,
			storage: 'Keeps 3 days in a jar in the fridge.',
			ingredientsText: `1 lb tomatillos (about 10), husked and rinsed
2 serrano chiles
½ white onion, roughly chopped
1 clove garlic
a large handful of cilantro, leaves and tender stems
juice of 1 lime
1 tsp salt`,
			stepsText: `Quarter the tomatillos and stem the chiles; seed one if you want it milder.

Pulse everything but the salt in a blender until chunky-smooth, stopping before it turns to purée.

Stir in the salt, let it sit for 10 minutes, then taste again: tomatillos vary, so add more salt or lime until it tastes bright.`
		}),
		changes: [
			{
				ingredientsText: `1 lb tomatillos (about 10), husked and rinsed
2 serrano chiles
½ white onion, roughly chopped
1 clove garlic
a large handful of cilantro, leaves and tender stems
½ ripe avocado
juice of 1 lime
1 tsp salt`,
				stepsText: `Quarter the tomatillos and stem the chiles; seed one if you want it milder.

Pulse everything but the salt in a blender until chunky-smooth, stopping before it turns to purée. The avocado makes it creamy, taquería-style.

Stir in the salt, let it sit for 10 minutes, then taste again: tomatillos vary, so add more salt or lime until it tastes bright.`,
				message: 'Half an avocado for the creamy taquería-style salsa that clings to the meat',
				daysAgo: 160
			}
		]
	},
	{
		key: 'jollof-rice',
		author: 'kofi_mensah',
		tags: ['Ghanaian', 'Rice', 'Party'],
		visibility: 'public',
		daysAgo: 290,
		first: content({
			title: 'Ghanaian Jollof Rice',
			description:
				'Rice cooked in a reduced tomato, pepper and scotch bonnet base, steamed under foil until every grain is red.',
			servings: 6,
			prepTimeMinutes: 20,
			cookTimeMinutes: 70,
			restTimeMinutes: 10,
			ingredientsText: `4 large ripe tomatoes (about 600 g), quartered
2 red bell peppers, seeded
1 scotch bonnet, stemmed
2 onions, 1 quartered and 1 sliced
4 cloves garlic
30 g fresh ginger
100 ml vegetable oil
3 tbsp tomato paste
1 tsp curry powder
1 tsp dried thyme
1 tsp smoked paprika
2 bay leaves
500 g jasmine rice, washed
600 ml chicken stock
1 tsp salt`,
			stepsText: `Blend the tomatoes, peppers, scotch bonnet, quartered onion, garlic and ginger until smooth.

Heat the oil in a heavy pot and fry the sliced onion for 5 minutes. Add the tomato paste and fry for 5 minutes more, stirring, until it darkens.

Pour in the blended base with the curry powder, thyme, paprika and bay leaves. Cook uncovered for 25 minutes, stirring often, until reduced by half and the oil rises to the top.

Stir in the rice to coat it, then the stock and salt. Bring to a boil, cover the pot tightly with foil and the lid and cook on the lowest heat for 30 minutes without stirring.

Check a grain; if it is still firm, sprinkle in a little water and cover for 5 minutes more. Turn off the heat and leave covered for 10 minutes, then fluff.`
		}),
		changes: [
			{
				ingredientsText: `4 large ripe tomatoes (about 600 g), quartered
2 red bell peppers, seeded
1 scotch bonnet, stemmed
2 onions, 1 quartered and 1 sliced
4 cloves garlic
30 g fresh ginger
100 ml vegetable oil
3 tbsp tomato paste
1 tsp curry powder
1 tsp dried thyme
1 tsp smoked paprika
2 bay leaves
500 g jasmine rice, washed
500 ml chicken stock
1 tsp salt`,
				message:
					'500 ml stock instead of 600: the base carries water too, and the rice came out soft',
				daysAgo: 200
			},
			{
				stepsText: `Blend the tomatoes, peppers, scotch bonnet, quartered onion, garlic and ginger until smooth.

Heat the oil in a heavy pot and fry the sliced onion for 5 minutes. Add the tomato paste and fry for 5 minutes more, stirring, until it darkens.

Pour in the blended base with the curry powder, thyme, paprika and bay leaves. Cook uncovered for 25 minutes, stirring often, until reduced by half and the oil rises to the top.

Stir in the rice to coat it, then the stock and salt. Bring to a boil, cover the pot tightly with foil and the lid and cook on the lowest heat for 30 minutes without stirring. For the last 5 minutes turn the heat up to medium so the bottom catches.
tip: That smoky, toasted layer is the party-jollof flavour; scrape it up with the rest.

Check a grain; if it is still firm, sprinkle in a little water and cover for 5 minutes more. Turn off the heat and leave covered for 10 minutes, then fluff.`,
				message:
					'Turn the heat up for the last 5 minutes so the bottom catches, for party-jollof smokiness',
				daysAgo: 35
			}
		]
	},
	{
		key: 'kelewele',
		author: 'kofi_mensah',
		tags: ['Ghanaian', 'Snack', 'Vegan'],
		visibility: 'friends',
		daysAgo: 90,
		first: content({
			title: 'Kelewele',
			description:
				'Ripe plantain cubes tossed in ginger, onion and chilli, then fried dark and sticky. Street food from Accra.',
			servings: 4,
			prepTimeMinutes: 15,
			cookTimeMinutes: 20,
			restTimeMinutes: 20,
			ingredientsText: `4 ripe plantains, yellow with plenty of black spots
20 g fresh ginger
2 cloves garlic
½ small onion
½ scotch bonnet, or 1 tsp cayenne
¼ tsp ground nutmeg
1 tsp salt
2 tbsp water
vegetable oil, for frying
roasted peanuts, to serve`,
			stepsText: `Blend the ginger, garlic, onion, scotch bonnet, nutmeg and salt with the water to a smooth paste.

Peel the plantains and cut them into 2 cm cubes. Toss with the paste and marinate for 20 minutes.

Heat 3 cm of oil in a deep pan to 175°C. Fry the plantain in batches for 4 to 5 minutes, until deep brown and caramelised at the edges.

Drain on paper and serve hot with roasted peanuts.`
		})
	},
	{
		key: 'dal-makhani',
		author: 'priti_patel',
		tags: ['Indian', 'Vegetarian', 'Lentils'],
		visibility: 'public',
		daysAgo: 380,
		first: content({
			title: 'Dal Makhani',
			description:
				'Whole black urad and kidney beans soaked overnight, simmered for hours, then finished with butter and cream.',
			servings: 6,
			prepTimeMinutes: 15,
			cookTimeMinutes: 210,
			restTimeMinutes: 480,
			ingredientsText: MAKHANI_INGREDIENTS,
			stepsText: MAKHANI_STEPS,
			reheating:
				'It thickens overnight; loosen with hot water over a low heat. It tastes better the next day.'
		}),
		changes: [
			{
				ingredientsText: MAKHANI_INGREDIENTS_V2,
				stepsText: MAKHANI_STEPS_V2,
				message: 'Smoke it with a hot coal and ghee (dhungar) for the dhaba flavour',
				daysAgo: 280
			},
			{
				cookTimeMinutes: 270,
				stepsText: MAKHANI_STEPS_V3,
				message: 'Simmer the dal 3 hours, not 2: the long cook is what makes it creamy',
				daysAgo: 170
			},
			{
				ingredientsText: swap(MAKHANI_INGREDIENTS_V2, [
					'100 ml double cream',
					'60 ml double cream'
				]),
				message: 'Cut the cream to 60 ml: after three hours the dal is creamy enough on its own',
				daysAgo: 20
			}
		]
	},
	{
		key: 'masala-chai',
		author: 'priti_patel',
		tags: ['Indian', 'Drinks'],
		visibility: 'public',
		daysAgo: 200,
		first: content({
			title: 'Masala Chai',
			description:
				'Strong Assam tea boiled with milk, ginger and whole spices, the way it is made at home every afternoon.',
			servings: 4,
			prepTimeMinutes: 5,
			cookTimeMinutes: 15,
			ingredientsText: `500 ml water
2-3 green cardamom pods, crushed
2 cloves
1 small piece of cinnamon stick
2 cm fresh ginger, crushed
3 black peppercorns
4 tsp loose Assam tea
500 ml whole milk
4 tsp sugar, or to taste`,
			stepsText: `Put the water in a pan with the cardamom, cloves, cinnamon, ginger and peppercorns. Bring to a boil and simmer for 5 minutes.

Add the tea and simmer for 2 minutes, until deep amber.

Pour in the milk and sugar and bring back to a boil. Let it rise up the pan, lower the heat until it settles, and let it rise twice more, 3 to 4 minutes in all.

Strain into cups and serve hot.`
		}),
		changes: [
			{
				ingredientsText: `500 ml water
2-3 green cardamom pods, crushed
2 cloves
1 small piece of cinnamon stick
½ tsp fennel seeds
2 cm fresh ginger, crushed
3 black peppercorns
4 tsp loose Assam tea
500 ml whole milk
4 tsp sugar, or to taste`,
				stepsText: `Put the water in a pan with the cardamom, cloves, cinnamon, fennel, ginger and peppercorns. Bring to a boil and simmer for 5 minutes.

Add the tea and simmer for 2 minutes, until deep amber.

Pour in the milk and sugar and bring back to a boil. Let it rise up the pan, lower the heat until it settles, and let it rise twice more, 3 to 4 minutes in all.

Strain into cups and serve hot.`,
				message: 'Fennel seeds with the spices, for a sweet anise lift',
				daysAgo: 50
			}
		]
	},
	{
		key: 'spanakopita',
		author: 'elena_r',
		tags: ['Ελληνική κουζίνα', 'Baking', 'Vegetarian'],
		visibility: 'public',
		daysAgo: 250,
		first: content({
			title: 'Spanakopita',
			description:
				'Spinach, feta and herb pie in crisp, oiled filo, baked in a tray and cut into squares.',
			servings: 8,
			prepTimeMinutes: 40,
			cookTimeMinutes: 55,
			restTimeMinutes: 15,
			ingredientsText: `# Filling
1 kg spinach, washed
6 spring onions, sliced
1 bunch dill, chopped
½ bunch flat-leaf parsley, chopped
2 tbsp olive oil
300 g feta, crumbled
3 eggs, beaten
½ tsp ground black pepper
¼ tsp grated nutmeg

# Assembly
450 g filo pastry (about 12 sheets), thawed
120 ml olive oil, for brushing`,
			stepsText: `# Filling
Wilt the spinach in batches in a large dry pan, about 3 minutes a batch. Leave it to cool, squeeze it as dry as you can and chop it.

Warm the oil and soften the spring onions for 5 minutes. Mix them with the spinach, herbs, feta, eggs, pepper and nutmeg.
tip: No salt: the feta brings plenty.

# Assembly
Heat the oven to 180°C and brush a 30 × 23 cm baking dish with oil.

Lay in 6 sheets of filo, brushing each with oil and letting the ends hang over the sides. Spread in the filling and fold the overhang over it. Top with the remaining 6 sheets, brushing each, and tuck the edges down the sides. Oil the top, score it into squares through the top layers only and flick over a little water.

Bake for 50 minutes, until deep golden and crisp. Cool for 15 minutes before cutting along the scored lines.`
		}),
		changes: [
			{
				ingredientsText: `# Filling
1 kg spinach, washed
6 spring onions, sliced
2 leeks, thinly sliced
1 bunch dill, chopped
½ bunch flat-leaf parsley, chopped
2 tbsp olive oil
300 g feta, crumbled
3 eggs, beaten
½ tsp ground black pepper
¼ tsp grated nutmeg

# Assembly
450 g filo pastry (about 12 sheets), thawed
120 ml olive oil, for brushing`,
				stepsText: `# Filling
Wilt the spinach in batches in a large dry pan, about 3 minutes a batch. Leave it to cool, squeeze it as dry as you can and chop it.

Warm the oil and soften the spring onions and leeks for 10 minutes. Mix them with the spinach, herbs, feta, eggs, pepper and nutmeg.
tip: No salt: the feta brings plenty.

# Assembly
Heat the oven to 180°C and brush a 30 × 23 cm baking dish with oil.

Lay in 6 sheets of filo, brushing each with oil and letting the ends hang over the sides. Spread in the filling and fold the overhang over it. Top with the remaining 6 sheets, brushing each, and tuck the edges down the sides. Oil the top, score it into squares through the top layers only and flick over a little water.

Bake for 50 minutes, until deep golden and crisp. Cool for 15 minutes before cutting along the scored lines.`,
				message: 'Two leeks softened with the spring onions, for sweetness against the feta',
				daysAgo: 140
			}
		]
	},
	{
		key: 'napa-kimchi',
		author: 'min_jun_kim',
		tags: ['김치', 'Fermentation'],
		visibility: 'public',
		daysAgo: 370,
		first: content({
			title: 'Napa Cabbage Kimchi',
			description:
				'Whole-leaf baechu kimchi: salted napa cabbage rubbed with gochugaru, garlic, fish sauce and radish, fermented two days before the fridge.',
			makes: 'about 2 L',
			prepTimeMinutes: 60,
			cookTimeMinutes: 5,
			restTimeMinutes: 3000,
			equipment: 'A 2 litre jar or kimchi container, and rubber gloves',
			ingredientsText: `# Salting
1 napa cabbage (about 2 kg)
150 g coarse sea salt

# Rice paste
250 ml water
2 tbsp glutinous rice flour
1 tbsp sugar

# Seasoning
60 g gochugaru (Korean chilli flakes)
3 tbsp fish sauce
1 tbsp salted shrimp (saeujeot), chopped
8 cloves garlic, minced
15 g fresh ginger, minced
½ Asian pear, grated
200 g Korean radish (mu), cut into matchsticks
6 spring onions, cut into 3 cm lengths`,
			stepsText: `# Salting
Quarter the cabbage lengthwise through the core. Rinse the quarters and sprinkle salt between every leaf, more on the thick white stems. Let them rest for 2 hours, turning them every 30 minutes, until the stems bend without snapping.

Rinse the quarters three times in cold water and drain them cut side down in a colander while you make the seasoning.

# Rice paste
Whisk the rice flour into the water and cook over medium heat, stirring, until thick and glossy, about 5 minutes. Stir in the sugar and leave to cool completely.

# Seasoning
Mix the cooled paste with the gochugaru, fish sauce, shrimp, garlic, ginger and pear, then fold in the radish and spring onions.

Wearing gloves, smear the seasoning between every leaf. Fold each quarter in on itself and pack them tightly into the jar, pressing out the air and leaving 3 cm of headspace.

Leave the jar at room temperature for 2 days, pressing the kimchi down under its brine each day. When it smells pleasantly sour and bubbles, move it to the fridge.`
		}),
		changes: [
			{
				ingredientsText: `# Salting
1 napa cabbage (about 2 kg)
150 g coarse sea salt

# Rice paste
250 ml water
2 tbsp glutinous rice flour
1 tbsp sugar

# Seasoning
60 g gochugaru (Korean chilli flakes)
3 tbsp fish sauce
1 tbsp salted shrimp (saeujeot), chopped
8 cloves garlic, minced
15 g fresh ginger, minced
½ Asian pear, grated
200 g Korean radish (mu), cut into matchsticks
6 spring onions, cut into 3 cm lengths
50 g Korean chives (buchu), cut into 3 cm lengths`,
				stepsText: `# Salting
Quarter the cabbage lengthwise through the core. Rinse the quarters and sprinkle salt between every leaf, more on the thick white stems. Let them rest for 2 hours, turning them every 30 minutes, until the stems bend without snapping.

Rinse the quarters three times in cold water and drain them cut side down in a colander while you make the seasoning.

# Rice paste
Whisk the rice flour into the water and cook over medium heat, stirring, until thick and glossy, about 5 minutes. Stir in the sugar and leave to cool completely.

# Seasoning
Mix the cooled paste with the gochugaru, fish sauce, shrimp, garlic, ginger and pear, then fold in the radish, spring onions and chives.

Wearing gloves, smear the seasoning between every leaf. Fold each quarter in on itself and pack them tightly into the jar, pressing out the air and leaving 3 cm of headspace.

Leave the jar at room temperature for 2 days, pressing the kimchi down under its brine each day. When it smells pleasantly sour and bubbles, move it to the fridge.`,
				message: 'Korean chives in the seasoning, for a green, garlicky bite',
				daysAgo: 260
			},
			{
				ingredientsText: `# Salting
1 napa cabbage (about 2 kg)
150 g coarse sea salt

# Rice paste
250 ml water
2 tbsp glutinous rice flour
1 tbsp sugar

# Seasoning
80 g gochugaru (Korean chilli flakes)
3 tbsp fish sauce
1 tbsp salted shrimp (saeujeot), chopped
8 cloves garlic, minced
15 g fresh ginger, minced
½ Asian pear, grated
200 g Korean radish (mu), cut into matchsticks
6 spring onions, cut into 3 cm lengths
50 g Korean chives (buchu), cut into 3 cm lengths`,
				message: '80 g gochugaru for a redder, hotter kimchi; 60 g came out pale',
				daysAgo: 100
			}
		]
	},
	{
		key: 'kimchi-fried-rice',
		author: 'min_jun_kim',
		tags: ['Korean', 'Rice', 'Weeknight'],
		visibility: 'friends',
		daysAgo: 60,
		first: content({
			title: 'Kimchi Fried Rice',
			description:
				'Day-old rice fried with sour kimchi, pork belly and gochujang, crisped on the bottom and topped with a fried egg.',
			servings: 2,
			prepTimeMinutes: 10,
			cookTimeMinutes: 15,
			ingredientsText: `300 g cooked short-grain rice, a day old
200 g sour, well-fermented kimchi, chopped, plus 3 tbsp of its juice
100 g pork belly, diced
1 tbsp neutral oil
1 tbsp gochujang
1 tsp sugar
1 tsp sesame oil
2 eggs
1 spring onion, sliced
toasted sesame seeds and crumbled gim, to garnish (optional)`,
			stepsText: `Fry the pork belly in the neutral oil in a wide pan over medium-high heat until the fat runs and the edges crisp, about 4 minutes.

Add the kimchi and fry for 3 minutes, then stir in the gochujang, sugar and kimchi juice.

Add the rice, breaking up any clumps, and fry for 5 minutes until every grain is red. Press it flat and leave it for a minute to crisp on the bottom, then stir in the sesame oil.

Fry the eggs sunny side up in a separate pan. Serve the rice topped with an egg, the spring onion and, if you like, sesame seeds and gim.`
		})
	},
	{
		key: 'mujadara',
		author: 'noor_kitchen',
		tags: ['Levantine', 'Vegan', 'Lentils'],
		visibility: 'public',
		daysAgo: 220,
		first: content({
			title: 'Mujadara',
			description:
				'Lentils and rice cooked together with spiced, slow-fried onions, half of them kept crisp for the top.',
			servings: 4,
			prepTimeMinutes: 15,
			cookTimeMinutes: 55,
			restTimeMinutes: 10,
			ingredientsText: `4 large onions, thinly sliced
120 ml olive oil
200 g brown or green lentils, rinsed
1 litre water
150 g long-grain rice, rinsed
1 tsp ground cumin
½ tsp ground allspice
1½ tsp salt
plain yogurt, to serve`,
			stepsText: `Fry the onions in the oil over medium-high heat, stirring often, until deep brown and some are crisp, 30 to 35 minutes. Lift out the crispest half to drain on paper.

Meanwhile, simmer the lentils in the water for 15 minutes, until just tender but holding their shape. Do not drain.

Add the rice, cumin, allspice, salt and the soft onions with their oil to the lentils, topping up with water if needed so it sits 1 cm above. Bring to a boil, cover and cook on low for 20 minutes.

Take the pot off the heat and leave it covered for 10 minutes. Fluff with a fork, pile on the crisp onions and serve with yogurt.`
		}),
		changes: [
			{
				restTimeMinutes: 30,
				stepsText: `Fry the onions in the oil over medium-high heat, stirring often, until deep brown and some are crisp, 30 to 35 minutes. Lift out the crispest half to drain on paper.

Meanwhile, cover the rice with water and soak it for 20 minutes, and simmer the lentils in the litre of water for 15 minutes, until just tender but holding their shape. Do not drain the lentils.

Add the drained rice, cumin, allspice, salt and the soft onions with their oil to the lentils, topping up with water if needed so it sits 1 cm above. Bring to a boil, cover and cook on low for 20 minutes.

Take the pot off the heat and leave it covered for 10 minutes. Fluff with a fork, pile on the crisp onions and serve with yogurt.`,
				message: 'Soak the rice 20 minutes so it cooks through in the time the lentils take',
				daysAgo: 75
			}
		]
	},
	{
		key: 'arroz-con-pollo',
		author: 'marisol_cocina',
		tags: ['Puerto Rican', 'Chicken', 'Rice', 'One pot'],
		visibility: 'public',
		daysAgo: 320,
		first: content({
			title: 'Arroz con Pollo',
			description:
				'One-pot chicken and rice with sofrito flavours, sazón, olives and peas, the Sunday pot of my childhood.',
			servings: 6,
			prepTimeMinutes: 15,
			cookTimeMinutes: 50,
			restTimeMinutes: 40,
			ingredientsText: `3 lb bone-in chicken thighs and drumsticks
1 tsp ground cumin
1 tsp dried oregano
1½ tsp salt
½ tsp black pepper
juice of 1 lime
2 tbsp olive oil
1 onion, diced
1 green bell pepper, diced
4 cloves garlic, minced
½ cup tomato sauce
1 packet sazón with achiote
2 cups medium-grain rice, rinsed
3 cups chicken broth
½ cup pimiento-stuffed green olives
1 cup frozen peas
¼ cup chopped cilantro`,
			stepsText: `Season the chicken with the cumin, oregano, salt, pepper and lime juice and marinate for 30 minutes.

Brown the chicken in the oil in a Dutch oven, skin side down first, 5 minutes a side. Set it aside.

Cook the onion and pepper in the fat for 5 minutes, add the garlic for a minute, then the tomato sauce and sazón for 2 minutes.

Stir in the rice to coat it, then the broth and olives. Nestle the chicken in, skin side up, bring to a boil, then cover and simmer on low for 25 minutes.

Scatter over the peas, cover and cook for 5 minutes more. Leave it off the heat for 10 minutes, then scatter with cilantro.`
		}),
		changes: [
			{
				ingredientsText: `3 lb bone-in chicken thighs and drumsticks
1 tsp ground cumin
1 tsp dried oregano
1½ tsp salt
½ tsp black pepper
juice of 1 lime
2 tbsp olive oil
1 onion, diced
1 green bell pepper, diced
4 cloves garlic, minced
½ cup tomato sauce
1 packet sazón with achiote
2 cups medium-grain rice, rinsed
2½ cups chicken broth
½ cup pimiento-stuffed green olives
1 cup frozen peas
¼ cup chopped cilantro`,
				message: '2½ cups broth instead of 3: the chicken gives off juice and the rice went mushy',
				daysAgo: 210
			},
			{
				stepsText: `Season the chicken with the cumin, oregano, salt, pepper and lime juice and marinate for 30 minutes.

Brown the chicken in the oil in a Dutch oven, skin side down for 8 minutes without moving it, then 4 minutes on the other side. Set it aside.

Cook the onion and pepper in the fat for 5 minutes, add the garlic for a minute, then the tomato sauce and sazón for 2 minutes.

Stir in the rice to coat it, then the broth and olives. Nestle the chicken in, skin side up, bring to a boil, then cover and simmer on low for 25 minutes.

Scatter over the peas, cover and cook for 5 minutes more. Leave it off the heat for 10 minutes, then scatter with cilantro.`,
				message: 'Brown the skin 8 minutes untouched so it renders and stays crisp above the rice',
				daysAgo: 55
			}
		]
	}
];
