import { CALLBACK_PREFIX, MAX_BOOKS } from './config';
import { bookExists, findBook, messages, reply } from './helpers';
import { checkBook, getAccessToken, searchBooks } from './ipusnas';
import { readStatuses, readWatchList, saveWatchList } from './storage';
import { BookSummary, ListEntry, Reply } from './types';

type CommandHandler = (env: Env, arg?: string) => Promise<Reply>;

async function addBookToWatchList(env: Env, book: BookSummary): Promise<Reply> {
	const watchList = await readWatchList(env.PUSNASIE_KV);
	if (bookExists(watchList, book.title)) return reply(messages.alreadyWatching(book.title));
	if (watchList.length >= MAX_BOOKS) return reply(messages.listFull(MAX_BOOKS));

	await saveWatchList(env.PUSNASIE_KV, [...watchList, book]);
	return reply(messages.added(book.title, watchList.length + 1, MAX_BOOKS));
}

async function addBookById(env: Env, bookId?: string): Promise<Reply> {
	if (!bookId) return reply(messages.usage('/addid', 'bookId'));

	const token = await getAccessToken(env);
	const book = await checkBook(token, bookId).catch(() => null);
	if (!book) return reply(messages.notFound(bookId));

	return addBookToWatchList(env, book);
}

async function addBook(env: Env, query?: string): Promise<Reply> {
	if (!query) return reply(messages.usage('/add', 'title'));

	const token = await getAccessToken(env);
	const searchedBooks = await searchBooks(token, query);
	if (searchedBooks.length === 0) return reply(messages.noResults(query));
	if (searchedBooks.length === 1) return addBookToWatchList(env, searchedBooks[0]);

	const keyboard = searchedBooks.map((searchedBook) => [
		{ text: searchedBook.title, callback_data: `${CALLBACK_PREFIX}${searchedBook.id}` },
	]);
	return reply(messages.pickOne(), keyboard);
}

async function removeBook(env: Env, title?: string): Promise<Reply> {
	if (!title) return reply(messages.usage('/remove', 'title'));

	const watchList = await readWatchList(env.PUSNASIE_KV);
	const book = findBook(watchList, title);
	if (!book) return reply(messages.notInList(title));

	await saveWatchList(
		env.PUSNASIE_KV,
		watchList.filter((watchedBook) => watchedBook.id !== book.id),
	);
	return reply(messages.removed(book.title));
}

async function listBooks(env: Env): Promise<Reply> {
	const [watchList, statuses] = await Promise.all([readWatchList(env.PUSNASIE_KV), readStatuses(env.PUSNASIE_KV)]);
	if (watchList.length === 0) return reply(messages.emptyList());

	const entries: ListEntry[] = watchList.map((watchedBook) => ({
		id: watchedBook.id,
		title: watchedBook.title,
		isAvailable: statuses[watchedBook.id]?.isAvailable,
	}));
	return reply(messages.list(entries, MAX_BOOKS));
}

export const handlers: Map<string, CommandHandler> = new Map([
	['/add', addBook],
	['/addid', addBookById],
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

export async function handleCommand(env: Env, text: string): Promise<Reply> {
	const { command, arg } = parseCommand(text);
	const handler = handlers.get(command);
	return handler ? handler(env, arg) : reply(messages.help());
}

export async function handleCallback(env: Env, data: string): Promise<Reply> {
	if (!data.startsWith(CALLBACK_PREFIX)) return reply(messages.unknownAction());
	return addBookById(env, data.slice(CALLBACK_PREFIX.length));
}
