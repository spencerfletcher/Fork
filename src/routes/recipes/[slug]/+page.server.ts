import {error} from '@sveltejs/kit';
import {recipes} from '../data';

export function load({params}) {
	const id = parseInt(params.slug, 10);
	const recipe = recipes.find(recipe => recipe.id === id);
	if (!recipe) error(404, `Recipe not found`);

	return {
		recipe
	};
}