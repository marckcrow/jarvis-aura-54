import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/jarvis/StatusBadge";
import { Terminal, ChevronRight, Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { CalendarConnectionBadge } from "@/components/jarvis/CalendarConnectionBadge";
import { executeInternalAction, isInternalAction } from "@/lib/internalActions";

type Cmd = {
  id: string;
  input_text: string;
  detected_intent: string | null;
  status: string;
  response_text: string | null;
  created_at: string;
};

type Action = {
  id: string;
  command_id: string;
  action_type: string;
  target_system: string | null;
  status: string;
  requires_confirmation: boolean;
  payload: Record<string, unknown>;
  error_message: string | null;
  result: Record<string, unknown> | null;
};

const CommandCenter = () => {
  const { user } = useAuth();
  const [commands, setCommands] = useState<Cmd[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: c }, { data: a }] = await Promise.all([
        supabase.from("jarvis_commands").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        supabase.from("jarvis_actions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
      ]);
      setCommands((c as Cmd[]) ?? []);
      setActions((a as Action[]) ?? []);
    };
    load();

    const channel = supabase
      .channel("cmd-center")
      .on("postgres_changes", { event: "*", schema: "public", table: "jarvis_commands", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "jarvis_actions", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filtered = commands.filter((c) => filter === "all" ? true : c.status === filter);

  const confirmAction = async (action: Action, approve: boolean) => {
    if (!approve) {
      const { error } = await supabase.from("jarvis_actions").update({
        status: "cancelled",
      }).eq("id", action.id);
      if (error) toast.error("Falha ao cancelar ação");
      else toast.success("Ação cancelada");
      return;
    }

    // Real execution path — currently only Google Calendar is wired up.
    if (action.action_type === "create_calendar_event") {
      // Mark as processing for UX feedback
      await supabase.from("jarvis_actions").update({ status: "processing" }).eq("id", action.id);
      toast.loading("Criando evento no Google Calendar...", { id: action.id });
      const { data, error } = await supabase.functions.invoke("execute-calendar-event", {
        body: { action_id: action.id },
      });
      toast.dismiss(action.id);
      if (error || (data && (data as { error?: string }).error)) {
        const msg = (data as { error?: string })?.error || error?.message || "Falha ao criar evento";
        toast.error(msg);
        return;
      }
      const link = (data as { html_link?: string })?.html_link;
      toast.success(link ? "Evento criado no Google Calendar" : "Evento criado");
      return;
    }

    if (isInternalAction(action.action_type)) {
      const r = await executeInternalAction(action);
      if (r.ok) toast.success(action.action_type === "create_task" ? "Tarefa criada" : "Projeto criado");
      else toast.error(r.error);
      return;
    }

    // Fallback: other action types still simulated until integrações forem ligadas
    const { error } = await supabase.from("jarvis_actions").update({
      status: "executed",
      executed_at: new Date().toISOString(),
      result: { simulated: true, note: "Execução simulada — integração externa pendente" },
    }).eq("id", action.id);
    if (error) toast.error("Falha ao atualizar ação");
    else toast.success("Ação aprovada (simulada)");
  };

  const selectedCmd = commands.find((c) => c.id === selected);
  const selectedActions = actions.filter((a) => a.command_id === selected);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">CENTRAL DE COMANDOS</span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold flex items-center gap-3">
              <Terminal className="w-8 h-8 text-primary" /> Command Center
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Histórico, status e aprovação de comandos enviados ao JARVIS.</p>
          </div>
          <CalendarConnectionBadge />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "completed", "processing", "error"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all ${
              filter === f ? "bg-primary/20 text-primary border border-primary/40" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm font-mono">
              Nenhum comando ainda. Vá ao <a href="/assistant" className="text-primary underline">Assistente</a> para enviar o primeiro.
            </div>
          )}
          <div className="divide-y divide-primary/10">
            {filtered.map((c, i) => {
              const cmdActions = actions.filter((a) => a.command_id === c.id);
              const pending = cmdActions.filter((a) => a.status === "awaiting_confirmation").length;
              return (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelected(c.id)}
                  className={`w-full text-left p-4 hover:bg-primary/5 transition-colors flex items-start gap-3 ${selected === c.id ? "bg-primary/10" : ""}`}
                >
                  <ChevronRight className={`w-4 h-4 mt-1 text-primary transition-transform ${selected === c.id ? "rotate-90" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">{c.input_text}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={c.status} />
                      {c.detected_intent && (
                        <span className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">{c.detected_intent}</span>
                      )}
                      {pending > 0 && (
                        <span className="text-[10px] font-mono text-accent tracking-wider">{pending} aguardando</span>
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                        {new Date(c.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="glass rounded-xl p-5 h-fit sticky top-4">
          {selectedCmd ? (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">COMANDO</div>
                <div className="text-sm">{selectedCmd.input_text}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">RESPOSTA JARVIS</div>
                <div className="text-sm text-foreground/80 whitespace-pre-wrap">{selectedCmd.response_text || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">AÇÕES ({selectedActions.length})</div>
                <div className="space-y-2">
                  {selectedActions.length === 0 && <div className="text-xs text-muted-foreground">Nenhuma ação gerada.</div>}
                  {selectedActions.map((a) => (
                    <div key={a.id} className="glass-strong rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-primary">{a.action_type}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      {a.target_system && <div className="text-[10px] font-mono text-muted-foreground">→ {a.target_system}</div>}
                      {a.target_system === "google_calendar" && (
                        <CalendarConnectionBadge compact />
                      )}
                      <pre className="text-[10px] font-mono text-muted-foreground bg-background/50 p-2 rounded overflow-x-auto max-h-32">
{JSON.stringify(a.payload, null, 2)}
                      </pre>
                      {(a.status === "awaiting_confirmation" || (a.status === "ready" && isInternalAction(a.action_type))) && (
                        <div className="flex gap-2">
                          <button onClick={() => confirmAction(a, true)} className="flex-1 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-mono tracking-wider hover:shadow-[0_0_12px_hsl(var(--primary)/0.5)] flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" /> APROVAR
                          </button>
                          <button onClick={() => confirmAction(a, false)} className="flex-1 py-1.5 rounded-md bg-secondary text-foreground text-xs font-mono tracking-wider hover:bg-destructive/20 hover:text-destructive flex items-center justify-center gap-1">
                            <X className="w-3 h-3" /> CANCELAR
                          </button>
                        </div>
                      )}
                      {a.status === "executed" && a.result && typeof (a.result as { html_link?: string }).html_link === "string" && (
                        <a
                          href={(a.result as { html_link: string }).html_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-mono text-primary hover:text-primary/80 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Abrir no Google Calendar
                        </a>
                      )}
                      {a.error_message && <div className="text-xs text-destructive">{a.error_message}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-12 font-mono">Selecione um comando para ver detalhes.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;