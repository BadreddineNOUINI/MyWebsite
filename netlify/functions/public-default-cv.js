const { json } = require("./_lib/response");
const { getDefaultPublishedCV, THEMES } = require("./_lib/repository");

exports.handler = async function handler(event) {
  if (event.httpMethod !== "GET") return json(405, { ok: false, error: "Method not allowed" });
  const cv = await getDefaultPublishedCV(event);
  if (!cv) return json(404, { ok: false, error: "Aucun CV publie" });
  return json(200, { ok: true, data: cv, themes: THEMES });
};
