import { isAxiosError } from "axios";

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string" && msg.trim()) return msg;
    if (error.response?.status) {
      return `Error ${error.response.status}: ${error.response.statusText || "solicitud fallida"}`;
    }
    return error.message || "Error al procesar la solicitud";
  }
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}

/** Evita toast duplicado cuando el interceptor ya redirige (403 / sesión). */
export function shouldSkipGlobalMutationToast(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
}
