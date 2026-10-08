import { handleCommand } from './commands';
import { sendMessage } from './telegram';
import { TelegramUpdate } from './types';

async function handleWebhook(request: Request, env: Env): Promise<Response> {
	const { message } = await request.json<TelegramUpdate>();
	if (message && message.text) {
		try {
			await sendMessage(env, await handleCommand(env, message.text));
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
} satisfies ExportedHandler<Env>;
