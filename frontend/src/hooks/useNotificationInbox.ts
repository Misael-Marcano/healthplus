import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type InboxItemKind = "validation_pending" | "comment" | "attachment";

export interface InboxItem {
  kind: InboxItemKind;
  id: number;
  creadoEn: string;
  requirementId: number;
  codigo: string;
  titulo: string;
  read: boolean;
  validadorNombre?: string;
  preview?: string;
  fileName?: string;
  actorNombre?: string;
}

export interface NotificationInboxPayload {
  items: InboxItem[];
  unreadCount: number;
}

const KEY = ["notifications", "inbox"] as const;

const REFETCH_MS = 60_000;

export function useNotificationInbox(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  return useQuery({
    queryKey: KEY,
    queryFn: () =>
      api
        .get<NotificationInboxPayload>("/notifications/inbox")
        .then((r) => r.data),
    enabled,
    refetchInterval: enabled ? REFETCH_MS : false,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { kind: InboxItemKind; id: number }[]) =>
      api.post("/notifications/mark-read", { items }).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export const notificationInboxQueryKey = KEY;
