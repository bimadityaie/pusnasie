async function callTelegram(env: Env, method: string, payload: unknown): Promise<void> {
	const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(`Telegram ${method} failed: ${res.status}`);
}

export async function sendMessage(env: Env, text: string): Promise<void> {
	await callTelegram(env, 'sendMessage', { chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' });
}
