const { json } = require("./response");

function methodNotAllowed() {
  return json(405, { ok: false, error: "Method not allowed" });
}

module.exports = { methodNotAllowed };
