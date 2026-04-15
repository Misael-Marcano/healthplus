"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface MotivoCambioModalProps {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onClose: () => void;
  /** Se llama solo con motivo no vacío (ya recortado). */
  onConfirm: (motivo: string) => void | Promise<void>;
}

export function MotivoCambioModal({
  open,
  title,
  description,
  placeholder = "Describe el motivo del cambio…",
  confirmLabel = "Confirmar",
  isLoading = false,
  onClose,
  onConfirm,
}: MotivoCambioModalProps) {
  const [texto, setTexto] = useState("");

  useEffect(() => {
    if (open) setTexto("");
  }, [open]);

  const handleConfirm = async () => {
    const limpio = texto.trim();
    if (!limpio) {
      toast.error("Indica un motivo para continuar.");
      return;
    }
    await onConfirm(limpio);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" closeLabel="Cancelar">
      <div className="space-y-4">
        {description ? (
          <p className="text-sm text-[#5E6C84] leading-relaxed">{description}</p>
        ) : null}
        <div>
          <label htmlFor="motivo-cambio-input" className="sr-only">
            Motivo del cambio
          </label>
          <textarea
            id="motivo-cambio-input"
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full resize-y rounded-md border border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2.5 text-sm text-[#172B4D] shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-[#97A0AF] hover:border-[#C1C7D0] focus:border-[#0052CC] focus:bg-white focus:ring-2 focus:ring-[#0052CC]/15 disabled:opacity-60"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            loading={isLoading}
            onClick={() => void handleConfirm()}
            className="bg-[#0052CC] hover:bg-[#0747A6] text-white border-0"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
