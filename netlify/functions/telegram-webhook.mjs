import { createHash } from 'node:crypto';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
});

export default async (request) => {
  if (request.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const suppliedSecret = request.headers.get('x-telegram-bot-api-secret-token');
  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return json({ ok: false, error: 'Unauthorized webhook request' }, 401);
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const join = update?.chat_join_request;
  if (!join) return json({ ok: true, ignored: true });

  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    console.error('Missing META_PIXEL_ID or META_ACCESS_TOKEN environment variable');
    return json({ ok: false, error: 'Meta CAPI is not configured' }, 500);
  }

  const telegramUserId = join?.from?.id;
  if (telegramUserId === undefined || update?.update_id === undefined) {
    console.error('Join request is missing Telegram user ID or update ID');
    return json({ ok: false, error: 'Incomplete join request update' }, 400);
  }

  // Hash the Telegram account ID before sending it as a pseudonymous external_id.
  const externalId = createHash('sha256').update(String(telegramUserId)).digest('hex');
  const eventTime = Number(join.date) || Math.floor(Date.now() / 1000);
  const eventId = `tg_join_request_${update.update_id}`;
  const apiVersion = process.env.META_GRAPH_API_VERSION || 'v25.0';
  const endpoint = `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;

  const payload = {
  test_event_code: "TEST45594",
  data: [{
    event_name: 'TelegramJoinRequest',
      event_time: eventTime,
      event_id: eventId,
      action_source: 'other',
      user_data: { external_id: [externalId] },
      custom_data: { source: 'telegram_channel_join_request' }
    }]
  };

  try {
    const metaResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const metaResult = await metaResponse.json().catch(() => ({}));
    
    console.log('META DEBUG', {
  status: metaResponse.status,
  response: metaResult,
  testEventCode: payload.test_event_code
});
    if (!metaResponse.ok || metaResult.error) {
      console.error('Meta CAPI rejected TelegramJoinRequest', JSON.stringify(metaResult));
      return json({ ok: false, error: 'Meta CAPI request failed' }, 502);
    }
    console.log('TelegramJoinRequest sent to Meta', { eventId, eventsReceived: metaResult.events_received });
    return json({ ok: true, event: 'TelegramJoinRequest', eventId });
  } catch (error) {
    console.error('Meta CAPI network error', error?.message || error);
    return json({ ok: false, error: 'Could not reach Meta CAPI' }, 502);
  }
};
