import { CheckCircle2, Clock, Loader2, AlertCircle, ShieldAlert } from "lucide-react";

const styles: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  pending:                { bg: "bg-muted/30",       text: "text-muted-foreground", icon: Clock,        label: "Pendente" },
  processing:             { bg: "bg-accent/20",      text: "text-accent",           icon: Loader2,      label: "Processando" },
  ready:                  { bg: "bg-primary/15",     text: "text-primary",          icon: CheckCircle2, label: "Pronto" },
  awaiting_confirmation:  { bg: "bg-accent/15",      text: "text-accent",           icon: ShieldAlert,  label: "Aguardando confirmação" },
  completed:              { bg: "bg-primary/15",     text: "text-primary",          icon: CheckCircle2, label: "Concluído" },
  executed:               { bg: "bg-primary/20",     text: "text-primary",          icon: CheckCircle2, label: "Executado" },
  error:                  { bg: "bg-destructive/15", text: "text-destructive",      icon: AlertCircle,  label: "Erro" },
  cancelled:              { bg: "bg-muted/30",       text: "text-muted-foreground", icon: AlertCircle,  label: "Cancelado" },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const s = styles[status] ?? styles.pending;
  const Icon = s.icon;
  const spin = status === "processing";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase ${s.bg} ${s.text}`}>
      <Icon className={`w-3 h-3 ${spin ? "animate-spin" : ""}`} />
      {s.label}
    </span>
  );
};