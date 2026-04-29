import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Mail, Calendar, Music, Mic2, Webhook, Database, Brain, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ConnState = "loading" | "connected" | "disconnected" | "error" | "coming_soon" | "static";

type Integration = {
  id: string;
  name: string;
  desc: string;
  icon: typeof MessageCircle;
  state: ConnState;
  message?: string;
};

const baseIntegrations: Integration[] = [
  { id: "whatsapp",       name: "WhatsApp Cloud", desc: "Mensagens automáticas via WhatsApp", icon: MessageCircle, state: "coming_soon" },
  { id: "gmail",          name: "Gmail",          desc: "Leitura e resposta inteligente de emails", icon: Mail, state: "coming_soon" },
  { id: "google_calendar",name: "Google Calendar",desc: "Sincronização de agenda", icon: Calendar, state: "loading" },
  { id: "spotify",        name: "Spotify",        desc: "Controle de música por comando", icon: Music, state: "coming_soon" },
  { id: "alexa",          name: "Alexa Skills",   desc: "Integração com Echo", icon: Mic2, state: "coming_soon" },
  { id: "n8n",            name: "n8n Webhooks",   desc: "Automação de workflows", icon: Webhook, state: "coming_soon" },
  { id: "supabase",       name: "Lovable Cloud",  desc: "Banco de dados e auth", icon: Database, state: "connected", message: "Backend nativo ativo" },
  { id: "openai",         name: "Lovable AI",     desc: "Modelos avançados de IA", icon: Brain, state: "connected", message: "Gateway pronto" },
];

const stateLabel = (s: ConnState) => ({
  loading: "VERIFICANDO",
  connected: "ATIVO",
  disconnected: "DESCONECTADO",
  error: "ERRO",
  coming_soon: "EM BREVE",
  static: "OFFLINE",
}[s]);

const Integrations = () => {
  const [items, setItems] = useState<Integration[]>(baseIntegrations);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatuses = async () => {
    setRefreshing(true);
    setItems((prev) => prev.map((i) => i.id === "google_calendar" ? { ...i, state: "loading", message: undefined } : i));

    const { data, error } = await supabase.functions.invoke("calendar-status");
    setItems((prev) => prev.map((i) => {
      if (i.id !== "google_calendar") return i;
      if (error) return { ...i, state: "error", message: error.message };
      const d = data as { connected?: boolean; message?: string; error?: string; reason?: string };
      if (d?.connected) return { ...i, state: "connected", message: "Conta vinculada e pronta para criar eventos." };
      return { ...i, state: "disconnected", message: d?.message || d?.error || d?.reason || "Não conectado" };
    }));
    setRefreshing(false);
  };

  useEffect(() => { loadStatuses(); }, []);

  const handleAction = (it: Integration) => {
    if (it.id === "google_calendar") {
      if (it.state === "connected") {
        toast.success("Google Calendar já está vinculado ao projeto.");
      } else {
        toast.info("Configure o conector em Lovable Cloud → Connectors → Google Calendar.");
      }
      return;
    }
    if (it.state === "coming_soon") {
      toast.info(`${it.name}: integração em breve.`);
      return;
    }
    toast.success(`${it.name} já disponível.`);
  };

  const dotClass = (s: ConnState) =>
    s === "connected" ? "bg-primary animate-pulse"
    : s === "loading" ? "bg-muted-foreground animate-pulse"
    : s === "disconnected" ? "bg-amber-400"
    : s === "error" ? "bg-destructive"
    : "bg-muted-foreground";

  const textClass = (s: ConnState) =>
    s === "connected" ? "text-primary"
    : s === "disconnected" ? "text-amber-400"
    : s === "error" ? "text-destructive"
    : "text-muted-foreground";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-8 bg-primary" />
              <span className="text-xs font-mono tracking-[0.3em] text-primary">INTEGRAÇÕES</span>
            </div>
            <h1 className="font-display text-4xl font-bold">Conectores & APIs</h1>
            <p className="text-muted-foreground mt-1">Status em tempo real dos sistemas conectados ao JARVIS.</p>
          </div>
          <button
            onClick={loadStatuses}
            disabled={refreshing}
            className="glass rounded-lg px-3 py-2 text-xs font-mono tracking-wider text-foreground hover:text-primary transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            ATUALIZAR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it, i) => {
          const Icon = it.icon;
          const isConnected = it.state === "connected";
          const isLoading = it.state === "loading";
          return (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-xl p-5 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConnected ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-mono tracking-wider ${textClass(it.state)}`}>
                  {isLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <span className={`w-1.5 h-1.5 rounded-full ${dotClass(it.state)}`} />}
                  {stateLabel(it.state)}
                </div>
              </div>
              <h3 className="font-display font-bold mb-1">{it.name}</h3>
              <p className="text-xs text-muted-foreground mb-1">{it.desc}</p>
              <p className="text-[10px] font-mono text-muted-foreground/80 mb-4 min-h-[14px] truncate" title={it.message}>
                {it.message || "—"}
              </p>
              <button
                onClick={() => handleAction(it)}
                disabled={isLoading}
                className={`w-full py-2 rounded-lg text-xs font-mono tracking-wider transition-all disabled:opacity-50 ${
                isConnected
                  ? "bg-secondary text-foreground hover:bg-secondary/70"
                  : it.state === "coming_soon"
                  ? "bg-secondary/50 text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
              }`}>
                {isLoading ? "VERIFICANDO..."
                  : isConnected ? "GERENCIAR"
                  : it.state === "coming_soon" ? "EM BREVE"
                  : it.state === "disconnected" ? "CONECTAR"
                  : it.state === "error" ? "TENTAR NOVAMENTE"
                  : "CONECTAR"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Integrations;