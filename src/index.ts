import { handleCallback, handleCommand } from './commands';
import { isOwner } from './helpers';
import { answerCallbackQuery, sendMessage } from './telegram';
import { TelegramCallbackQuery, TelegramMessage, TelegramUpdate } from './types';
import { runWatcher } from './watcher';

async function handleMessage(env: Env, message: TelegramMessage): Promise<void> {
	if (!message.text || !isOwner(env, message.chat.id)) return;

	const { text, keyboard } = await handleCommand(env, message.text);
	await sendMessage(env, text, keyboard);
}

async function handleCallbackQuery(env: Env, query: TelegramCallbackQuery): Promise<void> {
	if (!query.data || !isOwner(env, query.message?.chat.id)) return;

	await answerCallbackQuery(env, query.id).catch((err) => console.error('answerCallbackQuery failed:', err));

	const { text, keyboard } = await handleCallback(env, query.data);
	await sendMessage(env, text, keyboard);
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
	const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
	if (secret !== env.TELEGRAM_WEBHOOK_SECRET) return new Response('Unauthorized', { status: 401 });

	const telegramUpdate = await request.json<TelegramUpdate>();
	try {
		if (telegramUpdate.callback_query) await handleCallbackQuery(env, telegramUpdate.callback_query);
		else if (telegramUpdate.message) await handleMessage(env, telegramUpdate.message);
	} catch (err) {
		console.error('TelegramUpdate failed:', err);
	}

	return new Response('OK');
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method !== 'POST') return new Response('Not found', { status: 404 });
		return handleWebhook(request, env);
	},
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(runWatcher(env).catch((err) => console.error('Cron run failed:', err)));
	},
} satisfies ExportedHandler<Env>;
