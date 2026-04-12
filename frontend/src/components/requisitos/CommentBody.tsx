"use client";

import { parseCommentText } from "@/lib/comment-mentions";
import { MENTION_CHIP_CLASS } from "@/lib/mention-editable";

function MentionChip({ displayName }: { displayName: string }) {
  const label = displayName.trim() || "Usuario";
  return (
    <span
      className={MENTION_CHIP_CLASS}
      title={`Mención a ${label}`}
    >
      @{label}
    </span>
  );
}

/** Renderiza el texto del comentario con @menciones como chips (sin mostrar el id interno). */
export function CommentBody({ texto }: { texto: string }) {
  const parts = parseCommentText(texto);
  return (
    <span className="break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
      {parts.map((p, i) => {
        if (p.type === "text") {
          return <span key={i}>{p.value}</span>;
        }
        return <MentionChip key={i} displayName={p.displayName} />;
      })}
    </span>
  );
}
