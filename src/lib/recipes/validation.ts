import { z } from 'zod';
import type { Ingredient, Step, RecipeContent } from './types.js';
import { parseIngredientGroups } from './ingredients.js';
import { parseStepGroups } from './steps.js';
import {
	LINE_TOO_LONG,
	MAKES_TOO_LONG,
	MAX_GROUP_NAME,
	MAX_MAKES,
	fieldTooLong,
	groupNameTooLong,
	limitError
} from './limits.js';
import { normaliseTagNames } from './tags.js';
import { oneOf, text, slugify } from '#lib/helpers.js';

// Largest value a Postgres `integer` column holds.
const INT4_MAX = 2_147_483_647;

/** The number fields: their name in messages, their label on the form, their floor, and what a whole one counts. */
export const NUMBER_FIELDS = {
	servings: { label: 'Servings', formLabel: 'Serves', min: 1, unit: '' },
	prepTimeMinutes: { label: 'Prep time', formLabel: 'Prep (min)', min: 0, unit: ' of minutes' },
	cookTimeMinutes: { label: 'Cook time', formLabel: 'Cook (min)', min: 0, unit: ' of minutes' }
} as const;

export type NumberField = keyof typeof NUMBER_FIELDS;

/** What a number field says when it is not whole, below its floor or too large; the editor shows the same live. */
export function numberMessages(field: NumberField) {
	const { label, min, unit } = NUMBER_FIELDS[field];
	return {
		whole: `${label} must be a whole number${unit}`,
		belowMin: min === 0 ? `${label} can't be negative` : `${label} must be at least ${min}`,
		tooLarge: `${label} is too large`
	};
}

/** What a required field says when it is empty; the editor shows the same live. */
export const REQUIRED_MESSAGES = {
	title: 'Title is required',
	ingredients: 'At least one ingredient is required',
	steps: 'At least one step is required'
} as const;

/** The photo types the editor offers and a save stores. */
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
/** The largest photo a save stores. Netlify buffers a function request at
 *  6 MB, about 4.5 MB of binary, so this leaves room for the rest of the form. */
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;
export const PHOTO_TYPE_MESSAGE = 'Choose a JPEG, PNG, WebP or GIF photo.';
export const PHOTO_SIZE_MESSAGE = `Choose a photo under ${PHOTO_MAX_BYTES / 1024 / 1024} MB.`;

/** Why a chosen photo cannot be stored, or null when it can. */
export function photoError(file: File): string | null {
	if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) return PHOTO_TYPE_MESSAGE;
	if (file.size > PHOTO_MAX_BYTES) return PHOTO_SIZE_MESSAGE;
	return null;
}

// The labels the length limits name.
const INGREDIENTS = 'Ingredients';
const STEPS = 'Steps';

// The HTML number input's grammar: a valid floating-point number.
const NUMBER_TEXT = /^-?(\d+(\.\d+)?|\.\d+)([eE][-+]?\d+)?$/;

/** A whole number from a text input: blank is absent, otherwise an integer within [min, INT4_MAX]. */
const optionalInt = (field: NumberField) => {
	const { min } = NUMBER_FIELDS[field];
	const messages = numberMessages(field);
	return (
		z
			.string()
			.trim()
			// Whole by value, as a number input judges it, so "2.0" and "1e2" pass;
			// only what such an input can send, so "0x10" and "+4" do not. The
			// sign passes here so a negative is told it is below the floor.
			.refine(
				// An overflow to Infinity passes here, to be called too large next.
				(s) =>
					s === '' ||
					(NUMBER_TEXT.test(s) && (!Number.isFinite(Number(s)) || Number.isInteger(Number(s)))),
				messages.whole
			)
			// z.number() refuses Infinity with its own wording, so this says it first.
			.refine((s) => s === '' || Number.isFinite(Number(s)), messages.tooLarge)
			.transform((s) => (s === '' ? null : Number(s)))
			.pipe(z.number().min(min, messages.belowMin).max(INT4_MAX, messages.tooLarge).nullable())
	);
};

// What a "# Name" heading with nothing under it says. The tail is fixed, so
// fieldOfMessage can place the message whatever the name.
const emptyGroupTail = (items: 'ingredients' | 'steps') =>
	` has no ${items}. Add some under it or delete the heading.`;
export const emptyGroupMessage = (name: string, items: 'ingredients' | 'steps') =>
	`“${name}”${emptyGroupTail(items)}`;

/** What a "#" line with no name says, one wording per box so fieldOfMessage can place it. */
export const unnamedGroupMessage = (items: 'ingredients' | 'steps') =>
	`A # line needs a group name after it, like ${items === 'ingredients' ? '# Dough' : '# Bake'}.`;

/** A box's groups, refused when a heading is empty or its name too long, then flattened. */
const grouped = <T>(items: 'ingredients' | 'steps') =>
	z
		.custom<Array<{ group: string | undefined; rows: T[] }>>()
		.superRefine((sections, ctx) => {
			const empty = sections.find((s) => s.group !== undefined && s.rows.length === 0);
			if (sections.some((s) => s.group === ''))
				ctx.addIssue({ code: 'custom', message: unnamedGroupMessage(items) });
			else if (empty)
				ctx.addIssue({ code: 'custom', message: emptyGroupMessage(empty.group!, items) });
			else if (sections.some((s) => (s.group?.length ?? 0) > MAX_GROUP_NAME))
				ctx.addIssue({ code: 'custom', message: groupNameTooLong(items) });
		})
		.transform((sections) => sections.flatMap((s) => s.rows));

/** Raw editor text, refused with the same message the editor shows live. */
const bounded = (label: typeof INGREDIENTS | typeof STEPS) =>
	z.string().superRefine((s, ctx) => {
		const message = limitError(s, label);
		if (message) ctx.addIssue({ code: 'custom', message });
	});

const recipeContentSchema = z.object({
	title: z.string().trim().min(1, REQUIRED_MESSAGES.title),
	description: z
		.string()
		.trim()
		.transform((s) => s || null),
	servings: optionalInt('servings'),
	makes: z
		.string()
		.trim()
		.max(MAX_MAKES, MAKES_TOO_LONG)
		.transform((s) => s || null),
	prepTimeMinutes: optionalInt('prepTimeMinutes'),
	cookTimeMinutes: optionalInt('cookTimeMinutes'),
	ingredients: bounded(INGREDIENTS)
		.transform(parseIngredientGroups)
		.pipe(grouped<Ingredient>('ingredients'))
		.pipe(z.array(z.custom<Ingredient>()).min(1, REQUIRED_MESSAGES.ingredients)),
	steps: bounded(STEPS)
		.transform(parseStepGroups)
		.pipe(grouped<Step>('steps'))
		.pipe(z.array(z.custom<Step>()).min(1, REQUIRED_MESSAGES.steps))
});

/** What a parser hands back: the typed value, or the first message to show the user. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** The content fields a form carries as text. The photo is a file and is resolved by the action. */
export type ContentFields = Omit<RecipeContent, 'imageUrl'>;

/** Who can see a recipe, narrowest first: the order is what "a fork never widens access" compares. */
export const VISIBILITIES = ['private', 'friends', 'public'] as const;

export type Visibility = (typeof VISIBILITIES)[number];

export type Settings = {
	visibility: Visibility;
	tagNames: string[];
};

export type RecipeDraft = {
	title: string;
	description: string;
	servings: string;
	makes: string;
	prepTimeMinutes: string;
	cookTimeMinutes: string;
	ingredients: string;
	steps: string;
	commitMessage: string;
	editRevision: string;
	visibility: Visibility;
	tags: string[];
	hadPhoto: boolean;
	removeImage: boolean;
};

function parse<T>(schema: z.ZodType<T>, input: unknown): Result<T> {
	const result = schema.safeParse(input);
	return result.success
		? { ok: true, value: result.data }
		: { ok: false, error: result.error.issues[0].message };
}

/** What a tag name says when it makes no slug, so the tag would have no link. */
export const tagNameMessage = (name: string) =>
	`Tag "${name}" needs at least one letter or number from A to Z or 0 to 9`;

const settingsSchema = z.object({
	visibility: z.enum(VISIBILITIES),
	tagNames: z
		.array(z.string())
		.transform(normaliseTagNames)
		.superRefine((names, ctx) => {
			const unlinkable = names.find((name) => slugify(name) === '');
			if (unlinkable !== undefined)
				ctx.addIssue({ code: 'custom', message: tagNameMessage(unlinkable) });
		})
});

/**
 * The versioned content (title, description, servings, times, ingredients,
 * steps) from the form's draft strings: an action passes `draftOf(formData)`,
 * the editor its live draft.
 */
export function parseDraftContent(draft: RecipeDraft): Result<ContentFields> {
	return parse(recipeContentSchema, {
		title: draft.title,
		description: draft.description,
		servings: draft.servings,
		makes: draft.makes,
		prepTimeMinutes: draft.prepTimeMinutes,
		cookTimeMinutes: draft.cookTimeMinutes,
		ingredients: draft.ingredients,
		steps: draft.steps
	});
}

/** The visibility radio's value; missing or unknown reads as private, the default. */
function visibilityOf(formData: FormData): Visibility {
	const value = text(formData, 'visibility');
	return oneOf(VISIBILITIES, value) ?? 'private';
}

/** Tag names as submitted, before any trimming or deduplication. */
function tagsOf(formData: FormData): string[] {
	return formData.getAll('tags').filter((t): t is string => typeof t === 'string');
}

/** The recipe-level settings from the form: visibility and tags. The photo is a file, handled by the action. */
export function parseSettings(formData: FormData): Result<Settings> {
	return parse(settingsSchema, {
		visibility: visibilityOf(formData),
		tagNames: tagsOf(formData)
	});
}

/**
 * Every submitted field exactly as typed, so a failed save can hand the form
 * back what the user entered, invalid values included. Nothing here is
 * validated or trimmed; that is the parsers' job.
 */
export function draftOf(formData: FormData): RecipeDraft {
	const image = formData.get('image');
	return {
		title: text(formData, 'title'),
		description: text(formData, 'description'),
		servings: text(formData, 'servings'),
		makes: text(formData, 'makes'),
		prepTimeMinutes: text(formData, 'prepTimeMinutes'),
		cookTimeMinutes: text(formData, 'cookTimeMinutes'),
		ingredients: text(formData, 'ingredients'),
		steps: text(formData, 'steps'),
		commitMessage: text(formData, 'commitMessage'),
		editRevision: text(formData, 'editRevision'),
		visibility: visibilityOf(formData),
		tags: tagsOf(formData),
		// The file itself cannot be echoed back; the page uses this to say so.
		hadPhoto: image instanceof File && image.size > 0,
		removeImage: formData.get('removeImage') === 'on'
	};
}

// Every message a content field can be refused with. A Record over the
// fields, so a new one must say which messages are its own.
const MESSAGES_OF: Record<keyof ContentFields, string[]> = {
	title: [REQUIRED_MESSAGES.title],
	description: [],
	servings: Object.values(numberMessages('servings')),
	makes: [MAKES_TOO_LONG],
	prepTimeMinutes: Object.values(numberMessages('prepTimeMinutes')),
	cookTimeMinutes: Object.values(numberMessages('cookTimeMinutes')),
	ingredients: [
		REQUIRED_MESSAGES.ingredients,
		fieldTooLong(INGREDIENTS),
		LINE_TOO_LONG,
		groupNameTooLong('ingredients'),
		unnamedGroupMessage('ingredients')
	],
	steps: [
		REQUIRED_MESSAGES.steps,
		fieldTooLong(STEPS),
		groupNameTooLong('steps'),
		unnamedGroupMessage('steps')
	]
};

/** The field a content message belongs to, so the editor can show it there; undefined for any other message. */
export function fieldOfMessage(message: string): keyof ContentFields | undefined {
	return (Object.keys(MESSAGES_OF) as Array<keyof ContentFields>).find(
		(field) =>
			MESSAGES_OF[field].includes(message) ||
			((field === 'ingredients' || field === 'steps') && message.endsWith(emptyGroupTail(field)))
	);
}
