import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { JarvisAvatar } from "@/components/jarvis/JarvisAvatar";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Conta criada. Verifique seu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta, Senhor.");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/dashboard`,
      });
      if (result.error) {
        toast.error("Falha no Google Sign-in");
        setBusy(false);
      }
    } catch {
      toast.error("Erro ao iniciar login Google");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center mb-8">
          <div className="animate-float">
            <JarvisAvatar size={140} />
          </div>
        </Link>

        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-xs font-mono tracking-[0.3em] text-primary mb-2">
              {mode === "signin" ? "AUTENTICAÇÃO" : "REGISTRO"}
            </div>
            <h1 className="font-display text-2xl font-bold">
              {mode === "signin" ? "Acesse o sistema" : "Crie sua conta"}
            </h1>
          </div>

          <button
            onClick={google}
            disabled={busy}
            className="w-full py-3 rounded-xl glass-strong text-sm font-mono tracking-wider hover:border-primary/40 transition-all flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".8"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".6"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".9"/></svg>
            CONTINUAR COM GOOGLE
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-primary/20" />
            <span className="text-xs font-mono text-muted-foreground">OU</span>
            <div className="flex-1 h-px bg-primary/20" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-input/50 border border-primary/20 focus:border-primary outline-none text-sm font-mono transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-input/50 border border-primary/20 focus:border-primary outline-none text-sm font-mono transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-mono text-sm tracking-wider hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                {mode === "signin" ? "ENTRAR" : "CRIAR CONTA"} <ArrowRight className="w-4 h-4" />
              </>}
            </button>
          </form>

          <div className="text-center mt-6 text-xs font-mono text-muted-foreground">
            {mode === "signin" ? "Não tem conta?" : "Já possui conta?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary hover:underline"
            >
              {mode === "signin" ? "Criar agora" : "Fazer login"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;