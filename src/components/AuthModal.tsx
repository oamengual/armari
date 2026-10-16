"use client";

import React, { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { X, Lock, Mail, User, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setError(
        "Supabase aún no está configurado en .env.local. Puedes seguir usando el Modo Editorial Local o añadir tus claves."
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email.split("@")[0] },
          },
        });
        if (signUpErr) throw signUpErr;
        setMessage(
          "¡Cuenta creada! Si tienes activada la confirmación por email en Supabase, revisa tu bandeja; si no, ya estás conectado."
        );
        onAuthSuccess();
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
        onAuthSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de autenticación";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-editorial-bg w-full max-w-md rounded-3xl border border-editorial-border shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-editorial-border flex items-center justify-between bg-editorial-canvas">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-editorial-muted block">
              Acceso Personal · Supabase Auth
            </span>
            <h2 className="font-serif text-2xl text-editorial-ink">
              {mode === "login" ? "Entrar a mi Armario" : "Crear cuenta en ARMARI"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-editorial-sand text-editorial-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!configured && (
            <div className="p-4 rounded-2xl bg-editorial-sand/80 border border-editorial-border text-xs text-editorial-ink space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-editorial-gold" />
                Modo Demo Persistente Activo
              </div>
              <p className="text-editorial-muted leading-relaxed">
                Tus prendas, outfits y planificación se guardan automáticamente en este dispositivo. Cuando pegues tus claves `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, podrás sincronizar tu cuenta en la nube.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-editorial-terracotta/10 border border-editorial-terracotta/30 text-xs text-editorial-terracotta flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3.5 rounded-xl bg-editorial-sage/10 border border-editorial-sage/30 text-xs text-editorial-sage flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                  Tu Nombre
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-editorial-muted absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-editorial-border text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-editorial-muted absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-editorial-border text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-editorial-muted mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-editorial-muted absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-editorial-border text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !configured}
              className="w-full py-3 rounded-full bg-editorial-ink text-white text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-40"
            >
              {loading
                ? "Conectando..."
                : mode === "login"
                ? "Iniciar Sesión"
                : "Registrarme"}
            </button>
          </form>

          {configured && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 rounded-full bg-white border border-editorial-border text-xs uppercase tracking-wider text-editorial-ink hover:bg-editorial-sand transition-all"
            >
              Continuar con Google
            </button>
          )}

          <div className="text-center pt-2 border-t border-editorial-border">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-xs text-editorial-muted hover:text-editorial-ink underline"
            >
              {mode === "login"
                ? "¿No tienes cuenta? Regístrate gratis"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
