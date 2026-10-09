import { Book, BookSummary, ListEntry, TelegramUpdate } from './types';

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

export function code(text: string) {
	return `<code>${escapeHtml(text)}</code>`;
}

export function getOwnerText(env: Env, { message }: TelegramUpdate): string | null {
	if (!message || !message.text) return null;
	return String(message.chat.id) === env.TELEGRAM_CHAT_ID ? message.text : null;
}

export function statusIcon(isAvailable?: boolean): string {
	return isAvailable === undefined ? '⌛' : isAvailable ? '🟢' : '🔴';
}

export const messages = {
	usage(command: string, param: string): string {
		return `💡 Usage: ${code(`${command} <${param}>`)}`;
	},

	help(): string {
		return [
			'🤖 Ipusnas Watcher',
			'I check your books every minute and tell you when one is available.',
			[
				`🔎 ${code('/add <title>')} search and watch a book`,
				`🗑️ ${code('/remove <title>')} stop watching a book`,
				`📚 ${code('/list')} show your watch list`,
			].join('\n'),
		].join('\n\n');
	},

	added(title: string, count: number, max: number): string {
		return `✅ Now watching ${bold(title)}\n📚 ${count}/${max} books in your watch list`;
	},

	noResults(title: string): string {
		return `🔍 No books found for ${bold(title)}. Try a shorter title.`;
	},

	alreadyWatching(title: string): string {
		return `👀 You're already watching ${bold(title)}.`;
	},

	listFull(max: number): string {
		return `🚫 Your watch list is full (${max} books). Remove one with ${code('/remove <title>')} first.`;
	},

	removed(title: string): string {
		return `🗑️ Stopped watching ${bold(title)}.`;
	},

	notInList(title: string): string {
		return `🤔 Book ${bold(formatTitle(title))} is not in your watch list.`;
	},

	list(entries: ListEntry[], max: number): string {
		if (entries.length === 0) return `📭 Your watch list is empty.\n\nAdd a book with ${code('/add <title>')}`;

		const lines = entries.map((entry) => {
			return `${statusIcon(entry.isAvailable)} ${bold(entry.title)}`;
		});
		return [`📚 Your watch list (${entries.length}/${max})`, lines.join('\n'), '🟢 available · 🔴 borrowed · ⏳ not checked yet'].join(
			'\n\n',
		);
	},

	emptyList(): string {
		return '🪹 No books in the watch list.';
	},

	available(books: Book[]): string {
		const heading =
			books.length === 1 ? "🎉 A book you're watching is now available!" : `🎉 ${books.length} books you're watching are now available!`;
		const lines = books.map((book) => `📖 ${bold(book.title)}`).join('\n');
		return `${heading}\n\n${lines}\n\n🏃 Borrow it before someone else does!`;
	},
};
