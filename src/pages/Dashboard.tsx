import { motion } from "framer-motion";
import { JarvisAvatar } from "@/components/jarvis/JarvisAvatar";
import { Activity, Brain, MessageSquare, Zap, TrendingUp, Calendar, Mail, CheckCircle2, Volume2, VolumeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useJarvisGreeting } from "@/hooks/useJarvisGreeting";
import { useVoiceMode } from "@/hooks/useVoiceMode";
import { useVoicePreference } from "@/hooks/useVoicePreference";
import { useState } from "react";

const stats = [
  { label: "Conversas", value: "247", change: "+12%", icon: MessageSquare },
  { label: "Tarefas Ativas", value: "18", change: "+3", icon: CheckCircle2 },
  { label: "Integrações", value: "6", change: "online", icon: Zap },
  { label: "Eficiência", value: "94%", change: "+2.4%", icon: TrendingUp },
];

const activity = [
  { time: "10:42", text: "Email importante de Sarah classificado como prioridade alta.", icon: Mail },
  { time: "10:18", text: "Reunião com investidores agendada para amanhã às 15h.", icon: Calendar },
  { time: "09:55", text: "3 tarefas concluídas no projeto JARVIS Launch.", icon: CheckCircle2 },
  { time: "09:30", text: "Resumo diário gerado e enviado por WhatsApp.", icon: Brain },
];

const Dashboard = () => {
  const [voiceOn, setVoiceOn] = useVoiceMode();
  const [muteText, setMuteText] = useState(false);
  const [voiceGender, setVoiceGender] = useVoicePreference();
  useJarvisGreeting(voiceOn, muteText, voiceGender);
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">SISTEMA ATIVO</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold mb-1">
              Bem-vindo de volta, <span className="text-gradient">Senhor</span>
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-primary/20 overflow-hidden text-[10px] font-mono">
              <button
                onClick={() => setVoiceGender("male")}
                className={`px-2.5 py-2 transition-all ${voiceGender === "male" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                title="Voz masculina"
              >
                ♂ MASC
              </button>
              <button
                onClick={() => setVoiceGender("female")}
                className={`px-2.5 py-2 transition-all border-l border-primary/20 ${voiceGender === "female" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                title="Voz feminina"
              >
                ♀ FEM
              </button>
            </div>
            <button
              onClick={() => setMuteText((v) => !v)}
              title={muteText ? "Texto silenciado" : "Silenciar texto ao falar"}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono border transition-all ${
                muteText ? "border-primary bg-primary/10 text-primary" : "border-primary/20 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {muteText ? <VolumeOff className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{muteText ? "TEXTO OFF" : "SILENCIAR TEXTO"}</span>
            </button>
            <button
              onClick={() => setVoiceOn((v) => !v)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                voiceOn ? "bg-primary" : "bg-muted border border-primary/20"
              }`}
              title={voiceOn ? "Desligar voz" : "Ligar voz"}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-primary-foreground shadow transition-transform duration-300 ${
                  voiceOn ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
              VOZ {voiceOn ? "ON" : "OFF"}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* Avatar central */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-5 glass rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-glow)" }} />
          <div className="relative">
            <JarvisAvatar state="idle" size={220} />
          </div>
          <div className="mt-12 text-center relative">
            <div className="font-display text-2xl font-bold neon-text mb-2">J.A.R.V.I.S</div>
            <div className="text-xs font-mono text-muted-foreground tracking-widest mb-6">
              JUST · A · RATHER · VERY · INTELLIGENT · SYSTEM
            </div>
            <Link
              to="/assistant"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-mono text-sm tracking-wider hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] transition-all duration-300"
            >
              <MessageSquare className="w-4 h-4" />
              INICIAR CONVERSA
            </Link>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-4 content-start">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="glass rounded-xl p-5 hover:border-primary/40 transition-all group cursor-default"
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className="w-5 h-5 text-primary group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all" />
                  <span className="text-[10px] font-mono text-primary tracking-wider">{s.change}</span>
                </div>
                <div className="font-display text-3xl font-bold mb-1">{s.value}</div>
                <div className="text-xs font-mono text-muted-foreground tracking-wider uppercase">{s.label}</div>
              </motion.div>
            );
          })}

          {/* Activity feed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-2 glass rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs tracking-widest text-foreground">ATIVIDADE RECENTE</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">LIVE</span>
            </div>
            <div className="space-y-3">
              {activity.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="font-mono text-[10px] text-muted-foreground pt-1 w-10 shrink-0">{a.time}</div>
                    <Icon className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                    <div className="text-sm text-foreground/90 leading-relaxed">{a.text}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;