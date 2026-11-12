// Varied seed recipes, part A: mostly spencerfletcher's own shelf (weeknight
// staples, a trashed one, a private one), the chilli and shortbread fork
// chains, and a few other cooks. Steps are edited in place across versions so
// position-matched diffs read as single changes.
import { content, type VariedRecipe } from './types.js';

// ─── Sheet-pan lemon chicken ─────────────────────────────────────────────────

const LEMON_CHICKEN_INGREDIENTS = `8 bone-in, skin-on chicken thighs (about 3 lb)
1½ lb small potatoes, halved
1 red onion, cut into wedges
2 lemons
4 cloves garlic, smashed
3 tbsp olive oil
1 tsp dried oregano
1½ tsp kosher salt
½ tsp black pepper
2 tbsp chopped parsley, to finish`;

const LEMON_CHICKEN_STEPS_V1 = `Preheat the oven to 425°F with a rack in the middle.

Toss the potatoes and onion with 1 tbsp of the oil and half the salt on a large rimmed sheet pan, and spread them out.

Zest one lemon into a bowl and stir in the remaining oil, the garlic, oregano, the rest of the salt and the pepper. Rub it over the chicken and lay the thighs skin side up among the potatoes. Halve the zested lemon and slice the other, and tuck both around the pan.

Roast for 40 minutes, until the skin is golden and the thickest thigh reads 175°F. Squeeze the roasted lemon halves over everything and scatter with parsley.`;

const LEMON_CHICKEN_STEPS_V2 = `Preheat the oven to 450°F with a rack in the middle.

Toss the potatoes and onion with 1 tbsp of the oil and half the salt on a large rimmed sheet pan, and spread them out.

Pat the chicken thighs very dry with paper towels. Zest one lemon into a bowl and stir in the remaining oil, the garlic, oregano, the rest of the salt and the pepper. Rub it over the chicken and lay the thighs skin side up among the potatoes, keeping the skin clear of the lemon slices. Halve the zested lemon and slice the other, and tuck both around the pan.

Roast for 35 minutes, until the skin is deep golden and crackling and the thickest thigh reads 175°F. Squeeze the roasted lemon halves over everything and scatter with parsley.
tip: If the skin is still pale, slide the pan under the broiler for 2 minutes.`;

// ─── Roasted tomato sauce ────────────────────────────────────────────────────

const TOMATO_SAUCE_INGREDIENTS_V1 = `1 kg ripe plum tomatoes, halved lengthways
1 onion, cut into wedges
6 cloves garlic, unpeeled
60 ml olive oil
1 tsp sugar
a few sprigs of thyme
salt to taste`;

const TOMATO_SAUCE_INGREDIENTS_V2 = `${TOMATO_SAUCE_INGREDIENTS_V1}
1 tbsp red wine vinegar`;

const TOMATO_SAUCE_STEPS_V1 = `Preheat the oven to 200°C.

Toss the tomatoes, onion and garlic with the oil and sugar in a roasting tin, then turn the tomatoes cut side up and lay the thyme on top.

Roast for 45 minutes, until the tomatoes have collapsed and are catching at the edges.

Squeeze the garlic out of its skins, pick out the thyme stalks and blend everything, juices and all, until smooth. Simmer in a saucepan for 10 minutes to thicken, then season with salt to taste.`;

const TOMATO_SAUCE_STEPS_V2 = `Preheat the oven to 200°C.

Toss the tomatoes, onion and garlic with the oil and sugar in a roasting tin, then turn the tomatoes cut side up and lay the thyme on top.

Roast for 45 minutes, until the tomatoes have collapsed and are catching at the edges.

Squeeze the garlic out of its skins, pick out the thyme stalks and blend everything, juices and all, until smooth. Simmer in a saucepan for 10 minutes to thicken, then stir in the vinegar and season with salt to taste.`;

// ─── Cornbread with honey butter ─────────────────────────────────────────────

const CORNBREAD_INGREDIENTS = (sugar: string) => `# Cornbread
1 cup yellow cornmeal
1 cup all-purpose flour
${sugar}
1 tbsp baking powder
½ tsp baking soda
¾ tsp salt
1¼ cups buttermilk
2 large eggs
6 tbsp unsalted butter, divided

# Honey butter
½ cup salted butter, softened
3 tbsp honey`;

const CORNBREAD_STEPS = `# Cornbread
Preheat the oven to 400°F. Put 2 tbsp of the unsalted butter in an 8-inch square metal pan and slide it into the oven to melt while it heats.

Melt the remaining 4 tbsp of unsalted butter. Whisk the cornmeal, flour, sugar, baking powder, baking soda and salt in a large bowl. In another bowl whisk the buttermilk, eggs and melted butter.

Stir the wet ingredients into the dry just until no dry flour shows; a lumpy batter makes a tender crumb.

Take the hot pan out and swirl the butter to coat it, then pour in the batter, which should sizzle. Bake 20 to 25 minutes, until golden and a toothpick comes out clean. Cool in the pan for 10 minutes, then cut into 9 squares.

# Honey butter
Beat the salted butter with the honey until light and fluffy, and serve it with the warm cornbread.`;

// ─── Buttermilk pancakes ─────────────────────────────────────────────────────

const PANCAKE_INGREDIENTS = `2 cups (250 g) all-purpose flour
2 tbsp sugar
2 tsp baking powder
½ tsp baking soda
½ tsp salt
2 cups buttermilk (or 2 cups milk plus 2 tbsp lemon juice)
2 large eggs
45 g unsalted butter, melted, plus more for the pan`;

const PANCAKE_STEPS = (
	rest: string,
	cook: string
) => `Whisk the flour, sugar, baking powder, baking soda and salt in a large bowl.

In another bowl whisk the buttermilk, eggs and melted butter.

Pour the wet ingredients into the dry and stir with a fork until just combined; a few lumps are fine.${rest}

${cook}`;

const PANCAKE_REST =
	' Let the batter rest for 10 minutes so the flour hydrates and the leaveners get going; the pancakes rise taller.';

const PANCAKE_COOK_V1 =
	'Heat a griddle or large skillet over medium heat and butter it lightly. Pour ¼ cup of batter per pancake and cook until bubbles pop on top and the edges look dry, 2 to 3 minutes, then flip and cook 1 to 2 minutes more. Keep the finished pancakes warm in a low oven while you cook the rest.';

const PANCAKE_COOK_V4 =
	'Heat a griddle or large skillet over medium-low heat, then wipe it with a little butter on a paper towel. Pour ¼ cup of batter per pancake and cook until bubbles pop on top and the edges look dry, 3 to 4 minutes, then flip and cook 2 minutes more. Wipe the pan again between batches and keep the finished pancakes warm in a low oven.\ntip: A first pancake that browns in under 2 minutes means the pan is too hot.';

// ─── Weeknight fried rice ────────────────────────────────────────────────────

const FRIED_RICE_INGREDIENTS_V1 = `3 cups cooked rice, cold (ideally a day old)
2 tbsp neutral oil
3 large eggs, beaten
4 green onions, sliced, whites and greens kept apart
2 cloves garlic, minced
1 cup frozen peas and carrots
2 tbsp soy sauce
1 tsp toasted sesame oil
¼ tsp white pepper`;

const FRIED_RICE_INGREDIENTS_V2 = `3 cups cooked rice, cold (ideally a day old)
2 tbsp neutral oil
3 large eggs, beaten
4 green onions, sliced, whites and greens kept apart
2 cloves garlic, minced
1 cup frozen peas and carrots
1 tbsp soy sauce
1 tbsp oyster sauce
1 tsp toasted sesame oil
¼ tsp white pepper`;

const FRIED_RICE_STEPS = (
	sauce: string
) => `Break up any clumps of rice with your hands so every grain is loose.

Heat 1 tbsp of the oil in a wok or large skillet over high heat. Scramble the eggs until just set, about 1 minute, then tip them onto a plate.

Add the remaining oil, then the green onion whites and garlic, and stir for 30 seconds. Add the peas and carrots and stir-fry for 2 minutes.

Add the rice, press it flat and leave it for a minute to toast before tossing. Stir-fry for 3 to 4 minutes, until hot through and some grains crisp.

${sauce}`;

const FRIED_RICE_SAUCE_V1 =
	'Drizzle the soy sauce around the edge of the wok, add the sesame oil and pepper, return the eggs and toss everything together. Scatter with the green onion tops.';

const FRIED_RICE_SAUCE_V2 =
	'Stir the soy and oyster sauces together, drizzle them around the edge of the wok, add the sesame oil and pepper, return the eggs and toss everything together. Scatter with the green onion tops.';

// ─── Braised short ribs ──────────────────────────────────────────────────────

const SHORT_RIBS_INGREDIENTS = `# Short ribs
5 lb bone-in beef short ribs (about 8 pieces)
2 tsp kosher salt
1 tsp black pepper
2 tbsp olive oil
1 onion, chopped
4 cloves garlic, smashed
2 tbsp tomato paste
1 bottle (750 ml) dry red wine
2 cups beef stock
4 sprigs thyme
2 bay leaves
3 carrots, cut into 2-inch pieces
2 parsnips, cut into 2-inch pieces
12 pearl onions, peeled

# Gremolata
2 tbsp freshly grated horseradish
1 lemon, zested
½ cup chopped parsley
1 small clove garlic, finely grated`;

const SHORT_RIBS_STEPS = (braise: string, finish: string) => `# Short ribs
Season the ribs all over with the salt and pepper.

Preheat the oven to 325°F. Heat the oil in a large Dutch oven over medium-high heat and brown the ribs well on every side, in batches, about 15 minutes in all; set them aside.

Pour off all but 1 tbsp of the fat. Cook the onion for 5 minutes, then add the garlic and tomato paste and cook for 2 minutes more. Pour in the wine and boil until reduced by half, about 10 minutes.

${braise}

${finish}

# Gremolata
Mix the horseradish, lemon zest, parsley and garlic, and scatter it over the ribs just before serving.`;

const SHORT_RIBS_BRAISE_V1 =
	'Add the stock, thyme, bay leaves, carrots, parsnips and pearl onions, then nestle the ribs in bone side up; the liquid should come most of the way up them. Bring to a simmer, cover and braise in the oven for 3 hours, until the meat pulls away from the bone.';

const SHORT_RIBS_FINISH_V1 =
	'Lift out the ribs and vegetables, skim the fat from the pot and simmer the sauce on the stove for 10 minutes until it coats a spoon.';

const SHORT_RIBS_BRAISE_V2 =
	'Add the stock, thyme and bay leaves, then nestle the ribs in bone side up; the liquid should come most of the way up them. Bring to a simmer, cover and braise in the oven for 2 hours.';

const SHORT_RIBS_FINISH_V2 =
	'Tuck the carrots, parsnips and pearl onions around the ribs, cover and braise for 45 minutes more, until the meat pulls away from the bone and the vegetables are tender. Lift out the ribs and vegetables, skim the fat from the pot and simmer the sauce on the stove for 10 minutes until it coats a spoon.';

// ─── Sunday roast chicken ────────────────────────────────────────────────────

const ROAST_CHICKEN_INGREDIENTS_V1 = `1 whole chicken (about 4 lb)
2 tsp kosher salt
½ tsp black pepper
2 tbsp unsalted butter, softened
1 lemon, halved
1 head garlic, halved crosswise
4 sprigs thyme`;

const ROAST_CHICKEN_VEG = `1 lb carrots, cut into chunks
1½ lb small potatoes, halved
1 tbsp olive oil`;

const ROAST_CHICKEN_INGREDIENTS_V2 = `${ROAST_CHICKEN_INGREDIENTS_V1}
${ROAST_CHICKEN_VEG}`;

const ROAST_CHICKEN_INGREDIENTS_V3 = `1 whole chicken (about 4 lb)
1 tbsp kosher salt
½ tsp black pepper
2 tbsp unsalted butter, softened
1 lemon, halved
1 head garlic, halved crosswise
4 sprigs thyme
${ROAST_CHICKEN_VEG}`;

const ROAST_CHICKEN_GRAVY = `1 tbsp all-purpose flour
1 cup chicken stock`;

const ROAST_CHICKEN_INGREDIENTS_V4 = `${ROAST_CHICKEN_INGREDIENTS_V3}
${ROAST_CHICKEN_GRAVY}`;

const ROAST_CHICKEN_INGREDIENTS_V5 = `1 whole chicken (about 4 lb)
1 tbsp kosher salt
½ tsp black pepper
3 tbsp unsalted butter, softened
1 lemon, halved
1 head garlic, halved crosswise
4 sprigs thyme
${ROAST_CHICKEN_VEG}
${ROAST_CHICKEN_GRAVY}`;

const ROAST_CHICKEN_STEP_ROAST_V1 =
	'Tie the legs together and set the chicken breast side up in a roasting pan. Roast for 60 to 70 minutes, until the juices at the thigh run clear and it reads 165°F.';

const ROAST_CHICKEN_STEP_ROAST_V2 =
	'Toss the carrots and potatoes with the oil and a pinch of salt in a roasting pan. Tie the legs together and set the chicken breast side up on the vegetables. Roast for 60 to 70 minutes, stirring the vegetables once halfway, until the juices at the thigh run clear and it reads 165°F.';

const ROAST_CHICKEN_STEP_REST_V1 = 'Rest the chicken for 15 minutes before carving.';

const ROAST_CHICKEN_STEP_REST_V4 =
	'Lift the chicken onto a board and rest it for 15 minutes before carving, and move the vegetables to a warm dish. Meanwhile spoon off all but 2 tbsp of fat from the pan and put it over medium heat. Stir in the flour for a minute, then whisk in the stock and simmer for 5 minutes into a gravy.';

const ROAST_CHICKEN_STEPS_V1 = `Preheat the oven to 425°F with a rack in the lower third.

Pat the chicken dry inside and out with paper towels. Rub the butter all over the skin, season with the salt and pepper, and stuff the cavity with the lemon, garlic and thyme.

${ROAST_CHICKEN_STEP_ROAST_V1}

${ROAST_CHICKEN_STEP_REST_V1}`;

const ROAST_CHICKEN_STEPS_V2 = `Preheat the oven to 425°F with a rack in the lower third.

Pat the chicken dry inside and out with paper towels. Rub the butter all over the skin, season with the salt and pepper, and stuff the cavity with the lemon, garlic and thyme.

${ROAST_CHICKEN_STEP_ROAST_V2}

${ROAST_CHICKEN_STEP_REST_V1}`;

const ROAST_CHICKEN_BRINE =
	'The day before, pat the chicken dry inside and out, season it all over with the salt and refrigerate it uncovered on a plate overnight.';

const ROAST_CHICKEN_STEPS_V3 = `${ROAST_CHICKEN_BRINE}

Preheat the oven to 425°F with a rack in the lower third. Rub the butter all over the skin, season with the pepper, and stuff the cavity with the lemon, garlic and thyme.

${ROAST_CHICKEN_STEP_ROAST_V2}

${ROAST_CHICKEN_STEP_REST_V1}`;

const ROAST_CHICKEN_STEPS_V4 = `${ROAST_CHICKEN_BRINE}

Preheat the oven to 425°F with a rack in the lower third. Rub the butter all over the skin, season with the pepper, and stuff the cavity with the lemon, garlic and thyme.

${ROAST_CHICKEN_STEP_ROAST_V2}

${ROAST_CHICKEN_STEP_REST_V4}`;

const ROAST_CHICKEN_STEPS_V5 = `${ROAST_CHICKEN_BRINE}

Preheat the oven to 425°F with a rack in the lower third. Loosen the breast skin with your fingers and push half the butter underneath, then rub the rest over the skin. Season with the pepper and stuff the cavity with the lemon, garlic and thyme.

${ROAST_CHICKEN_STEP_ROAST_V2}

${ROAST_CHICKEN_STEP_REST_V4}`;

// ─── Basil pesto ─────────────────────────────────────────────────────────────

const PESTO_INGREDIENTS = `60 g fresh basil leaves (about 2 packed cups)
40 g pine nuts or walnuts
1 clove garlic
50 g Parmigiano Reggiano, finely grated
120 ml extra-virgin olive oil
½ tsp salt
1 tsp lemon juice`;

const PESTO_STEPS = (
	basil: string
) => `Toast the nuts in a dry pan over medium-low heat, shaking often, until golden, 3 to 4 minutes. Tip them onto a plate to cool.

Pulse the garlic and nuts in a food processor until finely chopped.

${basil}

With the motor running, pour in the oil in a thin stream. Stir in the cheese and lemon juice by hand, so the cheese is not heated by the blade.`;

const PESTO_BASIL_V1 =
	'Add the basil and salt and pulse to a coarse paste, scraping down the sides once or twice.';

const PESTO_BASIL_V2 =
	'Drop the basil into boiling water for 10 seconds, plunge it into ice water, then squeeze it dry. Add it to the processor with the salt and pulse to a coarse paste, scraping down the sides once or twice.';

// ─── Chilli con carne and its vegan fork ─────────────────────────────────────

const CHILLI_INGREDIENTS_V1 = `2 tbsp olive oil
1 large onion, diced
1 red bell pepper, diced
3 cloves garlic, minced
500 g ground beef
2 tbsp chilli powder
2 tsp ground cumin
1 tsp smoked paprika
1 tsp dried oregano
2 tbsp tomato paste
2 × 400 g cans chopped tomatoes
2 × 400 g cans kidney beans, drained
250 ml beef stock
1 tsp salt`;

const CHILLI_INGREDIENTS_V2 = `${CHILLI_INGREDIENTS_V1}
15 g dark chocolate, chopped`;

const CHILLI_STEPS = (
	garlic: string,
	simmer: string,
	beans: string
) => `Heat the oil in a large heavy pot over medium heat. Add the onion and pepper and cook until soft, about 8 minutes.

${garlic}

Stir in the chilli powder, cumin, paprika, oregano and tomato paste and cook for 2 minutes, until the paste darkens.

${simmer}

${beans}`;

const CHILLI_GARLIC_BEEF =
	'Add the garlic and cook for 1 minute. Turn the heat up, add the beef and brown it, breaking it up, for 8 to 10 minutes.';

const CHILLI_SIMMER = (minutes: number) =>
	`Add the tomatoes, stock and salt. Bring to a boil, then simmer partly covered for ${minutes} minutes, stirring now and then.`;

const CHILLI_BEANS_V1 =
	'Stir in the beans and simmer 15 minutes more. Taste for salt and heat before serving.';

const CHILLI_BEANS_V2 =
	'Stir in the beans and chocolate and simmer 15 minutes more. Taste for salt and heat before serving.';

const VEGAN_CHILLI_INGREDIENTS_V2 = `2 tbsp olive oil
1 large onion, diced
1 red bell pepper, diced
3 cloves garlic, minced
200 g dried brown lentils, rinsed
2 tbsp chilli powder
2 tsp ground cumin
1 tsp smoked paprika
1 tsp dried oregano
2 tbsp tomato paste
2 × 400 g cans chopped tomatoes
2 × 400 g cans kidney beans, drained
750 ml vegetable stock
1 tsp salt
15 g dairy-free dark chocolate, chopped`;

const VEGAN_CHILLI_INGREDIENTS_V3 = `2 tbsp olive oil
1 large onion, diced
1 red bell pepper, diced
3 cloves garlic, minced
2 tbsp chilli powder
2 tsp ground cumin
1 tsp smoked paprika
1 tsp dried oregano
2 tbsp tomato paste
2 × 400 g cans chopped tomatoes
1 × 400 g can kidney beans, drained
1 × 400 g can black beans, drained
1 × 400 g can pinto beans, drained
250 ml vegetable stock
1 tsp salt
15 g dairy-free dark chocolate, chopped`;

// ─── Lemon bars ──────────────────────────────────────────────────────────────

const LEMON_BARS_INGREDIENTS = (zest: string) => `# Crust
1 cup (125 g) all-purpose flour
¼ cup powdered sugar
¼ tsp salt
½ cup (113 g) cold unsalted butter, cubed

# Filling
1 cup granulated sugar
3 tbsp all-purpose flour
3 large eggs
${zest}
½ cup fresh lemon juice (3 to 4 lemons)
powdered sugar, to dust`;

const LEMON_BARS_STEPS = (filling: string) => `# Crust
Preheat the oven to 350°F. Line an 8-inch square pan with parchment, leaving an overhang on two sides.

Pulse the flour, powdered sugar and salt in a food processor, add the butter and pulse to fine crumbs. Press evenly into the pan and bake for 20 minutes, until pale golden at the edges.

# Filling
${filling}

Pour the filling over the hot crust, lower the oven to 325°F and bake for 18 to 22 minutes, until the centre barely jiggles.

Cool on a rack to room temperature, about 1 hour, then chill for 2 hours before lifting out and cutting into 16 bars. Dust with powdered sugar.`;

const LEMON_BARS_FILLING_V1 =
	'While the crust bakes, whisk the sugar and flour together, then whisk in the eggs, lemon zest and juice until smooth.';

const LEMON_BARS_FILLING_V2 =
	'While the crust bakes, rub the lemon zest into the sugar with your fingertips until fragrant, then whisk in the flour, eggs and juice until smooth.';

// ─── Green shakshuka ─────────────────────────────────────────────────────────

const GREEN_SHAKSHUKA_INGREDIENTS = `2 tbsp olive oil
1 onion
1 green chilli
3 cloves garlic
1 tsp ground cumin
½ tsp ground coriander
1 bunch Swiss chard (about 250 g)
300 g spinach
4 tbsp water
1 tsp salt
6 eggs
100 g feta, crumbled
a handful of dill and parsley, to finish`;

const GREEN_SHAKSHUKA_STEPS = `Warm the oil in a wide pan over medium heat. Add the sliced onion, the chard stems, sliced, and the chilli, finely chopped, and cook until soft, about 8 minutes.

Stir in the sliced garlic, cumin and coriander and cook for a minute, until fragrant.

Add the shredded chard leaves and the spinach in handfuls with the salt and water, and cook until wilted and most of the liquid has gone, about 5 minutes, so the greens are thick enough to hold a well.

Make six wells, crack an egg into each and scatter the feta around them. Cover and cook for 6 to 8 minutes, until the whites set and the yolks still wobble. Scatter with the herbs.`;

// ─── Maple pecan granola ─────────────────────────────────────────────────────

const GRANOLA_INGREDIENTS_V1 = `400 g rolled oats
150 g pecans, roughly chopped
50 g pumpkin seeds
50 g desiccated coconut
1 tsp ground cinnamon
1 tsp fine sea salt
160 ml maple syrup
80 ml olive oil or melted coconut oil
1 tsp vanilla extract
120 g dried cherries`;

const GRANOLA_INGREDIENTS_V2 = `${GRANOLA_INGREDIENTS_V1}
1 egg white`;

const GRANOLA_STEPS = (
	wet: string
) => `Preheat the oven to 160°C and line a large baking tray with parchment.

Mix the oats, pecans, pumpkin seeds, coconut, cinnamon and salt in a large bowl.

${wet}

Spread it over the tray and press it down firmly with the back of a spatula. Bake for 40 to 45 minutes, turning the tray halfway but not stirring, until deep golden.

Leave to cool completely on the tray, about 45 minutes, so it crisps into clusters, then break it up and stir in the cherries.`;

const GRANOLA_WET_V1 =
	'Warm the maple syrup, oil and vanilla together, pour over the dry ingredients and stir until everything is coated.';

const GRANOLA_WET_V2 =
	'Warm the maple syrup, oil and vanilla together, pour over the dry ingredients and stir until everything is coated. Whisk the egg white until frothy and stir it through; it binds the oats into bigger clusters.';

// ─── Shortbread and its brown butter fork ────────────────────────────────────

const SHORTBREAD_INGREDIENTS_V1 = `225 g unsalted butter, softened
100 g caster sugar
340 g plain flour
¼ tsp salt
1 tbsp caster sugar, for sprinkling`;

const SHORTBREAD_INGREDIENTS_V2 = `225 g unsalted butter, softened
100 g caster sugar
300 g plain flour
40 g cornflour
¼ tsp salt
1 tbsp caster sugar, for sprinkling`;

const SHORTBREAD_STEPS = (butter: string, flour: string, bake: string) => `${butter}

${flour}

Press the dough evenly into a 20 cm square tin lined with parchment, smooth the top and prick it all over with a fork. Chill for 30 minutes.

Preheat the oven to 160°C (140°C fan).

${bake}`;

const SHORTBREAD_BUTTER_V1 = 'Beat the butter and sugar until smooth and pale, about 2 minutes.';

const SHORTBREAD_FLOUR_V1 =
	'Add the flour and salt and mix on low until it just comes together into a soft dough.';

const SHORTBREAD_FLOUR_V2 =
	'Add the flour, cornflour and salt and mix on low until it just comes together into a soft dough.';

const SHORTBREAD_BAKE_V1 =
	'Bake for 35 to 40 minutes, until pale golden at the edges and firm in the middle. Sprinkle with sugar and cut into 16 fingers while warm, then leave to cool in the tin for 20 minutes before lifting out.';

const BROWN_BUTTER_SHORTBREAD_BUTTER =
	'Melt the butter in a light-coloured pan over medium heat and cook, swirling, until the milk solids are hazelnut brown and it smells nutty, 6 to 8 minutes. Pour it into a bowl, scraping in every brown bit, and refrigerate until solid again but soft enough to beat, about 2 hours. Beat it with the sugar until smooth, about 2 minutes.\ntip: Browning drives off water, so the solid brown butter weighs about what the original recipe’s butter did.';

const BROWN_BUTTER_SHORTBREAD_FLOUR =
	'Add the flour, rice flour and salt and mix on low until it just comes together into a soft dough.';

const BROWN_BUTTER_SHORTBREAD_BAKE =
	'Bake for 40 to 45 minutes, until golden all over and a shade darker at the edges. Sprinkle with sugar and cut into 16 fingers while warm, then leave to cool in the tin for 20 minutes before lifting out.';

// ─── Cacio e pepe ────────────────────────────────────────────────────────────

const CACIO_INGREDIENTS = (cheese: string) => `200 g spaghetti or tonnarelli
${cheese}
2 tsp black peppercorns
salt, for the pasta water`;

const CACIO_STEPS = (
	cheese: string
) => `Crack the peppercorns coarsely in a mortar and toast them in a wide dry pan over medium heat for 1 minute, until fragrant.

Boil the pasta in 1.5 litres of lightly salted water, so the water stays starchy, for 2 minutes less than the packet says.

Ladle 150 ml of the pasta water into the pepper pan. Lift the pasta straight in and toss over low heat for 1 minute.

${cheese}`;

const CACIO_CHEESE_V1 =
	'Take the pan off the heat and add the pecorino a handful at a time, tossing hard and adding splashes of pasta water until the sauce is creamy. Serve at once.';

const CACIO_CHEESE_V2 =
	'While the pasta cooks, mix the pecorino with 3 tbsp of pasta water in a bowl to a thick paste. Take the pan off the heat, add the paste and toss hard, adding splashes of pasta water until the sauce is creamy. Serve at once.\nwarning: If the pan is still sizzling, wait a minute; hot metal turns pecorino to clumps.';

// ─── Sunday ragù ─────────────────────────────────────────────────────────────

const RAGU_INGREDIENTS_V1 = `2 tbsp olive oil
100 g pancetta or unsmoked bacon, finely diced
1 onion, finely diced
1 carrot, finely diced
1 celery stalk, finely diced
400 g beef mince
300 g pork mince
150 ml dry white wine
250 ml whole milk
a pinch of nutmeg
400 g passata
250 ml beef stock
1 tsp salt
600 g tagliatelle, to serve
grated Parmigiano Reggiano, to serve`;

const RAGU_INGREDIENTS_V3 = `2 tbsp olive oil
100 g pancetta or unsmoked bacon, finely diced
1 onion, finely diced
1 carrot, finely diced
1 celery stalk, finely diced
400 g beef mince
300 g pork mince
2 tbsp tomato paste
150 ml dry white wine
250 ml whole milk
a pinch of nutmeg
400 g passata
250 ml beef stock
1 tsp salt
600 g tagliatelle, to serve
grated Parmigiano Reggiano, to serve`;

const RAGU_STEPS = (
	meat: string,
	wine: string
) => `Heat the oil in a heavy pot over medium heat and cook the pancetta for 5 minutes, until its fat runs. Add the onion, carrot and celery and cook gently for 10 minutes, until soft.

${meat}

${wine}

Stir in the passata, stock and salt. Bring to the barest simmer, partly cover and cook for 3 hours, stirring now and then and adding a splash of water if it gets dry.

Cook the tagliatelle, toss it with the ragù and a ladle of the pasta water, and serve with Parmigiano.`;

const RAGU_MEAT_V1 =
	'Turn the heat up, add the beef and pork and cook, breaking them up, until no longer pink, about 10 minutes.';

const RAGU_MEAT_V2 =
	'Turn the heat up, add the beef and pork and spread them out. Leave them alone until a brown crust forms underneath, then break them up and keep going until browned all over, about 15 minutes.';

const RAGU_WINE_V1 =
	'Add the wine and simmer until it has evaporated, about 5 minutes. Add the milk and nutmeg and simmer until absorbed, about 10 minutes.';

const RAGU_WINE_V3 =
	'Stir in the tomato paste and cook for 2 minutes, until it darkens. Add the wine and simmer until it has evaporated, about 5 minutes. Add the milk and nutmeg and simmer until absorbed, about 10 minutes.';

// ─── Black bean tacos ────────────────────────────────────────────────────────

const TACO_INGREDIENTS_V1 = `1 tbsp olive oil
½ onion, diced
2 cloves garlic, minced
1 tsp ground cumin
1 tsp chili powder
2 (15 oz) cans black beans, drained and rinsed
½ cup water
½ tsp salt
1 lime
8 small corn tortillas
1 avocado, sliced
½ cup crumbled cotija or feta
¼ cup chopped cilantro`;

const TACO_INGREDIENTS_V2 = `1 tbsp olive oil
½ onion, diced
2 cloves garlic, minced
1 tsp ground cumin
1 tsp chili powder
1 chipotle in adobo, chopped, plus 1 tsp of the sauce
2 (15 oz) cans black beans, drained and rinsed
½ cup water
½ tsp salt
1 lime
8 small corn tortillas
1 avocado, sliced
½ cup crumbled cotija or feta
¼ cup chopped cilantro`;

const TACO_STEPS = (
	spice: string
) => `Heat the oil in a skillet over medium heat and cook the onion until soft, about 5 minutes.

${spice}

Add the beans, water and salt and simmer, mashing about half the beans with a fork, until thick, about 5 minutes. Squeeze in the juice of half the lime and cut the rest into wedges.

Warm the tortillas in a dry skillet for 30 seconds a side, stacking them in a towel as they're done.

Fill each tortilla with beans, avocado, cheese and cilantro, and serve with the lime wedges.`;

const TACO_SPICE_V1 = 'Add the garlic, cumin and chili powder and stir for 1 minute.';

const TACO_SPICE_V2 =
	'Add the garlic, cumin, chili powder and chipotle with its sauce and stir for 1 minute.';

// ─── The recipes ─────────────────────────────────────────────────────────────

export const RECIPES_A: VariedRecipe[] = [
	{
		key: 'sheet-pan-lemon-chicken',
		author: 'spencerfletcher',
		tags: ['Dinner', 'Weeknight', 'Chicken', 'One pan'],
		visibility: 'public',
		daysAgo: 320,
		first: content({
			title: 'Sheet-Pan Lemon Chicken and Potatoes',
			description: 'Chicken thighs, potatoes and lemon roasted on one pan.',
			servings: 4,
			prepTimeMinutes: 15,
			cookTimeMinutes: 40,
			ingredientsText: LEMON_CHICKEN_INGREDIENTS,
			stepsText: LEMON_CHICKEN_STEPS_V1
		}),
		changes: [
			{
				message:
					'Roast at 450°F instead of 425°F and pat the thighs dry, for crisper skin in less time',
				daysAgo: 200,
				cookTimeMinutes: 35,
				stepsText: LEMON_CHICKEN_STEPS_V2
			},
			{
				message:
					'Describe it better, and allow 20 minutes of prep: trimming the thighs takes a while',
				daysAgo: 90,
				description:
					'Crisp-skinned thighs roasted hot over potatoes and red onion, finished with the juice of a roasted lemon. One pan, one hour.',
				prepTimeMinutes: 20
			}
		],
		tagsEditedDaysAgo: 60
	},
	{
		key: 'roasted-tomato-sauce',
		author: 'spencerfletcher',
		tags: ['Sauce', 'Vegetarian', 'Vegan', 'Make ahead'],
		visibility: 'public',
		daysAgo: 280,
		first: content({
			title: 'Roasted Tomato Sauce',
			description: 'Plum tomatoes roasted until jammy, then blended. For pasta, pizza or eggs.',
			makes: '500 ml',
			prepTimeMinutes: 10,
			cookTimeMinutes: 55,
			ingredientsText: TOMATO_SAUCE_INGREDIENTS_V1,
			stepsText: TOMATO_SAUCE_STEPS_V1,
			storage: 'Keeps 5 days in the fridge or 3 months frozen.'
		}),
		changes: [
			{
				message: 'Finish with a spoon of red wine vinegar to sharpen tomatoes that roasted sweet',
				daysAgo: 150,
				ingredientsText: TOMATO_SAUCE_INGREDIENTS_V2,
				stepsText: TOMATO_SAUCE_STEPS_V2
			}
		]
	},
	{
		key: 'cornbread-with-honey-butter',
		author: 'spencerfletcher',
		tags: ['Baking', 'Side', 'American'],
		visibility: 'friends',
		daysAgo: 240,
		first: content({
			title: 'Cornbread with Honey Butter',
			description: 'Buttermilk cornbread baked in a hot buttered pan for a crisp edge.',
			makes: '9 squares',
			prepTimeMinutes: 15,
			cookTimeMinutes: 25,
			restTimeMinutes: 10,
			ingredientsText: CORNBREAD_INGREDIENTS('¼ cup sugar'),
			stepsText: CORNBREAD_STEPS,
			equipment: '8-inch square metal pan'
		}),
		changes: [
			{
				message: 'Cut the sugar to 2 tbsp: with honey butter on top it was too sweet',
				daysAgo: 120,
				ingredientsText: CORNBREAD_INGREDIENTS('2 tbsp sugar')
			}
		]
	},
	{
		key: 'garlic-green-beans',
		author: 'spencerfletcher',
		tags: ['Side', 'Vegetarian', 'Weeknight'],
		visibility: 'private',
		daysAgo: 200,
		first: content({
			title: 'Blistered Garlic Green Beans',
			servings: 4,
			prepTimeMinutes: 10,
			cookTimeMinutes: 10,
			ingredientsText: `1 lb green beans, trimmed
1 tbsp neutral oil
1 tbsp butter
2-3 cloves garlic
1 tbsp soy sauce
a pinch of red pepper flakes
1 tsp toasted sesame seeds, to garnish (optional)`,
			stepsText: `Blanch the beans in a pot of boiling salted water for 3 minutes, then drain and rinse under cold water. Pat them dry.

Heat the oil in a large skillet over high heat and fry the beans, tossing only now and then, until blistered in spots, about 4 minutes.

Turn the heat to medium, add the butter and the garlic, thinly sliced, and cook for 1 minute until the garlic is pale gold.

Add the soy sauce and pepper flakes, toss and serve, with sesame seeds on top if you like.`
		})
	},
	{
		key: 'buttermilk-pancakes',
		author: 'spencerfletcher',
		tags: ['Breakfast', 'Vegetarian'],
		visibility: 'public',
		daysAgo: 380,
		first: content({
			title: 'Buttermilk Pancakes',
			description: 'Thick, fluffy weekend pancakes.',
			makes: '12 pancakes',
			prepTimeMinutes: 10,
			cookTimeMinutes: 20,
			ingredientsText: PANCAKE_INGREDIENTS,
			stepsText: PANCAKE_STEPS('', PANCAKE_COOK_V1)
		}),
		changes: [
			{
				message: 'Rest the batter 10 minutes before cooking for taller, more tender pancakes',
				daysAgo: 300,
				restTimeMinutes: 10,
				stepsText: PANCAKE_STEPS(PANCAKE_REST, PANCAKE_COOK_V1)
			},
			{
				message: 'Prep time was optimistic: measuring and mixing takes closer to 15 minutes',
				daysAgo: 210,
				prepTimeMinutes: 15
			},
			{
				message:
					'Cook over medium-low and wipe the pan with butter, so the pancakes brown evenly instead of in spots',
				daysAgo: 100,
				cookTimeMinutes: 25,
				stepsText: PANCAKE_STEPS(PANCAKE_REST, PANCAKE_COOK_V4)
			}
		]
	},
	{
		key: 'weeknight-fried-rice',
		author: 'spencerfletcher',
		tags: ['Dinner', 'Weeknight'],
		visibility: 'public',
		daysAgo: 300,
		first: content({
			title: 'Weeknight Fried Rice',
			description: 'Egg fried rice for the cold rice in the fridge.',
			servings: 3,
			prepTimeMinutes: 10,
			cookTimeMinutes: 12,
			ingredientsText: FRIED_RICE_INGREDIENTS_V1,
			stepsText: FRIED_RICE_STEPS(FRIED_RICE_SAUCE_V1)
		}),
		changes: [
			{
				message: 'Swap half the soy sauce for oyster sauce for a rounder, less salty seasoning',
				daysAgo: 180,
				ingredientsText: FRIED_RICE_INGREDIENTS_V2,
				stepsText: FRIED_RICE_STEPS(FRIED_RICE_SAUCE_V2)
			},
			{ restore: 1, daysAgo: 90 }
		]
	},
	{
		key: 'cinnamon-sugar-toast',
		author: 'spencerfletcher',
		tags: ['Breakfast', 'Quick'],
		visibility: 'public',
		daysAgo: 150,
		first: content({
			title: 'Cinnamon Sugar Toast',
			servings: 1,
			prepTimeMinutes: 2,
			cookTimeMinutes: 2,
			ingredientsText: `2 slices thick white bread
1 tbsp salted butter, softened
1 tbsp sugar
½ tsp ground cinnamon`,
			stepsText:
				'Butter the bread right to the edges, cover it with the sugar and cinnamon mixed together, and toast under the broiler for 2 minutes, until the sugar bubbles.'
		})
	},
	{
		key: 'braised-short-ribs-red-wine',
		author: 'spencerfletcher',
		tags: ['Dinner', 'Beef', 'Make ahead'],
		visibility: 'public',
		daysAgo: 360,
		first: content({
			title:
				"Grandmother's Slow Sunday Braised Short Ribs with Red Wine, Carrots, Parsnips and Pearl Onions, and a Sharp Horseradish Gremolata to Finish",
			description:
				'Short ribs braised in a whole bottle of red wine until they fall off the bone, with a raw horseradish and lemon gremolata to cut the richness.',
			servings: 6,
			prepTimeMinutes: 30,
			cookTimeMinutes: 225,
			ingredientsText: SHORT_RIBS_INGREDIENTS,
			stepsText: SHORT_RIBS_STEPS(SHORT_RIBS_BRAISE_V1, SHORT_RIBS_FINISH_V1),
			makeAhead:
				'Better made a day ahead: cool the braise, refrigerate it in the pot, then lift off the set fat and reheat, covered, at 325°F for 45 minutes. Make the gremolata just before serving.'
		}),
		changes: [
			{
				message:
					'Add the root vegetables for the last 45 minutes instead of the whole braise, so they hold their shape',
				daysAgo: 220,
				cookTimeMinutes: 210,
				stepsText: SHORT_RIBS_STEPS(SHORT_RIBS_BRAISE_V2, SHORT_RIBS_FINISH_V2)
			}
		]
	},
	{
		key: 'overnight-oats',
		author: 'spencerfletcher',
		tags: ['Breakfast', 'Make ahead', 'Vegetarian'],
		visibility: 'private',
		daysAgo: 120,
		first: content({
			title: 'Overnight Oats',
			servings: 2,
			prepTimeMinutes: 5,
			restTimeMinutes: 480,
			ingredientsText: `1 cup (90 g) rolled oats
1 cup (240 ml) milk, plus a splash to loosen
½ cup (120 g) plain Greek yogurt
2 tbsp chia seeds
1 tbsp maple syrup
a pinch of salt
½ cup berries, to serve`,
			stepsText: `Stir the oats, milk, yogurt, chia seeds, maple syrup and salt together in a jar or bowl.

Cover and refrigerate overnight, at least 8 hours.

Stir, loosen with a splash of milk, and top with the berries.`
		})
	},
	{
		key: 'miso-caramel-sauce',
		author: 'spencerfletcher',
		tags: ['Sauce', 'Dessert'],
		visibility: 'private',
		daysAgo: 90,
		first: content({
			title: 'Miso Caramel Sauce',
			description: 'Salted caramel with white miso in place of the salt.',
			makes: 'about 300 ml',
			prepTimeMinutes: 5,
			cookTimeMinutes: 15,
			ingredientsText: `200 g sugar
60 ml water
120 ml double cream
40 g unsalted butter
2 tbsp white miso`,
			stepsText: `Heat the sugar and water in a heavy saucepan over medium heat, swirling, until the sugar dissolves. Boil without stirring until deep amber, 8 to 10 minutes.

Take the pan off the heat and whisk in the cream, then the butter.
warning: The caramel boils up hard when the cream goes in; stand back and pour slowly.

Whisk in the miso until smooth. It thickens as it cools; give it 15 minutes before pouring over ice cream.`,
			storage: 'Keeps 2 weeks in a jar in the fridge; warm gently to loosen.'
		}),
		trashedDaysAgo: 5
	},
	{
		key: 'microwave-mug-cake',
		author: 'spencerfletcher',
		tags: ['Dessert', 'Quick'],
		visibility: 'public',
		daysAgo: 300,
		first: content({
			title: 'Microwave Chocolate Mug Cake',
			description: 'One chocolate cake, in a mug, in two minutes.',
			servings: 1,
			prepTimeMinutes: 3,
			cookTimeMinutes: 2,
			ingredientsText: `4 tbsp all-purpose flour
3 tbsp sugar
2 tbsp cocoa powder
¼ tsp baking powder
a pinch of salt
3 tbsp milk
2 tbsp neutral oil
¼ tsp vanilla extract
1 tbsp chocolate chips`,
			stepsText: `Whisk the flour, sugar, cocoa, baking powder and salt with a fork in a large (12 oz) mug.

Stir in the milk, oil and vanilla until smooth, scraping the bottom, then stir in the chocolate chips.

Microwave on high for 70 to 90 seconds, until risen and dry on top. Let it stand for a minute before eating.`
		}),
		changes: [
			{
				message:
					'Microwave 60 to 75 seconds: a shorter cook keeps the middle fudgy instead of rubbery',
				daysAgo: 200,
				stepsText: `Whisk the flour, sugar, cocoa, baking powder and salt with a fork in a large (12 oz) mug.

Stir in the milk, oil and vanilla until smooth, scraping the bottom, then stir in the chocolate chips.

Microwave on high for 60 to 75 seconds, until risen but still a little damp in the centre. Let it stand for a minute before eating.`
			}
		],
		trashedDaysAgo: 40
	},
	{
		key: 'smash-burgers',
		author: 'spencerfletcher',
		tags: ['Dinner', 'Beef', 'American'],
		visibility: 'friends',
		daysAgo: 260,
		first: content({
			title: 'Smash Burgers',
			description: 'Thin double patties smashed hard on a hot pan for lacy, browned edges.',
			servings: 4,
			prepTimeMinutes: 15,
			cookTimeMinutes: 20,
			ingredientsText: `# Burgers
1½ lb ground beef chuck (80/20), cold
1 tsp kosher salt
½ tsp black pepper
4 potato buns
2 tbsp butter, softened
4 slices American cheese
½ onion, very thinly sliced
dill pickle chips, to serve

# Sauce
¼ cup mayonnaise
2 tbsp ketchup
1 tbsp pickle brine`,
			stepsText: `Stir the mayonnaise, ketchup and pickle brine together.

Divide the beef into 8 loose balls of about 3 oz and keep them in the fridge until the pan is ready.

Butter the cut sides of the buns and toast them in a cast-iron skillet over medium heat for 1 to 2 minutes, until golden. Set aside.

Turn the heat to high until the pan smokes. Add two balls, lay parchment over each and smash them flat with a stiff spatula, then season with salt and pepper. Cook for 2 minutes without moving them, until the edges are deeply browned and lacy.

Scrape the patties up, flip, lay cheese on one and cook for 30 seconds more, then stack them. Repeat with the rest.

Spread the buns with sauce and build the burgers with the onion and pickles.`
		}),
		changes: [
			{
				message:
					'Smash the onion into the raw patties, Oklahoma style, so it fries soft and sweet in the beef fat',
				daysAgo: 130,
				stepsText: `Stir the mayonnaise, ketchup and pickle brine together.

Divide the beef into 8 loose balls of about 3 oz and keep them in the fridge until the pan is ready.

Butter the cut sides of the buns and toast them in a cast-iron skillet over medium heat for 1 to 2 minutes, until golden. Set aside.

Turn the heat to high until the pan smokes. Add two balls, pile a small handful of onion on each, lay parchment over them and smash the onion into the meat with a stiff spatula, then season with salt and pepper. Cook for 2 minutes without moving them, until the edges are deeply browned and lacy.

Scrape the patties up with their onion, flip, lay cheese on one and cook for 30 seconds more, then stack them. Repeat with the rest.

Spread the buns with sauce and build the burgers with the pickles.`
			}
		]
	},
	{
		key: 'sunday-roast-chicken',
		author: 'spencerfletcher',
		tags: ['Dinner', 'Chicken', 'Roast'],
		visibility: 'public',
		daysAgo: 400,
		first: content({
			title: 'Sunday Roast Chicken',
			description: 'A whole chicken with lemon, garlic and thyme.',
			servings: 4,
			prepTimeMinutes: 15,
			cookTimeMinutes: 70,
			restTimeMinutes: 15,
			ingredientsText: ROAST_CHICKEN_INGREDIENTS_V1,
			stepsText: ROAST_CHICKEN_STEPS_V1
		}),
		changes: [
			{
				message: 'Roast the chicken on carrots and potatoes so they cook in the drippings',
				daysAgo: 330,
				ingredientsText: ROAST_CHICKEN_INGREDIENTS_V2,
				stepsText: ROAST_CHICKEN_STEPS_V2
			},
			{
				message:
					'Dry-brine overnight with more salt: salting a day ahead seasons the meat through and dries the skin so it crisps',
				daysAgo: 260,
				restTimeMinutes: 495,
				ingredientsText: ROAST_CHICKEN_INGREDIENTS_V3,
				stepsText: ROAST_CHICKEN_STEPS_V3
			},
			{
				message: 'Make a quick pan gravy from the drippings while the chicken rests',
				daysAgo: 170,
				ingredientsText: ROAST_CHICKEN_INGREDIENTS_V4,
				stepsText: ROAST_CHICKEN_STEPS_V4
			},
			{
				message: 'Push butter under the breast skin as well as over it, so the breast stays moist',
				daysAgo: 70,
				ingredientsText: ROAST_CHICKEN_INGREDIENTS_V5,
				stepsText: ROAST_CHICKEN_STEPS_V5
			}
		]
	},
	{
		key: 'basil-pesto',
		author: 'spencerfletcher',
		tags: ['Sauce', 'Vegetarian', 'Pasta'],
		visibility: 'public',
		daysAgo: 230,
		first: content({
			title: 'Basil Pesto',
			description: 'Food-processor pesto with toasted nuts; pine nuts if you have them.',
			makes: 'about 250 ml',
			prepTimeMinutes: 10,
			cookTimeMinutes: 5,
			ingredientsText: PESTO_INGREDIENTS,
			stepsText: PESTO_STEPS(PESTO_BASIL_V1),
			storage:
				'Keeps a week in the fridge under a thin layer of oil, or freeze in an ice-cube tray.'
		}),
		changes: [
			{
				message: 'Blanch the basil for 10 seconds first so the pesto stays bright green for days',
				daysAgo: 100,
				stepsText: PESTO_STEPS(PESTO_BASIL_V2)
			}
		]
	},
	{
		key: 'chilli-con-carne',
		author: 'spencerfletcher',
		tags: ['Dinner', 'Spicy', 'Beef', 'Make ahead'],
		visibility: 'public',
		daysAgo: 350,
		first: content({
			title: 'Chilli con Carne',
			description: 'Beef and kidney bean chilli with cumin and smoked paprika.',
			servings: 6,
			prepTimeMinutes: 15,
			cookTimeMinutes: 80,
			ingredientsText: CHILLI_INGREDIENTS_V1,
			stepsText: CHILLI_STEPS(CHILLI_GARLIC_BEEF, CHILLI_SIMMER(45), CHILLI_BEANS_V1),
			reheating: 'Better the next day. Reheat gently with a splash of water.'
		}),
		changes: [
			{
				message:
					'Melt 15 g of dark chocolate in with the beans; it deepens the sauce and rounds the heat',
				daysAgo: 250,
				ingredientsText: CHILLI_INGREDIENTS_V2,
				stepsText: CHILLI_STEPS(CHILLI_GARLIC_BEEF, CHILLI_SIMMER(45), CHILLI_BEANS_V2)
			},
			{
				message: 'Simmer 90 minutes instead of 45 so the beef turns tender and the sauce thickens',
				daysAgo: 120,
				cookTimeMinutes: 125,
				stepsText: CHILLI_STEPS(CHILLI_GARLIC_BEEF, CHILLI_SIMMER(90), CHILLI_BEANS_V2)
			}
		]
	},
	{
		key: 'three-bean-vegan-chili',
		author: 'theo_vegan',
		tags: ['Dinner', 'Vegan', 'Spicy', 'Make ahead'],
		visibility: 'public',
		daysAgo: 200,
		forkOf: { key: 'chilli-con-carne', version: 2 },
		changes: [
			{
				message:
					'Make it vegan: brown lentils instead of beef, vegetable stock, dairy-free chocolate',
				daysAgo: 170,
				title: 'Vegan Chili',
				description:
					'The beef chilli made vegan, keeping the smoked paprika and the square of dark chocolate.',
				ingredientsText: VEGAN_CHILLI_INGREDIENTS_V2,
				stepsText: CHILLI_STEPS(
					'Add the garlic and cook for 1 minute, then stir in the lentils so they are coated in the oil.',
					'Add the tomatoes, stock and salt. Bring to a boil, then simmer partly covered for 45 minutes, stirring now and then, until the lentils are tender; add a splash of water if it gets thick.',
					CHILLI_BEANS_V2
				)
			},
			{
				message:
					'Kidney, black and pinto beans in place of the lentils: more texture, less stock and a 30-minute simmer',
				daysAgo: 60,
				title: 'Three-Bean Vegan Chili',
				cookTimeMinutes: 65,
				ingredientsText: VEGAN_CHILLI_INGREDIENTS_V3,
				stepsText: CHILLI_STEPS(
					'Add the garlic and cook for 1 minute.',
					CHILLI_SIMMER(30),
					'Stir in all three beans and the chocolate and simmer 15 minutes more, mashing a few beans against the side of the pot to thicken it. Taste for salt and heat before serving.'
				)
			}
		]
	},
	{
		key: 'lemon-bars',
		author: 'spencerfletcher',
		tags: ['Baking', 'Dessert'],
		visibility: 'public',
		daysAgo: 210,
		first: content({
			title: 'Lemon Bars',
			description: 'A shortbread crust under a tart, just-set lemon curd.',
			makes: '16 bars',
			prepTimeMinutes: 20,
			cookTimeMinutes: 42,
			restTimeMinutes: 180,
			ingredientsText: LEMON_BARS_INGREDIENTS('2 tsp lemon zest'),
			stepsText: LEMON_BARS_STEPS(LEMON_BARS_FILLING_V1)
		}),
		changes: [
			{
				message: 'Rub a full tablespoon of zest into the sugar for a sharper, more fragrant lemon',
				daysAgo: 80,
				ingredientsText: LEMON_BARS_INGREDIENTS('1 tbsp lemon zest'),
				stepsText: LEMON_BARS_STEPS(LEMON_BARS_FILLING_V2)
			}
		]
	},
	{
		key: 'green-shakshuka',
		author: 'spencerfletcher',
		tags: ['Dinner', 'Vegetarian', 'Breakfast'],
		visibility: 'friends',
		daysAgo: 120,
		forkOf: { key: 'shakshuka', version: 1 },
		changes: [
			{
				message:
					'Make it green: chard, spinach and a green chilli instead of tomatoes and pepper, with feta and dill',
				daysAgo: 100,
				title: 'Green Shakshuka',
				description: 'Eggs baked in garlicky chard and spinach, with feta and dill.',
				prepTimeMinutes: 15,
				ingredientsText: GREEN_SHAKSHUKA_INGREDIENTS,
				stepsText: GREEN_SHAKSHUKA_STEPS
			}
		]
	},
	{
		key: 'maple-pecan-granola',
		author: 'spencerfletcher',
		tags: ['Breakfast', 'Make ahead'],
		visibility: 'friends',
		daysAgo: 190,
		first: content({
			title: 'Maple Pecan Granola',
			description: 'Clustery oat granola sweetened with maple syrup, with dried cherries.',
			makes: 'about 1 kg',
			prepTimeMinutes: 10,
			cookTimeMinutes: 45,
			restTimeMinutes: 45,
			ingredientsText: GRANOLA_INGREDIENTS_V1,
			stepsText: GRANOLA_STEPS(GRANOLA_WET_V1),
			storage: 'Keeps a month in an airtight jar.'
		}),
		changes: [
			{
				message: 'Stir in a frothy egg white for bigger, crunchier clusters',
				daysAgo: 70,
				ingredientsText: GRANOLA_INGREDIENTS_V2,
				stepsText: GRANOLA_STEPS(GRANOLA_WET_V2)
			}
		]
	},
	{
		key: 'classic-shortbread',
		author: 'grace_bakes',
		tags: ['Baking', 'Cookies', 'Scottish'],
		visibility: 'public',
		daysAgo: 200,
		first: content({
			title: 'Classic Shortbread',
			description: 'Butter, sugar and flour in the old one-two-three ratio, baked pale.',
			makes: '16 fingers',
			prepTimeMinutes: 15,
			cookTimeMinutes: 40,
			restTimeMinutes: 50,
			ingredientsText: SHORTBREAD_INGREDIENTS_V1,
			stepsText: SHORTBREAD_STEPS(SHORTBREAD_BUTTER_V1, SHORTBREAD_FLOUR_V1, SHORTBREAD_BAKE_V1),
			storage: 'Keeps two weeks in a tin.'
		}),
		changes: [
			{
				message: 'Swap 40 g of the flour for cornflour for a more tender, sandy crumb',
				daysAgo: 150,
				ingredientsText: SHORTBREAD_INGREDIENTS_V2,
				stepsText: SHORTBREAD_STEPS(SHORTBREAD_BUTTER_V1, SHORTBREAD_FLOUR_V2, SHORTBREAD_BAKE_V1)
			}
		]
	},
	{
		key: 'crisp-brown-butter-shortbread',
		author: 'lucia_dolci',
		tags: ['Baking', 'Cookies'],
		visibility: 'public',
		daysAgo: 7,
		forkOf: { key: 'classic-shortbread', version: 2 },
		changes: [
			{
				message: 'Less sugar (75 g) so the edges crisp instead of staying soft',
				daysAgo: 5,
				ingredientsText: `225 g unsalted butter, softened
75 g caster sugar
300 g plain flour
40 g cornflour
¼ tsp salt
1 tbsp caster sugar, for sprinkling`
			},
			{
				message:
					'Brown the butter for a nutty flavour, then chill it back to solid so the dough still creams',
				daysAgo: 3,
				title: 'Crisp Brown Butter Shortbread',
				cookTimeMinutes: 48,
				restTimeMinutes: 170,
				ingredientsText: `250 g unsalted butter
75 g caster sugar
300 g plain flour
40 g cornflour
¼ tsp salt
1 tbsp caster sugar, for sprinkling`,
				stepsText: SHORTBREAD_STEPS(
					BROWN_BUTTER_SHORTBREAD_BUTTER,
					SHORTBREAD_FLOUR_V2,
					SHORTBREAD_BAKE_V1
				)
			},
			{
				message: 'Rice flour instead of cornflour for a snap, and a longer bake to a deeper gold',
				daysAgo: 1,
				description:
					'Brown butter, less sugar and rice flour make a darker, nuttier finger that snaps, with crisp edges. Choose it over the pale, tender original when you want shortbread with coffee rather than with cream.',
				cookTimeMinutes: 53,
				ingredientsText: `250 g unsalted butter
75 g caster sugar
300 g plain flour
50 g rice flour
¼ tsp salt
1 tbsp caster sugar, for sprinkling`,
				stepsText: SHORTBREAD_STEPS(
					BROWN_BUTTER_SHORTBREAD_BUTTER,
					BROWN_BUTTER_SHORTBREAD_FLOUR,
					BROWN_BUTTER_SHORTBREAD_BAKE
				)
			}
		]
	},
	{
		key: 'cacio-e-pepe',
		author: 'dario_pasta',
		tags: ['Pasta', 'Dinner', 'Vegetarian', 'Italian'],
		visibility: 'public',
		daysAgo: 330,
		first: content({
			title: 'Cacio e Pepe',
			description: 'Pecorino, black pepper and starchy pasta water, nothing else.',
			servings: 2,
			prepTimeMinutes: 5,
			cookTimeMinutes: 15,
			ingredientsText: CACIO_INGREDIENTS('80 g Pecorino Romano, finely grated'),
			stepsText: CACIO_STEPS(CACIO_CHEESE_V1)
		}),
		changes: [
			{
				message:
					'Mix the pecorino to a paste with pasta water first, so it melts smooth instead of clumping',
				daysAgo: 240,
				stepsText: CACIO_STEPS(CACIO_CHEESE_V2)
			},
			{
				message: 'More pecorino (100 g) for two; 80 g made a thin sauce',
				daysAgo: 110,
				ingredientsText: CACIO_INGREDIENTS('100 g Pecorino Romano, finely grated')
			}
		]
	},
	{
		key: 'sunday-ragu',
		author: 'dario_pasta',
		tags: ['Pasta', 'Dinner', 'Make ahead', 'Italian'],
		visibility: 'public',
		daysAgo: 390,
		first: content({
			title: 'Sunday Ragù',
			description: 'Beef and pork ragù cooked slowly with milk and white wine, for tagliatelle.',
			servings: 6,
			prepTimeMinutes: 20,
			cookTimeMinutes: 225,
			ingredientsText: RAGU_INGREDIENTS_V1,
			stepsText: RAGU_STEPS(RAGU_MEAT_V1, RAGU_WINE_V1)
		}),
		changes: [
			{
				message:
					'Brown the meat hard instead of just cooking out the pink; the crust is the flavour',
				daysAgo: 300,
				cookTimeMinutes: 230,
				stepsText: RAGU_STEPS(RAGU_MEAT_V2, RAGU_WINE_V1)
			},
			{
				message: 'Fry 2 tbsp of tomato paste after the meat for a deeper, sweeter sauce',
				daysAgo: 200,
				cookTimeMinutes: 232,
				ingredientsText: RAGU_INGREDIENTS_V3,
				stepsText: RAGU_STEPS(RAGU_MEAT_V2, RAGU_WINE_V3)
			},
			{
				message: 'Add a make-ahead note: the ragù is better the next day',
				daysAgo: 45,
				makeAhead:
					'Make it a day ahead: cool, refrigerate in the pot and reheat gently with a splash of water while the pasta cooks.'
			}
		]
	},
	{
		key: 'grilled-corn-chili-lime-butter',
		author: 'jamie_grills',
		tags: ['Grilling', 'Side', 'Vegetarian'],
		visibility: 'public',
		daysAgo: 60,
		first: content({
			title: 'Grilled Corn with Chili Lime Butter',
			description: 'Charred corn brushed with butter, lime zest and chili powder.',
			servings: 4,
			prepTimeMinutes: 10,
			cookTimeMinutes: 12,
			ingredientsText: `4 ears corn, husked
4 tbsp unsalted butter, softened
1 lime
1 tsp chili powder
½ tsp flaky salt
2 tbsp chopped cilantro`,
			stepsText: `Heat a grill to medium-high.

Zest the lime and mash the zest into the butter with 1 tbsp of the lime's juice, the chili powder and the salt. Cut the rest of the lime into wedges.

Grill the corn, turning every few minutes, until charred in spots and tender, 10 to 12 minutes.

Brush the hot corn with the butter, scatter with cilantro and serve with the lime wedges.`
		}),
		hiddenDaysAgo: 3
	},
	{
		key: 'black-bean-tacos',
		author: 'sam_weeknights',
		tags: ['Dinner', 'Weeknight', 'Vegetarian', 'Tacos'],
		visibility: 'public',
		daysAgo: 150,
		first: content({
			title: 'Black Bean Tacos',
			description: 'Mashed spiced black beans, avocado and cotija in warm corn tortillas.',
			makes: '8 tacos',
			prepTimeMinutes: 10,
			cookTimeMinutes: 15,
			ingredientsText: TACO_INGREDIENTS_V1,
			stepsText: TACO_STEPS(TACO_SPICE_V1)
		}),
		changes: [
			{
				message: 'Add a chipotle in adobo with the spices for smoky heat',
				daysAgo: 40,
				ingredientsText: TACO_INGREDIENTS_V2,
				stepsText: TACO_STEPS(TACO_SPICE_V2)
			}
		]
	}
];
