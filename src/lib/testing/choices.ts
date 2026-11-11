import { fireEvent, screen } from '@testing-library/svelte';

/** Picks a ChoiceSelect's choice by its word, as a cook's clicks would. */
export async function chooseOption(label: string | RegExp, word: string) {
	await fireEvent.click(screen.getByRole('combobox', { name: label }));
	await fireEvent.click(screen.getByRole('option', { name: new RegExp(`^${word}`) }));
}

/** The value a ChoiceSelect submits under `name`. */
export const chosenValue = (name: string) =>
	document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`)?.value;
