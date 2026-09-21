import katex from "katex";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Merender teks campuran (kalimat biasa + potongan TeX yang diapit `$...$`)
 * menjadi HTML aman-pakai untuk v-html.
 */
export function renderTeksCampuran(teks: string): string {
  return teks
    .split(/(\$[^$]+\$)/g)
    .map((bagian) => {
      if (bagian.startsWith("$") && bagian.endsWith("$") && bagian.length > 1) {
        try {
          return katex.renderToString(bagian.slice(1, -1), {
            throwOnError: false,
            displayMode: false,
          });
        } catch {
          return escapeHtml(bagian);
        }
      }
      return escapeHtml(bagian);
    })
    .join("");
}

/** Merender satu ekspresi TeX murni (tanpa delimiter `$`) menjadi HTML inline. */
export function renderTexInline(tex: string): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: false });
  } catch {
    return escapeHtml(tex);
  }
}
