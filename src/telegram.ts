export async function sendMessage(env: Env, text: string): Promise<void> {
	const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
	});
	if (!res.ok) throw new Error(`Telegram request failed: ${res.status}`);
}
