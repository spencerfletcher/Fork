/** The units a cook may ask quantities to be shown in (Settings); unset shows them as written. */
export const MEASUREMENTS = ['metric', 'us'] as const;

export type Measurement = (typeof MEASUREMENTS)[number];

/** The Settings form's value for "As written", stored as null. */
export const AS_WRITTEN = 'written';

/** The Settings choices in order, As written first. */
export const MEASUREMENT_CHOICES = [AS_WRITTEN, ...MEASUREMENTS] as const;

export type MeasurementChoice = (typeof MEASUREMENT_CHOICES)[number];

export const MEASUREMENT_LABEL: Record<MeasurementChoice, string> = {
	written: 'As written',
	metric: 'Metric',
	us: 'US'
};

/** One sentence each, under the label in Settings. */
export const MEASUREMENT_NOTE: Record<MeasurementChoice, string> = {
	written: "Exactly as the recipe's author wrote them.",
	metric:
		'Grams for most ingredients, estimated from cup and spoon measures; water, milk and stock in millilitres.',
	us: 'Ounces, pounds and cups where a conversion is certain.'
};

/** After the recipe page's conversion notice when a row led with a gram estimate (Metric). */
export const WEIGHED_NOTE = 'Weights from volume measures are estimates.';
