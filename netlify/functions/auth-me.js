const { requireAdmin } = require("./_lib/auth");
const { json } = require("./_lib/response");
const { methodNotAllowed } = require("./_lib/http");

exports.handler = async function handler(event) {
  if (event.httpMethod !== "GET") return methodNotAllowed();
  const auth = requireAdmin(event);
  if (!auth.ok) return auth.response;
  return json(200, { ok: true, user: { username: auth.admin, role: "admin" } });
};
