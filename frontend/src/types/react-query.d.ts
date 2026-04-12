import "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** No mostrar toast global de error (p. ej. si el componente ya muestra el mensaje). */
      skipGlobalErrorToast?: boolean;
    };
  }
}
