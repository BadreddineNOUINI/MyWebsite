const { json } = require("./_lib/response");
const { getCV } = require("./_lib/repository");

exports.handler = async function handler(event) {
  if (event.httpMethod !== "GET") return json(405, { ok: false, error: "Method not allowed" });
  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) return json(400, { ok: false, error: "Missing id" });
  const cv = await getCV(event, id);
  if (!cv || cv.status !== "published") {
    return json(404, { ok: false, error: "CV public introuvable" });
  }
  return json(200, { ok: true, data: cv });
};
