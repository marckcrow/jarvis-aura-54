import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageSquare, FolderKanban, ListChecks, Plug, Settings, Shield, Activity, Terminal, Brain, LogOut, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "Assistente", icon: MessageSquare },
  { to: "/command-center", label: "Comandos", icon: Terminal },
  { to: "/memory", label: "Memória", icon: Brain },
  { to: "/projects", label: "Projetos", icon: FolderKanban },
  { to: "/tasks", label: "Tarefas", icon: ListChecks },
  { to: "/integrations", label: "Integrações", icon: Plug },
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/admin", label: "Admin", icon: Shield },
];

export const AppShell = () => {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <div className="relative min-h-screen w-full flex">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-strong border-b border-primary/10 flex items-center justify-between px-4 h-14">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-primary-foreground bg-gradient-to-br from-primary to-accent">J</div>
          <span className="font-display font-bold tracking-wider">JARVIS</span>
        </NavLink>
        <button onClick={() => setMobileOpen((v) => !v)} className="p-2 text-primary" aria-label="menu">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 pt-14 bg-background/95 backdrop-blur-sm">
          <nav className="p-4 space-y-1 overflow-auto h-full pb-24">
            {navItems.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono ${active ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
                  <Icon className="w-4 h-4" /> {item.label}
                </NavLink>
              );
            })}
            <button onClick={signOut} className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono text-destructive">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </nav>
        </div>
      )}

      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex relative z-10 w-64 shrink-0 border-r border-primary/10 glass-strong flex-col">
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
              <div className="text-[10px] text-muted-foreground truncate">{user?.email ?? "—"}</div>
            </div>
            <button onClick={signOut} title="Sair" className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 relative z-10 overflow-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
};