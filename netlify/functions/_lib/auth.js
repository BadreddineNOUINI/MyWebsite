const crypto = require("crypto");
const { SESSION_COOKIE, SESSION_TTL_SECONDS } = require("./config");
const { json } = require("./response");

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function getSecret() {
  return process.env.SESSION_SECRET || "change-me-in-netlify-env";
}

function getAdminUsername() {
  return process.env.ADMIN_USERNAME || "admin";
}

function getAdminPasswordHash() {
  if (process.env.ADMIN_PASSWORD_HASH) return process.env.ADMIN_PASSWORD_HASH;
  if (process.env.ADMIN_PASSWORD) return sha256(process.env.ADMIN_PASSWORD);
  return sha256("admin123");
}

function parseCookies(event) {
  const raw = (event && event.headers && (event.headers.cookie || event.headers.Cookie)) || "";
  const out = {};
  raw.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (_error) {
    return null;
  }
}

function buildSessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}; Secure`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

function authenticateCredentials(username, password) {
  const safeUser = String(username || "").trim();
  const safePass = String(password || "");
  return safeUser === getAdminUsername() && sha256(safePass) === getAdminPasswordHash();
}

function createSession(username) {
  const now = Math.floor(Date.now() / 1000);
  return signToken({ sub: username, role: "admin", iat: now, exp: now + SESSION_TTL_SECONDS });
}

function requireAdmin(event) {
  const cookies = parseCookies(event);
  const token = cookies[SESSION_COOKIE];
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return { ok: false, response: json(401, { ok: false, error: "Unauthorized" }) };
  }
  return { ok: true, admin: payload.sub };
}

module.exports = {
  sha256,
  authenticateCredentials,
  createSession,
  buildSessionCookie,
  clearSessionCookie,
  requireAdmin,
  getAdminUsername
};
