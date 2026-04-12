"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useUserLookup } from "@/hooks/useUsers";
import { sanitizeMentionLabel } from "@/lib/comment-mentions";
import { cn } from "@/lib/utils";

interface MentionState {
  start: number;
  query: string;
}

interface Props {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

const MAX_SUGGEST = 8;
const MAX_LIST_PX = 192; // matches max-h-48
const POPOVER_Z = 10050;

interface PopoverCoords {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function CommentMentionTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  className,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const { data: users = [] } = useUserLookup();
  const [mention, setMention] = useState<MentionState | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [popoverPos, setPopoverPos] = useState<PopoverCoords | null>(null);

  const filtered = useMemo(() => {
    const q = (mention?.query ?? "").trim().toLowerCase();
    const list = users.filter((u) => {
      if (!q) return true;
      return u.nombre.toLowerCase().includes(q);
    });
    return list.slice(0, MAX_SUGGEST);
  }, [users, mention?.query]);

  const showSuggestList =
    Boolean(mention && !disabled && filtered.length > 0);
  const showEmptyHint =
    Boolean(
      mention &&
        !disabled &&
        filtered.length === 0 &&
        (mention.query.length > 0 || users.length === 0),
    );
  const showPopover = showSuggestList || showEmptyHint;

  const updatePopoverPosition = useCallback(() => {
    const ta = taRef.current;
    if (!ta || !showPopover) {
      setPopoverPos(null);
      return;
    }
    const rect = ta.getBoundingClientRect();
    const margin = 6;
    const rowApprox = 44;
    const estimatedListH = showSuggestList
      ? Math.min(MAX_LIST_PX, Math.max(filtered.length, 1) * rowApprox + 8)
      : 44;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUp = spaceBelow < estimatedListH && spaceAbove > spaceBelow;
    const maxHeight = openUp
      ? Math.min(MAX_LIST_PX, Math.max(80, rect.top - margin * 2))
      : Math.min(MAX_LIST_PX, Math.max(80, window.innerHeight - rect.bottom - margin * 2));
    const top = openUp
      ? Math.max(margin, rect.top - Math.min(estimatedListH, maxHeight) - margin)
      : rect.bottom + margin;

    setPopoverPos({
      top,
      left: rect.left,
      width: Math.max(rect.width, 220),
      maxHeight,
    });
  }, [showPopover, showSuggestList, filtered.length, mention, disabled]);

  useLayoutEffect(() => {
    if (!showPopover) {
      setPopoverPos(null);
      return;
    }
    updatePopoverPosition();
    const onMove = () => updatePopoverPosition();
    window.addEventListener("resize", onMove);
    document.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      document.removeEventListener("scroll", onMove, true);
    };
  }, [showPopover, updatePopoverPosition]);

  useEffect(() => {
    setHighlight(0);
  }, [mention?.query, mention?.start]);

  useEffect(() => {
    if (!filtered.length) return;
    setHighlight((h) => Math.min(h, filtered.length - 1));
  }, [filtered.length]);

  useEffect(() => {
    if (!mention) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (taRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      if (emptyRef.current?.contains(t)) return;
      setMention(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [mention]);

  const detectMention = useCallback(
    (text: string, cursor: number) => {
      const before = text.slice(0, cursor);
      const lastAt = before.lastIndexOf("@");
      if (lastAt === -1) {
        setMention(null);
        return;
      }
      const afterAt = before.slice(lastAt + 1);
      if (afterAt.startsWith("[")) {
        setMention(null);
        return;
      }
      if (/[\s\n]/.test(afterAt)) {
        setMention(null);
        return;
      }
      setMention({ start: lastAt, query: afterAt });
    },
    [],
  );

  const insertMention = useCallback(
    (user: { id: number; nombre: string }) => {
      if (!mention || !taRef.current) return;
      const ta = taRef.current;
      const cursor = ta.selectionStart ?? value.length;
      const head = value.slice(0, mention.start);
      const tail = value.slice(cursor);
      const safe = sanitizeMentionLabel(user.nombre);
      const insert = `@[${safe}](${user.id})`;
      const newVal = head + insert + tail;
      onChange(newVal);
      setMention(null);
      const pos = head.length + insert.length;
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(pos, pos);
      });
    },
    [mention, onChange, value],
  );

  const onChangeInner = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    const cursor = e.target.selectionStart ?? v.length;
    onChange(v);
    detectMention(v, cursor);
  };

  const onSelectInner = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    detectMention(ta.value, ta.selectionStart ?? ta.value.length);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mention || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      insertMention(filtered[highlight]!);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setMention(null);
    }
  };

  const portal =
    typeof document !== "undefined" &&
    showPopover &&
    popoverPos &&
    createPortal(
      showSuggestList ? (
        <ul
          ref={listRef}
          role="listbox"
          style={{
            position: "fixed",
            top: popoverPos.top,
            left: popoverPos.left,
            width: popoverPos.width,
            maxHeight: popoverPos.maxHeight,
            zIndex: POPOVER_Z,
          }}
          className="overflow-y-auto rounded-md border border-[#DFE1E6] bg-white shadow-lg py-1 text-sm"
        >
          {filtered.map((u, i) => (
            <li key={u.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 flex items-center gap-2",
                  i === highlight ? "bg-[#DEEBFF] text-[#0747A6]" : "hover:bg-[#F4F5F7]",
                )}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => insertMention(u)}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#DFE1E6] text-[10px] font-bold text-[#42526E]">
                  {u.nombre
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((x) => x[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?"}
                </span>
                <span className="truncate font-medium">{u.nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div
          ref={emptyRef}
          style={{
            position: "fixed",
            top: popoverPos.top,
            left: popoverPos.left,
            width: popoverPos.width,
            zIndex: POPOVER_Z,
          }}
          className="rounded-md border border-[#DFE1E6] bg-white shadow-lg px-3 py-2 text-xs text-[#5E6C84]"
        >
          {users.length === 0 ? "Cargando usuarios…" : "Nadie coincide con esa búsqueda"}
        </div>
      ),
      document.body,
    );

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#42526E]">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          ref={taRef}
          id={id}
          rows={rows}
          value={value}
          onChange={onChangeInner}
          onKeyDown={onKeyDown}
          onClick={onSelectInner}
          onKeyUp={onSelectInner}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full rounded-md border border-[#DFE1E6] bg-white px-3 py-2 text-sm text-[#172B4D] placeholder:text-[#5E6C84] transition-colors resize-y min-h-[80px]",
            "focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25",
            "disabled:bg-[#F4F5F7] disabled:cursor-not-allowed",
            className,
          )}
        />
        {portal}
      </div>
    </div>
  );
}
