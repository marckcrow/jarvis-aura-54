import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Brain, Zap, Shield } from "lucide-react";
import { JarvisAvatar } from "@/components/jarvis/JarvisAvatar";

const features = [
  { icon: Brain, title: "IA Estratégica", desc: "Assessor pessoal que pensa, decide e executa por você." },
  { icon: MessageSquare, title: "WhatsApp Nativo", desc: "Comande tudo direto do seu WhatsApp pessoal." },
  { icon: Zap, title: "Automação Real", desc: "Conecte e centralize todos os seus SaaS em um só lugar." },
  { icon: Shield, title: "Multi-Tenant Seguro", desc: "Arquitetura empresarial com RLS e isolamento total." },
];

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)]">J</div>
            <span className="font-display font-bold tracking-wider">JARVIS</span>
          </div>
          <Link to="/dashboard" className="px-5 py-2 rounded-lg glass text-sm font-mono tracking-wider hover:border-primary/40 transition-all">
            ACESSAR →
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-primary" />
              <span className="text-xs font-mono tracking-[0.3em] text-primary">ASSISTENTE INTELIGENTE PESSOAL</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6">
              Seu próprio
              <br />
              <span className="text-gradient">JARVIS</span>
              <span className="text-primary">.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Um assessor de IA que gerencia sua agenda, emails, projetos e SaaS conectados.
              Comande por voz, texto ou WhatsApp. <span className="text-foreground">Decisões reais, executadas em tempo real.</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-mono text-sm tracking-wider hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] transition-all"
              >
                CONVERSAR AGORA <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl glass text-sm font-mono tracking-wider hover:border-primary/40 transition-all"
              >
                VER DASHBOARD
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="animate-float">
              <JarvisAvatar size={340} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-xl p-6 hover:border-primary/40 transition-all group"
              >
                <Icon className="w-6 h-6 text-primary mb-4 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all" />
                <h3 className="font-display font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 border-t border-primary/10 py-6 text-center text-xs font-mono text-muted-foreground tracking-widest">
        JARVIS AI · POWERED BY LOVABLE CLOUD
      </footer>
    </div>
  );
};

export default Index;
