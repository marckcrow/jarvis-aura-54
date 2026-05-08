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
const MALE_HINTS = ["male", "homem", "masculin", "ricardo", "daniel", "felipe", "antonio", "joão", "joao", "paulo", "bruno", "microsoft daniel", "microsoft antonio"];

export function pickVoice(gender: VoiceGender): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const all = window.speechSynthesis.getVoices();
  const pt = all.filter((v) => v.lang?.toLowerCase().startsWith("pt"));
  const pool = pt.length ? pt : all;
  const hints = gender === "female" ? FEMALE_HINTS : MALE_HINTS;
  const anti = gender === "female" ? MALE_HINTS : FEMALE_HINTS;
  const match = pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  if (match) return match;
  const notAnti = pool.find((v) => !anti.some((h) => v.name.toLowerCase().includes(h)));
  return notAnti || pool[0];
}