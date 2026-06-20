export function hasOversizedPayload(request, maxBytes) {
  const length = Number(request.headers.get('content-length') || 0);
  return Number.isFinite(length) && length > maxBytes;
}

export async function readJsonRequestBody(request, maxBytes = 4096) {
  if (hasOversizedPayload(request, maxBytes)) return { ok: false, error: 'payload_too_large' };
  let text = '';
  try {
    text = await request.text();
  } catch (e) {
    return { ok: false, error: 'invalid_json' };
  }
  if (new TextEncoder().encode(text).length > maxBytes) return { ok: false, error: 'payload_too_large' };
  try {
    return { ok: true, body: text ? JSON.parse(text) : {} };
  } catch (e) {
    return { ok: false, error: 'invalid_json' };
  }
}
