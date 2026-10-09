export const IPUSNAS_BASE_ENDPOINT = 'https://backend-ipusnas.perpusnas.go.id/api';
export const MAX_BOOKS = 30;
export const SEARCH_LIMIT = 7;
export const SEARCH_OFFSET = 0;
export const TOKEN_REFRESH_MARGIN_MS = 60_000;

export const CALLBACK_PREFIX = 'add:';

export const KV_KEYS = {
	auth: 'auth',
	watchList: 'watch-list',
	bookStatus: 'book-status',
} as const;
