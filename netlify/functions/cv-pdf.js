const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const { json } = require("./_lib/response");
const { getCV, getDefaultPublishedCV } = require("./_lib/repository");
const { requireAdmin } = require("./_lib/auth");

function themeColors(theme) {
  if (theme === "neon_grid") return { primary: "#0fd3ff", text: "#08101a", muted: "#3f4d63", bg: "#f4fbff" };
  if (theme === "atelier") return { primary: "#e25d3e", text: "#1e1b18", muted: "#6a625a", bg: "#fff9f4" };
  return { primary: "#1d3557", text: "#17202c", muted: "#4a5666", bg: "#f8fafc" };
}

function addHeading(doc, text, colors) {
  return { text: text.toUpperCase(), color: colors.primary, size: 14, bold: true, spacingAfter: 8 };
}

function blockText(block) {
  const content = block.content || {};
  switch (block.type) {
    case "summary":
      return String(content.text || "");
    case "experience_short":
      return `${content.role || ""} - ${content.company || ""} (${content.period || ""})\n${content.impact || ""}`;
    case "experience_detailed":
      return `${content.role || ""} - ${content.company || ""} (${content.period || ""})\n${content.details || ""}`;
    case "diploma":
      return `${content.degree || ""} - ${content.school || ""} (${content.year || ""})`;
    case "certification":
      return `${content.name || ""} - ${content.org || ""} (${content.year || ""})`;
    case "skills":
      return Array.isArray(content.items) ? content.items.join(", ") : String(content.text || "");
    case "tools":
      return Array.isArray(content.items) ? content.items.join(", ") : String(content.text || "");
    default:
      return JSON.stringify(content);
  }
}

function safeFilename(name) {
  return String(name || "CV").replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 80);
}

function toRgb(hex) {
  const value = String(hex || "#000000").replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16) / 255;
  const g = Number.parseInt(value.slice(2, 4), 16) / 255;
  const b = Number.parseInt(value.slice(4, 6), 16) / 255;
  return rgb(r || 0, g || 0, b || 0);
}

function wrapText(text, maxChars) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  return lines;
}

async function readCv(event) {
  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (id) {
    const cv = await getCV(event, id);
    if (!cv) return { error: json(404, { ok: false, error: "CV introuvable" }) };
    const auth = requireAdmin(event);
    if (!auth.ok && cv.status !== "published") {
      return { error: auth.response };
    }
    return { cv };
  }

  const cv = await getDefaultPublishedCV(event);
  if (!cv) return { error: json(404, { ok: false, error: "Aucun CV publie" }) };
  return { cv };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "GET") return json(405, { ok: false, error: "Method not allowed" });

  const result = await readCv(event);
  if (result.error) return result.error;
  const cv = result.cv;
  const colors = themeColors(cv.theme);
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page = pdf.addPage([595.28, 841.89]);
  let y = 792;
  const left = 48;
  const right = 548;

  function ensureSpace(lines = 1, lineHeight = 15) {
    const needed = lines * lineHeight;
    if (y - needed < 52) {
      page = pdf.addPage([595.28, 841.89]);
      y = 792;
    }
  }

  page.drawRectangle({ x: 0, y: 0, width: page.getWidth(), height: page.getHeight(), color: toRgb(colors.bg) });

  page.drawText(cv.fullName || cv.title || "CV", {
    x: left,
    y,
    size: 27,
    font: fontBold,
    color: toRgb(colors.text)
  });
  y -= 32;

  page.drawText(cv.role || "", {
    x: left,
    y,
    size: 12,
    font: fontRegular,
    color: toRgb(colors.muted)
  });
  y -= 28;

  if (cv.summary) {
    ensureSpace(6);
    const heading = addHeading(null, "Resume professionnel", colors);
    page.drawText(heading.text, {
      x: left,
      y,
      size: heading.size,
      font: fontBold,
      color: toRgb(heading.color)
    });
    y -= heading.spacingAfter;

    const summaryLines = wrapText(cv.summary, 92);
    ensureSpace(summaryLines.length + 1, 14);
    summaryLines.forEach((line) => {
      page.drawText(line, { x: left, y, size: 11, font: fontRegular, color: toRgb(colors.text) });
      y -= 14;
    });
    y -= 8;
  }

  if (cv.blocks && cv.blocks.length) {
    ensureSpace(3);
    const heading = addHeading(null, "Sections", colors);
    page.drawText(heading.text, {
      x: left,
      y,
      size: heading.size,
      font: fontBold,
      color: toRgb(heading.color)
    });
    y -= 10;

    const blocks = cv.blocks.filter((b) => b.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    blocks.forEach((block) => {
      const title = block.title || block.type;
      const text = blockText(block);
      const lines = wrapText(text, 96);
      ensureSpace(lines.length + 3, 14);

      page.drawText(title, { x: left, y, size: 11.2, font: fontBold, color: toRgb(colors.primary) });
      y -= 14;

      lines.forEach((line) => {
        page.drawText(line, { x: left + 6, y, size: 10.5, font: fontRegular, color: toRgb(colors.text) });
        y -= 13;
      });
      y -= 6;
    });
  }

  page.drawText("Generated by CV Manager", {
    x: left,
    y: 28,
    size: 9,
    font: fontItalic,
    color: toRgb(colors.muted)
  });

  const bytes = await pdf.save();
  const buffer = Buffer.from(bytes);

  const fileName = `CV_${safeFilename(cv.fullName || cv.title)}.pdf`;
  return {
    statusCode: 200,
    isBase64Encoded: true,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename=\"${fileName}\"`,
      "cache-control": "no-store"
    },
    body: buffer.toString("base64")
  };
};
