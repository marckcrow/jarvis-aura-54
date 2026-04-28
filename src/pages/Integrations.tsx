import { motion } from "framer-motion";
import { MessageCircle, Mail, Calendar, Music, Mic2, Webhook, Database, Brain } from "lucide-react";

const integrations = [
  { name: "WhatsApp Cloud", desc: "Mensagens automáticas via WhatsApp", icon: MessageCircle, connected: false },
  { name: "Gmail", desc: "Leitura e resposta inteligente de emails", icon: Mail, connected: true },
  { name: "Google Calendar", desc: "Sincronização de agenda", icon: Calendar, connected: true },
  { name: "Spotify", desc: "Controle de música por comando", icon: Music, connected: false },
  { name: "Alexa Skills", desc: "Integração com Echo", icon: Mic2, connected: false },
  { name: "n8n Webhooks", desc: "Automação de workflows", icon: Webhook, connected: true },
  { name: "Supabase", desc: "Banco de dados e auth", icon: Database, connected: true },
  { name: "OpenAI", desc: "Modelos avançados de IA", icon: Brain, connected: true },
];

const Integrations = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">INTEGRAÇÕES</span>
        </div>
        <h1 className="font-display text-4xl font-bold">Conectores & APIs</h1>
        <p className="text-muted-foreground mt-1">Centralize todos os seus sistemas em um só lugar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.div
              key={it.name}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-xl p-5 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${it.connected ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-mono tracking-wider ${it.connected ? "text-primary" : "text-muted-foreground"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${it.connected ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                  {it.connected ? "ATIVO" : "OFFLINE"}
                </div>
              </div>
              <h3 className="font-display font-bold mb-1">{it.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{it.desc}</p>
              <button className={`w-full py-2 rounded-lg text-xs font-mono tracking-wider transition-all ${
                it.connected
                  ? "bg-secondary text-foreground hover:bg-secondary/70"
                  : "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
              }`}>
                {it.connected ? "GERENCIAR" : "CONECTAR"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Integrations;