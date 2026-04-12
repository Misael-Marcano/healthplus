"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, setSessionCookie } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, User, Lock } from "lucide-react";
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
    <div className="min-h-screen flex bg-[#EEF1F6]">
      {/* Panel izquierdo — tono clínico / corporativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#EAF2F8] via-[#D0E4F5] to-[#A3C8EC] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 bg-white/10 rounded-full" />

        <div className="relative z-10 text-center text-[#2C5FA3]">
          <div className="w-20 h-20 bg-white/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-white/60">
            <svg viewBox="0 0 24 24" className="w-11 h-11 text-[#2C5FA3]" fill="currentColor">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14a1 1 0 01-1-1v-3H8a1 1 0 010-2h3V8a1 1 0 012 0v3h3a1 1 0 010 2h-3v3a1 1 0 01-1 1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">HealthPlus</h1>
          <p className="text-[#4E6A8F] text-lg mb-8">Clínica Integral</p>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-left max-w-sm border border-[#E5EAF1] shadow-sm">
            <h2 className="text-xl font-semibold mb-3 text-[#4B5563]">Sistema de Gestión de Requisitos</h2>
            <p className="text-[#7A8798] text-sm leading-relaxed mb-5">
              Centraliza, organiza, prioriza y da seguimiento a los requisitos de los proyectos tecnológicos internos.
            </p>
            <div className="space-y-2">
              {["Trazabilidad completa de cambios", "Control de versiones", "Validación con stakeholders", "Reportes automatizados"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-[#4E6A8F]">
                  <div className="w-4 h-4 rounded-full bg-[#2C5FA3]/15 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-[#2C5FA3]" fill="currentColor"><path d="M10 3L5 8.5 2 5.5l-1 1L5 10.5l6-7-1-0.5z" /></svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-[#2C5FA3] rounded-xl flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14a1 1 0 01-1-1v-3H8a1 1 0 010-2h3V8a1 1 0 012 0v3h3a1 1 0 010 2h-3v3a1 1 0 01-1 1z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900">HealthPlus</p>
              <p className="text-xs text-gray-400">Clínica Integral</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(15,23,42,0.06)] border border-[#E5EAF1] px-8 py-10">
            <div className="mb-7">
              <h2 className="text-2xl font-semibold text-[#4B5563]">Iniciar Sesión</h2>
              <p className="text-sm text-[#7A8798] mt-1">Ingresa tus credenciales para continuar</p>
            </div>

            {apiError && (
              <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <p className="text-xs text-[#7A8798] -mt-0.5 mb-0.5">Debe coincidir con el correo registrado en el sistema.</p>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden />
                  <input
                    id="login-email"
                    autoComplete="email"
                    {...register("email")}
                    type="text"
                    placeholder="tu.usuario@healthplus.com"
                    className={`w-full min-h-11 rounded-[10px] border pl-9 pr-3 py-2.5 text-sm text-[#4B5563] placeholder:text-[#9AA8B8] transition-colors focus:outline-none focus:ring-2 ${errors.email ? "border-red-300 focus:ring-red-200" : "border-[#D9E2EC] focus:ring-[#619CD0]/25 focus:border-[#619CD0]"}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden />
                  <input
                    id="login-password"
                    autoComplete="current-password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full min-h-11 rounded-[10px] border pl-9 pr-10 py-2.5 text-sm text-[#4B5563] placeholder:text-[#9AA8B8] transition-colors focus:outline-none focus:ring-2 ${errors.password ? "border-red-300 focus:ring-red-200" : "border-[#D9E2EC] focus:ring-[#619CD0]/25 focus:border-[#619CD0]"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[#7A8798] cursor-pointer select-none">
                  <input
                    {...register("remember")}
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#D9E2EC] text-[#2C5FA3] focus:ring-[#619CD0]"
                  />
                  <span>Recuérdame</span>
                </label>
                <Link href="/olvido-contrasena" className="text-sm font-medium text-[#2C5FA3] hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-11 bg-[#2C5FA3] hover:bg-[#244F88] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-[10px] transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm"
              >
                {isSubmitting ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Iniciando sesión...</>
                ) : "Iniciar Sesión"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-[#7A8798] mt-6">
            HealthPlus Clínica Integral © {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  );
}
