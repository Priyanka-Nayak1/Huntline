import { createRequire } from "node:module";
import mammoth from "mammoth";
import { AppError } from "../../middleware/error-handler.js";
import { sanitizeText } from "../../utils/sanitize.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function extractResumeText(file) {
  const name = (file.originalname || "").toLowerCase();
  let text = "";

  if (name.endsWith(".pdf") || file.mimetype === "application/pdf") {
    const parsed = await pdfParse(file.buffer, { pagerender: renderPdfPage });
    text = parsed.text || "";
  } else if (name.endsWith(".docx")) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    text = parsed.value || "";
  } else {
    throw new AppError(400, "Unsupported resume file type");
  }

  const cleaned = sanitizeText(text, 80_000);
  if (cleaned.length < 80) {
    throw new AppError(400, "Could not extract enough text from the resume");
  }
  return cleaned;
}

function renderPdfPage(pageData) {
  return pageData.getTextContent({ normalizeWhitespace: false }).then((textContent) => {
    let lastY;
    let output = "";
    for (const item of textContent.items) {
      const str = item.str || "";
      if (!str) continue;
      const y = Math.round(item.transform[5]);
      if (lastY !== undefined && Math.abs(y - lastY) > 2) {
        output += "\n";
      } else if (output && !output.endsWith("\n")) {
        const lastToken = output.split(/\s+/).pop() || "";
        const glueLetter = lastToken.length === 1 && /[A-Z]/.test(lastToken) && /^[A-Za-z]/.test(str);
        if (!glueLetter) output += " ";
      }
      output += str;
      lastY = y;
    }
    return output;
  });
}
