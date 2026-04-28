import { motion } from "framer-motion";
import { Users, Activity, Server, AlertTriangle } from "lucide-react";

const metrics = [
  { label: "Usuários ativos", value: "1,247", icon: Users },
  { label: "Requisições/min", value: "342", icon: Activity },
  { label: "Uptime", value: "99.98%", icon: Server },
  { label: "Alertas", value: "2", icon: AlertTriangle },
];

const Admin = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">ADMIN</span>
        </div>
        <h1 className="font-display text-4xl font-bold">Painel Administrativo</h1>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5">
              <Icon className="w-5 h-5 text-primary mb-3" />
              <div className="font-display text-3xl font-bold">{m.value}</div>
              <div className="text-xs font-mono text-muted-foreground tracking-wider uppercase mt-1">{m.label}</div>
            </motion.div>
          );
        })}
      </div>
      <div className="glass rounded-xl p-6">
        <h2 className="font-display font-bold mb-4">Logs do Sistema</h2>
        <div className="space-y-2 font-mono text-xs">
          {[
            { t: "10:42:18", level: "INFO", msg: "User session started: usr_8f2a" },
            { t: "10:41:55", level: "INFO", msg: "AI request processed in 423ms" },
            { t: "10:40:12", level: "WARN", msg: "Rate limit approaching for tenant_42" },
            { t: "10:39:01", level: "INFO", msg: "Edge function jarvis-chat deployed" },
          ].map((l, i) => (
            <div key={i} className="flex gap-3 text-muted-foreground hover:bg-secondary/30 px-2 py-1 rounded">
              <span>{l.t}</span>
              <span className={l.level === "WARN" ? "text-accent" : "text-primary"}>[{l.level}]</span>
              <span className="text-foreground/80">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;