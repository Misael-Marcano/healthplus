import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

// Adjunta el access token en cada petición
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cola de peticiones que esperan el refresh
let isRefreshing = false;
let queue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Solo intentar refresh en 401, una sola vez, y no en la propia llamada de refresh
    if (typeof window !== "undefined" && error.response?.status === 403) {
      const path = window.location.pathname;
      if (!path.startsWith("/sin-permiso") && !path.startsWith("/login")) {
        window.location.replace("/sin-permiso");
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes("/auth/refresh") ||
      typeof window === "undefined"
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar la petición
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
      );
      const newToken: string = data.accessToken;
      localStorage.setItem("access_token", newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
