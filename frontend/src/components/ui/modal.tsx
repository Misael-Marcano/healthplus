"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Etiqueta accesible del botón cerrar (por defecto español). */
  closeLabel?: string;
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  closeLabel = "Cerrar",
}: ModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      closeRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] outline-none",
          sizes[size],
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={closeLabel}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
