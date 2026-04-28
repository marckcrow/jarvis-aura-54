import { motion } from "framer-motion";
import { FolderKanban, Users, TrendingUp } from "lucide-react";

const projects = [
  { name: "JARVIS Launch", progress: 78, status: "Em progresso", team: 4, deadline: "30 dias" },
  { name: "App Mobile v2", progress: 45, status: "Em progresso", team: 3, deadline: "60 dias" },
  { name: "Estratégia Q2", progress: 92, status: "Final", team: 2, deadline: "5 dias" },
  { name: "Onboarding Redesign", progress: 30, status: "Início", team: 5, deadline: "90 dias" },
];

const Projects = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">PROJETOS</span>
        </div>
        <h1 className="font-display text-4xl font-bold">Iniciativas Estratégicas</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-xl p-6 hover:border-primary/40 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <FolderKanban className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-display font-bold text-lg">{p.name}</h3>
                <span className="text-xs font-mono text-muted-foreground tracking-wider">{p.status.toUpperCase()}</span>
              </div>
              <span className="font-display text-2xl font-bold text-gradient">{p.progress}%</span>
            </div>

            <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${p.progress}%` }}
                transition={{ duration: 1, delay: i * 0.07 }}
                className="h-full bg-gradient-to-r from-primary to-accent"
                style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.6)" }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{p.team} membros</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />{p.deadline}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Projects;