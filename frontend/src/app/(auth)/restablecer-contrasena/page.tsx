"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import api from "@/lib/api";

const schema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string().min(6, "Confirma la contraseña"),
  })
  .refine((d) => d.password === d.confirm, { message: "Las contraseñas no coinciden", path: ["confirm"] });

type FormValues = z.infer<typeof schema>;

function RestablecerForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState("");
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setApiError("");
    try {
      await api.post("/auth/reset-password", { token, newPassword: values.password });
      setDone(true);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "No se pudo restablecer la contraseña.";
      setApiError(msg);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-[#7A8798]">Falta el token en el enlace. Solicita un nuevo correo desde recuperar contraseña.</p>
        <Link href="/olvido-contrasena" className="text-sm font-medium text-[#2C5FA3] hover:underline">
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-[#4B5563]">Contraseña actualizada. Ya puedes iniciar sesión.</p>
        <Link
          href="/login"
          className="inline-flex w-full justify-center rounded-[10px] bg-[#2C5FA3] py-2.5 text-sm font-semibold text-white hover:bg-[#244F88]"
        >
          Ir al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{apiError}</div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[#4B5563]">Nueva contraseña</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA8B8]" />
          <input
            {...register("password")}
            type={show ? "text" : "password"}
            className={`w-full h-11 rounded-[10px] border border-[#D9E2EC] pl-10 pr-10 text-sm focus:border-[#619CD0] focus:outline-none focus:ring-2 focus:ring-[#619CD0]/25 ${errors.password ? "border-red-300" : ""}`}
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA8B8]" onClick={() => setShow(!show)}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[#4B5563]">Confirmar contraseña</label>
        <input
          {...register("confirm")}
          type={show ? "text" : "password"}
          className={`w-full h-11 rounded-[10px] border border-[#D9E2EC] px-3 text-sm focus:border-[#619CD0] focus:outline-none focus:ring-2 focus:ring-[#619CD0]/25 ${errors.confirm ? "border-red-300" : ""}`}
        />
        {errors.confirm && <p className="text-xs text-red-600">{errors.confirm.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 rounded-[10px] bg-[#2C5FA3] text-sm font-semibold text-white hover:bg-[#244F88] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
        Guardar contraseña
      </button>
    </form>
  );
}

export default function RestablecerContrasenaPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#EEF1F6] p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E5EAF1] shadow-sm flex items-center justify-center p-0.5 shrink-0">
            <BrandLogo variant="mark" className="h-8 w-8" />
          </div>
          <span className="text-sm font-semibold text-[#4B5563]">HealthPlus</span>
        </div>
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4E6A8F] hover:text-[#2C5FA3] mb-6">
          <ArrowLeft size={16} /> Volver al login
        </Link>
        <div className="bg-white rounded-2xl border border-[#E5EAF1] shadow-sm px-8 py-10">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#4B5563]">Nueva contraseña</h1>
            <p className="text-sm text-[#7A8798] mt-1">Elige una contraseña segura para tu cuenta.</p>
          </div>
          <Suspense fallback={<div className="flex justify-center py-8 text-[#7A8798] text-sm">Cargando…</div>}>
            <RestablecerForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
