/**
 * Formato almacenado: @[Nombre](userId)
 * Tolerante: @ opcional delante, paréntesis ASCII o tipográficos (U+FF08/U+FF09), espacios.
 * Debe mantenerse alineado con `mention-utils.ts` en el backend.
 */
export const MENTION_TOKEN_RE =
  /(?:@)?\[([^\]]*)\]\s*[\(（]\s*(\d+)\s*[\)）]/g;

export type CommentPart =
  | { type: "text"; value: string }
  | { type: "mention"; displayName: string; userId: number };

/** Normaliza caracteres que suelen romper el patrón @[…](id) al copiar/pegar o desde el teclado. */
export function normalizeMentionSource(texto: string): string {
  return (
    texto
      // espacios invisibles / BOM
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // @ y corchetes “fullwidth” (algunos teclados / Word)
      .replace(/\uFF20/g, "@")
      .replace(/\uFF3B/g, "[")
      .replace(/\uFF3D/g, "]")
      // entidades HTML frecuentes al pegar desde otros sistemas
      .replace(/&#64;/g, "@")
      .replace(/&lbrack;/g, "[")
      .replace(/&rbrack;/g, "]")
      .replace(/&lpar;/g, "(")
      .replace(/&rpar;/g, ")")
  );
}

/** Parte texto en trozos de texto + menciones (token almacenado: @[Nombre](id)). */
export function parseCommentText(texto: string): CommentPart[] {
  const raw = normalizeMentionSource(texto ?? "");
  const parts: CommentPart[] = [];
  let last = 0;
  const re = new RegExp(MENTION_TOKEN_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", value: raw.slice(last, m.index) });
    }
    const id = Number(m[2]);
    if (Number.isFinite(id) && id > 0) {
      parts.push({
        type: "mention",
        displayName: (m[1] ?? "").trim() || "Usuario",
        userId: id,
      });
    } else {
      parts.push({ type: "text", value: m[0] });
    }
    last = m.index + m[0].length;
  }
  if (last < raw.length) {
    parts.push({ type: "text", value: raw.slice(last) });
  }
  if (parts.length === 0) {
    parts.push({ type: "text", value: texto ?? "" });
  }
  return parts;
}

export function sanitizeMentionLabel(nombre: string): string {
  return nombre.replace(/\]/g, " ").replace(/\s+/g, " ").trim() || "Usuario";
}
