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

function createInfoRow(label, value) {
  if (!value) return null;
  const row = document.createElement("p");
  row.className = "info-row";
  row.innerHTML = `<strong>${label}:</strong> ${value}`;
  return row;
}

function createList(title, items = []) {
  const safe = (items || []).filter(Boolean);
  if (!safe.length) return null;
  const wrap = document.createElement("section");
  wrap.className = "profile-group";
  const heading = document.createElement("h4");
  heading.textContent = title;
  const ul = document.createElement("ul");
  ul.className = "bullet-list";
  safe.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
  wrap.append(heading, ul);
  return wrap;
}

function renderStructuredProfile(container, cv) {
  const content = container.querySelector(".block-content");
  content.innerHTML = "";

  const groups = [
    createList("Compétences", cv.skills),
    createList("Outils", cv.tools),
    createList("Diplômes", cv.diplomas),
    createList("Certifications", cv.certifications),
    createList("Langues", cv.languages)
  ].filter(Boolean);

  groups.forEach((group) => content.appendChild(group));

  if (cv.links && cv.links.length) {
    const linkWrap = document.createElement("section");
    linkWrap.className = "profile-group";
    const heading = document.createElement("h4");
    heading.textContent = "Liens utiles";
    const ul = document.createElement("ul");
    ul.className = "bullet-list";

    cv.links.forEach((entry) => {
      if (!entry || !entry.url) return;
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = entry.url;
      a.target = "_blank";
      a.rel = "noreferrer noopener";
      a.textContent = entry.label || entry.url;
      li.appendChild(a);
      ul.appendChild(li);
    });

    linkWrap.append(heading, ul);
    content.appendChild(linkWrap);
  }
}

function renderBlockContent(container, block) {
  const content = container.querySelector(".block-content");
  const c = block.content || {};
  content.innerHTML = "";

  if (block.type === "summary") {
    content.textContent = c.text || "";
    return;
  }

  if (block.type === "experience_short" || block.type === "experience_detailed") {
    const role = createInfoRow("Poste", c.role);
    const company = createInfoRow("Entreprise", c.company);
    const period = createInfoRow("Période", c.period);
    const detail = createInfoRow(block.type === "experience_short" ? "Impact" : "Détails", c.impact || c.details);
    [role, company, period, detail].filter(Boolean).forEach((x) => content.appendChild(x));
    return;
  }

  if (block.type === "diploma") {
    [
      createInfoRow("Diplôme", c.degree),
      createInfoRow("Établissement", c.school),
      createInfoRow("Année", c.year)
    ]
      .filter(Boolean)
      .forEach((x) => content.appendChild(x));
    return;
  }

  if (block.type === "certification") {
    [
      createInfoRow("Certification", c.name),
      createInfoRow("Organisme", c.org),
      createInfoRow("Année", c.year)
    ]
      .filter(Boolean)
      .forEach((x) => content.appendChild(x));
    return;
  }

  if (block.type === "tools" || block.type === "skills") {
    const list = createList("", Array.isArray(c.items) ? c.items : []);
    if (list) {
      content.appendChild(list.querySelector(".bullet-list"));
    } else {
      content.textContent = c.text || "";
    }
    return;
  }

  if (typeof c.text === "string" && c.text.trim()) {
    content.textContent = c.text;
    return;
  }

  content.textContent = JSON.stringify(c, null, 2);
}

function renderBlocks(cv) {
  renderEl.innerHTML = "";

  const base = blockTemplate.content.firstElementChild.cloneNode(true);
  base.querySelector(".block-title").textContent = "Profil structuré";
  renderStructuredProfile(base, cv);
  renderEl.appendChild(base);

  (cv.blocks || [])
    .filter((b) => b.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((block) => {
      const node = blockTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector(".block-title").textContent = block.title || block.type;
      renderBlockContent(node, block);
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
