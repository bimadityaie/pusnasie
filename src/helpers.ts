import { BookSummary } from './types';

export function findBook(list: BookSummary[], bookTitle: string): BookSummary | undefined {
	return list.find((book) => book.title.toLowerCase().includes(bookTitle.toLowerCase()));
}

export function bookExists(list: BookSummary[], bookTitle: string): boolean {
	return Boolean(findBook(list, bookTitle));
}

const SMALL_WORDS = new Set([
	// Indonesian
	'di',
	'ke',
	'dari',
	'yang',
	'dan',
	'atau',
	'untuk',
	'dengan',
	'pada',
	'dalam',
	'oleh',
	'bagi',
	'tentang',
	'serta',
	'sebagai',

	// English
	'a',
	'an',
	'the',
	'and',
	'but',
	'or',
	'nor',
	'for',
	'of',
	'in',
	'on',
	'at',
	'to',
	'by',
	'from',
	'with',
	'as',
	'vs',
]);

function capitalize(word: string) {
	return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatPart(part: string, isFirst: boolean, isAllCaps: boolean): string {
	const lower = part.toLowerCase();

	if (!isFirst && SMALL_WORDS.has(lower)) return lower;
	if (isAllCaps) return capitalize(lower);
	if (part === lower) return capitalize(part);

	return part;
}

function formatWord(word: string, isFirst: boolean, isAllCaps: boolean): string {
	return word
		.split('-')
		.map((part, i) => formatPart(part, isFirst && i === 0, isAllCaps))
		.join('-');
}

export function formatTitle(raw: string): string {
	const withoutSubtitle = raw.split(':')[0];
	const mainTitle = withoutSubtitle.replace(/\s*\([^)]*\)\s*$/, '').trim();

	if (!mainTitle) return raw.trim();

	const isAllCaps = mainTitle === mainTitle.toUpperCase();

	return mainTitle
		.split(/\s+/)
		.map((word, i) => formatWord(word, i === 0, isAllCaps))
		.join(' ');
}

export function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function bold(text: string) {
	return `<b>${escapeHtml(text)}</b>`;
}
