import { MAX_BOOKS } from './config';
import { bold, bookExists, escapeHtml, findBook, formatTitle } from './helpers';
import { getAccessToken, searchBooks } from './ipusnas';
import { readWatchList, saveWatchList } from './storage';

type CommandHandler = (env: Env, arg?: string) => Promise<string>;

const HELP_TEXT = 'Commands:\n/add <book title>\n/remove <book title>\n/list';

async function addBook(env: Env, bookTitle?: string): Promise<string> {
	if (!bookTitle) return escapeHtml('Usage: /add <book title>');

	const token = await getAccessToken(env);
	const searchedBooks = await searchBooks(token, bookTitle);
	const book = findBook(searchedBooks, bookTitle);
	if (!book) return `Book ${bold(formatTitle(bookTitle))} not found.`;

	const watchList = await readWatchList(env.PUSNASIE_KV);
	if (bookExists(watchList, book.title)) return `Book ${bold(book.title)} by ${bold(book.author)} is already in the list.`;
	if (watchList.length >= MAX_BOOKS) return `Cannot add more than ${bold(MAX_BOOKS.toString())} books.`;

	await saveWatchList(env.PUSNASIE_KV, [...watchList, book]);
	return `Book ${bold(book.title)} by ${bold(book.author)} added to watch list.`;
}

async function removeBook(env: Env, bookTitle?: string): Promise<string> {
	if (!bookTitle) return escapeHtml('Usage: /remove <book title>');

	const watchList = await readWatchList(env.PUSNASIE_KV);
	const book = findBook(watchList, bookTitle);
	if (!book) return `Book ${bold(bookTitle)} is not in the watch list.`;

	await saveWatchList(
		env.PUSNASIE_KV,
		watchList.filter((watchedBook) => watchedBook.id !== book.id),
	);
	return `Book ${bold(book.title)} by ${bold(book.author)} removed from watch list.`;
}

async function listBooks(env: Env): Promise<string> {
	const watchList = await readWatchList(env.PUSNASIE_KV);
	return watchList.length > 0
		? `Watched books:\n${watchList.map((watchedBook, index) => `${index + 1}. ${watchedBook.title} by ${watchedBook.author}`).join('\n')}`
		: 'No books in the watch list.';
}

export const handlers: Map<string, CommandHandler> = new Map([
	['/add', addBook],
	['/remove', removeBook],
	['/list', listBooks],
]);

function parseCommand(text: string): { command: string; arg?: string } {
	const trimmed = text.trim();
	const firstSpace = trimmed.search(/\s/);
	const rawCommand = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
	const arg = firstSpace === -1 ? '' : trimmed.slice(firstSpace).trim();
	return {
		command: rawCommand.split('@')[0],
		arg: arg || undefined,
	};
}

export async function handleCommand(env: Env, text: string): Promise<string> {
	const { command, arg } = parseCommand(text);
	const handler = handlers.get(command);
	return handler ? handler(env, arg) : escapeHtml(HELP_TEXT);
}
