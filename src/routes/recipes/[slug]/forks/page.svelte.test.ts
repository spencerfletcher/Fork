import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ForksPage from './+page.svelte';

const card = (id: number) => ({
	id,
	slug: `fork-${id}`,
	title: `Fork ${id}`,
	description: null,
	imageUrl: `https://img/${id}.jpg`,
	parentId: 42,
	prepTimeMinutes: null,
	cookTimeMinutes: null
});

const data = {
	recipe: { slug: 'classic-cookies', title: 'Classic Cookies' },
	forks: [] as ReturnType<typeof card>[]
};

function renderForks(overrides: Partial<typeof data> = {}) {
	return render(ForksPage, { props: { data: { ...data, ...overrides } } as never });
}

describe('Forks page', () => {
	test('titles itself after the recipe and links back to it', () => {
		renderForks();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			`Forks of ${data.recipe.title}`
		);
		expect(screen.getByRole('link', { name: `← ${data.recipe.title}` })).toHaveAttribute(
			'href',
			`/recipes/${data.recipe.slug}`
		);
	});

	test('renders a card per fork in the shared grid, in the order given', () => {
		const forks = [3, 1, 2].map(card);
		const { container } = renderForks({ forks });
		const grid = container.querySelector('.recipe-grid');
		const hrefs = forks.map((f) => `/recipes/${f.slug}`);
		const links = [...(grid?.querySelectorAll('a') ?? [])]
			.map((a) => a.getAttribute('href'))
			.filter((h) => h && hrefs.includes(h));
		expect([...new Set(links)]).toEqual(hrefs);
	});

	test('cards know their place, so the first row of photos loads eagerly', () => {
		const { container } = renderForks({ forks: [1, 2, 3, 4, 5].map(card) });
		const imgs = [...container.querySelectorAll('img.card-img')];
		expect(imgs[0]).toHaveAttribute('fetchpriority', 'high');
		expect(imgs.at(-1)).toHaveAttribute('loading', 'lazy');
	});

	test('says so in one line when there are no forks', () => {
		const { container } = renderForks();
		expect(screen.getByText('No forks yet.')).toBeInTheDocument();
		expect(container.querySelector('.recipe-grid')).toBeNull();
	});
});
