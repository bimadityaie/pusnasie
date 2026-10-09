import { messages } from './helpers';
import { checkBook, getAccessToken } from './ipusnas';
import { readStatuses, readWatchList, saveStatuses } from './storage';
import { sendMessage } from './telegram';
import { Book, BookSummary, StatusMap } from './types';

export function diffStatuses(watchList: BookSummary[], books: Book[], prev: StatusMap): { next: StatusMap; newlyAvailable: Book[] } {
	const next: StatusMap = {};
	for (const watchedBook of watchList) {
		if (prev[watchedBook.id]) next[watchedBook.id] = prev[watchedBook.id];
	}

	const newlyAvailable: Book[] = [];
	for (const book of books) {
		const wasAvailable = prev[book.id] ? prev[book.id].isAvailable : false;
		next[book.id] = { title: book.title, isAvailable: book.isAvailable };
		if (!wasAvailable && book.isAvailable) newlyAvailable.push(book);
	}

	return { next, newlyAvailable };
}

function collectSuccessful(watchList: BookSummary[], settledResults: PromiseSettledResult<Book>[], prev: StatusMap): Book[] {
	const books: Book[] = [];
	for (const [index, settledResult] of settledResults.entries()) {
		if (settledResult.status === 'fulfilled') {
			books.push(settledResult.value);
			continue;
		}

		const watchedBook = watchList[index];
		const title = prev[watchedBook.id] ? prev[watchedBook.id].title : 'Unknown Title';
		console.error(`Failed to check book ${watchedBook.id} ("${title}"):`, settledResult.reason);
	}

	return books;
}

export async function runWatcher(env: Env): Promise<void> {
	const watchList = await readWatchList(env.PUSNASIE_KV);
	if (watchList.length === 0) return;

	const token = await getAccessToken(env);
	const settledResult = await Promise.allSettled(watchList.map((watchedBook) => checkBook(token, watchedBook.id)));

	const prev = await readStatuses(env.PUSNASIE_KV);
	const books = collectSuccessful(watchList, settledResult, prev);
	const { next, newlyAvailable } = diffStatuses(watchList, books, prev);

	if (newlyAvailable.length > 0) {
		await sendMessage(env, messages.available(newlyAvailable));
	}

	if (JSON.stringify(prev) !== JSON.stringify(next)) {
		await saveStatuses(env.PUSNASIE_KV, next);
	}
}
