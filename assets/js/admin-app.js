import { requestJson, requestPdf, downloadBlob } from "./api.js";

const authPanel = document.getElementById("authPanel");
const adminApp = document.getElementById("adminApp");
const authStatus = document.getElementById("authStatus");
const loginForm = document.getElementById("loginForm");

const cvListEl = document.getElementById("cvList");
const createCvBtn = document.getElementById("createCvBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emptyEditor = document.getElementById("emptyEditor");
const editorWrap = document.getElementById("editorWrap");

const cvTitleEl = document.getElementById("cvTitle");
const cvFullNameEl = document.getElementById("cvFullName");
const cvRoleEl = document.getElementById("cvRole");
const cvThemeEl = document.getElementById("cvTheme");
const cvSummaryEl = document.getElementById("cvSummary");
const cvSkillsEl = document.getElementById("cvSkills");
const cvToolsEl = document.getElementById("cvTools");
const cvDiplomasEl = document.getElementById("cvDiplomas");
const cvCertificationsEl = document.getElementById("cvCertifications");
const cvLanguagesEl = document.getElementById("cvLanguages");
const cvLinksEl = document.getElementById("cvLinks");

const saveCvBtn = document.getElementById("saveCvBtn");
const publishCvBtn = document.getElementById("publishCvBtn");
const defaultCvBtn = document.getElementById("defaultCvBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const deleteCvBtn = document.getElementById("deleteCvBtn");

const paletteButtons = document.getElementById("paletteButtons");
const blockListEl = document.getElementById("blockList");
const previewCard = document.getElementById("previewCard");
const editorStatus = document.getElementById("editorStatus");

const cvCardTemplate = document.getElementById("cvCardTemplate");
const blockItemTemplate = document.getElementById("blockItemTemplate");

const state = {
  cvs: [],
  themes: [],
  blockTypes: [],
  selectedId: null,
  dragId: null
};

const blockTitles = {
  summary: "Résumé / description",
  experience_short: "Expérience résumée",
  experience_detailed: "Expérience détaillée",
  diploma: "Diplôme",
  certification: "Certification",
  tools: "Outils",
  skills: "Compétences"
};

function setThemeClass(theme) {
  document.body.classList.remove("theme-executive", "theme-neon_grid", "theme-atelier");
  document.body.classList.add(`theme-${theme}`);
}

function selectedCv() {
  return state.cvs.find((cv) => cv.id === state.selectedId) || null;
}

function toPreviewText(block) {
  const c = block.content || {};
  if (typeof c.text === "string") return c.text;
  return JSON.stringify(c, null, 2);
}

function blockTemplateByType(type) {
  if (type === "summary") return { text: "" };
  if (type === "experience_short") return { role: "", company: "", period: "", impact: "" };
  if (type === "experience_detailed") return { role: "", company: "", period: "", details: "" };
  if (type === "diploma") return { degree: "", school: "", year: "" };
  if (type === "certification") return { name: "", org: "", year: "" };
  if (type === "tools" || type === "skills") return { items: [] };
  return { text: "" };
}

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
  if (title) {
    const heading = document.createElement("h4");
    heading.textContent = title;
    wrap.appendChild(heading);
  }
  const ul = document.createElement("ul");
  ul.className = "bullet-list";
  safe.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
  wrap.appendChild(ul);
  return wrap;
}

function renderStructuredPreview(content, cv) {
  content.innerHTML = "";
  [
    createList("Compétences", cv.skills),
    createList("Outils", cv.tools),
    createList("Diplômes", cv.diplomas),
    createList("Certifications", cv.certifications),
    createList("Langues", cv.languages)
  ]
    .filter(Boolean)
    .forEach((group) => content.appendChild(group));

  if (cv.links && cv.links.length) {
    const list = createList(
      "Liens utiles",
      cv.links.map((x) => `${x.label || "Lien"}: ${x.url || ""}`)
    );
    if (list) content.appendChild(list);
  }
}

function renderBlockPreview(content, block) {
  const c = block.content || {};
  content.innerHTML = "";

  if (block.type === "summary") {
    content.textContent = c.text || "";
    return;
  }

  if (block.type === "experience_short" || block.type === "experience_detailed") {
    [
      createInfoRow("Poste", c.role),
      createInfoRow("Entreprise", c.company),
      createInfoRow("Période", c.period),
      createInfoRow(block.type === "experience_short" ? "Impact" : "Détails", c.impact || c.details)
    ]
      .filter(Boolean)
      .forEach((row) => content.appendChild(row));
    return;
  }

  if (block.type === "diploma") {
    [createInfoRow("Diplôme", c.degree), createInfoRow("Établissement", c.school), createInfoRow("Année", c.year)]
      .filter(Boolean)
      .forEach((row) => content.appendChild(row));
    return;
  }

  if (block.type === "certification") {
    [createInfoRow("Certification", c.name), createInfoRow("Organisme", c.org), createInfoRow("Année", c.year)]
      .filter(Boolean)
      .forEach((row) => content.appendChild(row));
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

  content.textContent = toPreviewText(block);
}

function showEditor(cv) {
  emptyEditor.classList.add("hidden");
  editorWrap.classList.remove("hidden");
  cvTitleEl.value = cv.title || "";
  cvFullNameEl.value = cv.fullName || "";
  cvRoleEl.value = cv.role || "";
  cvThemeEl.value = cv.theme || "executive";
  cvSummaryEl.value = cv.summary || "";
  cvSkillsEl.value = (cv.skills || []).join("\n");
  cvToolsEl.value = (cv.tools || []).join("\n");
  cvDiplomasEl.value = (cv.diplomas || []).join("\n");
  cvCertificationsEl.value = (cv.certifications || []).join("\n");
  cvLanguagesEl.value = (cv.languages || []).join("\n");
  cvLinksEl.value = (cv.links || []).map((x) => `${x.label || ""}|${x.url || ""}`).join("\n");
  setThemeClass(cv.theme || "executive");
  renderBlocks(cv);
  renderPreview(cv);
}

function hideEditor() {
  emptyEditor.classList.remove("hidden");
  editorWrap.classList.add("hidden");
}

function renderCvList() {
  cvListEl.innerHTML = "";
  state.cvs.forEach((cv) => {
    const node = cvCardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".cv-item-title").textContent = cv.title;
    node.querySelector(".cv-item-meta").textContent = `${cv.status} | ${cv.theme}${cv.isDefault ? " | défaut" : ""}`;
    const actions = node.querySelector(".cv-item-actions");

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.textContent = "Éditer";
    editBtn.addEventListener("click", () => {
      state.selectedId = cv.id;
      showEditor(cv);
    });

    const previewBtn = document.createElement("button");
    previewBtn.className = "icon-btn";
    previewBtn.textContent = "Preview";
    previewBtn.addEventListener("click", () => {
      state.selectedId = cv.id;
      showEditor(cv);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    actions.append(editBtn, previewBtn);
    cvListEl.appendChild(node);
  });
}

function renderPreview(cv) {
  previewCard.innerHTML = "";
  const heading = document.createElement("section");
  heading.className = "public-block";
  heading.innerHTML = `<h3 class=\"block-title\">${cv.fullName || cv.title}</h3><div class=\"block-content\">${cv.role || ""}\n\n${cv.summary || ""}</div>`;
  previewCard.appendChild(heading);

  const structured = document.createElement("section");
  structured.className = "public-block";
  structured.innerHTML = "<h3 class=\"block-title\">Profil structuré</h3><div class=\"block-content\"></div>";
  renderStructuredPreview(structured.querySelector(".block-content"), cv);
  previewCard.appendChild(structured);

  (cv.blocks || [])
    .filter((b) => b.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((block) => {
      const section = document.createElement("section");
      section.className = "public-block";
      section.innerHTML = `<h3 class=\"block-title\">${block.title || blockTitles[block.type] || block.type}</h3><div class=\"block-content\"></div>`;
      renderBlockPreview(section.querySelector(".block-content"), block);
      previewCard.appendChild(section);
    });
}

function renderBlocks(cv) {
  blockListEl.innerHTML = "";
  (cv.blocks || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((block) => {
      const node = blockItemTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.id = block.id;
      node.querySelector(".block-name").textContent = blockTitles[block.type] || block.type;
      node.querySelector(".block-title").value = block.title || "";
      node.querySelector(".block-content").value = JSON.stringify(block.content || {}, null, 2);

      const controls = node.querySelector(".block-controls");
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "icon-btn";
      toggleBtn.textContent = block.enabled === false ? "Activer" : "Désactiver";
      toggleBtn.addEventListener("click", () => {
        block.enabled = !block.enabled;
        renderBlocks(cv);
        renderPreview(cv);
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "icon-btn";
      removeBtn.textContent = "Supprimer";
      removeBtn.addEventListener("click", () => {
        cv.blocks = cv.blocks.filter((b) => b.id !== block.id).map((b, index) => ({ ...b, order: index }));
        renderBlocks(cv);
        renderPreview(cv);
      });
      controls.append(toggleBtn, removeBtn);

      node.querySelector(".block-title").addEventListener("input", (e) => {
        block.title = e.target.value;
        renderPreview(cv);
      });

      node.querySelector(".block-content").addEventListener("input", (e) => {
        try {
          block.content = JSON.parse(e.target.value || "{}");
          node.querySelector(".block-content").style.borderColor = "var(--line)";
          renderPreview(cv);
        } catch (_error) {
          node.querySelector(".block-content").style.borderColor = "var(--danger)";
        }
      });

      node.addEventListener("dragstart", () => {
        state.dragId = block.id;
        node.classList.add("dragging");
      });

      node.addEventListener("dragend", () => {
        state.dragId = null;
        node.classList.remove("dragging");
      });

      node.addEventListener("dragover", (e) => e.preventDefault());
      node.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!state.dragId || state.dragId === block.id) return;
        const draggedIndex = cv.blocks.findIndex((b) => b.id === state.dragId);
        const targetIndex = cv.blocks.findIndex((b) => b.id === block.id);
        const [dragged] = cv.blocks.splice(draggedIndex, 1);
        cv.blocks.splice(targetIndex, 0, dragged);
        cv.blocks = cv.blocks.map((b, index) => ({ ...b, order: index }));
        renderBlocks(cv);
        renderPreview(cv);
      });

      blockListEl.appendChild(node);
    });
}

function bindPalette() {
  paletteButtons.innerHTML = "";
  state.blockTypes.forEach((type) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary";
    btn.textContent = blockTitles[type] || type;
    btn.addEventListener("click", () => {
      const cv = selectedCv();
      if (!cv) return;
      cv.blocks.push({
        id: `blk_${crypto.randomUUID()}`,
        type,
        title: blockTitles[type] || type,
        enabled: true,
        order: cv.blocks.length,
        content: blockTemplateByType(type)
      });
      renderBlocks(cv);
      renderPreview(cv);
    });
    paletteButtons.appendChild(btn);
  });
}

function readEditor(cv) {
  const lines = (raw) =>
    String(raw || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

  const links = lines(cvLinksEl.value).map((entry) => {
    const [label, url] = entry.split("|");
    return {
      label: (label || "Lien").trim(),
      url: (url || label || "").trim()
    };
  });

  return {
    ...cv,
    title: cvTitleEl.value.trim(),
    fullName: cvFullNameEl.value.trim(),
    role: cvRoleEl.value.trim(),
    theme: cvThemeEl.value,
    summary: cvSummaryEl.value.trim(),
    skills: lines(cvSkillsEl.value),
    tools: lines(cvToolsEl.value),
    diplomas: lines(cvDiplomasEl.value),
    certifications: lines(cvCertificationsEl.value),
    languages: lines(cvLanguagesEl.value),
    links,
    blocks: (cv.blocks || []).map((b, index) => ({ ...b, order: index }))
  };
}

async function loadCvs() {
  const payload = await requestJson("/.netlify/functions/admin-cvs");
  state.cvs = payload.data || [];
  state.themes = payload.themes || [];
  state.blockTypes = payload.blockTypes || [];
  renderCvList();
  bindPalette();
  if (state.selectedId) {
    const cv = selectedCv();
    if (cv) showEditor(cv);
  }
}

async function saveCurrent() {
  const cv = selectedCv();
  if (!cv) return;
  const payload = readEditor(cv);
  const res = await requestJson(`/.netlify/functions/admin-cv?id=${encodeURIComponent(cv.id)}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  editorStatus.textContent = "Enregistré.";
  const index = state.cvs.findIndex((x) => x.id === cv.id);
  if (index >= 0) state.cvs[index] = res.data;
  showEditor(res.data);
  renderCvList();
}

async function ensureSession() {
  try {
    await requestJson("/.netlify/functions/auth-me", { method: "GET" });
    authPanel.classList.add("hidden");
    adminApp.classList.remove("hidden");
    await loadCvs();
  } catch (_error) {
    authPanel.classList.remove("hidden");
    adminApp.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  authStatus.textContent = "Connexion en cours...";
  try {
    await requestJson("/.netlify/functions/auth-login", {
      method: "POST",
      body: JSON.stringify({
        username: String(formData.get("username") || ""),
        password: String(formData.get("password") || "")
      })
    });
    authStatus.textContent = "Connexion réussie.";
    await ensureSession();
  } catch (error) {
    authStatus.textContent = error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  await requestJson("/.netlify/functions/auth-logout", { method: "POST", body: "{}" });
  state.selectedId = null;
  hideEditor();
  ensureSession();
});

createCvBtn.addEventListener("click", async () => {
  const res = await requestJson("/.netlify/functions/admin-cvs", {
    method: "POST",
    body: JSON.stringify({
      title: "Nouveau CV",
      fullName: "Nom Prénom",
      role: "Poste recherché",
      summary: "Résumé professionnel",
      theme: "executive",
      blocks: []
    })
  });
  state.selectedId = res.data.id;
  await loadCvs();
  showEditor(selectedCv());
});

saveCvBtn.addEventListener("click", async () => {
  try {
    await saveCurrent();
  } catch (error) {
    editorStatus.textContent = error.message;
  }
});

publishCvBtn.addEventListener("click", async () => {
  const cv = selectedCv();
  if (!cv) return;
  const next = cv.status !== "published";
  const res = await requestJson("/.netlify/functions/admin-cv-publish", {
    method: "POST",
    body: JSON.stringify({ id: cv.id, published: next })
  });
  const idx = state.cvs.findIndex((x) => x.id === cv.id);
  if (idx >= 0) state.cvs[idx] = res.data;
  editorStatus.textContent = next ? "CV publié." : "CV repassé en brouillon.";
  showEditor(res.data);
  renderCvList();
});

defaultCvBtn.addEventListener("click", async () => {
  const cv = selectedCv();
  if (!cv) return;
  await requestJson("/.netlify/functions/admin-cv-default", {
    method: "POST",
    body: JSON.stringify({ id: cv.id })
  });
  editorStatus.textContent = "CV défini comme défaut.";
  await loadCvs();
});

deleteCvBtn.addEventListener("click", async () => {
  const cv = selectedCv();
  if (!cv) return;
  if (!window.confirm("Supprimer ce CV ?")) return;
  await requestJson(`/.netlify/functions/admin-cv?id=${encodeURIComponent(cv.id)}`, {
    method: "DELETE"
  });
  state.selectedId = null;
  editorStatus.textContent = "CV supprimé.";
  hideEditor();
  await loadCvs();
});

cvThemeEl.addEventListener("change", () => {
  const cv = selectedCv();
  if (!cv) return;
  cv.theme = cvThemeEl.value;
  setThemeClass(cv.theme);
  renderPreview(cv);
});

downloadPdfBtn.addEventListener("click", async () => {
  const cv = selectedCv();
  if (!cv) return;
  const blob = await requestPdf(`/.netlify/functions/cv-pdf?id=${encodeURIComponent(cv.id)}`);
  downloadBlob(blob, `CV_${(cv.fullName || cv.title || "profil").replace(/\s+/g, "_")}.pdf`);
});

ensureSession();
