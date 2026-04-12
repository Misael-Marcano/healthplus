"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canViewValidationNotifications } from "@/lib/permissions";
import {
  useMarkNotificationsRead,
  useNotificationInbox,
  type InboxItem,
} from "@/hooks/useNotificationInbox";
import { useLocale } from "@/context/LocaleContext";
import type { MessageKey } from "@/i18n/dictionaries";

function itemSubtitle(item: InboxItem, t: (k: MessageKey) => string) {
  if (item.kind === "validation_pending") {
    return t("topbar.notificationsValidationPending");
  }
  if (item.kind === "comment") {
    return `${t("topbar.notificationsComment")} · ${item.actorNombre ?? ""}`;
  }
  return `${t("topbar.notificationsAttachment")} · ${item.fileName ?? item.actorNombre ?? ""}`;
}

function itemDetailLine(item: InboxItem) {
  if (item.kind === "comment" && item.preview?.trim()) {
    return item.preview;
  }
  return null;
}

/** Stakeholder no tiene ruta `/requisitos/:id` en la matriz: la validación vive en `/validacion`. */
function hrefForItem(item: InboxItem, rol: string | undefined) {
  if (rol === "stakeholder" && item.kind === "validation_pending") {
    return "/validacion";
  }
  return `/requisitos/${item.requirementId}`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { t } = useLocale();
  const enabled = canViewValidationNotifications(user?.rol, user?.permisos);
  const { data, isLoading } = useNotificationInbox({ enabled });
  const markRead = useMarkNotificationsRead();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open || isLoading) return;
    const unread = items.filter((i) => !i.read);
    if (!unread.length) return;
    markRead.mutate(unread.map((i) => ({ kind: i.kind, id: i.id })));
  }, [open, isLoading, items, markRead]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!enabled) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-[10px] p-2 text-[#7A8798] transition-colors hover:bg-[#F6F8FB]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("topbar.notifications")}
      >
        <Bell size={18} strokeWidth={1.75} aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#E45469] px-0.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-[#E5EAF1] bg-white py-2 shadow-lg"
          role="menu"
          aria-label={t("topbar.notifications")}
        >
          <div className="border-b border-[#EEF1F6] px-3 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7A8798]">
              {t("topbar.notifications")}
            </p>
          </div>
          <div className="max-h-[min(70vh,20rem)] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8 text-[#7A8798]">
                <Loader2 className="size-6 animate-spin" aria-hidden />
              </div>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[#7A8798]">
                {t("topbar.notificationsEmpty")}
              </p>
            ) : (
              <ul className="py-1">
                {items.map((item) => {
                  const detail = itemDetailLine(item);
                  const key = `${item.kind}-${item.id}`;
                  return (
                    <li key={key} role="none">
                      <Link
                        role="menuitem"
                        href={hrefForItem(item, user?.rol)}
                        className={`block px-3 py-2.5 text-left transition-colors hover:bg-[#F6F8FB] ${
                          item.read ? "opacity-60" : ""
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        <span className="font-mono text-xs font-semibold text-[#2C5FA3]">
                          {item.codigo || "—"}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-sm text-[#4B5563]">
                          {item.titulo?.trim() || "—"}
                        </span>
                        {detail ? (
                          <span className="mt-0.5 line-clamp-2 block text-xs text-[#7A8798]">
                            {detail}
                          </span>
                        ) : null}
                        <span className="mt-1 text-[10px] text-[#7A8798]">
                          {itemSubtitle(item, t)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="border-t border-[#EEF1F6] px-2 py-2">
            <Link
              href="/validacion"
              className="block rounded-lg px-2 py-2 text-center text-sm font-medium text-[#2C5FA3] hover:bg-[#EAF2F8]"
              onClick={() => setOpen(false)}
            >
              {t("topbar.viewAllValidation")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
