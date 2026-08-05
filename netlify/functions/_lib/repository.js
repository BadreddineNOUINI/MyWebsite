const crypto = require("crypto");
const { connectLambda, getStore } = require("@netlify/blobs");
const { Pool } = require("pg");
const { STORE_NAME, DATA_KEY, THEMES, BLOCK_TYPES } = require("./config");

let pool;
let schemaReady = false;

function uid(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeStatus(status) {
  return status === "published" ? "published" : "draft";
}

function normalizeTheme(theme) {
  const allowed = new Set(THEMES.map((t) => t.id));
  return allowed.has(theme) ? theme : THEMES[0].id;
}

function ensureBlocks(blocks) {
  const safe = Array.isArray(blocks) ? blocks : [];
  return safe
    .filter((b) => b && BLOCK_TYPES.includes(b.type))
    .map((b, index) => ({
      id: typeof b.id === "string" ? b.id : uid("blk"),
      type: b.type,
      enabled: b.enabled !== false,
      title: String(b.title || ""),
      content: typeof b.content === "object" && b.content ? b.content : {},
      order: Number.isFinite(Number(b.order)) ? Number(b.order) : index
    }))
    .sort((a, b) => a.order - b.order)
    .map((b, index) => ({ ...b, order: index }));
}

function sanitizeCvPayload(payload = {}) {
  const links = Array.isArray(payload.links) ? payload.links : [];
  const languages = Array.isArray(payload.languages) ? payload.languages : [];

  return {
    title: String(payload.title || "Nouveau CV").slice(0, 160),
    fullName: String(payload.fullName || "").slice(0, 160),
    role: String(payload.role || "").slice(0, 200),
    summary: String(payload.summary || "").slice(0, 5000),
    theme: normalizeTheme(payload.theme),
    links: links.map((l) => ({ label: String(l.label || ""), url: String(l.url || "") })).slice(0, 20),
    languages: languages.map((l) => String(l || "")).slice(0, 20),
    skills: Array.isArray(payload.skills) ? payload.skills.map((s) => String(s || "")).slice(0, 60) : [],
    tools: Array.isArray(payload.tools) ? payload.tools.map((s) => String(s || "")).slice(0, 60) : [],
    certifications: Array.isArray(payload.certifications)
      ? payload.certifications.map((s) => String(s || "")).slice(0, 60)
      : [],
    diplomas: Array.isArray(payload.diplomas) ? payload.diplomas.map((s) => String(s || "")).slice(0, 60) : [],
    blocks: ensureBlocks(payload.blocks),
    status: normalizeStatus(payload.status)
  };
}

function getPostgresPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
}

async function ensurePostgresSchema(client) {
  if (schemaReady) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS cvs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      summary TEXT NOT NULL,
      theme TEXT NOT NULL,
      links_json TEXT NOT NULL,
      languages_json TEXT NOT NULL,
      skills_json TEXT NOT NULL,
      tools_json TEXT NOT NULL,
      certifications_json TEXT NOT NULL,
      diplomas_json TEXT NOT NULL,
      blocks_json TEXT NOT NULL,
      status TEXT NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  schemaReady = true;
}

function rowToCv(row) {
  return {
    id: row.id,
    title: row.title,
    fullName: row.full_name,
    role: row.role,
    summary: row.summary,
    theme: row.theme,
    links: JSON.parse(row.links_json || "[]"),
    languages: JSON.parse(row.languages_json || "[]"),
    skills: JSON.parse(row.skills_json || "[]"),
    tools: JSON.parse(row.tools_json || "[]"),
    certifications: JSON.parse(row.certifications_json || "[]"),
    diplomas: JSON.parse(row.diplomas_json || "[]"),
    blocks: JSON.parse(row.blocks_json || "[]"),
    status: row.status,
    isDefault: row.is_default === true,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

async function getBlobStore(event) {
  if (event) connectLambda(event);
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token });
  }
  return getStore(STORE_NAME);
}

async function readBlobData(event) {
  const store = await getBlobStore(event);
  const data = await store.get(DATA_KEY, { type: "json" });
  if (data && Array.isArray(data.cvs)) return { store, data };
  return { store, data: { cvs: [] } };
}

async function writeBlobData(store, data) {
  await store.setJSON(DATA_KEY, data);
}

async function listCVs(event) {
  const pgPool = getPostgresPool();
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await ensurePostgresSchema(client);
      const result = await client.query("SELECT * FROM cvs ORDER BY updated_at DESC");
      return result.rows.map(rowToCv);
    } finally {
      client.release();
    }
  }

  const { data } = await readBlobData(event);
  return data.cvs.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

async function getCV(event, id) {
  const all = await listCVs(event);
  return all.find((cv) => cv.id === id) || null;
}

async function createCV(event, payload) {
  const safe = sanitizeCvPayload(payload);
  const id = uid("cv");
  const timestamp = nowIso();
  const next = {
    id,
    ...safe,
    isDefault: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const pgPool = getPostgresPool();
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await ensurePostgresSchema(client);
      await client.query(
        `INSERT INTO cvs (id, title, full_name, role, summary, theme, links_json, languages_json, skills_json, tools_json, certifications_json, diplomas_json, blocks_json, status, is_default, updated_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          next.id,
          next.title,
          next.fullName,
          next.role,
          next.summary,
          next.theme,
          JSON.stringify(next.links),
          JSON.stringify(next.languages),
          JSON.stringify(next.skills),
          JSON.stringify(next.tools),
          JSON.stringify(next.certifications),
          JSON.stringify(next.diplomas),
          JSON.stringify(next.blocks),
          next.status,
          next.isDefault,
          next.updatedAt,
          next.createdAt
        ]
      );
      return next;
    } finally {
      client.release();
    }
  }

  const { store, data } = await readBlobData(event);
  data.cvs.unshift(next);
  await writeBlobData(store, data);
  return next;
}

async function updateCV(event, id, payload) {
  const safe = sanitizeCvPayload(payload);
  const pgPool = getPostgresPool();

  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await ensurePostgresSchema(client);
      const current = await client.query("SELECT * FROM cvs WHERE id = $1", [id]);
      if (!current.rows[0]) return null;
      const existing = rowToCv(current.rows[0]);
      const next = {
        ...existing,
        ...safe,
        id,
        isDefault: existing.isDefault,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await client.query(
        `UPDATE cvs SET title=$2, full_name=$3, role=$4, summary=$5, theme=$6, links_json=$7, languages_json=$8, skills_json=$9, tools_json=$10, certifications_json=$11, diplomas_json=$12, blocks_json=$13, status=$14, updated_at=$15 WHERE id=$1`,
        [
          id,
          next.title,
          next.fullName,
          next.role,
          next.summary,
          next.theme,
          JSON.stringify(next.links),
          JSON.stringify(next.languages),
          JSON.stringify(next.skills),
          JSON.stringify(next.tools),
          JSON.stringify(next.certifications),
          JSON.stringify(next.diplomas),
          JSON.stringify(next.blocks),
          next.status,
          next.updatedAt
        ]
      );
      return next;
    } finally {
      client.release();
    }
  }

  const { store, data } = await readBlobData(event);
  const index = data.cvs.findIndex((cv) => cv.id === id);
  if (index < 0) return null;
  const existing = data.cvs[index];
  const next = {
    ...existing,
    ...safe,
    id,
    isDefault: existing.isDefault,
    createdAt: existing.createdAt,
    updatedAt: nowIso()
  };
  data.cvs[index] = next;
  await writeBlobData(store, data);
  return next;
}

async function deleteCV(event, id) {
  const pgPool = getPostgresPool();
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await ensurePostgresSchema(client);
      const result = await client.query("DELETE FROM cvs WHERE id = $1", [id]);
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  const { store, data } = await readBlobData(event);
  const before = data.cvs.length;
  data.cvs = data.cvs.filter((cv) => cv.id !== id);
  await writeBlobData(store, data);
  return data.cvs.length !== before;
}

async function setDefaultCV(event, id) {
  const all = await listCVs(event);
  const target = all.find((cv) => cv.id === id);
  if (!target) return null;

  const pgPool = getPostgresPool();
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await ensurePostgresSchema(client);
      await client.query("UPDATE cvs SET is_default = FALSE");
      await client.query("UPDATE cvs SET is_default = TRUE, updated_at = $2 WHERE id = $1", [id, nowIso()]);
      return true;
    } finally {
      client.release();
    }
  }

  const { store, data } = await readBlobData(event);
  data.cvs = data.cvs.map((cv) => ({
    ...cv,
    isDefault: cv.id === id,
    updatedAt: cv.id === id ? nowIso() : cv.updatedAt
  }));
  await writeBlobData(store, data);
  return true;
}

async function setPublished(event, id, published) {
  const cv = await getCV(event, id);
  if (!cv) return null;
  return updateCV(event, id, { ...cv, status: published ? "published" : "draft" });
}

async function reorderBlocks(event, id, orderedBlockIds = []) {
  const cv = await getCV(event, id);
  if (!cv) return null;
  const map = new Map((cv.blocks || []).map((block) => [block.id, block]));
  const next = [];

  orderedBlockIds.forEach((blockId) => {
    const block = map.get(blockId);
    if (block) {
      next.push(block);
      map.delete(blockId);
    }
  });

  map.forEach((block) => next.push(block));
  const normalized = next.map((block, index) => ({ ...block, order: index }));
  return updateCV(event, id, { ...cv, blocks: normalized });
}

async function getDefaultPublishedCV(event) {
  const all = await listCVs(event);
  const published = all.filter((cv) => cv.status === "published");
  if (!published.length) return null;
  const preferred = published.find((cv) => cv.isDefault);
  return preferred || published[0];
}

module.exports = {
  THEMES,
  BLOCK_TYPES,
  listCVs,
  getCV,
  createCV,
  updateCV,
  deleteCV,
  setDefaultCV,
  setPublished,
  reorderBlocks,
  getDefaultPublishedCV,
  sanitizeCvPayload
};
