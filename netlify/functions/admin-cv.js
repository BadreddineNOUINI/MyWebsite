const { requireAdmin } = require("./_lib/auth");
const { json, parseBody } = require("./_lib/response");
const { getCV, updateCV, deleteCV } = require("./_lib/repository");

exports.handler = async function handler(event) {
  const auth = requireAdmin(event);
  if (!auth.ok) return auth.response;

  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) return json(400, { ok: false, error: "Missing id" });

  if (event.httpMethod === "GET") {
    const cv = await getCV(event, id);
    if (!cv) return json(404, { ok: false, error: "CV introuvable" });
    return json(200, { ok: true, data: cv });
  }

  if (event.httpMethod === "PUT") {
    const body = parseBody(event);
    const updated = await updateCV(event, id, body);
    if (!updated) return json(404, { ok: false, error: "CV introuvable" });
    return json(200, { ok: true, data: updated });
  }

  if (event.httpMethod === "DELETE") {
    const deleted = await deleteCV(event, id);
    if (!deleted) return json(404, { ok: false, error: "CV introuvable" });
    return json(200, { ok: true });
  }

  return json(405, { ok: false, error: "Method not allowed" });
};
