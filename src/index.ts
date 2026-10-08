import { handleCommand } from './commands';
import { getOwnerText } from './helpers';
import { sendMessage } from './telegram';
import { TelegramUpdate } from './types';
import { runWatcher } from './watcher';

async function handleWebhook(request: Request, env: Env): Promise<Response> {
	const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
	if (secret !== env.TELEGRAM_WEBHOOK_SECRET) return new Response('Unauthorized', { status: 401 });

	const telegramUpdate = await request.json<TelegramUpdate>();
	const text = getOwnerText(env, telegramUpdate);
	if (text) {
		try {
			await sendMessage(env, await handleCommand(env, text));
		} catch (err) {
			console.error('Command failed:', err);
		}
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
