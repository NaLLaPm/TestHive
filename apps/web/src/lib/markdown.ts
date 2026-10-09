/** Minimal markdown -> HTML for our own report output (headings, bold, tables,
 * blockquotes, lists, paragraphs). Not a general-purpose parser. */
export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inTable = false;
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (/^\|.*\|$/.test(line.trim())) {
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c))) continue; // separator row
      if (!inTable) {
        html.push('<table class="w-full text-sm border-collapse my-3">');
        inTable = true;
      }
      const tag = i > 0 && /^\|.*\|$/.test((lines[i - 1] ?? "").trim()) ? "td" : "th";
      html.push(
        `<tr>${cells.map((c) => `<${tag} class="border border-border px-3 py-1.5 text-left">${inline(c)}</${tag}>`).join("")}</tr>`,
      );
      continue;
    } else if (inTable) {
      html.push("</table>");
      inTable = false;
    }

    if (/^###\s+/.test(line)) {
      closeList();
      html.push(`<h3 class="text-base font-semibold mt-4 mb-1">${inline(line.replace(/^###\s+/, ""))}</h3>`);
    } else if (/^##\s+/.test(line)) {
      closeList();
      html.push(`<h2 class="text-lg font-bold mt-5 mb-2">${inline(line.replace(/^##\s+/, ""))}</h2>`);
    } else if (/^#\s+/.test(line)) {
      closeList();
      html.push(`<h1 class="text-2xl font-bold mt-2 mb-3">${inline(line.replace(/^#\s+/, ""))}</h1>`);
    } else if (/^>\s?/.test(line)) {
      closeList();
      html.push(`<blockquote class="border-l-2 border-accent pl-3 italic text-muted my-2">${inline(line.replace(/^>\s?/, ""))}</blockquote>`);
    } else if (/^-\s+/.test(line)) {
      if (!inList) {
        html.push('<ul class="list-disc list-inside space-y-1 my-2">');
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^-\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      html.push(`<p class="my-2 leading-relaxed">${inline(line)}</p>`);
    }
  }
  closeList();
  if (inTable) html.push("</table>");

  return html.join("\n");
}

function inline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-panel2 px-1 rounded">$1</code>');
}
