// Reading CSS rules out of a source file (app.css, a component's <style>) in a
// test. A pattern, not a parser: a rule body holds no braces, which is true of
// every rule this repo writes.

function rulePattern(selector: string, flags: string): RegExp {
	// The selector as written, its list split on commas so a list may break
	// across lines. It is one whole entry of the rule's selector list: preceded
	// by the start, a brace, a semicolon, a comment's end, `<style>` or a comma,
	// so `.b` matches `.a, .b` but never `.a .b`.
	const escaped = selector
		.trim()
		.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		.replace(/\s*,\s*/g, ',')
		.replace(/\s+/g, '\\s+')
		.replace(/,/g, ',\\s*');
	return new RegExp(
		`(?:^|[{};,]|\\*/|<style>)\\s*${escaped}\\s*(?:,[^{}]*)?\\{([^{}]*)(?=\\})`,
		flags
	);
}

/** The body of the first rule whose selector list holds `selector`; throws when there is none. */
export function cssRule(source: string, selector: string): string {
	const match = rulePattern(selector, '').exec(source);
	if (!match) throw new Error(`No rule for ${selector}`);
	return match[1];
}

/** The bodies of every rule whose selector list holds `selector`, in source order. */
export function cssRules(source: string, selector: string): string[] {
	return [...source.matchAll(rulePattern(selector, 'g'))].map((m) => m[1]);
}
