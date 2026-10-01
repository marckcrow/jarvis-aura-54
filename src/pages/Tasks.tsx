import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Flag, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Task = { id: string; title: string; priority: string; due_at: string | null; done: boolean; source_action_id: string | null };

const colorByPriority: Record<string, string> = {
  alta: "text-destructive",
  media: "text-accent",
  baixa: "text-muted-foreground",
};
const labelPriority: Record<string, string> = { alta: "alta", media: "média", baixa: "baixa" };

const db = supabase as any;

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("media");
  const [due, setDue] = useState("");

  const load = async () => {
    const { data, error } = await db.from("tasks").select("*").order("done").order("due_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
    if (error) toast.error("Falha ao carregar tarefas");
    setTasks(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("tasks-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    if (t.length > 200) return toast.error("Título muito longo");
    const { error } = await db.from("tasks").insert({ title: t, priority, due_at: due ? new Date(due).toISOString() : null });
    if (error) return toast.error(error.message);
    setTitle(""); setDue("");
    load();
  };

  const toggle = async (t: Task) => {
    setTasks((ts) => ts.map((x) => x.id === t.id ? { ...x, done: !x.done } : x));
    const { error } = await db.from("tasks").update({ done: !t.done }).eq("id", t.id);
    if (error) { toast.error("Falha ao atualizar"); load(); }
  };

  const remove = async (id: string) => {
    setTasks((ts) => ts.filter((x) => x.id !== id));
    const { error } = await db.from("tasks").delete().eq("id", id);
    if (error) { toast.error("Falha ao excluir"); load(); }
  };

  const fmtDue = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Sem prazo";

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">TAREFAS</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Sua lista de prioridades</h1>
        <p className="text-muted-foreground mt-1">Crie aqui ou peça ao JARVIS: "crie uma tarefa para...".</p>
      </div>

      <form onSubmit={add} className="glass rounded-xl p-3 flex flex-wrap gap-2 mb-6">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova tarefa..."
          className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-input/50 border border-primary/20 focus:border-primary outline-none text-sm" />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 rounded-lg bg-input/50 border border-primary/20 text-sm font-mono">
          <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
        </select>
        <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)}
          className="px-3 py-2 rounded-lg bg-input/50 border border-primary/20 text-sm font-mono" />
        <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-mono flex items-center gap-1">
          <Plus className="w-4 h-4" /> ADICIONAR
        </button>
      </form>

      {loading ? (
        <div className="font-mono text-xs text-primary animate-pulse">CARREGANDO...</div>
      ) : tasks.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">Nenhuma tarefa ainda.</div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className={`glass rounded-xl p-4 flex items-center gap-4 hover:border-primary/40 transition-all group ${t.done ? "opacity-50" : ""}`}>
              <button onClick={() => toggle(t)} aria-label="Concluir">
                {t.done ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${t.done ? "line-through" : "text-foreground"}`}>{t.title}</div>
                <div className="flex items-center gap-3 mt-1 text-xs font-mono text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDue(t.due_at)}</span>
                  <span className={`flex items-center gap-1 ${colorByPriority[t.priority] ?? ""}`}><Flag className="w-3 h-3" />{labelPriority[t.priority] ?? t.priority}</span>
                  {t.source_action_id && <span className="text-primary">via JARVIS</span>}
                </div>
              </div>
              <button onClick={() => remove(t.id)} aria-label="Excluir" className="text-muted-foreground hover:text-destructive opacity-60 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
