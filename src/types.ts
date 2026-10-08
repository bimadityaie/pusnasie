export interface Auth {
	accessToken: string;
	expiredAt: number;
}

export interface WatchedBook {
	id: string;
	title: string;
}

export interface SearchedBook {
	id: string;
	title: string;
}

export interface Book {
	id: string;
	title: string;
	isAvailable: boolean;
}

export interface TelegramUpdate {
	message?: { chat: { id: number }; text?: string };
}
