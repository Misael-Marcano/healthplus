import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const REQ_KEY = "requirements";

export function useAddRequirementComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requirementId, texto }: { requirementId: number; texto: string }) =>
      api
        .post(`/requirements/${requirementId}/comments`, { texto })
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [REQ_KEY, vars.requirementId] });
      qc.invalidateQueries({ queryKey: [REQ_KEY] });
    },
  });
}
