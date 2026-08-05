exports.handler = async function handler() {
  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      ok: true,
      service: "netlify-function",
      timestamp: new Date().toISOString()
    })
  };
};
