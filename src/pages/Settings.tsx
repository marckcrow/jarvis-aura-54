import { User, Bell, Mic, Palette, Shield } from "lucide-react";

const sections = [
  { icon: User, title: "Perfil", desc: "Nome, email, foto e informações pessoais" },
  { icon: Bell, title: "Notificações", desc: "Configure alertas e canais de comunicação" },
  { icon: Mic, title: "Voz & Áudio", desc: "Modo de voz, idioma e velocidade da fala" },
  { icon: Palette, title: "Aparência", desc: "Tema, cores neon e densidade da interface" },
  { icon: Shield, title: "Segurança", desc: "Senha, 2FA e sessões ativas" },
];

const Settings = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">CONFIGURAÇÕES</span>
        </div>
        <h1 className="font-display text-4xl font-bold">Personalize sua experiência</h1>
      </div>
      <div className="space-y-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.title} className="w-full glass rounded-xl p-5 flex items-center gap-4 hover:border-primary/40 transition-all text-left group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)] transition-all">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-display font-bold">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
              <span className="text-primary text-sm font-mono">→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;