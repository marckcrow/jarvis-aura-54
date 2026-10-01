import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Mic, Square, Sparkles, ShieldAlert } from "lucide-react";
import { JarvisAvatar } from "@/components/jarvis/JarvisAvatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Msg = {
  role: "user" | "assistant";
  content: string;
  intent?: string;
  requires_confirmation?: boolean;
  command_id?: string;
};

const suggestions = [
  "Resuma minha agenda da semana",
  "Quais minhas prioridades hoje?",
  "Crie um plano para lançar meu produto",
  "Analise meu desempenho recente",
];

const Assistant = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const history = next.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("jarvis-brain", {
        body: { messages: history.slice(0, -1), input_text: trimmed },
      });
      if (error) {
        const msg = (error as any)?.context?.status === 429
          ? "Muitas requisições. Aguarde."
          : (error as any)?.context?.status === 402
          ? "Créditos esgotados no workspace."
          : "Falha ao contatar JARVIS.";
        toast.error(msg);
      } else if (data?.response_text) {
        setMessages((m) => [...m, {
          role: "assistant",
          content: data.response_text,
          intent: data.intent,
          requires_confirmation: data.requires_confirmation,
          command_id: data.command_id,
        }]);
        if (data.requires_confirmation) {
          toast.info("Ação aguardando confirmação no Command Center.");
        } else if (data.action_id && isInternalAction(data.intent)) {
          const r = await executeInternalAction({ id: data.action_id, action_type: data.intent, payload: data.payload });
          if (r.ok) toast.success(data.intent === "create_task" ? "Tarefa criada em Tarefas" : "Projeto criado em Projetos");
          else toast.error(r.error);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao processar resposta");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="h-screen flex flex-col p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-primary/10">
        <div className="w-12 h-12">
          <JarvisAvatar state={streaming ? "speaking" : "idle"} size={48} />
        </div>
        <div className="flex-1">
          <div className="font-display font-bold text-lg neon-text">JARVIS</div>
          <div className="font-mono text-xs text-muted-foreground tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {streaming ? "PROCESSANDO..." : "PRONTO PARA AUXILIAR"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center text-center"
          >
            <div className="mb-8 animate-float">
              <JarvisAvatar size={160} />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">
              Como posso ajudá-lo, <span className="text-gradient">Senhor</span>?
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-md">
              Estou aqui para gerenciar sua agenda, responder perguntas, executar comandos e tomar decisões estratégicas.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-2xl w-full">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="glass rounded-lg p-3 text-left text-sm text-foreground/80 hover:text-primary hover:border-primary/40 transition-all flex items-center gap-2 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-xs text-primary-foreground shrink-0 mt-1 shadow-[0_0_12px_hsl(var(--primary)/0.4)]">
                  J
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 text-foreground"
                    : "glass text-foreground/95"
                }`}
              >
                {m.role === "assistant" && !m.content && streaming ? (
                  <div className="flex gap-1 py-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:text-primary prose-strong:text-primary prose-code:text-accent">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    {m.role === "assistant" && m.intent && m.intent !== "chat" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-primary/10 text-[10px] font-mono tracking-wider">
                        <span className="text-primary uppercase">{m.intent}</span>
                        {m.requires_confirmation && (
                          <span className="flex items-center gap-1 text-accent">
                            <ShieldAlert className="w-3 h-3" /> AGUARDA APROVAÇÃO
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-primary/10">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="glass rounded-2xl p-2 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => toast.info("Modo de voz em breve")}
            className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite seu comando, Senhor..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/60 px-2 font-mono"
            disabled={streaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)] transition-all"
          >
            {streaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;