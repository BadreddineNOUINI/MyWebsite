const { getStore } = require("@netlify/blobs");

exports.handler = async function handler() {
  try {
    const store = getStore("ping_data");
    const rawCounter = await store.get("counter");
    const previous = Number.parseInt(rawCounter ?? "0", 10);
    const safePrevious = Number.isFinite(previous) ? previous : 0;
    const counter = safePrevious + 1;

    await store.set("counter", String(counter));

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        ok: true,
        service: "netlify-function",
        db: "netlify-blobs",
        previous: safePrevious,
        counter,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        ok: false,
        service: "netlify-function",
        db: "netlify-blobs",
        error: "Storage error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      })
    };
  }
};
