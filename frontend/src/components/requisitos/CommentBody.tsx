"use client";

import { parseCommentText } from "@/lib/comment-mentions";

function MentionChip({ displayName }: { displayName: string }) {
  const label = displayName.trim() || "Usuario";
  return (
    <span
      className="inline-flex max-w-full align-baseline rounded-md border border-[#85B8FF] bg-[#E9F2FF] px-1.5 py-0.5 text-[0.8125rem] font-semibold leading-tight text-[#0747A6] shadow-[inset_0_-1px_0_rgba(9,30,66,0.08)]"
      title={`Mención a ${label}`}
    >
      <span className="text-[#0052CC] opacity-90" aria-hidden>
        @
      </span>
      <span className="truncate">{label}</span>
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
