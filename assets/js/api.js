async function requestJson(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    },
    credentials: "same-origin",
    ...options
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.ok === false) {
    const message = payload.error || `Erreur HTTP ${res.status}`;
    throw new Error(message);
  }
  return payload;
}

async function requestPdf(path) {
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
  return res.blob();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { requestJson, requestPdf, downloadBlob };
