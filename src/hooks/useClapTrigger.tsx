import { useEffect, useRef, useState } from "react";

type Options = {
  enabled?: boolean;
  onTrigger: () => void;
  claps?: number;
  windowMs?: number;
  threshold?: number;
  minGapMs?: number;
};

/**
 * Detecta N palmas consecutivas via microfone usando picos de energia/flux espectral.
 * Requer permissão do usuário (chame start() após um gesto).
 */
export function useClapTrigger({
  enabled = true,
  onTrigger,
  claps = 2,
  windowMs = 1500,
  threshold = 0.35,
  minGapMs = 120,
}: Options) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const clapsRef = useRef<number[]>([]);
  const lastPeakRef = useRef(0);
  const prevRmsRef = useRef(0);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setListening(false);
  };

  const start = async () => {
    if (listening) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const AC: typeof AudioContext =
        (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AC();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      setListening(true);
      setError(null);

      const loop = () => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        const delta = rms - prevRmsRef.current;
        prevRmsRef.current = rms;

        const now = performance.now();
        // Pico curto e súbito → palma
        if (rms > threshold && delta > threshold * 0.6 && now - lastPeakRef.current > minGapMs) {
          lastPeakRef.current = now;
          const arr = clapsRef.current.filter((t) => now - t < windowMs);
          arr.push(now);
          clapsRef.current = arr;
          if (arr.length >= claps) {
            clapsRef.current = [];
            try { onTrigger(); } catch (e) { console.warn(e); }
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao acessar microfone");
      stop();
    }
  };

  useEffect(() => {
    if (!enabled) stop();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { listening, error, start, stop };
}
