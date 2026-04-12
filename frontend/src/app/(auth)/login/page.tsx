"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, setSessionCookie } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/toastError";

const loginSchema = z.object({
  email: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  remember: z.boolean().optional(),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const { login } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    const u = getUser();
    if (token && u) {
      setSessionCookie();
      router.replace("/dashboard");
    }
  }, [router]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  const onSubmit = async ({ email, password, remember }: LoginForm) => {
    setApiError("");
    try {
      await login(email, password, !!remember);
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#E5EEF8]">
      {/* Fondo: PNG 1536×1024 en public (sin optimizador Next = sin recompresión). */}
      <div
        className="pointer-events-none absolute inset-0 z-0 isolate [transform:translateZ(0)]"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- fondo full-bleed: máxima fidelidad del PNG original */}
        <img
          src="/Fondo_login.png"
          alt=""
          width={1536}
          height={1024}
          fetchPriority="high"
          decoding="async"
          className="h-full min-h-[100dvh] w-full object-cover object-center"
        />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-white/70 bg-white/95 px-8 py-10 shadow-[0_8px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm">
              <div className="mb-8 flex items-center justify-center gap-3">
                <div className="shrink-0 rounded-xl border border-[#E5EAF1] bg-white p-1 shadow-sm">
                  <BrandLogo variant="mark" className="h-11 w-11" priority />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold leading-tight text-[#1e4d8c]">HealthPlus</p>
                  <p className="text-sm font-medium text-[#4E6A8F]">Clínica Integral</p>
                </div>
              </div>

              <div className="mb-7 text-center">
                <h2 className="text-2xl font-semibold text-[#4B5563]">Iniciar Sesión</h2>
                <p className="mt-1 text-sm text-[#7A8798]">Ingresa tus credenciales para continuar</p>
              </div>

              {apiError && (
                <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <p className="mb-0.5 -mt-0.5 text-xs text-[#7A8798]">
                    Debe coincidir con el correo registrado en el sistema.
                  </p>
                  <div className="relative">
                    <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
                    <input
                      id="login-email"
                      autoComplete="email"
                      {...register("email")}
                      type="text"
                      placeholder="tu.usuario@healthplus.com"
                      className={`w-full min-h-11 rounded-[10px] border py-2.5 pl-9 pr-3 text-sm text-[#4B5563] placeholder:text-[#9AA8B8] transition-colors focus:outline-none focus:ring-2 ${errors.email ? "border-red-300 focus:ring-red-200" : "border-[#D9E2EC] focus:border-[#619CD0] focus:ring-[#619CD0]/25"}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
                    <input
                      id="login-password"
                      autoComplete="current-password"
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`w-full min-h-11 rounded-[10px] border py-2.5 pl-9 pr-10 text-sm text-[#4B5563] placeholder:text-[#9AA8B8] transition-colors focus:outline-none focus:ring-2 ${errors.password ? "border-red-300 focus:ring-red-200" : "border-[#D9E2EC] focus:border-[#619CD0] focus:ring-[#619CD0]/25"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-[#7A8798]">
                    <input
                      {...register("remember")}
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#D9E2EC] text-[#2C5FA3] focus:ring-[#619CD0]"
                    />
                    <span>Recuérdame</span>
                  </label>
                  <Link
                    href="/olvido-contrasena"
                    className="text-center text-sm font-medium text-[#2C5FA3] hover:underline sm:text-right"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#2C5FA3] py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#244F88] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Iniciando sesión…
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <p className="pb-6 text-center text-xs text-[#5a6d82] drop-shadow-sm">
          HealthPlus Clínica Integral © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
