import { z } from 'zod';
import type { Ingredient, Step, RecipeContent } from './types.js';
import { ingredientsToText, parseIngredientGroups } from './ingredients.js';
import { parseStepGroups, stepsToText } from './steps.js';
import {
	LINE_TOO_LONG,
	MAX_GROUP_NAME,
	MAX_SOURCE_URL,
	TEXT_LIMITS,
	fieldTooLong,
	groupNameTooLong,
	limitError,
	textTooLong,
	type TextField
} from './limits.js';
import { formatDuration, readDuration, TIME_FIELDS, type TimeField } from './times.js';

export { TIME_FIELDS, type TimeField };
import { normaliseTagNames } from './tags.js';
import { oneOf, text, slugify } from '#lib/helpers.js';

// Largest value a Postgres `integer` column holds.
const INT4_MAX = 2_147_483_647;

/** The number fields: their name in messages, their label on the form and their floor. */
export const NUMBER_FIELDS = {
	servings: { label: 'Servings', formLabel: 'Serves', min: 1 }
} as const;

/** What a time field says when it cannot be read or runs past the cap; the editor shows the same live. */
export function timeMessages(field: TimeField) {
	const { label, word } = TIME_FIELDS[field];
	return {
		unreadable: `Write the ${word} time like 45 min, 1 h 30 or 2 days`,
		tooLong: `${label} is too long (30 days max)`
	};
}

/** What the source link says when it is refused; the editor shows the same live. */
export const SOURCE_URL_MESSAGES = {
	invalid: 'Write the source link as a web address, like https://example.com',
	tooLong: `Source link is too long (${MAX_SOURCE_URL.toLocaleString('en-US')} characters max)`
} as const;

/**
 * A typed source link as it is stored: blank is none; an address without a
 * scheme is taken as https; only http and https to a named host are kept, so
 * the page never links to a script or a file. Never fetched.
 */
export function readSourceUrl(
	typed: string
): { ok: true; url: string | null } | { ok: false; error: string } {
	const text = typed.trim();
	if (text === '') return { ok: true, url: null };
	if (text.length > MAX_SOURCE_URL) return { ok: false, error: SOURCE_URL_MESSAGES.tooLong };
	const withScheme = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`;
	const url = URL.canParse(withScheme) ? new URL(withScheme) : null;
	if (!url || !['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.'))
		return { ok: false, error: SOURCE_URL_MESSAGES.invalid };
	return { ok: true, url: url.href };
}

export type NumberField = keyof typeof NUMBER_FIELDS;

/** What a number field says when it is not whole, below its floor or too large; the editor shows the same live. */
export function numberMessages(field: NumberField) {
	const { label, min } = NUMBER_FIELDS[field];
	return {
		whole: `${label} must be a whole number`,
		belowMin: `${label} must be at least ${min}`,
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
const PHOTO_TYPE_NAMES = 'JPEG, PNG, WebP or GIF';
const PHOTO_MAX_MB = PHOTO_MAX_BYTES / 1024 / 1024;
export const PHOTO_TYPE_MESSAGE = `Choose a ${PHOTO_TYPE_NAMES} photo.`;
export const PHOTO_SIZE_MESSAGE = `Choose a photo under ${PHOTO_MAX_MB} MB.`;
/** The photo field's format hint, from the same types and limit. */
export const PHOTO_HINT = `${PHOTO_TYPE_NAMES}, up to ${PHOTO_MAX_MB} MB`;

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

/** A typed time as minutes, refused with the message the editor shows live. */
const duration = (field: TimeField) =>
	z.string().transform((s, ctx) => {
		const read = readDuration(s);
		if (read.ok) return read.minutes;
		ctx.addIssue({ code: 'custom', message: timeMessages(field)[read.reason] });
		return z.NEVER;
	});

/** Free text, trimmed, one kind of line break, capped; blank is absent. */
const optionalText = (field: TextField) =>
	z
		.string()
		.transform((s) => s.replace(/\r\n?/g, '\n').trim())
		.pipe(z.string().max(TEXT_LIMITS[field].max, textTooLong(field)))
		.transform((s) => s || null);

const sourceUrl = z.string().transform((s, ctx) => {
	const read = readSourceUrl(s);
	if (read.ok) return read.url;
	ctx.addIssue({ code: 'custom', message: read.error });
	return z.NEVER;
});

/** How a source reads: its name, else the link's host without "www.". */
export function sourceLabel(name: string | null, url: string | null): string {
	return name ?? (url ? new URL(url).hostname.replace(/^www\./, '') : '');
}

const recipeContentSchema = z.object({
	title: z.string().trim().min(1, REQUIRED_MESSAGES.title),
	description: z
		.string()
		.trim()
		.transform((s) => s || null),
	sourceName: optionalText('sourceName'),
	sourceUrl,
	servings: optionalInt('servings'),
	makes: optionalText('makes'),
	prepTimeMinutes: duration('prepTimeMinutes'),
	cookTimeMinutes: duration('cookTimeMinutes'),
	restTimeMinutes: duration('restTimeMinutes'),
	ingredients: bounded(INGREDIENTS)
		.transform(parseIngredientGroups)
		.pipe(grouped<Ingredient>('ingredients'))
		.pipe(z.array(z.custom<Ingredient>()).min(1, REQUIRED_MESSAGES.ingredients)),
	steps: bounded(STEPS)
		.transform(parseStepGroups)
		.pipe(grouped<Step>('steps'))
		.pipe(z.array(z.custom<Step>()).min(1, REQUIRED_MESSAGES.steps)),
	notes: optionalText('notes'),
	makeAhead: optionalText('makeAhead'),
	equipment: optionalText('equipment'),
	storage: optionalText('storage'),
	reheating: optionalText('reheating')
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
	restTimeMinutes: string;
	sourceName: string;
	sourceUrl: string;
	ingredients: string;
	steps: string;
	notes: string;
	makeAhead: string;
	equipment: string;
	storage: string;
	reheating: string;
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
export const tagNameMessage = (name: string) => `Tag "${name}" needs at least one letter or number`;

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
 * The versioned content (title, description, source, servings, times,
 * ingredients, steps, notes) from the form's draft strings: an action passes
 * `draftOf(formData)`, the editor its live draft.
 */
export function parseDraftContent(draft: RecipeDraft): Result<ContentFields> {
	return parse(recipeContentSchema, {
		title: draft.title,
		description: draft.description,
		sourceName: draft.sourceName,
		sourceUrl: draft.sourceUrl,
		servings: draft.servings,
		makes: draft.makes,
		prepTimeMinutes: draft.prepTimeMinutes,
		cookTimeMinutes: draft.cookTimeMinutes,
		restTimeMinutes: draft.restTimeMinutes,
		ingredients: draft.ingredients,
		steps: draft.steps,
		notes: draft.notes,
		makeAhead: draft.makeAhead,
		equipment: draft.equipment,
		storage: draft.storage,
		reheating: draft.reheating
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
 * A version's content as the form's strings, times as words, with the
 * recipe's settings; with no content (a new recipe) every field is blank.
 */
export function contentDraft(
	content: ContentFields | null,
	settings: Pick<RecipeDraft, 'editRevision' | 'visibility' | 'tags'>
): RecipeDraft {
	const words = (s: string | null | undefined) => s ?? '';
	const time = (minutes: number | null | undefined) =>
		minutes == null ? '' : formatDuration(minutes);
	return {
		title: words(content?.title),
		description: words(content?.description),
		sourceName: words(content?.sourceName),
		sourceUrl: words(content?.sourceUrl),
		servings: content?.servings?.toString() ?? '',
		makes: words(content?.makes),
		prepTimeMinutes: time(content?.prepTimeMinutes),
		cookTimeMinutes: time(content?.cookTimeMinutes),
		restTimeMinutes: time(content?.restTimeMinutes),
		ingredients: content ? ingredientsToText(content.ingredients) : '',
		steps: content ? stepsToText(content.steps) : '',
		notes: words(content?.notes),
		makeAhead: words(content?.makeAhead),
		equipment: words(content?.equipment),
		storage: words(content?.storage),
		reheating: words(content?.reheating),
		commitMessage: '',
		...settings,
		hadPhoto: false,
		removeImage: false
	};
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
		restTimeMinutes: text(formData, 'restTimeMinutes'),
		sourceName: text(formData, 'sourceName'),
		sourceUrl: text(formData, 'sourceUrl'),
		ingredients: text(formData, 'ingredients'),
		steps: text(formData, 'steps'),
		notes: text(formData, 'notes'),
		makeAhead: text(formData, 'makeAhead'),
		equipment: text(formData, 'equipment'),
		storage: text(formData, 'storage'),
		reheating: text(formData, 'reheating'),
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
	sourceName: [textTooLong('sourceName')],
	sourceUrl: Object.values(SOURCE_URL_MESSAGES),
	servings: Object.values(numberMessages('servings')),
	makes: [textTooLong('makes')],
	prepTimeMinutes: Object.values(timeMessages('prepTimeMinutes')),
	cookTimeMinutes: Object.values(timeMessages('cookTimeMinutes')),
	restTimeMinutes: Object.values(timeMessages('restTimeMinutes')),
	notes: [textTooLong('notes')],
	makeAhead: [textTooLong('makeAhead')],
	equipment: [textTooLong('equipment')],
	storage: [textTooLong('storage')],
	reheating: [textTooLong('reheating')],
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
