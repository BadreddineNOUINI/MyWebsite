const { clearSessionCookie } = require("./_lib/auth");
const { noContent } = require("./_lib/response");
const { methodNotAllowed } = require("./_lib/http");

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed();
  return noContent({ headers: { "set-cookie": clearSessionCookie() } });
};
