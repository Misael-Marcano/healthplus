"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import api from "@/lib/api";

const schema = z.object({
  email: z.string().email("Correo inválido"),
});
type FormValues = z.infer<typeof schema>;

export default function OlvidoContrasenaPage() {
  const [done, setDone] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setDevHint(null);
    const { data } = await api.post<{ message: string; resetUrl?: string; debugToken?: string }>(
      "/auth/forgot-password",
      values,
    );
    setDone(true);
    if (data.resetUrl) setDevHint(data.resetUrl);
    else if (data.debugToken) setDevHint(`Token (solo desarrollo): ${data.debugToken}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#EEF1F6] p-6">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4E6A8F] hover:text-[#2C5FA3] mb-6"
        >
          <ArrowLeft size={16} /> Volver al inicio de sesión
        </Link>

        <div className="bg-white rounded-2xl border border-[#E5EAF1] shadow-sm px-8 py-10">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#4B5563]">Recuperar contraseña</h1>
            <p className="text-sm text-[#7A8798] mt-1">
              Indica tu correo corporativo. Si existe una cuenta, podrás restablecer la contraseña.
            </p>
          </div>

          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-[#4B5563] leading-relaxed">
                Si el correo existe en el sistema, recibirás instrucciones (cuando el envío de correo esté
                configurado). En desarrollo puede mostrarse un enlace abajo.
              </p>
              {devHint && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 break-all">
                  {devHint.startsWith("http") ? (
                    <a href={devHint} className="underline font-medium text-amber-800">
                      {devHint}
                    </a>
                  ) : (
                    devHint
                  )}
                </div>
              )}
              <Link
                href="/login"
                className="inline-flex w-full justify-center rounded-[10px] bg-[#2C5FA3] py-2.5 text-sm font-semibold text-white hover:bg-[#244F88] transition-colors"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#4B5563]">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA8B8]" />
                  <input
                    {...register("email")}
                    type="email"
                    autoComplete="email"
                    className={`w-full h-11 rounded-[10px] border border-[#D9E2EC] pl-10 pr-3 text-sm text-[#4B5563] placeholder:text-[#9AA8B8] focus:border-[#619CD0] focus:outline-none focus:ring-2 focus:ring-[#619CD0]/25 ${errors.email ? "border-red-300" : ""}`}
                    placeholder="nombre@healthplus.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-[10px] bg-[#2C5FA3] text-sm font-semibold text-white hover:bg-[#244F88] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                Enviar instrucciones
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
