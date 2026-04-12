/**
 * Tokens tipo JIRA: @[Nombre](userId) — tolerante a @ opcional y paréntesis tipográficos.
 * Alineado con `comment-mentions.ts` en el frontend.
 */
export const MENTION_TOKEN_REGEX =
  /(?:@)?\[([^\]]*)\]\s*[\(（]\s*(\d+)\s*[\)）]/g;

export function extractMentionUserIds(texto: string): number[] {
  const ids: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_TOKEN_REGEX.source, 'g');
  while ((m = re.exec(texto)) !== null) {
    const id = Number(m[2]);
    if (Number.isInteger(id) && id > 0) ids.push(id);
  }
  return [...new Set(ids)];
}
