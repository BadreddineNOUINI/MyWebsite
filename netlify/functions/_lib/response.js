function json(statusCode, payload, extra = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(extra.headers || {})
    },
    body: JSON.stringify(payload)
  };
}

function noContent(extra = {}) {
  return {
    statusCode: 204,
    headers: {
      "cache-control": "no-store",
      ...(extra.headers || {})
    },
    body: ""
  };
}

function parseBody(event) {
  if (!event || !event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return JSON.parse(raw || "{}");
  } catch (_error) {
    return {};
  }
}

module.exports = { json, noContent, parseBody };
