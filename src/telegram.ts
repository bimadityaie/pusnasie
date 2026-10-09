import { InlineKeyboard } from './types';

async function callTelegram(env: Env, method: string, payload: unknown): Promise<void> {
	const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(`Telegram ${method} failed: ${res.status}`);
}

export async function sendMessage(env: Env, text: string, keyboard?: InlineKeyboard): Promise<void> {
	await callTelegram(env, 'sendMessage', {
		chat_id: env.TELEGRAM_CHAT_ID,
		text,
		parse_mode: 'HTML',
		...(keyboard && { reply_markup: { inline_keyboard: keyboard } }),
	});
}

export async function answerCallbackQuery(env: Env, callbackQueryId: string): Promise<void> {
	await callTelegram(env, 'answerCallbackQuery', { callback_query_id: callbackQueryId });
}
