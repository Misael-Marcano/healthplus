import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage, shouldSkipGlobalMutationToast } from "@/lib/toastError";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (mutation.meta?.skipGlobalErrorToast) return;
      if (shouldSkipGlobalMutationToast(error)) return;
      toast.error(getApiErrorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
