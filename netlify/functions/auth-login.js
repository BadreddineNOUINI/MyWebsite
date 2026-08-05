const { authenticateCredentials, createSession, buildSessionCookie, getAdminUsername } = require("./_lib/auth");
const { json, parseBody } = require("./_lib/response");
const { methodNotAllowed } = require("./_lib/http");

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") return methodNotAllowed();

  const body = parseBody(event);
  const username = String(body.username || "");
  const password = String(body.password || "");

  if (!authenticateCredentials(username, password)) {
    return json(401, { ok: false, error: "Identifiants invalides" });
  }

  const token = createSession(username || getAdminUsername());
  return json(
    200,
    {
      ok: true,
      user: { username: username || getAdminUsername(), role: "admin" }
    },
    {
      headers: {
        "set-cookie": buildSessionCookie(token)
      }
    }
  );
};
