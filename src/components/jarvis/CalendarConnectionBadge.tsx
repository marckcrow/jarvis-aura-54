import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Status = "loading" | "connected" | "disconnected" | "error";

interface Props {
  compact?: boolean;
  className?: string;
}

export function CalendarConnectionBadge({ compact = false, className }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");

  const check = async () => {
    setStatus("loading");
    const { data, error } = await supabase.functions.invoke("calendar-status");
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    const d = data as { connected?: boolean; reason?: string; message?: string; error?: string };
    if (d?.connected) {
      setStatus("connected");
      setMessage("Google Calendar conectado e pronto.");
    } else {
      setStatus("disconnected");
      setMessage(d?.message || d?.error || d?.reason || "Não conectado");
    }
  };

  useEffect(() => { check(); }, []);

  const cfg = {
    loading:      { color: "text-muted-foreground border-muted-foreground/30 bg-muted-foreground/5", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "VERIFICANDO" },
    connected:    { color: "text-primary border-primary/40 bg-primary/10", icon: <CheckCircle2 className="w-3 h-3" />, label: "CONECTADO" },
    disconnected: { color: "text-amber-400 border-amber-400/40 bg-amber-400/10", icon: <AlertCircle className="w-3 h-3" />, label: "DESCONECTADO" },
    error:        { color: "text-destructive border-destructive/40 bg-destructive/10", icon: <AlertCircle className="w-3 h-3" />, label: "ERRO" },
  }[status];

  return (
    <div
      title={message}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-mono tracking-wider transition-all",
        cfg.color,
        className
      )}
    >
      <Calendar className="w-3 h-3" />
      {!compact && <span className="opacity-70">GOOGLE CALENDAR</span>}
      <span className="flex items-center gap-1">{cfg.icon} {cfg.label}</span>
    </div>
  );
}