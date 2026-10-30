const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
});

export default async (request) => {
  if (request.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const setupKey = process.env.WEBHOOK_SETUP_KEY;
  if (!setupKey || body?.key !== setupKey) return json({ ok: false, error: 'Unauthorized' }, 401);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const siteUrl = process.env.URL;
  if (!botToken || !webhookSecret || !siteUrl) {
    return json({ ok: false, error: 'Missing TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, or Netlify URL environment variable' }, 500);
  }

  const webhookUrl = `${siteUrl.replace(/\/$/, '')}/.netlify/functions/telegram-webhook`;
  const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ['chat_join_request'],
      drop_pending_updates: false
    })
  });
  const result = await telegramResponse.json().catch(() => ({}));
  if (!telegramResponse.ok || !result.ok) {
    console.error('Telegram setWebhook failed', JSON.stringify(result));
    return json({ ok: false, error: 'Telegram could not register the webhook' }, 502);
  }

  return json({ ok: true, message: 'Telegram join-request webhook configured', webhookUrl });
};
