import { requestJson } from "./api.js";

const body = document.body;
const nameEl = document.getElementById("cvName");
const roleEl = document.getElementById("cvRole");
const summaryEl = document.getElementById("cvSummary");
const metaEl = document.getElementById("cvMeta");
const renderEl = document.getElementById("cvRender");
const themeLabel = document.getElementById("themeLabel");
const pdfLink = document.getElementById("pdfLink");
const blockTemplate = document.getElementById("blockTemplate");

const themeMap = {
  executive: "theme-executive",
  neon_grid: "theme-neon_grid",
  atelier: "theme-atelier"
};

let currentCv = null;
let themes = [];

function toText(block) {
  const c = block.content || {};
  if (typeof c.text === "string") return c.text;
  return JSON.stringify(c, null, 2);
}

function renderBlocks(cv) {
  renderEl.innerHTML = "";

  const base = blockTemplate.content.firstElementChild.cloneNode(true);
  base.querySelector(".block-title").textContent = "Profil structuré";
  const lines = [];
  if (cv.skills && cv.skills.length) lines.push(`Compétences: ${cv.skills.join(", ")}`);
  if (cv.tools && cv.tools.length) lines.push(`Outils: ${cv.tools.join(", ")}`);
  if (cv.diplomas && cv.diplomas.length) lines.push(`Diplômes: ${cv.diplomas.join(" | ")}`);
  if (cv.certifications && cv.certifications.length) lines.push(`Certifications: ${cv.certifications.join(" | ")}`);
  if (cv.languages && cv.languages.length) lines.push(`Langues: ${cv.languages.join(", ")}`);
  if (cv.links && cv.links.length) {
    lines.push(`Liens: ${cv.links.map((x) => `${x.label}: ${x.url}`).join(" | ")}`);
  }
  base.querySelector(".block-content").textContent = lines.join("\n");
  renderEl.appendChild(base);

  (cv.blocks || [])
    .filter((b) => b.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((block) => {
      const node = blockTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector(".block-title").textContent = block.title || block.type;
      node.querySelector(".block-content").textContent = toText(block);
      renderEl.appendChild(node);
    });
}

function applyTheme(themeId) {
  body.classList.remove("theme-executive", "theme-neon_grid", "theme-atelier");
  body.classList.add(themeMap[themeId] || "theme-executive");
  const found = themes.find((t) => t.id === themeId);
  themeLabel.textContent = found ? `${found.name} - ${found.description}` : themeId;
}

function hydrateCv(cv) {
  currentCv = cv;
  nameEl.textContent = cv.fullName || cv.title;
  roleEl.textContent = cv.role || "";
  summaryEl.textContent = cv.summary || "";
  metaEl.textContent = `Statut: ${cv.status} | Theme: ${cv.theme}`;
  renderBlocks(cv);
  applyTheme(cv.theme);
  pdfLink.href = `/.netlify/functions/cv-pdf?id=${encodeURIComponent(cv.id)}`;
}

async function loadDefaultCv() {
  try {
    const payload = await requestJson("/.netlify/functions/public-default-cv");
    themes = payload.themes || [];
    hydrateCv(payload.data);
  } catch (error) {
    nameEl.textContent = "Aucun CV publié";
    roleEl.textContent = "";
    summaryEl.textContent = error.message;
    metaEl.textContent = "Publiez un CV depuis l'admin pour l'afficher ici.";
  }
}

function bindThemeButtons() {
  document.querySelectorAll(".swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!currentCv) return;
      applyTheme(btn.dataset.theme);
    });
  });
}

bindThemeButtons();
loadDefaultCv();
