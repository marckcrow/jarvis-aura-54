import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Brain, Plus, Trash2, Power } from "lucide-react";

const schema = z.object({
  memory_type: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(2000),
});

type Mem = {
  id: string;
  memory_type: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
};

const Memory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Mem[]>([]);
  const [memory_type, setType] = useState("preference");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("jarvis_memory").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems((data as Mem[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ memory_type, title, content });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    setBusy(true);
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("user_id", user.id).maybeSingle();
    if (!profile) { toast.error("Profile não encontrado"); setBusy(false); return; }
    const { error } = await supabase.from("jarvis_memory").insert({
      ...parsed.data, user_id: user.id, tenant_id: profile.tenant_id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Memória salva"); setTitle(""); setContent(""); load(); }
    setBusy(false);
  };

  const toggle = async (m: Mem) => {
    await supabase.from("jarvis_memory").update({ is_active: !m.is_active }).eq("id", m.id);
    load();
  };
  const del = async (id: string) => {
    await supabase.from("jarvis_memory").delete().eq("id", id);
    load();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">MEMÓRIA CONTEXTUAL</span>
        </div>
        <h1 className="font-display text-4xl font-bold flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" /> O que JARVIS sabe sobre você
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Preferências, rotina, metas e fatos usados em todas as respostas.</p>
      </div>

      <form onSubmit={add} className="glass rounded-xl p-5 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={memory_type} onChange={(e) => setType(e.target.value)} className="px-3 py-2.5 rounded-lg bg-input/50 border border-primary/20 text-sm font-mono">
            <option value="preference">Preferência</option>
            <option value="goal">Meta</option>
            <option value="routine">Rotina</option>
            <option value="project">Projeto</option>
            <option value="fact">Fato</option>
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" required maxLength={120} className="md:col-span-2 px-3 py-2.5 rounded-lg bg-input/50 border border-primary/20 text-sm" />
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Conteúdo da memória" required rows={3} maxLength={2000} className="w-full px-3 py-2.5 rounded-lg bg-input/50 border border-primary/20 text-sm" />
        <button disabled={busy} className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-mono text-xs tracking-wider flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> SALVAR MEMÓRIA
        </button>
      </form>

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="glass rounded-xl p-12 text-center text-muted-foreground text-sm font-mono">
            Nenhuma memória ainda. Adicione uma acima — ou peça ao JARVIS para salvar.
          </div>
        )}
        {items.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`glass rounded-xl p-4 flex items-start gap-4 ${!m.is_active ? "opacity-50" : ""}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-primary tracking-widest uppercase">{m.memory_type}</span>
                <span className="font-display font-bold text-sm">{m.title}</span>
              </div>
              <div className="text-sm text-foreground/80">{m.content}</div>
            </div>
            <button onClick={() => toggle(m)} className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"><Power className="w-4 h-4" /></button>
            <button onClick={() => del(m.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Memory;