import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.rate = 1;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("pt"));
    if (ptVoice) u.voice = ptVoice;
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.warn("speak fail", e);
  }
}

function periodAndTreatment(gender: string | null | undefined) {
  const h = new Date().getHours();
  const greet = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const treat = gender === "feminino" ? "senhora" : gender === "neutro" ? "" : "senhor";
  return { greet, treat };
}

function fmtTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const SESSION_KEY = "jarvis_greeted_session";

export function useJarvisGreeting() {
  const { user, loading } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (loading || !user || ran.current) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    ran.current = true;
    sessionStorage.setItem(SESSION_KEY, "1");

    (async () => {
      // wait briefly so voices load
      if ("speechSynthesis" in window && window.speechSynthesis.getVoices().length === 0) {
        await new Promise<void>((res) => {
          const t = setTimeout(() => res(), 800);
          window.speechSynthesis.onvoiceschanged = () => { clearTimeout(t); res(); };
        });
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, gender")
        .eq("user_id", user.id)
        .maybeSingle();

      const { greet, treat } = periodAndTreatment(prof?.gender);
      const name = prof?.display_name?.trim();
      const welcome = treat
        ? `${greet}, ${treat}${name ? `, ${name}` : ""}. Bem-vindo de volta.`
        : `${greet}${name ? `, ${name}` : ""}. Bem-vindo de volta.`;

      let agendaPhrase = "";
      try {
        const { data: cal } = await supabase.functions.invoke("calendar-today");
        const events: Array<{ summary: string; start?: string }> = cal?.events ?? [];
        if (cal?.not_connected) {
          agendaPhrase = " O Google Agenda ainda não está conectado.";
        } else if (events.length === 0) {
          agendaPhrase = " Sua agenda de hoje está livre.";
        } else {
          const n = events.length;
          const first = events[0];
          const t = fmtTime(first.start);
          agendaPhrase = ` Você tem ${n} ${n === 1 ? "compromisso" : "compromissos"} hoje. O próximo é ${first.summary}${t ? ` às ${t}` : ""}.`;
        }
      } catch {
        agendaPhrase = "";
      }

      const closing = treat
        ? ` Deseja saber mais detalhes da sua agenda, ${treat}?`
        : " Deseja saber mais detalhes da sua agenda?";

      speak(welcome + agendaPhrase + closing);
    })();
  }, [user, loading]);
}