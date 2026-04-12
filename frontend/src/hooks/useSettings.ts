import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface SystemSettingsPayload {
  org: {
    nombre: string;
    area: string;
    email: string;
    ciudad: string;
    tel: string;
    web: string;
  };
  prefs: { lang: string; tz: string; datefmt: string };
  cats: string[];
  vtrigger: string;
  versionOpts: string[];
  notifOpts: string[];
  smtp: { host: string; port: string; user: string };
  smtpPasswordSet: boolean;
  updatedAt: string;
}

export type SystemSettingsPatch = Partial<{
  org: Partial<SystemSettingsPayload["org"]>;
  prefs: Partial<SystemSettingsPayload["prefs"]>;
  cats: string[];
  vtrigger: string;
  versionOpts: string[];
  notifOpts: string[];
  smtp: Partial<{ host: string; port: string; user: string; password: string }>;
}>;

const KEY = ["settings"] as const;

export function useSystemSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () =>
      api.get<SystemSettingsPayload>("/settings").then((r) => r.data),
  });
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SystemSettingsPatch) =>
      api.patch<SystemSettingsPayload>("/settings", patch).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
    },
  });
}
