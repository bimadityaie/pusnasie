import { MAX_BOOKS } from './config';
import { getAccessToken, searchBooks } from './ipusnas';
import { readWatchList, saveWatchList } from './storage';

type CommandHandler = (env: Env, arg?: string) => Promise<string>;

const HELP_TEXT = 'Commands:\n/add <book title>\n/remove <book title>\n/list';

async function addBook(env: Env, bookTitle?: string): Promise<string> {
	if (!bookTitle) return 'Usage: /add <book title>';

	const watchList = await readWatchList(env.PUSNASIE_KV);
	if (watchList.find((watchedBook) => watchedBook.title.toLowerCase().startsWith(bookTitle.toLowerCase())))
		return `Book "${bookTitle}" is already in the list.`;
	if (watchList.length >= MAX_BOOKS) return `Cannot add more than ${MAX_BOOKS} books.`;

	const token = await getAccessToken(env);
	const searchedBooks = await searchBooks(token, bookTitle);
	const book = searchedBooks.find((searchedBook) => searchedBook.title.toLowerCase().startsWith(bookTitle.toLowerCase()));
	if (!book) return `Book "${bookTitle}" not found.`;

	await saveWatchList(env.PUSNASIE_KV, [...watchList, { id: book.id, title: book.title }]);
	return `Book "${book.title}" added to watch list.`;
}

async function removeBook(env: Env, bookTitle?: string): Promise<string> {
	if (!bookTitle) return 'Usage: /remove <book title>';

	const watchList = await readWatchList(env.PUSNASIE_KV);
	const book = watchList.find((watchedBook) => watchedBook.title.toLowerCase().startsWith(bookTitle.toLowerCase()));
	if (!book) return `Book "${bookTitle}" is not in the watch list.`;

	await saveWatchList(
		env.PUSNASIE_KV,
		watchList.filter((watchedBook) => watchedBook.id !== book.id),
	);
	return `Book "${book.title}" removed from watch list.`;
}

async function listBooks(env: Env): Promise<string> {
	const watchList = await readWatchList(env.PUSNASIE_KV);
	return watchList.length > 0
		? `Watched books:\n${watchList.map((watchedBook, index) => `${index + 1}. ${watchedBook.title}`).join('\n')}`
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
	return handler ? handler(env, arg) : HELP_TEXT;
}
