import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Flag } from "lucide-react";

const tasks = [
  { title: "Revisar pitch deck para investidores", priority: "alta", done: false, due: "Hoje, 16h" },
  { title: "Responder email da Microsoft", priority: "alta", done: false, due: "Hoje" },
  { title: "Reunião 1:1 com equipe de produto", priority: "média", done: true, due: "Concluída" },
  { title: "Publicar artigo no LinkedIn", priority: "baixa", done: false, due: "Amanhã" },
  { title: "Renovar contrato AWS", priority: "média", done: false, due: "Sex" },
  { title: "Treino com personal", priority: "baixa", done: true, due: "Concluída" },
];

const colorByPriority: Record<string, string> = {
  alta: "text-destructive",
  média: "text-accent",
  baixa: "text-muted-foreground",
};

const Tasks = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">TAREFAS</span>
        </div>
        <h1 className="font-display text-4xl font-bold">Sua lista de prioridades</h1>
        <p className="text-muted-foreground mt-1">JARVIS organizou suas tarefas por urgência e impacto.</p>
      </div>

      <div className="space-y-2">
        {tasks.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass rounded-xl p-4 flex items-center gap-4 hover:border-primary/40 transition-all group cursor-pointer ${t.done ? "opacity-50" : ""}`}
          >
            {t.done ? (
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${t.done ? "line-through" : "text-foreground"}`}>{t.title}</div>
              <div className="flex items-center gap-3 mt-1 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.due}</span>
                <span className={`flex items-center gap-1 ${colorByPriority[t.priority]}`}>
                  <Flag className="w-3 h-3" />{t.priority}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;