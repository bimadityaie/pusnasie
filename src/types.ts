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

export interface TelegramUpdate {
	message?: { chat: { id: number }; text?: string };
}
