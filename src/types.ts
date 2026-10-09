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

export interface InlineButton {
	text: string;
	callback_data: string;
}

export type InlineKeyboard = InlineButton[][];

export interface Reply {
	text: string;
	keyboard?: InlineKeyboard;
}

export interface TelegramMessage {
	chat: { id: number };
	text?: string;
}

export interface TelegramCallbackQuery {
	id: string;
	data: string;
	message?: { chat: { id: number } };
}

export interface TelegramUpdate {
	message?: TelegramMessage;
	callback_query?: TelegramCallbackQuery;
}

export interface ListEntry {
	id: string;
	title: string;
	isAvailable?: boolean;
}
