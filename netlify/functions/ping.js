const { connectLambda, getStore } = require("@netlify/blobs");

function buildStore(event) {
  // In Netlify Lambda compatibility mode, Blobs context must be connected manually.
  if (event) {
    connectLambda(event);
  }

  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;

  if (siteID && token) {
    return getStore({
      name: "ping_data",
      siteID,
      token
    });
  }

  return getStore("ping_data");
}

exports.handler = async function handler(event) {
  try {
    const store = buildStore(event);
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
        hint: "Set NETLIFY_BLOBS_SITE_ID and NETLIFY_BLOBS_TOKEN in Netlify UI if auto context is unavailable.",
        envConfigured: Boolean(process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID) && Boolean(process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN),
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      })
    };
  }
};
