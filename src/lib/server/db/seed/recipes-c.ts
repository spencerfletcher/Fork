// Breads, French classics, preserves, barbecue and a few weeknight dishes:
// the long recipes (the cassoulet, the overnight sourdough and its forks) and
// the withdrawn and trashed parents whose forks outlive them.
import { content, type VariedRecipe } from './types.js';

/** `text` with `from` replaced, or a throw: a later version must really edit what it says it edits. */
function swap(text: string, from: string, to: string): string {
	if (!text.includes(from)) throw new Error(`recipes-c: "${from}" is not in the text`);
	return text.replace(from, to);
}

// ─── Country sourdough, and its rye fork, and that fork's seeded fork ───────

const SOURDOUGH_INGREDIENTS_V1 = `# Levain
20 g active sourdough starter
50 g bread flour
50 g water

# Dough
450 g bread flour
50 g whole wheat flour
325 g water, about 27°C
25 g water, to add with the salt
10 g fine sea salt

# For shaping
rice flour, for the banneton`;

const SOURDOUGH_STEPS_V1 = `# Levain
First thing in the morning, stir the starter, flour and water together in a jar. Cover and let it ferment at warm room temperature for 4–5 hours, until doubled, domed and bubbly.
tip: A spoonful dropped into water should float when the levain is ready.

# Dough
Mix the bread flour, whole wheat flour and the 325 g water in a large bowl until no dry flour remains. Cover and rest for 1 hour; this autolyse lets the flour drink before the salt goes in.

Add the levain, the salt and the 25 g water. Squeeze and fold the dough with a wet hand for 3–4 minutes, until it pulls back together into one smooth mass.

Bulk ferment, covered, for about 4 hours at 24–26°C. In the first 2 hours give it a set of stretch and folds every 30 minutes: lift one side, fold it over, turn the bowl and repeat four times. Then leave it alone until it has grown by about half, feels airy and shows bubbles at the sides.

# Shape
Tip the dough onto an unfloured counter, pre-shape it into a loose round and let it rest uncovered for 30 minutes.

Dust the banneton with rice flour. Shape the dough into a tight boule, dragging it towards you on the counter to build tension, and lay it in the banneton seam side up.

Cover and retard in the fridge overnight, 12–14 hours.

# Bake
In the morning, put a Dutch oven with its lid in the oven and preheat it to 250°C for 45 minutes.

Turn the cold dough out onto a square of parchment, score it with one confident slash and lower it into the hot pot. Bake covered for 20 minutes, then uncover, lower the oven to 230°C and bake 20–25 minutes more, until deep brown.

Cool on a rack for at least 1 hour before slicing; the crumb is still setting.`;

const SOURDOUGH_STEPS_V2 = swap(
	SOURDOUGH_STEPS_V1,
	'overnight, 12–14 hours.',
	'overnight, 16–18 hours.'
);

const SOURDOUGH_INGREDIENTS_V3 = swap(
	SOURDOUGH_INGREDIENTS_V1,
	'325 g water, about 27°C',
	'350 g water, about 27°C'
);
const SOURDOUGH_STEPS_V3 = swap(SOURDOUGH_STEPS_V2, 'the 325 g water', 'the 350 g water');

const SOURDOUGH_STEPS_V4 = swap(
	SOURDOUGH_STEPS_V3,
	'lower the oven to 230°C and bake 20–25 minutes more',
	'keep the oven at 250°C and bake 25–30 minutes more'
);

const SOURDOUGH_INGREDIENTS_V5 = swap(
	swap(SOURDOUGH_INGREDIENTS_V3, '450 g bread flour', '400 g bread flour'),
	'50 g whole wheat flour',
	'100 g whole wheat flour'
);
const SOURDOUGH_STEPS_V5 = swap(SOURDOUGH_STEPS_V4, 'for about 4 hours', 'for 3.5–4 hours');

const SOURDOUGH_NOTES_V1 =
	"Baker's percentages on the 500 g of dough flour: 70% water (350 g), 20% levain (100 g), 2% salt (10 g).\nThe timings assume a kitchen around 24°C; a cooler one needs a longer bulk.";
const SOURDOUGH_NOTES_V3 = swap(SOURDOUGH_NOTES_V1, '70% water (350 g)', '75% water (375 g)');

const RYE_INGREDIENTS_V2 = swap(
	swap(SOURDOUGH_INGREDIENTS_V3, '450 g bread flour', '350 g bread flour'),
	'50 g whole wheat flour',
	'150 g whole rye flour'
);
const RYE_STEPS_V2 = swap(
	swap(SOURDOUGH_STEPS_V3, 'the bread flour, whole wheat flour', 'the bread flour, rye flour'),
	'Tip the dough onto an unfloured counter',
	'Rye makes a sticky dough, so work with wet hands. Tip the dough onto an unfloured counter'
);
const RYE_NOTES_V2 =
	"Baker's percentages on the 500 g of dough flour: 30% whole rye (150 g), 75% water (375 g), 20% levain (100 g), 2% salt (10 g).\nRye ferments faster than wheat: check the bulk from 3 hours.";

const RYE_INGREDIENTS_V3 = swap(
	RYE_INGREDIENTS_V2,
	'350 g water, about 27°C',
	'375 g water, about 27°C'
);
const RYE_STEPS_V3 = swap(RYE_STEPS_V2, 'the 350 g water', 'the 375 g water');
const RYE_NOTES_V3 = swap(RYE_NOTES_V2, '75% water (375 g)', '80% water (400 g)');

const SEEDED_INGREDIENTS = `${RYE_INGREDIENTS_V2}

# Seed soaker
40 g sunflower seeds
30 g flaxseed
30 g sesame seeds, toasted
100 g boiling water`;
const SEEDED_STEPS = swap(
	swap(
		RYE_STEPS_V2,
		'until doubled, domed and bubbly.',
		'until doubled, domed and bubbly. At the same time, pour the boiling water over the seeds, stir and cover; they drink it all while the levain works.'
	),
	'Add the levain, the salt and the 25 g water.',
	'Add the levain, the salt, the 25 g water and the soaked seeds.'
);

// ─── Overnight focaccia ─────────────────────────────────────────────────────

const FOCACCIA_INGREDIENTS_V1 = `500 g bread flour
400 g cold water
10 g fine sea salt
3 g instant yeast
6 tbsp olive oil, divided
1 sprig rosemary
flaky sea salt, for the top`;

const FOCACCIA_STEPS_V1 = `Whisk the yeast into the water, add the flour and salt and stir with a spatula until no dry patches remain. The dough will be wet and shaggy.

Pour 2 tbsp of the oil into a large lidded tub, add the dough and turn it to coat. Rest for 30 minutes, then give it a set of stretch and folds with wet hands.

Cover and refrigerate overnight, 12–18 hours. The dough will more than double.

Pour 2 tbsp of the oil into a 23 × 33 cm baking tin. Tip the cold dough in, fold it into a rough rectangle and let it rise at room temperature for 2–3 hours, until puffy and jiggly, stretching it to the corners once it relaxes. About 30 minutes before it is ready, heat the oven to 230°C.

Drizzle the last of the oil over the dough, oil your fingers and press deep dimples all over, right down to the tin. Scatter with rosemary leaves and flaky salt.

Bake for 22–25 minutes, until golden on top and crisp underneath. Cool in the tin for 5 minutes, then on a rack, and cut into 12 squares.`;

const FOCACCIA_INGREDIENTS_V2 = `${FOCACCIA_INGREDIENTS_V1}
150 g cherry tomatoes, halved
a handful of pitted black olives`;
const FOCACCIA_STEPS_V2 = swap(
	FOCACCIA_STEPS_V1,
	'Scatter with rosemary leaves and flaky salt.',
	'Press the tomatoes, cut side up, and the olives into the dimples, then scatter with rosemary leaves and flaky salt.'
);
const FOCACCIA_STEPS_V3 = swap(
	swap(FOCACCIA_STEPS_V2, 'heat the oven to 230°C.', 'heat the oven to 250°C.'),
	'Bake for 22–25 minutes, until golden',
	'Bake on the lowest shelf for 18–20 minutes, until golden'
);

// ─── New York bagels ────────────────────────────────────────────────────────

const BAGEL_INGREDIENTS_V1 = `# Dough
500 g high-gluten or bread flour
290 g warm water
10 g fine sea salt
15 g barley malt syrup
5 g instant yeast

# To boil
2 litres water
1 tbsp barley malt syrup
1 tsp baking soda

# Topping
sesame or poppy seeds, optional`;

const BAGEL_STEPS_V1 = `# Dough
Stir the yeast and malt syrup into the water, add the flour and salt and mix to a stiff, shaggy dough. Knead for 10 minutes by hand, or 7 minutes on low in a stand mixer, until smooth and firm.

Cover and let it rest for 30 minutes.

Divide into 8 pieces of about 100 g and roll each into a tight ball. Rest them under a towel for 15 minutes.

Poke a floured thumb through the centre of each ball and stretch it into a ring about 5 cm across; the hole shrinks as they rise. Space them on a lined, lightly oiled tray.

Cover the tray tightly and retard in the fridge overnight, 12–16 hours.

# Boil and bake
In the morning, preheat the oven to 240°C and bring the water, malt syrup and baking soda to a boil in a wide pot. Test one bagel in a bowl of cold water: it should float within a few seconds. If it sinks, give them 20 minutes at room temperature and test again.

Boil the bagels a few at a time, 1 minute per side. Lift them onto a rack and dip the tops in seeds while still wet.

Bake on a parchment-lined tray for 18–20 minutes, until deep golden. Cool for at least 20 minutes before cutting.`;

const BAGEL_STEPS_V2 = swap(BAGEL_STEPS_V1, '1 minute per side', '30 seconds per side');
const BAGEL_INGREDIENTS_V3 = swap(
	BAGEL_INGREDIENTS_V1,
	'sesame or poppy seeds, optional',
	`1 tbsp sesame seeds
1 tbsp poppy seeds
2 tsp dried onion flakes
2 tsp dried garlic flakes
1 tsp flaky sea salt`
);
const BAGEL_STEPS_V3 = swap(
	swap(BAGEL_STEPS_V2, 'dip the tops in seeds', 'dip the tops in the mixed topping'),
	'# Dough\nStir',
	'# Dough\nMix the topping ingredients in a shallow bowl and set aside. Stir'
);

// ─── Banana bread, and its brown butter fork ────────────────────────────────

const BANANA_INGREDIENTS_V1 = `3 very ripe bananas
⅓ cup unsalted butter, melted
¾ cup granulated sugar
1 large egg, beaten
1 tsp vanilla extract
1 tsp baking soda
¼ tsp salt
1½ cups all-purpose flour`;

const BANANA_STEPS_V1 = `Heat the oven to 350°F. Butter a 9 × 5-inch loaf pan.

Mash the bananas in a large bowl with a fork until mostly smooth. Stir in the melted butter.

Mix in the sugar, egg and vanilla, then sprinkle over the baking soda and salt and stir.

Add the flour and fold until just combined; a few streaks are fine.

Scrape into the pan and bake for 55–65 minutes, until a skewer in the centre comes out clean.

Cool in the pan for 10 minutes, then turn out onto a rack and cool for at least 1 hour before slicing.`;

const BANANA_INGREDIENTS_V2 = swap(
	BANANA_INGREDIENTS_V1,
	'¾ cup granulated sugar',
	'⅓ cup granulated sugar\n⅓ cup packed light brown sugar'
);
const BANANA_STEPS_V2 = swap(BANANA_STEPS_V1, 'Mix in the sugar,', 'Mix in both sugars,');

const BANANA_INGREDIENTS_V3 = `${BANANA_INGREDIENTS_V2}
¾ cup walnuts`;
const BANANA_STEPS_V3 = swap(
	swap(
		BANANA_STEPS_V2,
		'Heat the oven to 350°F.',
		'Heat the oven to 350°F. Toast the walnuts on a sheet pan for 8–10 minutes, then chop them.'
	),
	'a few streaks are fine.',
	'a few streaks are fine. Fold in the walnuts.'
);

const BANANA_INGREDIENTS_V4 = swap(
	BANANA_INGREDIENTS_V3,
	'1 large egg, beaten',
	'1 large egg, beaten\n¼ cup sour cream'
);
const BANANA_STEPS_V4 = swap(
	BANANA_STEPS_V3,
	'Mix in both sugars, egg and vanilla,',
	'Mix in both sugars, egg, sour cream and vanilla,'
);

// ─── Cassoulet ──────────────────────────────────────────────────────────────

const CASSOULET_INGREDIENTS_V1 = `# Beans
800 g dried white beans, such as Tarbais or lingot
water, to soak and to cook
1 onion, halved and studded with 2 cloves
1 carrot, halved
1 head garlic, halved across
1 bouquet garni (thyme, bay and parsley stalks, tied)
200 g pork rind, in one piece
1 tsp fine sea salt

# Duck and pork
4 confit duck legs, with their fat
600 g pork shoulder, in 5 cm chunks
200 g salt pork belly, in thick lardons
2 onions, chopped
1 carrot, diced
6 cloves garlic, sliced
2 tbsp tomato paste
400 g canned chopped tomatoes
250 ml dry white wine
1 litre chicken stock
2 sprigs thyme
2 bay leaves
freshly ground black pepper

# Sausages
6 Toulouse sausages, about 600 g
1 tbsp duck fat

# To assemble
2 cloves garlic, halved
80 g fresh breadcrumbs
2 tbsp duck fat, melted
a handful of flat-leaf parsley, chopped`;

const CASSOULET_STEPS_V1 = `# Beans
The day before, cover the beans with plenty of cold water and leave them to soak overnight, at least 12 hours.

Drain the beans and put them in a large pot with the onion, carrot, garlic and bouquet garni. Roll up the pork rind, tie it with string and add it. Cover with fresh water by 5 cm.

Bring to a boil and skim, then simmer gently for 1–1.5 hours, until the beans are tender but still whole. Salt them only in the last 15 minutes.

Drain, keeping every drop of the cooking liquid. Discard the vegetables and the bouquet garni, and slice the pork rind into strips.

# Duck and pork
While the beans cook, scrape the fat off the duck legs into a large casserole. Warm the legs in it over low heat until the fat runs, then lift them out and cut each in two at the joint.

Season the pork shoulder and brown it in batches in the duck fat over medium-high heat, about 8 minutes a batch, then lift it out. Brown the lardons the same way.

Lower the heat, add the onions and diced carrot and cook until soft and golden, about 10 minutes. Add the garlic and tomato paste and cook 2 minutes more.

Pour in the wine and let it bubble for a minute, scraping the bottom. Add the tomatoes, stock, thyme and bay, and return the pork shoulder and lardons.

Cover and simmer gently for 1.5 hours, until the pork is tender. Season with pepper; go easy on salt, as the lardons and the confit carry plenty.

# Sausages
Prick the sausages and brown them all over in the duck fat in a frying pan, about 10 minutes. Cut each into three.

# To assemble
Heat the oven to 150°C. Rub the inside of a wide earthenware dish, about 5 litres, with the cut garlic.

Lay the pork rind strips over the base. Spoon in a third of the beans, then half the duck, pork and sausage, then another third of the beans, the remaining meat, and the last of the beans.

Ladle over the pork's braising liquid, then top up with the bean liquid until it just reaches the top layer of beans. Grind over some pepper.

Scatter over half the breadcrumbs and drizzle with half the melted duck fat. Bake for 3 hours. Every 45 minutes or so a crust forms: break it with the back of a spoon and push it under, adding a ladle of bean liquid if it looks dry.

For the last 45 minutes, scatter over the remaining breadcrumbs and duck fat and leave the crust to brown undisturbed.

Let it settle out of the oven for 15 minutes, scatter with parsley and bring the whole dish to the table.`;

const CASSOULET_INGREDIENTS_V2 = swap(
	swap(CASSOULET_INGREDIENTS_V1, '600 g pork shoulder', '400 g pork shoulder'),
	'6 Toulouse sausages, about 600 g',
	'6 Toulouse sausages, about 600 g\n300 g garlic sausage, in thick slices'
);
const CASSOULET_STEPS_V2 = swap(
	CASSOULET_STEPS_V1,
	'Cut each into three.',
	'Cut each into three. The garlic sausage needs no browning; it goes in as it is.'
);

const CASSOULET_STEPS_V3 = swap(
	swap(CASSOULET_STEPS_V2, 'Heat the oven to 150°C.', 'Heat the oven to 140°C.'),
	'Bake for 3 hours.',
	'Bake for 3.5 hours.'
);

// ─── French onion soup ──────────────────────────────────────────────────────

const ONION_INGREDIENTS_V1 = `# Soup
1.2 kg yellow onions, thinly sliced
50 g unsalted butter
1 tbsp olive oil
1 tsp fine sea salt
2 tbsp plain flour
150 ml dry white wine
1.2 litres beef stock
2 sprigs thyme
1 bay leaf
freshly ground black pepper
1 tbsp cognac, optional

# To finish
8 slices baguette, 1.5 cm thick
150 g Gruyère, grated`;

const ONION_STEPS_V1 = `# Soup
Melt the butter with the oil in a heavy casserole over medium heat. Add the onions and salt, stir to coat, cover and cook for 15 minutes, until they collapse.

Uncover, lower the heat a little and cook for 45–60 minutes, stirring every few minutes and scraping the bottom, until the onions are a deep, even brown. Add a splash of water whenever the bottom catches.

Stir in the flour and cook for 2 minutes. Pour in the wine and let it bubble away by half, scraping up the brown bits.

Add the stock, thyme and bay, bring to a boil and simmer for 30 minutes. Season with pepper, and more salt if it needs it, and stir in the cognac if using.

# To finish
Meanwhile, toast the baguette slices under the grill until dry and golden on both sides.

Ladle the soup into four flameproof bowls, float two toasts on each and heap with Gruyère. Grill for 3–5 minutes, until bubbling and browned in patches.`;

const ONION_INGREDIENTS_V2 = swap(
	ONION_INGREDIENTS_V1,
	'1 tbsp cognac, optional',
	'1 tbsp cognac, optional\n1 tsp sherry vinegar'
);
const ONION_STEPS_V2 = swap(
	swap(
		ONION_STEPS_V1,
		'Uncover, lower the heat a little and cook for 45–60 minutes,',
		'Uncover, turn the heat to medium-low and cook for about 1.5 hours,'
	),
	'stir in the cognac if using.',
	'stir in the cognac if using and the sherry vinegar.'
);

// ─── Tarte Tatin ────────────────────────────────────────────────────────────

const TATIN_INGREDIENTS = `# Pastry
175 g plain flour
100 g cold unsalted butter, diced
1 tbsp caster sugar
a pinch of salt
1 egg yolk
2–3 tbsp ice-cold water

# Apples
7 firm apples, such as Cox or Braeburn
100 g caster sugar
60 g unsalted butter
a pinch of flaky salt
crème fraîche, to serve`;

const TATIN_STEPS_V1 = `# Pastry
Rub the butter into the flour, sugar and salt until it looks like coarse crumbs with a few flakes of butter still visible. Mix in the yolk and just enough water to bring it together.

Flatten into a disc, wrap and chill for 30 minutes.

# Apples
Peel, quarter and core the apples.

Scatter the sugar over the base of a 24 cm ovenproof frying pan and melt it over medium heat without stirring, swirling the pan, until it is a deep amber caramel. Off the heat, stir in the butter and salt.

Pack the apple quarters into the caramel, rounded side down, as tightly as they will go; they shrink. Cook over medium-low heat for 15 minutes, basting with the caramel, until the juices bubble thick.

Meanwhile, heat the oven to 200°C.

# Bake
Roll the pastry into a round 3 cm wider than the pan. Lay it over the hot apples and tuck the edges down inside the pan with a spoon. Prick the top a few times.

Bake for 25–30 minutes, until the pastry is crisp and golden.

Cool in the pan for 10 minutes, then put a plate over it and, with oven gloves, turn it out in one quick move. Put back any apples that stick, and serve warm with crème fraîche.`;

const TATIN_STEPS_V2 = swap(
	TATIN_STEPS_V1,
	'Cook over medium-low heat for 15 minutes,',
	'Cook over medium-low heat for 25 minutes,'
);

// ─── Tiramisu ───────────────────────────────────────────────────────────────

const TIRAMISU_INGREDIENTS_V1 = `4 very fresh eggs, separated
100 g caster sugar
500 g mascarpone, at room temperature
300 ml strong espresso, cooled
2 tbsp marsala or dark rum
about 30 savoiardi
2 tbsp cocoa powder, for dusting`;

const TIRAMISU_STEPS_V1 = `Whisk the yolks with half the sugar until pale and thick, about 4 minutes. Beat in the mascarpone a spoonful at a time until smooth.
warning: The eggs are raw. Use the freshest you can get, and leave this one out for anyone pregnant or very young.

In a clean bowl, whisk the whites to soft peaks, add the remaining sugar and whisk to firm, glossy peaks. Fold them into the mascarpone in three goes.

Stir the marsala into the cooled espresso in a shallow dish.

Dip the savoiardi one at a time, a quick second per side, and lay them in a single layer in a 20 × 30 cm dish. Spread over half the cream.

Add a second layer of dipped biscuits and the remaining cream, and smooth the top.

Cover and chill for at least 6 hours, or overnight, so it sets firm enough to slice.

Dust thickly with cocoa through a sieve just before serving.`;

const TIRAMISU_INGREDIENTS_V2 = swap(
	swap(TIRAMISU_INGREDIENTS_V1, '100 g caster sugar', '80 g caster sugar'),
	'500 g mascarpone',
	'a pinch of salt\n500 g mascarpone'
);
const TIRAMISU_STEPS_V2 = swap(
	TIRAMISU_STEPS_V1,
	'Whisk the yolks with half the sugar',
	'Whisk the yolks with half the sugar and the salt'
);

const TIRAMISU_INGREDIENTS_V3 = swap(
	TIRAMISU_INGREDIENTS_V2,
	'2 tbsp cocoa powder',
	'50 g dark chocolate, finely grated\n2 tbsp cocoa powder'
);
const TIRAMISU_STEPS_V3 = swap(
	swap(
		TIRAMISU_STEPS_V2,
		'Spread over half the cream.',
		'Spread over half the cream and scatter with half the chocolate.'
	),
	'and the remaining cream, and smooth the top.',
	'and the remaining cream, smooth the top and scatter over the rest of the chocolate.'
);

// ─── Sauerkraut ─────────────────────────────────────────────────────────────

const KRAUT_INGREDIENTS_V1 = `1 green or white cabbage, about 1.2 kg
24 g fine sea salt (2% of the sliced cabbage's weight)
1 tsp caraway seeds, optional`;

const KRAUT_STEPS_V1 = `Pull off two clean outer leaves and keep them. Quarter and core the cabbage and slice it thinly.

Weigh the sliced cabbage and measure out 2% of that weight in salt. Toss them together in a large bowl and leave for 15 minutes to start drawing out the water.

Massage and squeeze the cabbage hard for 5–10 minutes, until it is limp and sitting in a pool of its own brine. Mix in the caraway.

Pack it into a clean 1 litre jar a handful at a time, pressing each layer down with your fist until brine rises over it. Fold the kept leaves over the top and weigh them down with a small jar or a zip bag of water, so everything stays under the brine.

Cover loosely with a lid or a cloth and leave it to ferment at cool room temperature, 18–22°C, for 3–4 weeks. Press it down every day or two for the first week.
warning: Pink, fuzzy or slimy mould means start again; a flat white film is harmless yeast and skims off.

Start tasting after 2 weeks. When it is as sour as you like it, take out the weight, close the jar and refrigerate.`;

const KRAUT_INGREDIENTS_V2 = swap(
	KRAUT_INGREDIENTS_V1,
	"24 g fine sea salt (2% of the sliced cabbage's weight)",
	"30 g fine sea salt (2.5% of the sliced cabbage's weight)"
);
const KRAUT_STEPS_V2 = swap(KRAUT_STEPS_V1, 'measure out 2% of that', 'measure out 2.5% of that');

// ─── Quick-pickled red onions ───────────────────────────────────────────────

const PICKLE_INGREDIENTS_V1 = `2 red onions, about 400 g
200 ml cider vinegar
100 ml water
1 tbsp sugar
1½ tsp fine sea salt
½ tsp black peppercorns
1 bay leaf`;

const PICKLE_STEPS_V1 = `Halve the onions through the root and slice them thinly. Pack them into a clean 500 ml jar with the peppercorns and bay.

Warm the vinegar, water, sugar and salt in a small pan, stirring, just until the sugar and salt dissolve. It does not need to boil.

Pour the warm brine over the onions, pressing them under. Leave to cool, uncovered, for 30 minutes, then close the jar.

Chill for at least 1 hour before eating. They turn bright pink and are best after a day.`;

const PICKLE_INGREDIENTS_V2 = swap(
	swap(PICKLE_INGREDIENTS_V1, '1 tbsp sugar', '2 tsp sugar'),
	'1 bay leaf',
	'1 bay leaf\n1 dried red chilli, split'
);
const PICKLE_STEPS_V2 = swap(
	PICKLE_STEPS_V1,
	'with the peppercorns and bay.',
	'with the peppercorns, bay and chilli.'
);

// ─── Strawberry jam ─────────────────────────────────────────────────────────

const JAM_INGREDIENTS_V1 = `1 kg strawberries, hulled
800 g granulated sugar
juice of 2 lemons, about 4 tbsp
1 tsp butter, optional
4 jam jars of about 350 ml, with lids`;

const JAM_STEPS_V1 = `Put two small plates in the freezer for testing the set.

Halve the strawberries, or quarter big ones. Layer them with the sugar in a wide preserving pan, cover and leave to macerate for 4 hours, or overnight in the fridge.

Wash the jars and lids in hot soapy water and rinse. Stand the jars on a tray in a 140°C oven for 15 minutes to sterilise, and put the lids in a bowl of just-boiled water.

Set the pan over low heat and stir until every grain of sugar has dissolved, then add the lemon juice.

Turn up the heat and boil hard for 8–12 minutes, stirring now and then, until the jam reaches 105°C or passes the wrinkle test.
warning: Boiling jam is hotter than boiling water and sticks as it burns; keep children and pets out of the kitchen.

To test, take the pan off the heat, drop a teaspoon of jam onto a cold plate, wait a minute and push it with your finger. If it wrinkles, it is ready; if not, boil 2 minutes more and test again.

Skim off any scum, stirring in the butter if you like to settle the foam. Leave to stand for 15 minutes so the fruit stays suspended rather than floating.

Ladle into the hot jars, leaving 5 mm at the top, and seal at once. Leave them to cool before labelling.`;

const JAM_INGREDIENTS_V2 = swap(
	JAM_INGREDIENTS_V1,
	'800 g granulated sugar',
	'650 g granulated sugar'
);
const JAM_STEPS_V2 = swap(
	JAM_STEPS_V1,
	'boil hard for 8–12 minutes',
	'boil hard for 10–15 minutes'
);

const JAM_INGREDIENTS_V3 = swap(
	JAM_INGREDIENTS_V2,
	'1 tsp butter, optional',
	'1 tbsp balsamic vinegar\n¼ tsp freshly ground black pepper\n1 tsp butter, optional'
);
const JAM_STEPS_V3 = swap(
	JAM_STEPS_V2,
	'Skim off any scum, stirring in the butter',
	'Skim off any scum and stir in the balsamic and pepper, and the butter'
);

// ─── Apple pie ──────────────────────────────────────────────────────────────

const PIE_INGREDIENTS = `# Crust
2½ cups all-purpose flour
1 tbsp sugar
1 tsp salt
1 cup cold unsalted butter, cubed
6–8 tbsp ice water

# Filling
3 lb baking apples, such as Honeycrisp and Granny Smith
½ cup granulated sugar
¼ cup packed brown sugar
2 tbsp all-purpose flour
1 tbsp lemon juice
1 tsp ground cinnamon
¼ tsp ground nutmeg
¼ tsp salt
2 tbsp unsalted butter, cut small

# To finish
1 egg, beaten with 1 tbsp milk
1 tbsp coarse sugar`;

const PIE_STEPS_V1 = `# Crust
Whisk the flour, sugar and salt. Cut in the butter with a pastry blender or your fingertips until the largest pieces are the size of peas.

Drizzle in the ice water a tablespoon at a time, tossing with a fork, until the dough holds together when squeezed. Divide in two, flatten each into a disc, wrap and chill for at least 1 hour.

# Filling
Peel, core and slice the apples about ¼ inch thick. Toss with the sugars, flour, lemon juice, spices and salt.

# To finish
Heat the oven to 425°F with a rack in the lowest position.

Roll one disc into a 12-inch round and line a 9-inch pie plate. Pile in the apples, mounding them in the middle, and dot with the butter.

Roll out the second disc, lay it over the top, trim to a ½-inch overhang and crimp the edges together. Brush with the egg wash, sprinkle with coarse sugar and cut four steam vents.

Bake for 20 minutes, then lower the oven to 375°F and bake 40–45 minutes more, until the crust is deep golden and the juices bubble thickly through the vents. Cover the edge with foil if it browns too fast.

Cool on a rack for at least 2 hours so the filling sets before slicing.`;

const PIE_STEPS_V2 = swap(
	PIE_STEPS_V1,
	'Toss with the sugars, flour, lemon juice, spices and salt.',
	'Toss with the sugars, flour, lemon juice, spices and salt, then cook in a wide pan over medium heat, stirring, for 10 minutes, until just tender. Spread on a sheet pan to cool completely.'
);
const PIE_STEPS_V3 = swap(
	swap(
		PIE_STEPS_V2,
		'Roll out the second disc, lay it over the top, trim to a ½-inch overhang and crimp the edges together. Brush with the egg wash, sprinkle with coarse sugar and cut four steam vents.',
		'Roll out the second disc and cut it into ten 1-inch strips. Weave them into a lattice over the filling, trim to a ½-inch overhang and crimp the edges together. Brush with the egg wash and sprinkle with coarse sugar.'
	),
	'bubble thickly through the vents.',
	'bubble thickly through the lattice.'
);

// ─── Smoked brisket ─────────────────────────────────────────────────────────

const BRISKET_INGREDIENTS_V1 = `1 whole packer brisket, 12–14 lb
3 tbsp kosher salt
3 tbsp coarse black pepper
1 tbsp garlic powder
1 cup beef broth, in a spray bottle
oak or hickory wood chunks
pink butcher paper`;

const BRISKET_STEPS_V1 = `Trim the hard fat off the brisket, leaving about ¼ inch on the fat cap, and round off any thin edges that would burn.

Mix the salt, pepper and garlic powder and season every surface evenly. Set it on a rack over a tray and dry brine it uncovered in the fridge overnight, 12–24 hours.

Take the brisket out of the fridge while you light the smoker, and bring the smoker to a steady 250°F with the wood.

Smoke it fat side up, spritzing with broth every hour or so once the bark has firmed, until the bark is dark and the internal temperature stalls around 165°F, 5–6 hours in.

Wrap it tightly in butcher paper and return it to the smoker. Cook until it reaches about 203°F and a probe slides in like butter, another 4–6 hours; the whole smoke runs 10–12 hours.

Rest it, still wrapped, in a dry cooler for at least 1 hour.

Separate the point from the flat. Slice the flat across the grain into pencil-thick slices; cube the point or slice it thicker.`;

const BRISKET_INGREDIENTS_V2 = swap(
	BRISKET_INGREDIENTS_V1,
	'pink butcher paper',
	'pink butcher paper\n½ cup beef tallow, warmed'
);
const BRISKET_STEPS_V2 = swap(
	swap(BRISKET_STEPS_V1, 'stalls around 165°F', 'stalls around 170°F'),
	'Wrap it tightly in butcher paper and return it',
	'Smear the tallow over the butcher paper where the flat will sit, wrap the brisket tightly in it and return it'
);
const BRISKET_STEPS_V3 = swap(
	BRISKET_STEPS_V2,
	'in a dry cooler for at least 1 hour.',
	'in a dry cooler for 2–3 hours.'
);

// ─── Pulled pork ────────────────────────────────────────────────────────────

const PORK_INGREDIENTS = `1 bone-in pork shoulder (Boston butt), 8–9 lb
2 tbsp yellow mustard
¼ cup packed brown sugar
2 tbsp kosher salt
2 tbsp paprika
1 tbsp coarse black pepper
2 tsp garlic powder
1 tsp cayenne
½ cup apple cider vinegar, for spritzing
apple or cherry wood chunks`;

const PORK_STEPS_V1 = `Mix the sugar, salt, paprika, pepper, garlic powder and cayenne into a rub. Smear the shoulder thinly with mustard and coat it all over with the rub.

Bring the smoker to 250°F. Smoke the shoulder fat side up, spritzing with vinegar every hour after the first 3 hours.

When the internal temperature reaches 160°F, about 6 hours in, wrap it in foil with a splash of vinegar and return it to the smoker.

Cook until it reaches 200–205°F and the bone wiggles free, 10–12 hours in all.

Rest in the foil in a cooler for 1 hour, then pull the meat into shreds, discarding the bone and any soft fat, and toss with the juices from the foil.`;

const PORK_STEPS_V2 = swap(
	PORK_STEPS_V1,
	'coat it all over with the rub.',
	'coat it all over with the rub. Wrap it and refrigerate overnight so the salt works its way in.'
);

// ─── Lemon drizzle cake, and its thyme fork ─────────────────────────────────

const DRIZZLE_INGREDIENTS_V1 = `# Cake
175 g unsalted butter, softened
175 g caster sugar
3 large eggs
175 g self-raising flour
finely grated zest of 2 lemons
3 tbsp milk

# Drizzle
juice of 2 lemons
100 g granulated sugar`;

const DRIZZLE_STEPS_V1 = `# Cake
Heat the oven to 180°C (160°C fan). Grease and line a 900 g loaf tin.

Beat the butter and sugar until pale and fluffy, about 3 minutes. Beat in the eggs one at a time, adding a spoonful of the flour with the last.

Fold in the remaining flour, the zest and the milk until smooth.

Scrape into the tin, level the top and bake for 45–50 minutes, until a skewer comes out clean.

# Drizzle
Stir the lemon juice and sugar together. Do not let the sugar dissolve: it should stay gritty.

While the cake is still hot in its tin, prick it all over with a skewer and spoon over the drizzle. It sinks in and leaves a crackly crust on top.

Leave it in the tin until completely cool, about 1 hour, before lifting it out.`;

const DRIZZLE_INGREDIENTS_V2 = swap(DRIZZLE_INGREDIENTS_V1, '3 tbsp milk', '3 tbsp Greek yogurt');
const DRIZZLE_STEPS_V2 = swap(DRIZZLE_STEPS_V1, 'the zest and the milk', 'the zest and the yogurt');

const THYME_INGREDIENTS = swap(
	swap(DRIZZLE_INGREDIENTS_V1, '3 tbsp milk', '3 tbsp milk\n2 tsp fresh thyme leaves, chopped'),
	'100 g granulated sugar',
	'100 g granulated sugar\n4 sprigs thyme'
);
const THYME_STEPS = swap(
	swap(DRIZZLE_STEPS_V1, 'the zest and the milk', 'the zest, the chopped thyme and the milk'),
	'Stir the lemon juice and sugar together.',
	'Stir the lemon juice and sugar together with the leaves stripped from the thyme sprigs.'
);

// ─── West African peanut stew, and its groundnut soup fork ──────────────────

const STEW_INGREDIENTS_V1 = `2 tbsp vegetable oil
1 large onion, chopped
4 cloves garlic, grated
a thumb of ginger, grated
1 tsp ground coriander
1 tsp smoked paprika
2 tbsp tomato paste
400 g canned chopped tomatoes
1 scotch bonnet chilli, left whole
150 g smooth unsweetened peanut butter
1 litre vegetable stock
1 tsp fine sea salt
600 g sweet potatoes, peeled, in 3 cm chunks
200 g kale, shredded
juice of 1 lime
roasted peanuts and coriander leaves, to serve`;

const STEW_STEPS_V1 = `Warm the oil in a large pot over medium heat and cook the onion until soft, about 8 minutes. Add the garlic, ginger, coriander and paprika and cook 1 minute more.

Stir in the tomato paste and cook for 2 minutes until it darkens, then add the tomatoes and the whole scotch bonnet.

Whisk the peanut butter with a ladle of the stock until smooth, then stir it into the pot with the remaining stock and the salt.

Add the sweet potatoes, bring to a simmer and cook, partly covered, for 25 minutes, until tender. Stir now and then so the bottom doesn't catch.

Fish out the scotch bonnet. Stir in the kale and simmer 5 minutes more, until wilted. Add the lime juice and taste for salt.

Serve over rice, scattered with chopped peanuts and coriander.`;

const STEW_INGREDIENTS_V2 = swap(
	STEW_INGREDIENTS_V1,
	'200 g kale, shredded',
	'400 g can chickpeas, drained\n200 g kale, shredded'
);
const STEW_STEPS_V2 = swap(STEW_STEPS_V1, 'Stir in the kale', 'Stir in the chickpeas and kale');

const GROUNDNUT_INGREDIENTS = swap(
	swap(
		swap(
			STEW_INGREDIENTS_V1,
			'600 g sweet potatoes, peeled, in 3 cm chunks',
			'1 kg bone-in chicken thighs, skin removed'
		),
		'1 litre vegetable stock',
		'1.5 litres chicken stock'
	),
	'200 g kale, shredded\n',
	''
);
const GROUNDNUT_STEPS = `Season the chicken with the salt. Warm the oil in a large pot over medium-high heat and brown the chicken on both sides, about 8 minutes, then lift it out. Lower the heat, cook the onion in the same pot until soft, about 8 minutes, then add the garlic, ginger, coriander and paprika and cook 1 minute more.

Stir in the tomato paste and cook for 2 minutes until it darkens, then add the tomatoes and the whole scotch bonnet.

Whisk the peanut butter with a ladle of the stock until smooth, then stir it into the pot with the remaining stock.

Return the chicken, bring to a simmer and cook, partly covered, for 40 minutes, until the chicken is tender and a layer of red oil gathers on top. Stir now and then so the bottom doesn't catch.

Fish out the scotch bonnet. Add the lime juice and taste for salt; the soup should be thin enough to ladle.

Serve in bowls over rice balls or fufu, scattered with chopped peanuts and coriander.`;

// ─── Sticky toffee pudding ──────────────────────────────────────────────────

const STP_INGREDIENTS_V1 = `# Pudding
200 g pitted dates, chopped
250 ml boiling water
1 tsp bicarbonate of soda
85 g unsalted butter, softened
140 g light muscovado sugar
2 large eggs
1 tsp vanilla extract
175 g self-raising flour

# Toffee sauce
100 g unsalted butter
150 g dark muscovado sugar
300 ml double cream
a pinch of flaky salt`;

const STP_STEPS_V1 = `# Pudding
Pour the boiling water over the dates in a bowl, stir in the bicarbonate of soda and leave to soak for 20 minutes.

Meanwhile, heat the oven to 180°C (160°C fan) and butter a 20 × 30 cm baking dish.

Beat the butter and sugar until creamy, then beat in the eggs one at a time and the vanilla. Fold in the flour, then the dates with all their liquid; the batter will be loose.

Pour into the dish and bake for 30–35 minutes, until springy and a skewer comes out clean.

# Toffee sauce
While it bakes, melt the butter and sugar in a pan, stir in 200 ml of the cream and bring to a boil, then simmer for 3 minutes until dark and glossy. Stir in the salt.

# To serve
Prick the warm pudding all over and pour over a third of the sauce. Leave it for 10 minutes to soak in, then cut into squares and serve with the remaining sauce and the last of the cream, cold.`;

const STP_INGREDIENTS_V2 = swap(
	STP_INGREDIENTS_V1,
	'150 g dark muscovado sugar',
	'150 g dark muscovado sugar\n1 tbsp black treacle'
);
const STP_STEPS_V2 = swap(
	STP_STEPS_V1,
	'melt the butter and sugar in a pan,',
	'melt the butter, sugar and treacle in a pan,'
);

// ─── Nettle and potato soup ─────────────────────────────────────────────────

const NETTLE_INGREDIENTS_V1 = `200 g young nettle tops, about a carrier bag loosely packed
30 g butter
1 onion, chopped
1 leek, sliced
400 g floury potatoes, peeled and diced
1 litre vegetable or chicken stock
1 tsp fine sea salt
100 ml single cream
freshly ground black pepper
a grating of nutmeg`;

const NETTLE_STEPS_V1 = `Pick over the nettles, discarding thick stalks, and wash them well in a sink of cold water.
warning: Wear rubber gloves until the nettles are cooked; the sting goes as soon as they meet the heat.

Melt the butter in a large pan and cook the onion and leek gently for 10 minutes, until soft but not browned.

Add the potatoes, stock and salt, bring to a boil and simmer for 15 minutes, until the potatoes are tender.

Add the nettles, pushing them under, and simmer for 3 minutes, until wilted and bright green. Any longer and they turn drab.

Blend until smooth, stir in the cream, and season with pepper and nutmeg.`;

const NETTLE_INGREDIENTS_V2 = swap(
	NETTLE_INGREDIENTS_V1,
	'30 g butter',
	'a handful of wild garlic leaves\n30 g butter'
);
const NETTLE_STEPS_V2 = swap(
	NETTLE_STEPS_V1,
	'Add the nettles, pushing them under,',
	'Add the nettles and wild garlic, pushing them under,'
);

// ─── The recipes ────────────────────────────────────────────────────────────

export const RECIPES_C: VariedRecipe[] = [
	{
		key: 'country-sourdough',
		author: 'sofia_sourdough',
		tags: ['Bread', 'Sourdough', 'Baking'],
		visibility: 'public',
		daysAgo: 380,
		first: content({
			title: 'Country Sourdough',
			description:
				'A crackly-crusted white loaf with a little whole wheat, fermented slowly and baked straight from the fridge in a Dutch oven.',
			makes: '1 loaf',
			prepTimeMinutes: 45,
			cookTimeMinutes: 45,
			restTimeMinutes: 1530,
			ingredientsText: SOURDOUGH_INGREDIENTS_V1,
			stepsText: SOURDOUGH_STEPS_V1,
			notes: SOURDOUGH_NOTES_V1,
			equipment: 'A 5 litre Dutch oven, a banneton or a towel-lined bowl, a lame or razor',
			storage: 'Cut side down on a board for 2 days, then sliced and frozen'
		}),
		changes: [
			{
				message: 'Longer cold retard, 16–18 hours, for a more open crumb and a tangier loaf',
				daysAgo: 300,
				stepsText: SOURDOUGH_STEPS_V2,
				restTimeMinutes: 1770
			},
			{
				message:
					'Hydration up to 75% now the dough is easier to handle: 25 g more water in the mix',
				daysAgo: 220,
				ingredientsText: SOURDOUGH_INGREDIENTS_V3,
				stepsText: SOURDOUGH_STEPS_V3,
				notes: SOURDOUGH_NOTES_V3
			},
			{
				message:
					'Keep the oven at 250°C uncovered and bake 5 minutes longer, for a darker, thicker crust',
				daysAgo: 150,
				stepsText: SOURDOUGH_STEPS_V4,
				cookTimeMinutes: 50
			},
			{
				message:
					'Twice the whole wheat (100 g) for more flavour; it ferments faster, so the bulk is 3.5–4 hours',
				daysAgo: 60,
				ingredientsText: SOURDOUGH_INGREDIENTS_V5,
				stepsText: SOURDOUGH_STEPS_V5
			}
		]
	},
	{
		key: 'rye-country-sourdough',
		author: 'leo_ferments',
		tags: ['Bread', 'Sourdough', 'Rye'],
		visibility: 'public',
		daysAgo: 200,
		forkOf: { key: 'country-sourdough', version: 3 },
		changes: [
			{
				message: '30% whole rye in place of the whole wheat and 100 g of the bread flour',
				daysAgo: 180,
				title: 'Rye Country Sourdough',
				description:
					'The country loaf with 30% whole rye: a darker, denser crumb that tastes faintly of malt and keeps for days.',
				ingredientsText: RYE_INGREDIENTS_V2,
				stepsText: RYE_STEPS_V2,
				notes: RYE_NOTES_V2
			},
			{
				message: 'More water, 80% hydration: rye drinks it, and the crumb was dry at 75%',
				daysAgo: 140,
				ingredientsText: RYE_INGREDIENTS_V3,
				stepsText: RYE_STEPS_V3,
				notes: RYE_NOTES_V3
			}
		]
	},
	{
		key: 'seeded-rye-sourdough',
		author: 'spencerfletcher',
		tags: ['Bread', 'Sourdough', 'Rye'],
		visibility: 'private',
		daysAgo: 120,
		forkOf: { key: 'rye-country-sourdough', version: 2 },
		changes: [
			{
				message:
					'A seed soaker of sunflower, flax and toasted sesame, soaked while the levain ferments and mixed in with the salt',
				daysAgo: 90,
				title: 'Seeded Rye Sourdough',
				ingredientsText: SEEDED_INGREDIENTS,
				stepsText: SEEDED_STEPS
			}
		]
	},
	{
		key: 'overnight-focaccia',
		author: 'sofia_sourdough',
		tags: ['Bread', 'Italian', 'Baking'],
		visibility: 'public',
		daysAgo: 340,
		first: content({
			title: 'Overnight Focaccia',
			description:
				'A wet, barely kneaded dough left in the fridge overnight, then dimpled with olive oil and baked into a crisp-bottomed, airy slab.',
			makes: '12 squares',
			prepTimeMinutes: 20,
			cookTimeMinutes: 25,
			restTimeMinutes: 1290,
			ingredientsText: FOCACCIA_INGREDIENTS_V1,
			stepsText: FOCACCIA_STEPS_V1,
			storage: 'Best the day it is baked; wrapped, it toasts well the next day'
		}),
		changes: [
			{
				message: 'Cherry tomatoes and black olives pressed into the dimples',
				daysAgo: 250,
				ingredientsText: FOCACCIA_INGREDIENTS_V2,
				stepsText: FOCACCIA_STEPS_V2
			},
			{
				message: 'Hotter oven, 250°C, on the lowest shelf, for a crisper base in less time',
				daysAgo: 110,
				stepsText: FOCACCIA_STEPS_V3,
				cookTimeMinutes: 20
			}
		]
	},
	{
		key: 'new-york-bagels',
		author: 'ben_and_flour',
		tags: ['Bread', 'Breakfast', 'Baking'],
		visibility: 'public',
		daysAgo: 320,
		first: content({
			title: 'New York Bagels',
			description:
				'Dense, chewy bagels with a shiny crust: a stiff malted dough, an overnight retard in the fridge, a quick boil and a hot bake.',
			makes: '8 bagels',
			prepTimeMinutes: 45,
			cookTimeMinutes: 30,
			restTimeMinutes: 1025,
			ingredientsText: BAGEL_INGREDIENTS_V1,
			stepsText: BAGEL_STEPS_V1,
			storage: 'A paper bag for a day; slice and freeze the rest'
		}),
		changes: [
			{
				message: 'Boil 30 seconds a side instead of a minute, for a thinner, crisper crust',
				daysAgo: 230,
				stepsText: BAGEL_STEPS_V2
			},
			{
				message: 'Everything topping: sesame, poppy, dried onion, dried garlic and flaky salt',
				daysAgo: 75,
				ingredientsText: BAGEL_INGREDIENTS_V3,
				stepsText: BAGEL_STEPS_V3
			}
		]
	},
	{
		key: 'banana-bread',
		author: 'ben_and_flour',
		tags: ['Baking', 'Breakfast', 'American'],
		visibility: 'public',
		daysAgo: 390,
		first: content({
			title: 'Banana Bread',
			description:
				'The one-bowl loaf for bananas gone black on the counter: moist, plain and stirred together with a fork.',
			makes: '1 loaf',
			prepTimeMinutes: 15,
			cookTimeMinutes: 65,
			restTimeMinutes: 70,
			ingredientsText: BANANA_INGREDIENTS_V1,
			stepsText: BANANA_STEPS_V1,
			storage: 'Wrapped, at room temperature, up to 4 days'
		}),
		changes: [
			{
				message: 'Brown sugar for part of the white: a moister loaf with a deeper flavour',
				daysAgo: 310,
				ingredientsText: BANANA_INGREDIENTS_V2,
				stepsText: BANANA_STEPS_V2
			},
			{
				message: 'Toasted walnuts folded in, toasted while the oven heats',
				daysAgo: 200,
				ingredientsText: BANANA_INGREDIENTS_V3,
				stepsText: BANANA_STEPS_V3
			},
			{
				message: 'A quarter cup of sour cream for a more tender crumb',
				daysAgo: 130,
				ingredientsText: BANANA_INGREDIENTS_V4,
				stepsText: BANANA_STEPS_V4
			}
		]
	},
	{
		key: 'brown-butter-banana-bread',
		author: 'grace_bakes',
		tags: ['Baking', 'Breakfast'],
		visibility: 'friends',
		daysAgo: 100,
		forkOf: { key: 'banana-bread', version: 4 },
		changes: [
			{
				message: 'Brown the butter before it goes in, for a nutty, toffee-ish loaf',
				daysAgo: 50,
				title: 'Brown Butter Banana Bread',
				description:
					'The walnut and sour cream banana bread, with the butter browned first for a nutty, toffee-ish depth.',
				prepTimeMinutes: 25,
				ingredientsText: swap(
					BANANA_INGREDIENTS_V4,
					'⅓ cup unsalted butter, melted',
					'⅓ cup unsalted butter, browned'
				),
				stepsText: swap(
					BANANA_STEPS_V4,
					'Stir in the melted butter.',
					'Brown the butter in a light-coloured pan over medium heat, swirling, until it smells nutty and the solids are toasted, 5–6 minutes; let it cool 10 minutes, then stir it in with every brown fleck.'
				)
			}
		]
	},
	{
		key: 'cassoulet',
		author: 'hugo_bistro',
		tags: ['French', 'Dinner', 'Slow cooking', 'Beans'],
		visibility: 'public',
		daysAgo: 360,
		first: content({
			title: 'Cassoulet',
			description:
				'Beans, duck confit, pork and Toulouse sausage, layered in an earthenware dish and baked for hours under a crust broken and rebuilt as it cooks.',
			servings: 8,
			prepTimeMinutes: 60,
			cookTimeMinutes: 330,
			restTimeMinutes: 735,
			ingredientsText: CASSOULET_INGREDIENTS_V1,
			stepsText: CASSOULET_STEPS_V1,
			notes:
				'Two days of work, mostly waiting. Day one: soak the beans. Day two: cook the beans and the braise side by side in the morning, assemble and bake in the afternoon.',
			makeAhead:
				'Better the next day: bake, cool and chill it in the dish, then reheat at 160°C for about an hour, breaking the crust once',
			equipment: 'A large pot, a heavy casserole, and a wide 5 litre earthenware or enamelled dish',
			reheating: 'In the dish at 160°C with a ladle of stock, until bubbling'
		}),
		changes: [
			{
				message:
					'Garlic sausage alongside the Toulouse, and less pork shoulder, for a lighter dish',
				daysAgo: 270,
				ingredientsText: CASSOULET_INGREDIENTS_V2,
				stepsText: CASSOULET_STEPS_V2
			},
			{
				message: 'Lower and longer, 140°C for 3.5 hours, for a deeper crust and creamier beans',
				daysAgo: 140,
				stepsText: CASSOULET_STEPS_V3,
				cookTimeMinutes: 360
			}
		]
	},
	{
		key: 'french-onion-soup',
		author: 'hugo_bistro',
		tags: ['French', 'Soup', 'Dinner'],
		visibility: 'public',
		daysAgo: 300,
		first: content({
			title: 'French Onion Soup',
			description:
				'A kilo of onions cooked down to a dark jam, simmered in beef stock and finished under the grill with Gruyère toasts.',
			servings: 4,
			prepTimeMinutes: 20,
			cookTimeMinutes: 115,
			ingredientsText: ONION_INGREDIENTS_V1,
			stepsText: ONION_STEPS_V1,
			makeAhead: 'The soup keeps 3 days chilled; toast and grill the tops to serve'
		}),
		changes: [
			{
				message:
					'Onions cooked low for 1.5 hours instead of an hour, and a drop of sherry vinegar to lift the sweetness',
				daysAgo: 180,
				ingredientsText: ONION_INGREDIENTS_V2,
				stepsText: ONION_STEPS_V2,
				cookTimeMinutes: 145
			}
		]
	},
	{
		key: 'tarte-tatin',
		author: 'lucia_dolci',
		tags: ['French', 'Dessert', 'Baking'],
		visibility: 'public',
		daysAgo: 280,
		first: content({
			title: 'Tarte Tatin',
			description:
				'Apples cooked in amber caramel under a lid of short pastry, then turned out so the fruit sits glossy on top.',
			servings: 8,
			prepTimeMinutes: 30,
			cookTimeMinutes: 55,
			restTimeMinutes: 40,
			ingredientsText: TATIN_INGREDIENTS,
			stepsText: TATIN_STEPS_V1,
			equipment: 'A 24 cm ovenproof frying pan or tatin tin'
		}),
		changes: [
			{
				message:
					'Cook the apples 25 minutes on the hob instead of 15: darker, and they hold their shape when turned out',
				daysAgo: 160,
				stepsText: TATIN_STEPS_V2,
				cookTimeMinutes: 65
			}
		]
	},
	{
		key: 'tiramisu',
		author: 'lucia_dolci',
		tags: ['Italian', 'Dessert', 'No bake'],
		visibility: 'public',
		daysAgo: 260,
		first: content({
			title: 'Tiramisu',
			description:
				'Savoiardi dipped in espresso and marsala, layered with a mascarpone cream lightened with whipped egg whites.',
			servings: 8,
			prepTimeMinutes: 30,
			restTimeMinutes: 360,
			ingredientsText: TIRAMISU_INGREDIENTS_V1,
			stepsText: TIRAMISU_STEPS_V1,
			makeAhead: 'Made the day before, it slices more cleanly',
			storage: 'Covered in the fridge, up to 2 days'
		}),
		changes: [
			{
				message: 'Less sugar in the cream, 80 g, and a pinch of salt so the coffee comes through',
				daysAgo: 170,
				ingredientsText: TIRAMISU_INGREDIENTS_V2,
				stepsText: TIRAMISU_STEPS_V2
			},
			{
				message: 'Grated dark chocolate over each layer of cream',
				daysAgo: 40,
				ingredientsText: TIRAMISU_INGREDIENTS_V3,
				stepsText: TIRAMISU_STEPS_V3
			}
		]
	},
	{
		key: 'sauerkraut',
		author: 'leo_ferments',
		tags: ['Fermentation', 'Preserves', 'Vegan'],
		visibility: 'public',
		daysAgo: 230,
		first: content({
			title: 'Sauerkraut',
			description:
				'Cabbage and salt, massaged until it weeps, packed under its own brine and left to sour for a few weeks.',
			makes: 'about 1 L',
			prepTimeMinutes: 30,
			restTimeMinutes: 40320,
			ingredientsText: KRAUT_INGREDIENTS_V1,
			stepsText: KRAUT_STEPS_V1,
			equipment: 'A 1 litre jar, a small weight that fits inside its neck, kitchen scales',
			storage: 'In the fridge for months; it keeps slowly souring'
		}),
		changes: [
			{
				message: 'Salt at 2.5% instead of 2%: a crunchier kraut in a warm kitchen',
				daysAgo: 100,
				ingredientsText: KRAUT_INGREDIENTS_V2,
				stepsText: KRAUT_STEPS_V2
			}
		]
	},
	{
		key: 'quick-pickled-red-onions',
		author: 'wren_preserves',
		tags: ['Pickles', 'Preserves', 'Vegan'],
		visibility: 'public',
		daysAgo: 210,
		first: content({
			title: 'Quick-Pickled Red Onions',
			description:
				'Sharp, pink and crisp in an hour: thin-sliced red onions under a warm vinegar brine, for tacos, salads and sandwiches.',
			makes: '1 jar (about 500 ml)',
			prepTimeMinutes: 10,
			cookTimeMinutes: 5,
			restTimeMinutes: 90,
			ingredientsText: PICKLE_INGREDIENTS_V1,
			stepsText: PICKLE_STEPS_V1,
			storage: 'Refrigerated in the jar, up to 3 weeks'
		}),
		changes: [
			{
				message: 'Less sugar and a dried chilli in the jar: sharper, with a slow heat',
				daysAgo: 90,
				ingredientsText: PICKLE_INGREDIENTS_V2,
				stepsText: PICKLE_STEPS_V2
			}
		]
	},
	{
		key: 'strawberry-jam',
		author: 'wren_preserves',
		tags: ['Preserves', 'Jam', 'Summer'],
		visibility: 'friends',
		daysAgo: 300,
		first: content({
			title: 'Strawberry Jam',
			description:
				'A soft-set jam with whole pieces of fruit, macerated first so the berries hold together through a short, hard boil.',
			makes: 'about 4 jars',
			prepTimeMinutes: 20,
			cookTimeMinutes: 25,
			restTimeMinutes: 255,
			ingredientsText: JAM_INGREDIENTS_V1,
			stepsText: JAM_STEPS_V1,
			equipment: 'A wide preserving pan, a sugar thermometer, a jam funnel',
			storage: 'Sealed, in a cool cupboard for a year; once open, in the fridge for a month'
		}),
		changes: [
			{
				message: 'Less sugar, 650 g, for a fruitier jam; it needs a few more minutes to set',
				daysAgo: 220,
				ingredientsText: JAM_INGREDIENTS_V2,
				stepsText: JAM_STEPS_V2
			},
			{
				message: 'A spoonful of balsamic and some black pepper stirred in at the end',
				daysAgo: 30,
				ingredientsText: JAM_INGREDIENTS_V3,
				stepsText: JAM_STEPS_V3
			}
		]
	},
	{
		key: 'apple-pie',
		author: 'grace_bakes',
		tags: ['Baking', 'Dessert', 'American', 'Pie'],
		visibility: 'public',
		daysAgo: 350,
		first: content({
			title: 'Apple Pie',
			description:
				'A double-crust pie with an all-butter pastry and a filling of tart and sweet apples, baked until the juices bubble thick.',
			makes: 'one 9-inch pie',
			prepTimeMinutes: 45,
			cookTimeMinutes: 65,
			restTimeMinutes: 180,
			ingredientsText: PIE_INGREDIENTS,
			stepsText: PIE_STEPS_V1,
			makeAhead: 'The dough keeps 3 days chilled or 3 months frozen'
		}),
		changes: [
			{
				message:
					'Cook the filling for 10 minutes first, so the apples stop shrinking away from the top crust',
				daysAgo: 240,
				stepsText: PIE_STEPS_V2,
				cookTimeMinutes: 75
			},
			{
				message: 'A lattice top instead of a full lid, so the filling reduces as it bakes',
				daysAgo: 50,
				stepsText: PIE_STEPS_V3
			}
		]
	},
	{
		key: 'smoked-brisket',
		author: 'nate_smokes',
		tags: ['Barbecue', 'Beef', 'Smoking'],
		visibility: 'public',
		daysAgo: 330,
		first: content({
			title: 'Smoked Brisket',
			description:
				'A whole packer brisket with a salt and pepper bark, smoked low over oak for most of a day and wrapped in butcher paper through the stall.',
			servings: 12,
			prepTimeMinutes: 30,
			cookTimeMinutes: 720,
			restTimeMinutes: 1500,
			ingredientsText: BRISKET_INGREDIENTS_V1,
			stepsText: BRISKET_STEPS_V1,
			equipment: 'A smoker, a probe thermometer, a cooler big enough for the brisket',
			reheating: 'Wrapped in foil with a splash of broth, at 275°F until warm through'
		}),
		changes: [
			{
				message: 'Wrap at 170°F with tallow smeared on the paper, for a juicier flat',
				daysAgo: 210,
				ingredientsText: BRISKET_INGREDIENTS_V2,
				stepsText: BRISKET_STEPS_V2
			},
			{
				message:
					'Hold it 2–3 hours in the cooler instead of 1: more tender, and the juices stay in',
				daysAgo: 70,
				stepsText: BRISKET_STEPS_V3,
				restTimeMinutes: 1620
			}
		]
	},
	{
		key: 'pulled-pork',
		author: 'nate_smokes',
		tags: ['Barbecue', 'Pork', 'Smoking'],
		visibility: 'friends',
		daysAgo: 270,
		first: content({
			title: 'Pulled Pork',
			description:
				'A pork shoulder with a sweet paprika rub, smoked until the bone slides out and pulled into its own juices.',
			servings: 10,
			prepTimeMinutes: 20,
			cookTimeMinutes: 720,
			restTimeMinutes: 60,
			ingredientsText: PORK_INGREDIENTS,
			stepsText: PORK_STEPS_V1,
			storage: 'In its juices in the fridge, up to 4 days',
			reheating: 'Covered, in a low oven or a pan with a splash of vinegar'
		}),
		changes: [
			{
				message: 'Rub it the night before so the salt goes deeper',
				daysAgo: 120,
				stepsText: PORK_STEPS_V2,
				restTimeMinutes: 780
			}
		]
	},
	{
		key: 'cashew-alfredo',
		author: 'theo_vegan',
		tags: ['Vegan', 'Pasta', 'Dinner'],
		visibility: 'public',
		daysAgo: 150,
		first: content({
			title: 'Cashew Alfredo',
			description:
				'Fettuccine in a creamy, garlicky sauce of soaked cashews, nutritional yeast and lemon: no dairy, no roux.',
			servings: 4,
			prepTimeMinutes: 15,
			cookTimeMinutes: 15,
			restTimeMinutes: 120,
			ingredientsText: `150 g raw cashews
240 ml water
2 tbsp olive oil
3 cloves garlic, minced
3 tbsp nutritional yeast
1 tbsp lemon juice
1 tsp white miso
½ tsp fine sea salt, plus more for the pasta water
350 g fettuccine
freshly ground black pepper
a handful of parsley, chopped`,
			stepsText: `Cover the cashews with cold water and soak for 2 hours, then drain and rinse.

Warm the oil in a small pan over low heat and cook the garlic gently for 2 minutes, until soft but not coloured.

Blend the cashews, the garlic and its oil, the 240 ml water, nutritional yeast, lemon juice, miso and salt until completely smooth, 1–2 minutes.

Cook the fettuccine in well-salted boiling water until al dente. Keep a mugful of the water, then drain.

Pour the sauce into the empty pot over low heat, add the pasta and toss, loosening with pasta water until glossy. Season with pepper and finish with parsley.`
		})
	},
	{
		key: 'lemon-drizzle-cake',
		author: 'hannah_k',
		tags: ['Baking', 'Cake', 'British'],
		visibility: 'private',
		daysAgo: 250,
		withdrawn: { from: 'public', daysAgo: 20 },
		first: content({
			title: 'Lemon Drizzle Cake',
			description:
				'A buttery lemon loaf soaked while hot with lemon juice and sugar, which sets into a sharp, crackly crust.',
			makes: '1 loaf',
			prepTimeMinutes: 20,
			cookTimeMinutes: 50,
			restTimeMinutes: 60,
			ingredientsText: DRIZZLE_INGREDIENTS_V1,
			stepsText: DRIZZLE_STEPS_V1,
			storage: 'Wrapped, at room temperature, up to 4 days'
		}),
		changes: [
			{
				message: 'Greek yogurt instead of milk, for a damper, tangier crumb',
				daysAgo: 120,
				ingredientsText: DRIZZLE_INGREDIENTS_V2,
				stepsText: DRIZZLE_STEPS_V2
			}
		]
	},
	{
		key: 'lemon-thyme-drizzle-cake',
		author: 'wren_preserves',
		tags: ['Baking', 'Cake'],
		visibility: 'public',
		daysAgo: 140,
		forkOf: { key: 'lemon-drizzle-cake', version: 1 },
		changes: [
			{
				message: 'Fresh thyme in the batter and stirred into the drizzle',
				daysAgo: 100,
				title: 'Lemon Thyme Drizzle Cake',
				description:
					'The lemon drizzle loaf with fresh thyme in the batter and the drizzle, for a faintly savoury, herby edge.',
				ingredientsText: THYME_INGREDIENTS,
				stepsText: THYME_STEPS
			}
		]
	},
	{
		key: 'west-african-peanut-stew',
		author: 'amara_eats',
		tags: ['West African', 'Stew', 'Vegan', 'Dinner'],
		visibility: 'public',
		daysAgo: 200,
		trashedDaysAgo: 10,
		first: content({
			title: 'West African Peanut Stew',
			description:
				'Sweet potato and kale in a tomato and peanut broth, warmed through with ginger and a whole scotch bonnet.',
			servings: 6,
			prepTimeMinutes: 20,
			cookTimeMinutes: 45,
			ingredientsText: STEW_INGREDIENTS_V1,
			stepsText: STEW_STEPS_V1,
			storage: 'Chilled, up to 4 days; it thickens, so loosen with water',
			reheating: 'Gently in a pan with a splash of water'
		}),
		changes: [
			{
				message: 'A can of chickpeas with the kale, for more body',
				daysAgo: 80,
				ingredientsText: STEW_INGREDIENTS_V2,
				stepsText: STEW_STEPS_V2
			}
		]
	},
	{
		key: 'groundnut-soup-with-chicken',
		author: 'kofi_mensah',
		tags: ['West African', 'Ghanaian', 'Soup', 'Chicken'],
		visibility: 'public',
		daysAgo: 150,
		forkOf: { key: 'west-african-peanut-stew', version: 1 },
		changes: [
			{
				message:
					'Chicken thighs simmered in, no sweet potato or kale, and more stock for a thinner soup the way it is made at home',
				daysAgo: 110,
				title: 'Groundnut Soup with Chicken',
				description:
					'A thinner peanut soup with bone-in chicken thighs simmered in it until tender, for ladling over rice balls or fufu.',
				cookTimeMinutes: 65,
				ingredientsText: GROUNDNUT_INGREDIENTS,
				stepsText: GROUNDNUT_STEPS
			}
		]
	},
	{
		key: 'sticky-toffee-pudding',
		author: 'hannah_k',
		tags: ['British', 'Dessert', 'Baking'],
		visibility: 'public',
		daysAgo: 190,
		first: content({
			title: 'Sticky Toffee Pudding',
			description:
				'A soft date sponge soaked with dark toffee sauce while warm, served with more sauce and cold cream.',
			servings: 8,
			prepTimeMinutes: 25,
			cookTimeMinutes: 35,
			restTimeMinutes: 30,
			ingredientsText: STP_INGREDIENTS_V1,
			stepsText: STP_STEPS_V1,
			makeAhead:
				'Bake a day ahead and reheat, covered, at 160°C for 20 minutes; the sauce keeps a week'
		}),
		changes: [
			{
				message: 'A spoonful of black treacle in the sauce, for a darker, less sweet toffee',
				daysAgo: 60,
				ingredientsText: STP_INGREDIENTS_V2,
				stepsText: STP_STEPS_V2
			}
		]
	},
	{
		key: 'one-pot-tomato-pasta',
		author: 'sam_weeknights',
		tags: ['Pasta', 'Weeknight', 'Vegetarian', 'One pot'],
		visibility: 'public',
		daysAgo: 90,
		first: content({
			title: 'One-Pot Tomato Pasta',
			description:
				'Spaghetti cooked straight in garlicky tomato water, so the starch thickens it into a sauce: one pan, twenty-five minutes.',
			servings: 4,
			prepTimeMinutes: 10,
			cookTimeMinutes: 15,
			ingredientsText: `3 tbsp olive oil
4 cloves garlic, thinly sliced
½ tsp chilli flakes
400 g spaghetti
1 can (400 g) cherry tomatoes
250 g fresh cherry tomatoes, halved
4 cups water
1 tsp salt
a big handful of basil
grated parmesan, to serve`,
			stepsText: `Warm the oil in a wide, deep pan over medium heat and cook the garlic and chilli for a minute, until the garlic just turns gold.

Add the pasta, snapped in half if it doesn't fit, both kinds of tomatoes, the water and salt. Bring to a boil, pressing the pasta under as it softens.

Boil, stirring often so it doesn't stick, for 10–12 minutes, until the pasta is al dente and the water has cooked down to a glossy sauce. Add a splash more water if it dries out before the pasta is done.

Tear in the basil, season with pepper and serve with parmesan.`
		})
	},
	{
		key: 'nettle-and-potato-soup',
		author: 'freya_garden',
		tags: ['Soup', 'Foraging', 'Spring', 'Vegetarian'],
		visibility: 'public',
		daysAgo: 180,
		first: content({
			title: 'Nettle and Potato Soup',
			description:
				'Young spring nettles wilted into a leek and potato soup at the last minute, so it stays bright green and tastes of the hedgerow.',
			servings: 4,
			prepTimeMinutes: 20,
			cookTimeMinutes: 30,
			ingredientsText: NETTLE_INGREDIENTS_V1,
			stepsText: NETTLE_STEPS_V1,
			notes:
				'Pick only the top four to six leaves of young plants, before they flower, away from roads.'
		}),
		changes: [
			{
				message: 'A handful of wild garlic in with the nettles',
				daysAgo: 30,
				ingredientsText: NETTLE_INGREDIENTS_V2,
				stepsText: NETTLE_STEPS_V2
			}
		]
	}
];
