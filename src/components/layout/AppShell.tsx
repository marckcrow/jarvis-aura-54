import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageSquare, FolderKanban, ListChecks, Plug, Settings, Shield, Activity } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "Assistente", icon: MessageSquare },
  { to: "/projects", label: "Projetos", icon: FolderKanban },
  { to: "/tasks", label: "Tarefas", icon: ListChecks },
  { to: "/integrations", label: "Integrações", icon: Plug },
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/admin", label: "Admin", icon: Shield },
];

export const AppShell = () => {
  const { pathname } = useLocation();

  return (
    <div className="relative min-h-screen w-full flex">
      {/* Sidebar */}
      <aside className="relative z-10 w-64 shrink-0 border-r border-primary/10 glass-strong flex flex-col">
        <div className="p-6 border-b border-primary/10">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-xl text-primary-foreground bg-gradient-to-br from-primary to-accent shadow-[0_0_20px_hsl(168_100%_50%/0.5)]">
              J
              <div className="absolute inset-0 rounded-lg border border-primary/50 animate-pulse-ring" />
            </div>
            <div>
              <div className="font-display font-bold tracking-wider text-foreground">JARVIS</div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-widest">AI ASSISTANT</div>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.to || (pathname === "/" && item.to === "/dashboard");
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group ${
                  active
                    ? "text-primary bg-primary/10 shadow-[inset_2px_0_0_hsl(var(--primary))]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "drop-shadow-[0_0_6px_hsl(var(--primary))]" : ""}`} />
                <span className="font-mono tracking-wide">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary/10">
          <div className="glass rounded-lg p-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <div className="flex-1">
              <div className="text-xs font-mono text-foreground">Sistema Online</div>
              <div className="text-[10px] text-muted-foreground">Latência: 12ms</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 relative z-10 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};