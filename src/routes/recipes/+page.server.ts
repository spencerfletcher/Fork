import {recipes} from './data';

export function load() {
	return {
		summaries: recipes.map(recipe => ({
			id: recipe.id,
			title: recipe.title,
		}))
	};
}