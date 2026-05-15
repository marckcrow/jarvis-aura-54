import { useEffect, useState } from "react";

export type VoiceGender = "male" | "female";
const KEY = "jarvis_voice_gender";

export function useVoicePreference(): [VoiceGender, (v: VoiceGender) => void] {
  const [v, setV] = useState<VoiceGender>(() => {
    if (typeof window === "undefined") return "male";
    return (localStorage.getItem(KEY) as VoiceGender) || "male";
  });
  useEffect(() => {
    localStorage.setItem(KEY, v);
  }, [v]);
  return [v, setV];
}

const FEMALE_HINTS = ["female", "mulher", "feminin", "luciana", "fernanda", "maria", "joana", "helena", "francisca", "vitoria", "camila", "google português do brasil", "microsoft maria", "microsoft francisca"];
const MALE_HINTS = ["male", "homem", "masculin", "ricardo", "felipe", "antonio", "joão", "joao", "paulo", "bruno", "microsoft antonio"];

// Hints especiais para soar como o JARVIS (Iron Man): voz masculina britânica refinada.
// Ordem importa — preferimos vozes en-GB masculinas reconhecíveis.
const JARVIS_MALE_HINTS = [
  "daniel",                 // macOS / iOS en-GB masculino
  "google uk english male",
  "microsoft george",       // en-GB masculino Windows
  "microsoft ryan",         // en-GB masculino Windows
  "oliver",
  "arthur",
];

export function pickVoice(gender: VoiceGender): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const all = window.speechSynthesis.getVoices();

  if (gender === "male") {
    // Apenas vozes em português; preferimos pt-BR masculinas com timbre grave (estilo JARVIS).
    const pt = all.filter((v) => v.lang?.toLowerCase().startsWith("pt"));
    const ptBR = pt.filter((v) => v.lang?.toLowerCase().includes("br"));
    const pool = ptBR.length ? ptBR : pt;
    const ptMale = pool.find((v) => MALE_HINTS.some((h) => v.name.toLowerCase().includes(h)));
    if (ptMale) return ptMale;
    const ptNotFemale = pool.find((v) => !FEMALE_HINTS.some((h) => v.name.toLowerCase().includes(h)));
    return ptNotFemale || pool[0] || all[0];
  }

  // Feminino: prioriza pt-BR feminina.
  const pt = all.filter((v) => v.lang?.toLowerCase().startsWith("pt"));
  const pool = pt.length ? pt : all;
  const match = pool.find((v) => FEMALE_HINTS.some((h) => v.name.toLowerCase().includes(h)));
  if (match) return match;
  const notMale = pool.find((v) => !MALE_HINTS.some((h) => v.name.toLowerCase().includes(h)));
  return notMale || pool[0];
}