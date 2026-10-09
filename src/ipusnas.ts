import { IPUSNAS_BASE_ENDPOINT, SEARCH_LIMIT, SEARCH_OFFSET, TOKEN_REFRESH_MARGIN_MS } from './config';
import { formatTitle } from './helpers';
import { readAuth, saveAuth } from './storage';
import { Auth, Book, BookSummary } from './types';

interface LoginResponse {
	data: {
		access_token: string;
		expired_at: string;
	};
}

interface CheckBookResponse {
	data: {
		id: string;
		book_title: string;
		book_author: string;
		available_qty: number;
	};
}

interface SearchBooksResponse {
	data: [{ id: string; book_title: string; author_name: string }];
}

async function getJson<T>(path: string, init: RequestInit, label: string): Promise<T> {
	const res = await fetch(`${IPUSNAS_BASE_ENDPOINT}${path}`, init);
	if (!res.ok) throw new Error(`Failed ${label}: ${res.status}`);
	return res.json<T>();
}

export async function login(env: Env): Promise<Auth> {
	const { data } = await getJson<LoginResponse>(
		'/auth/login',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email: env.IPUSNAS_EMAIL,
				password: env.IPUSNAS_PASSWORD,
			}),
		},
		'Login',
	);
	return {
		accessToken: data.access_token,
		expiredAt: new Date(data.expired_at).getTime(),
	};
}

export async function searchBooks(token: string, query: string): Promise<BookSummary[]> {
	const params = new URLSearchParams({ limit: SEARCH_LIMIT.toString(), offset: SEARCH_OFFSET.toString(), q: query });
	const { data } = await getJson<SearchBooksResponse>(
		`/webhook/search-book?${params}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
		`Search books for ${query}`,
	);
	return data.map(({ id, book_title, author_name }) => ({
		id,
		title: formatTitle(book_title),
		author: author_name,
	}));
}

export async function checkBook(token: string, bookId: string): Promise<Book> {
	const { data } = await getJson<CheckBookResponse>(
		`/webhook/book-detail?book_id=${bookId}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
		`Book ${bookId} check`,
	);
	return {
		id: data.id,
		title: formatTitle(data.book_title),
		author: data.book_author,
		isAvailable: data.available_qty > 0,
	};
}

function isFresh(auth: Auth): boolean {
	return auth.expiredAt > Date.now() + TOKEN_REFRESH_MARGIN_MS;
}

export async function getAccessToken(env: Env) {
	const cached = await readAuth(env.PUSNASIE_KV);
	if (cached && isFresh(cached)) return cached.accessToken;

	const auth = await login(env);
	await saveAuth(env.PUSNASIE_KV, auth);
	return auth.accessToken;
}
