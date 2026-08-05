const { requireAdmin } = require("./_lib/auth");
const { json, parseBody } = require("./_lib/response");
const { setPublished } = require("./_lib/repository");

exports.handler = async function handler(event) {
  const auth = requireAdmin(event);
  if (!auth.ok) return auth.response;
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "Method not allowed" });

  const body = parseBody(event);
  if (!body.id) return json(400, { ok: false, error: "Missing id" });
  const published = body.published === true;
  const updated = await setPublished(event, String(body.id), published);
  if (!updated) return json(404, { ok: false, error: "CV introuvable" });
  return json(200, { ok: true, data: updated });
};
