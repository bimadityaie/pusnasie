import { MAX_BOOKS } from './config';
import { bookExists, findBook, messages } from './helpers';
import { getAccessToken, searchBooks } from './ipusnas';
import { readStatuses, readWatchList, saveWatchList } from './storage';
import { ListEntry } from './types';

type CommandHandler = (env: Env, arg?: string) => Promise<string>;

async function addBook(env: Env, bookTitle?: string): Promise<string> {
	if (!bookTitle) return messages.usage('/add', 'book title');

	const token = await getAccessToken(env);
	const searchedBooks = await searchBooks(token, bookTitle);
	const book = findBook(searchedBooks, bookTitle);
	if (!book) return messages.noResults(bookTitle);

	const watchList = await readWatchList(env.PUSNASIE_KV);
	if (bookExists(watchList, book.title)) return messages.alreadyWatching(book.title);
	if (watchList.length >= MAX_BOOKS) return messages.listFull(MAX_BOOKS);

	await saveWatchList(env.PUSNASIE_KV, [...watchList, book]);
	return messages.added(book.title, watchList.length + 1, MAX_BOOKS);
}

async function removeBook(env: Env, bookTitle?: string): Promise<string> {
	if (!bookTitle) return messages.usage('/remove', 'book title');

	const watchList = await readWatchList(env.PUSNASIE_KV);
	const book = findBook(watchList, bookTitle);
	if (!book) return messages.notInList(bookTitle);

	await saveWatchList(
		env.PUSNASIE_KV,
		watchList.filter((watchedBook) => watchedBook.id !== book.id),
	);
	return messages.removed(book.title);
}

async function listBooks(env: Env): Promise<string> {
	const [watchList, statuses] = await Promise.all([readWatchList(env.PUSNASIE_KV), readStatuses(env.PUSNASIE_KV)]);
	if (watchList.length === 0) return messages.emptyList();

	const entries: ListEntry[] = watchList.map((watchedBook) => ({
		id: watchedBook.id,
		title: watchedBook.title,
		isAvailable: statuses[watchedBook.id]?.isAvailable,
	}));
	return messages.list(entries, MAX_BOOKS);
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
	return handler ? handler(env, arg) : messages.help();
}
