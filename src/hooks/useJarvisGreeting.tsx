import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { pickVoice, VoiceGender } from "./useVoicePreference";

export function speak(text: string, gender: VoiceGender = "male") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(gender);
    if (v) u.voice = v;
    if (gender === "male") {
      // Estilo JARVIS em pt-BR: grave, cadência calma e formal.
      u.lang = "pt-BR";
      u.rate = 0.95;
      u.pitch = 0.8;
    } else {
      u.lang = v?.lang || "pt-BR";
      u.rate = 1;
      u.pitch = 1.15;
    }
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

export function useJarvisGreeting(voiceEnabled = true, muteText = false, voiceGender: VoiceGender = "male") {
  const { user, loading } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (!voiceEnabled) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [voiceEnabled]);

  useEffect(() => {
    if (loading || !user || ran.current || !voiceEnabled) return;
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

      const fullText = welcome + agendaPhrase + closing;
      speak(fullText, voiceGender);
      if (muteText) {
        // Silencia qualquer output textual da saudação — aqui apenas garantimos que não logamos
        // Em futuro: pode esconder overlay de legenda
      }
    })();
  }, [user, loading, voiceEnabled, muteText]);
}
