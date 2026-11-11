/** The units a cook may ask quantities to be shown in (Settings); unset shows them as written. */
export const MEASUREMENTS = ['metric', 'us'] as const;

export type Measurement = (typeof MEASUREMENTS)[number];

/** The Settings form's value for "As written", stored as null. */
export const AS_WRITTEN = 'written';
