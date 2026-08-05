const { requireAdmin } = require("./_lib/auth");
const { json, parseBody } = require("./_lib/response");
const { listCVs, createCV, THEMES, BLOCK_TYPES } = require("./_lib/repository");

exports.handler = async function handler(event) {
  const auth = requireAdmin(event);
  if (!auth.ok) return auth.response;

  if (event.httpMethod === "GET") {
    const data = await listCVs(event);
    return json(200, { ok: true, data, themes: THEMES, blockTypes: BLOCK_TYPES });
  }

  if (event.httpMethod === "POST") {
    const body = parseBody(event);
    const created = await createCV(event, body);
    return json(201, { ok: true, data: created });
  }

  return json(405, { ok: false, error: "Method not allowed" });
};
