/**
 * Ingredient densities (grams per ml) for common ingredients.
 * Used as the first lookup layer before falling back to Spoonacular.
 * Keys are lowercase; matching is case-insensitive and checks if the
 * ingredient name contains the key (or vice-versa).
 */
export const DENSITIES: Record<string, number> = {
	// Flours
	'all-purpose flour': 0.529,
	flour: 0.529,
	'bread flour': 0.529,
	'cake flour': 0.435,
	'whole wheat flour': 0.529,
	'whole-wheat flour': 0.529,
	'almond flour': 0.385,
	'coconut flour': 0.385,
	'rye flour': 0.529,
	'oat flour': 0.385,
	// Sugars & sweeteners
	sugar: 0.845,
	'granulated sugar': 0.845,
	'white sugar': 0.845,
	'brown sugar': 0.722,
	'powdered sugar': 0.561,
	'confectioners sugar': 0.561,
	'icing sugar': 0.561,
	'caster sugar': 0.845,
	honey: 1.42,
	'maple syrup': 1.37,
	'corn syrup': 1.38,
	'agave nectar': 1.38,
	molasses: 1.47,
	// Fats & oils
	butter: 0.911,
	'unsalted butter': 0.911,
	'salted butter': 0.911,
	'olive oil': 0.911,
	'vegetable oil': 0.911,
	'canola oil': 0.911,
	'coconut oil': 0.924,
	'sesame oil': 0.924,
	'avocado oil': 0.911,
	lard: 0.925,
	shortening: 0.853,
	// Dairy & liquids
	water: 1.0,
	milk: 1.032,
	'whole milk': 1.032,
	'skim milk': 1.035,
	buttermilk: 1.035,
	'heavy cream': 1.012,
	'heavy whipping cream': 1.012,
	'whipping cream': 1.012,
	'sour cream': 1.01,
	'cream cheese': 0.981,
	yogurt: 1.04,
	'greek yogurt': 1.04,
	'coconut milk': 1.02,
	'almond milk': 1.01,
	'oat milk': 1.03,
	// Dry baking ingredients
	salt: 1.217,
	'kosher salt': 0.81,
	'sea salt': 1.217,
	'baking soda': 0.69,
	'baking powder': 0.9,
	'cocoa powder': 0.423,
	'cacao powder': 0.423,
	cornstarch: 0.609,
	'corn starch': 0.609,
	arrowroot: 0.576,
	'cream of tartar': 0.9,
	yeast: 0.72,
	'instant yeast': 0.72,
	'active dry yeast': 0.72,
	// Fresh aromatics & vegetables (minced/grated — denser than dry)
	ginger: 0.85,
	'fresh ginger': 0.85,
	'ginger, grated': 0.85,
	'ginger, minced': 0.85,
	'ground ginger': 0.56,
	garlic: 0.64,
	'garlic, minced': 0.64,
	'garlic, crushed': 0.64,
	'minced garlic': 0.64,
	onion: 0.72,
	'onion, diced': 0.72,
	'onion, chopped': 0.72,
	'diced onion': 0.72,
	shallot: 0.72,
	'shallots, minced': 0.72,
	scallion: 0.5,
	'green onion': 0.5,
	chive: 0.5,
	chives: 0.5,
	// Grains & starches
	'rolled oats': 0.34,
	oats: 0.34,
	rice: 0.753,
	'white rice': 0.753,
	'brown rice': 0.753,
	pasta: 0.561,
	breadcrumbs: 0.423,
	'panko breadcrumbs': 0.28,
	semolina: 0.609,
	// Nuts & seeds
	'sesame seeds': 0.577,
	'chia seeds': 0.576,
	'flax seeds': 0.576,
	'poppy seeds': 0.576,
	'sunflower seeds': 0.496,
	'pumpkin seeds': 0.496,
	// Spices (approximate — loose powder)
	cinnamon: 0.56,
	'ground cinnamon': 0.56,
	paprika: 0.56,
	'smoked paprika': 0.56,
	turmeric: 0.56,
	'ground turmeric': 0.56,
	cumin: 0.56,
	'ground cumin': 0.56,
	coriander: 0.56,
	'ground coriander': 0.56,
	'garam masala': 0.56,
	'chili powder': 0.56,
	cayenne: 0.56,
	'black pepper': 0.56,
	'white pepper': 0.56,
	oregano: 0.28,
	thyme: 0.28,
	basil: 0.28,
	'dried basil': 0.28,
	rosemary: 0.28,
	'dried rosemary': 0.28,
	// Sauces & condiments
	'soy sauce': 1.088,
	'fish sauce': 1.088,
	'worcestershire sauce': 1.088,
	'hot sauce': 1.01,
	'tomato paste': 1.07,
	'tomato sauce': 1.03,
	ketchup: 1.15,
	mustard: 1.07,
	tahini: 0.95,
	vinegar: 1.006,
	'apple cider vinegar': 1.006,
	'balsamic vinegar': 1.08,
	'rice vinegar': 1.006,
	// Other
	'vanilla extract': 0.879,
	vanilla: 0.879,
	'lemon juice': 1.006,
	'lime juice': 1.006,
	'orange juice': 1.045,
	broth: 1.003,
	'chicken broth': 1.003,
	'beef broth': 1.003,
	'vegetable broth': 1.003,
	stock: 1.003,
	wine: 0.994,
	'white wine': 0.994,
	'red wine': 0.994
};

/** Volume of 1 unit in ml */
const ML_PER_UNIT: Record<string, number> = {
	tsp: 4.929,
	teaspoon: 4.929,
	teaspoons: 4.929,
	tbsp: 14.787,
	tablespoon: 14.787,
	tablespoons: 14.787,
	cup: 236.588,
	cups: 236.588,
	'fluid oz': 29.574,
	'fluid ounce': 29.574,
	'fluid ounces': 29.574,
	'fl oz': 29.574,
	pint: 473.176,
	pints: 473.176,
	quart: 946.353,
	quarts: 946.353,
	gallon: 3785.41,
	gallons: 3785.41,
	ml: 1,
	milliliter: 1,
	milliliters: 1,
	l: 1000,
	liter: 1000,
	liters: 1000
};

/** Weight units that convert directly to grams — no density needed */
const GRAMS_PER_WEIGHT_UNIT: Record<string, number> = {
	g: 1,
	gram: 1,
	grams: 1,
	kg: 1000,
	kilogram: 1000,
	kilograms: 1000,
	lb: 453.592,
	lbs: 453.592,
	pound: 453.592,
	pounds: 453.592,
	oz: 28.3495,
	ounce: 28.3495,
	ounces: 28.3495
};

/**
 * Look up the gram equivalent of an ingredient from the local table.
 * Returns null if the unit is unknown or (for volumetric units) the ingredient is not in the table.
 */
export function lookupGrams(amount: number, unit: string, name: string): number | null {
	const unitLower = unit.trim().toLowerCase();

	// Weight units — direct conversion, no density needed
	const gramsPerUnit = GRAMS_PER_WEIGHT_UNIT[unitLower];
	if (gramsPerUnit !== undefined) {
		return amount * gramsPerUnit;
	}

	const mlPerUnit = ML_PER_UNIT[unitLower];
	if (!mlPerUnit) return null; // unknown unit (count, pinch, etc.) — fall through to Spoonacular

	const nameLower = name.trim().toLowerCase();

	// Find best matching density key: exact match first, then substring
	let density: number | null = null;
	if (DENSITIES[nameLower] !== undefined) {
		density = DENSITIES[nameLower];
	} else {
		// Check if any key is contained in the ingredient name or vice-versa
		for (const [key, val] of Object.entries(DENSITIES)) {
			if (nameLower.includes(key) || key.includes(nameLower)) {
				density = val;
				break;
			}
		}
	}

	if (density === null) return null;

	return amount * mlPerUnit * density;
}
