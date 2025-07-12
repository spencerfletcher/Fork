export const slugify = (text: string) => {
	return text
		.toLowerCase()
		.replace(/ & /g, ' ')
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
};