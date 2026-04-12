import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const REQ_KEY = "requirements";

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
}

/** Sube un PDF o Word; usa fetch para enviar multipart sin forzar JSON. */
export async function uploadRequirementAttachment(
  requirementId: number,
  file: File,
): Promise<unknown> {
  const fd = new FormData();
  fd.append("file", file);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
  const res = await fetch(
    `${getApiBase()}/requirements/${requirementId}/attachments`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Error ${res.status}`);
  }
  return res.json();
}

export function useUploadRequirementAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requirementId,
      file,
    }: {
      requirementId: number;
      file: File;
    }) => uploadRequirementAttachment(requirementId, file),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: [REQ_KEY, v.requirementId] });
      qc.invalidateQueries({ queryKey: [REQ_KEY] });
    },
  });
}

export function useDeleteRequirementAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requirementId,
      attachmentId,
    }: {
      requirementId: number;
      attachmentId: number;
    }) =>
      api
        .delete(
          `/requirements/${requirementId}/attachments/${attachmentId}`,
        )
        .then((r) => r.data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: [REQ_KEY, v.requirementId] });
      qc.invalidateQueries({ queryKey: [REQ_KEY] });
    },
  });
}

export async function downloadRequirementAttachment(
  requirementId: number,
  attachmentId: number,
  nombreOriginal: string,
): Promise<void> {
  const res = await api.get<Blob>(
    `/requirements/${requirementId}/attachments/${attachmentId}/download`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreOriginal;
  a.click();
  URL.revokeObjectURL(url);
}
