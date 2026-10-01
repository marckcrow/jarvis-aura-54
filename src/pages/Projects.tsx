import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderKanban, TrendingUp, Plus, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Project = { id: string; name: string; description: string | null; goals: string | null; status: string; progress: number; deadline: string | null; source_action_id: string | null };

const statusLabel: Record<string, string> = { active: "Em progresso", paused: "Pausado", done: "Concluído" };
const db = supabase as any;

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");

  const load = async () => {
    const { data, error } = await db.from("projects").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Falha ao carregar projetos");
    setProjects(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("projects-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (n.length > 120) return toast.error("Nome muito longo");
    const { error } = await db.from("projects").insert({ name: n, deadline: deadline || null });
    if (error) return toast.error(error.message);
    setName(""); setDeadline("");
    load();
  };

  const update = async (id: string, patch: Partial<Project>) => {
    setProjects((ps) => ps.map((p) => p.id === id ? { ...p, ...patch } : p));
    const { error } = await db.from("projects").update(patch).eq("id", id);
    if (error) { toast.error("Falha ao atualizar"); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este projeto?")) return;
    setProjects((ps) => ps.filter((p) => p.id !== id));
    const { error } = await db.from("projects").delete().eq("id", id);
    if (error) { toast.error("Falha ao excluir"); load(); }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">PROJETOS</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Iniciativas Estratégicas</h1>
        <p className="text-muted-foreground mt-1">Crie aqui ou peça ao JARVIS: "transforme essa ideia em um projeto".</p>
      </div>

      <form onSubmit={add} className="glass rounded-xl p-3 flex flex-wrap gap-2 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do projeto..."
          className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-input/50 border border-primary/20 focus:border-primary outline-none text-sm" />
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
          className="px-3 py-2 rounded-lg bg-input/50 border border-primary/20 text-sm font-mono" />
        <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-mono flex items-center gap-1">
          <Plus className="w-4 h-4" /> CRIAR
        </button>
      </form>

      {loading ? (
        <div className="font-mono text-xs text-primary animate-pulse">CARREGANDO...</div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">Nenhum projeto ainda.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-6 hover:border-primary/40 transition-all group">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="min-w-0">
                  <FolderKanban className="w-5 h-5 text-primary mb-3" />
                  <h3 className="font-display font-bold text-lg break-words">{p.name}</h3>
                  <select value={p.status} onChange={(e) => update(p.id, { status: e.target.value })}
                    className="mt-1 bg-transparent text-xs font-mono text-muted-foreground tracking-wider outline-none">
                    {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-display text-2xl font-bold text-gradient">{p.progress}%</span>
                  <button onClick={() => remove(p.id)} aria-label="Excluir" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {p.description && <p className="text-sm text-muted-foreground mb-2">{p.description}</p>}
              {p.goals && (
                <div className="text-xs text-muted-foreground mb-3 whitespace-pre-line flex gap-2">
                  <ListChecks className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />{p.goals}
                </div>
              )}

              <input type="range" min={0} max={100} step={5} value={p.progress}
                onChange={(e) => setProjects((ps) => ps.map((x) => x.id === p.id ? { ...x, progress: +e.target.value } : x))}
                onMouseUp={(e) => update(p.id, { progress: +(e.target as HTMLInputElement).value })}
                onTouchEnd={(e) => update(p.id, { progress: +(e.target as HTMLInputElement).value })}
                className="w-full accent-primary mb-3" aria-label="Progresso" />

              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>{p.source_action_id ? <span className="text-primary">via JARVIS</span> : "manual"}</span>
                <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />
                  {p.deadline ? new Date(p.deadline + "T00:00").toLocaleDateString("pt-BR") : "Sem prazo"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
