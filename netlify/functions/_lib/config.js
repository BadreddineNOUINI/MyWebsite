const SESSION_COOKIE = "cv_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const STORE_NAME = "cv_manager_store";
const DATA_KEY = "app_data_v1";

const BLOCK_TYPES = [
  "summary",
  "experience_short",
  "experience_detailed",
  "diploma",
  "certification",
  "tools",
  "skills"
];

const THEMES = [
  {
    id: "executive",
    name: "Executive Slate",
    description: "Professionnel, sobre et recruteur-friendly"
  },
  {
    id: "neon_grid",
    name: "Neon Grid",
    description: "Futuriste premium inspire SaaS"
  },
  {
    id: "atelier",
    name: "Atelier Editorial",
    description: "Creatif visuel, design editorial moderne"
  }
];

module.exports = {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  STORE_NAME,
  DATA_KEY,
  BLOCK_TYPES,
  THEMES
};
