import { KV_KEYS } from './config';
import { Auth, BookSummary, StatusMap } from './types';

async function readJson<T>(kv: KVNamespace, key: string): Promise<any> {
	return kv.get<T>(key, 'json');
}

async function writeJson<T>(kv: KVNamespace, key: string, value: T): Promise<void> {
	await kv.put(key, JSON.stringify(value));
}

export async function readAuth(kv: KVNamespace): Promise<Auth | null> {
	return readJson<Auth>(kv, KV_KEYS.auth);
}

export async function saveAuth(kv: KVNamespace, auth: Auth): Promise<void> {
	await writeJson(kv, KV_KEYS.auth, auth);
}

export async function readWatchList(kv: KVNamespace): Promise<BookSummary[]> {
	return (await readJson<BookSummary[]>(kv, KV_KEYS.watchList)) ?? [];
}

export async function saveWatchList(kv: KVNamespace, watchList: BookSummary[]): Promise<void> {
	await writeJson(kv, KV_KEYS.watchList, watchList);
}

export async function readStatuses(kv: KVNamespace): Promise<StatusMap> {
	return (await readJson<StatusMap>(kv, KV_KEYS.bookStatus)) ?? {};
}

export async function saveStatuses(kv: KVNamespace, statuses: StatusMap): Promise<void> {
	await writeJson(kv, KV_KEYS.bookStatus, statuses);
}
