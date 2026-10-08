export interface Auth {
	accessToken: string;
	expiredAt: number;
}

export interface BookSummary {
	id: string;
	title: string;
	author: string;
}

export interface Book extends BookSummary {
	isAvailable: boolean;
}

export type BookState = Pick<Book, 'title' | 'isAvailable'>;

export type StatusMap = Record<Book['id'], BookState>;

export interface TelegramUpdate {
	message?: { chat: { id: number }; text?: string };
}
