import { parseCommentText, sanitizeMentionLabel } from "@/lib/comment-mentions";

export const MENTION_CHIP_CLASS =
  "mention-chip inline-flex max-w-full items-center align-baseline rounded-full border border-[#A0C4FF] bg-[#E9F2FF] px-2 py-0.5 text-[13px] font-semibold leading-tight text-[#0052CC] [overflow-wrap:anywhere]";

export function mentionTokenFromEl(el: HTMLElement): string {
  const id = el.dataset.userId ?? "0";
  const name = sanitizeMentionLabel(el.dataset.displayName ?? "");
  return `@[${name}](${id})`;
}

export function nodeSerializedLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").length;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    if (el.tagName === "BR") return 1;
    if (el.classList.contains("mention-chip")) return mentionTokenFromEl(el).length;
    let sum = 0;
    for (const c of Array.from(el.childNodes)) sum += nodeSerializedLength(c);
    return sum;
  }
  return 0;
}

/** Serializa el contenido del editor al formato guardado en API. */
export function serializeMentionEditable(root: HTMLElement): string {
  let out = "";
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      if (el.tagName === "BR") {
        out += "\n";
      } else if (el.classList.contains("mention-chip")) {
        out += mentionTokenFromEl(el);
      } else {
        out += el.textContent ?? "";
      }
    }
  }
  return out;
}

/** Construye nodos a partir del string almacenado. */
export function fillEditableFromValue(root: HTMLElement, value: string) {
  root.replaceChildren();
  const parts = parseCommentText(value ?? "");
  for (const p of parts) {
    if (p.type === "text") {
      root.appendChild(document.createTextNode(p.value));
    } else {
      const span = document.createElement("span");
      span.className = MENTION_CHIP_CLASS;
      span.contentEditable = "false";
      span.dataset.userId = String(p.userId);
      span.dataset.displayName = p.displayName;
      span.textContent = `@${p.displayName.trim() || "Usuario"}`;
      span.setAttribute("tabindex", "-1");
      root.appendChild(span);
    }
  }
}

/** Offset en el string serializado equivalente a la selección colapsada. */
export function rangeToSerializedOffset(root: HTMLElement, range: Range): number {
  const end = range.endContainer;
  const endOff = range.endOffset;

  if (end.nodeType === Node.ELEMENT_NODE) {
    const el = end as HTMLElement;
    if (!root.contains(el) && el !== root) return 0;
    let sum = 0;
    const kids = Array.from(el.childNodes);
    for (let i = 0; i < endOff && i < kids.length; i++) {
      sum += nodeSerializedLength(kids[i]!);
    }
    return sum;
  }

  if (end.nodeType === Node.TEXT_NODE) {
    let acc = 0;
    function walk(n: Node): boolean {
      if (n === end) {
        acc += endOff;
        return true;
      }
      if (n.nodeType === Node.TEXT_NODE) {
        acc += (n.textContent ?? "").length;
        return false;
      }
      if (n.nodeType === Node.ELEMENT_NODE) {
        const el = n as HTMLElement;
        if (el.tagName === "BR") {
          acc += 1;
          return false;
        }
        if (el.classList.contains("mention-chip")) {
          acc += mentionTokenFromEl(el).length;
          return false;
        }
        for (const c of Array.from(n.childNodes)) {
          if (walk(c)) return true;
        }
      }
      return false;
    }
    walk(root);
    return acc;
  }
  return 0;
}

export function getCaretSerializedOffset(root: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return 0;
  return rangeToSerializedOffset(root, sel.getRangeAt(0));
}

/** Coloca el cursor después del carácter `offset` en el texto serializado. */
export function setCaretSerializedOffset(root: HTMLElement, offset: number) {
  let remaining = offset;
  const sel = window.getSelection();
  if (!sel) return;
  const selection = sel;

  function walk(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent ?? "").length;
      if (remaining <= len) {
        const r = document.createRange();
        r.setStart(node, Math.max(0, remaining));
        r.collapse(true);
        selection.removeAllRanges();
        selection.addRange(r);
        return true;
      }
      remaining -= len;
      return false;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === "BR") {
        if (remaining === 0) {
          const r = document.createRange();
          r.setStartBefore(el);
          r.collapse(true);
          selection.removeAllRanges();
          selection.addRange(r);
          return true;
        }
        remaining -= 1;
        if (remaining === 0) {
          const r = document.createRange();
          r.setStartAfter(el);
          r.collapse(true);
          selection.removeAllRanges();
          selection.addRange(r);
          return true;
        }
        return false;
      }
      if (el.classList.contains("mention-chip")) {
        const tokLen = mentionTokenFromEl(el).length;
        if (remaining <= 0) {
          const r = document.createRange();
          r.setStartBefore(el);
          r.collapse(true);
          selection.removeAllRanges();
          selection.addRange(r);
          return true;
        }
        if (remaining < tokLen) {
          const r = document.createRange();
          r.setStartAfter(el);
          r.collapse(true);
          selection.removeAllRanges();
          selection.addRange(r);
          return true;
        }
        remaining -= tokLen;
        return false;
      }
      for (const c of Array.from(node.childNodes)) {
        if (walk(c)) return true;
      }
    }
    return false;
  }

  if (walk(root)) return;
  const r = document.createRange();
  r.selectNodeContents(root);
  r.collapse(false);
  selection.removeAllRanges();
  selection.addRange(r);
}
