import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && user && isAdmin) navigate("/admin", { replace: true });
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (supabase as any).rpc("admin_exists").then(({ data }: any) => setAdminExists(!!data));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/admin/login` },
        });
        if (error) throw error;
        toast.success("Conta criada. Confirme pelo email e depois entre aqui.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data as { email: string; password: string });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    setBusy(true);
    const { data, error } = await (supabase as any).rpc("claim_first_admin");
    setBusy(false);
    if (error || !data) return toast.error("Já existe um administrador.");
    toast.success("Você agora é o administrador.");
    window.location.assign("/admin");
  };

  const input = "w-full pl-10 pr-4 py-3 rounded-xl bg-input/50 border border-primary/20 focus:border-primary outline-none text-sm font-mono";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <ShieldCheck className="w-10 h-10 mx-auto text-primary mb-2" />
          <div className="text-xs font-mono tracking-[0.3em] text-primary mb-1">ACESSO RESTRITO</div>
          <h1 className="font-display text-2xl font-bold">Painel Administrativo</h1>
        </div>

        {user && !loading && !isAdmin ? (
          <div className="space-y-4 text-center text-sm">
            <p className="text-muted-foreground font-mono">
              Conectado como {user.email}, sem permissão de administrador.
            </p>
            {adminExists === false && (
              <button onClick={claim} disabled={busy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-mono text-sm tracking-wider disabled:opacity-50">
                TORNAR-ME O PRIMEIRO ADMIN
              </button>
            )}
            <button onClick={signOut} className="w-full py-3 rounded-xl glass-strong font-mono text-xs tracking-wider">
              SAIR E USAR OUTRA CONTA
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@email.com" required className={input} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className={input} />
            </div>
            <button type="submit" disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-mono text-sm tracking-wider disabled:opacity-50 flex justify-center">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "signin" ? "ENTRAR COMO ADMIN" : "CADASTRAR"}
            </button>
            <div className="text-center text-xs font-mono text-muted-foreground pt-2">
              {mode === "signin" ? "Sem conta?" : "Já tem conta?"}{" "}
              <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary hover:underline">
                {mode === "signin" ? "Cadastrar" : "Entrar"}
              </button>
            </div>
          </form>
        )}
        <Link to="/" className="block text-center mt-6 text-xs font-mono text-muted-foreground hover:text-primary">← Voltar</Link>
      </div>
    </div>
  );
};

export default AdminLogin;
