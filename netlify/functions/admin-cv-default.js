const { requireAdmin } = require("./_lib/auth");
const { json, parseBody } = require("./_lib/response");
const { setDefaultCV } = require("./_lib/repository");

exports.handler = async function handler(event) {
  const auth = requireAdmin(event);
  if (!auth.ok) return auth.response;
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "Method not allowed" });

  const body = parseBody(event);
  if (!body.id) return json(400, { ok: false, error: "Missing id" });
  const ok = await setDefaultCV(event, String(body.id));
  if (!ok) return json(404, { ok: false, error: "CV introuvable" });
  return json(200, { ok: true });
};
