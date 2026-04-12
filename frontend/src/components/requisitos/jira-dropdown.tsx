"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type JiraMenuItem = {
  value: string;
  label: string;
  /** Clases para el trigger cuando este ítem está seleccionado (tema lozenge) */
  lozengeClass?: string;
  /** Fila del menú: tinte suave opcional */
  rowTintClass?: string;
};

function useDropdownPosition(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const el = anchorRef.current;
    const update = () => {
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  return pos;
}

/** Menú desplegable estilo Jira (modo claro): no usa &lt;select&gt; nativo. */
export function JiraMenuDropdown({
  value,
  items,
  onChange,
  disabled,
  pending,
  variant = "neutral",
  ariaLabel,
  minMenuWidth = 240,
  className,
}: {
  value: string;
  items: JiraMenuItem[];
  onChange: (value: string) => void;
  disabled?: boolean;
  pending?: boolean;
  variant?: "lozenge" | "neutral";
  ariaLabel: string;
  minMenuWidth?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const pos = useDropdownPosition(open, anchorRef);

  const selected = items.find((i) => i.value === value) ?? items[0];
  const selectedLabel = selected?.label ?? "—";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onPick = useCallback(
    (v: string) => {
      onChange(v);
      setOpen(false);
    },
    [onChange],
  );

  const triggerLozenge =
    variant === "lozenge" && selected?.lozengeClass
      ? selected.lozengeClass
      : "border-[#DCDFE4] bg-[#FAFBFC] text-[#172B4D] hover:bg-[#F1F2F4]";

  return (
    <div className={cn("relative min-w-0", className)}>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled || pending || items.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 text-left text-[13px] font-semibold leading-none transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#388BFF] focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          triggerLozenge,
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          strokeWidth={2}
          className={cn(
            "h-4 w-4 shrink-0 opacity-70 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            className="fixed z-[200] overflow-hidden rounded-md border border-[#DCDFE4] bg-white py-1 shadow-[0_4px_8px_rgba(9,30,66,0.12),0_0_1px_rgba(9,30,66,0.12)]"
            style={{
              top: pos.top,
              left: pos.left,
              minWidth: Math.max(pos.width, minMenuWidth),
              maxHeight: "min(320px, calc(100vh - 24px))",
              overflowY: "auto",
            }}
          >
            {items.map((item) => {
              const isSel = item.value === value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  onClick={() => onPick(item.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
                    "cursor-pointer hover:bg-[#F1F2F4]",
                    isSel &&
                      "bg-[#E9F2FF] shadow-[inset_3px_0_0_#0C66E4]",
                    item.rowTintClass,
                  )}
                >
                  {variant === "lozenge" && item.lozengeClass ? (
                    <span
                      className={cn(
                        "inline-flex max-w-full min-w-0 truncate rounded px-2 py-0.5 text-[11px] font-semibold leading-tight",
                        item.lozengeClass,
                      )}
                    >
                      {item.label}
                    </span>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#172B4D]">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** Selector de usuario: avatar + nombre en el trigger; filas con ícono genérico. */
export function JiraUserMenuDropdown({
  value,
  items,
  onChange,
  disabled,
  pending,
  ariaLabel,
  initials,
  avatarClassName,
  emptyLabel = "Sin asignar",
}: {
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  pending?: boolean;
  ariaLabel: string;
  initials: string;
  avatarClassName: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const pos = useDropdownPosition(open, anchorRef);

  const selected = items.find((i) => i.value === value);
  const selectedLabel = selected?.label ?? emptyLabel;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative min-w-0 w-full">
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled || pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-8 w-full min-w-0 items-center gap-2 rounded-md border border-[#DCDFE4] bg-white px-2 py-1 text-left transition-colors",
          "hover:bg-[#FAFBFC] hover:border-[#C1C7D0]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#388BFF] focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
            avatarClassName,
          )}
          aria-hidden
        >
          {initials || "?"}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#172B4D]">
          {selectedLabel}
        </span>
        <ChevronDown
          strokeWidth={2}
          className={cn("h-4 w-4 shrink-0 text-[#5E6C84] opacity-80", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            className="fixed z-[200] overflow-hidden rounded-md border border-[#DCDFE4] bg-white py-1 shadow-[0_4px_8px_rgba(9,30,66,0.12)]"
            style={{
              top: pos.top,
              left: pos.left,
              minWidth: Math.max(pos.width, 260),
              maxHeight: "min(280px, calc(100vh - 24px))",
              overflowY: "auto",
            }}
          >
            {items.map((item) => {
              const isSel = item.value === value;
              return (
                <button
                  key={item.value || "empty"}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] text-[#172B4D] transition-colors",
                    "cursor-pointer hover:bg-[#F1F2F4]",
                    isSel && "bg-[#E9F2FF] shadow-[inset_3px_0_0_#0C66E4]",
                  )}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EBECF0] text-[#5E6C84]">
                    <User size={14} strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 truncate font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
