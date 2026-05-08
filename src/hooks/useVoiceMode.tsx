import { useState, useEffect } from "react";

const STORAGE_KEY = "jarvis_voice_mode";

export function useVoiceMode(): [boolean, (v: boolean | ((prev: boolean) => boolean)) => void] {
  const [on, setOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? true : raw === "1";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  }, [on]);

  return [on, setOn];
}
