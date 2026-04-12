/** Mismo formato que el backend: @[Nombre](userId) — tolera espacios alrededor del id */
export const MENTION_TOKEN_RE = /@\[([^\]]*)\]\s*\(\s*(\d+)\s*\)/g;

export type CommentPart =
  | { type: "text"; value: string }
  | { type: "mention"; displayName: string; userId: number };

function normalizeMentionSource(texto: string): string {
  return texto
    .replace(/\uFF08/g, "(")
    .replace(/\uFF09/g, ")");
}

export function parseCommentText(texto: string): CommentPart[] {
  const raw = normalizeMentionSource(texto);
  const parts: CommentPart[] = [];
  let last = 0;
  const re = new RegExp(MENTION_TOKEN_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", value: raw.slice(last, m.index) });
    }
    const userId = Number(m[2]);
    parts.push({
      type: "mention",
      displayName: m[1] || "Usuario",
      userId: Number.isFinite(userId) ? userId : 0,
    });
    last = m.index + m[0].length;
  }
  if (last < raw.length) {
    parts.push({ type: "text", value: raw.slice(last) });
  }
  if (parts.length === 0) {
    parts.push({ type: "text", value: texto });
  }
  return parts;
}

export function sanitizeMentionLabel(nombre: string): string {
  return nombre.replace(/\]/g, " ").replace(/\s+/g, " ").trim() || "Usuario";
}
