import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

interface JarvisAvatarProps {
  state?: "idle" | "thinking" | "speaking";
  size?: number;
}

type Node = { x: number; y: number; r: number; phase: number };

// Deterministic pseudo-random for stable node layout
const rand = (seed: number) => {
  const x = Math.sin(seed * 9999.1) * 43758.5453;
  return x - Math.floor(x);
};

const buildNodes = (count: number, cx: number, cy: number, rMin: number, rMax: number): Node[] => {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + rand(i + 1) * 0.6;
    const radius = rMin + rand(i + 7) * (rMax - rMin);
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      r: 1.4 + rand(i + 11) * 1.6,
      phase: rand(i + 17) * Math.PI * 2,
    };
  });
};

export const JarvisAvatar = ({ state = "idle", size = 200 }: JarvisAvatarProps) => {
  const VB = 200; // viewBox
  const cx = VB / 2;
  const cy = VB / 2;

  // Two layered rings of neural nodes
  const innerNodes = useMemo(() => buildNodes(10, cx, cy, 38, 46), []);
  const outerNodes = useMemo(() => buildNodes(18, cx, cy, 70, 86), []);
  const allNodes = useMemo(() => [...innerNodes, ...outerNodes], [innerNodes, outerNodes]);

  // Connections: each outer node to its 2 nearest inner nodes + neighbor outer
  const links = useMemo(() => {
    const ls: { a: Node; b: Node; key: string }[] = [];
    outerNodes.forEach((o, i) => {
      const sorted = [...innerNodes]
        .map((n) => ({ n, d: Math.hypot(n.x - o.x, n.y - o.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      sorted.forEach((s, k) => ls.push({ a: o, b: s.n, key: `oi-${i}-${k}` }));
      const next = outerNodes[(i + 1) % outerNodes.length];
      ls.push({ a: o, b: next, key: `oo-${i}` });
    });
    // inner ring closure
    innerNodes.forEach((n, i) => {
      const next = innerNodes[(i + 1) % innerNodes.length];
      ls.push({ a: n, b: next, key: `ii-${i}` });
    });
    return ls;
  }, [innerNodes, outerNodes]);

  // Audio-reactive amplitude (mic) when speaking; fallback synthetic when not allowed
  const [amp, setAmp] = useState(0);
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode; stream: MediaStream } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tickSynthetic = () => {
      const t = performance.now() / 1000;
      const base =
        state === "speaking" ? 0.55 + 0.4 * Math.abs(Math.sin(t * 6) * Math.cos(t * 2.7))
        : state === "thinking" ? 0.35 + 0.2 * Math.sin(t * 3)
        : 0.18 + 0.06 * Math.sin(t * 1.2);
      setAmp(base);
      rafRef.current = requestAnimationFrame(tickSynthetic);
    };

    const tickMic = () => {
      if (!audioRef.current) return;
      const { analyser } = audioRef.current;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      setAmp(Math.min(1, 0.2 + rms * 4));
      rafRef.current = requestAnimationFrame(tickMic);
    };

    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const Ctx: typeof AudioContext =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        audioRef.current = { ctx, analyser, stream };
        rafRef.current = requestAnimationFrame(tickMic);
      } catch {
        rafRef.current = requestAnimationFrame(tickSynthetic);
      }
    };

    if (state === "speaking" && typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      startMic();
    } else {
      rafRef.current = requestAnimationFrame(tickSynthetic);
    }

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioRef.current) {
        audioRef.current.stream.getTracks().forEach((t) => t.stop());
        audioRef.current.ctx.close().catch(() => {});
        audioRef.current = null;
      }
    };
  }, [state]);

  const intensity = amp; // 0..1
  const coreScale = 1 + intensity * 0.08;
  const glow = 0.3 + intensity * 0.7;

  // VU meter ring config
  const VU_BARS = 56;
  const vuRadius = VB / 2 - 6;
  const vuInner = vuRadius - 4;
  const vuOuterMax = vuRadius + 8;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer slow ring */}
      <div className="absolute inset-0 animate-orbit-slow pointer-events-none">
        <div className="absolute inset-0 rounded-full border border-primary/15" />
      </div>

      {/* Neural network SVG */}
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <radialGradient id="jcore" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="hsl(168 100% 70%)" stopOpacity="0.95" />
            <stop offset="45%" stopColor="hsl(204 100% 55%)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(0 0% 4%)" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="jhalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(168 100% 50%)" stopOpacity={0.35 * glow} />
            <stop offset="70%" stopColor="hsl(168 100% 50%)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="jlink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(168 100% 60%)" />
            <stop offset="100%" stopColor="hsl(204 100% 60%)" />
          </linearGradient>
          <filter id="jglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={1.2 + intensity * 1.6} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Halo */}
        <circle cx={cx} cy={cy} r={VB / 2 - 4} fill="url(#jhalo)" />

        {/* VU meter ring */}
        <g filter="url(#jglow)">
          {Array.from({ length: VU_BARS }).map((_, i) => {
            const t = performance.now() / 1000;
            const angle = (i / VU_BARS) * Math.PI * 2 - Math.PI / 2;
            // Per-bar oscillation driven by amplitude
            const wob = 0.5 + 0.5 * Math.sin(t * (3 + (i % 7) * 0.4) + i * 0.35);
            const level = Math.min(1, intensity * (0.55 + wob * 0.85));
            const outer = vuInner + (vuOuterMax - vuInner) * level;
            const x1 = cx + Math.cos(angle) * vuInner;
            const y1 = cy + Math.sin(angle) * vuInner;
            const x2 = cx + Math.cos(angle) * outer;
            const y2 = cy + Math.sin(angle) * outer;
            const hot = level > 0.75;
            return (
              <line
                key={`vu-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={hot ? "hsl(168 100% 70%)" : "hsl(204 100% 60%)"}
                strokeOpacity={0.25 + level * 0.75}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            );
          })}
          {/* Guide ring */}
          <circle
            cx={cx}
            cy={cy}
            r={vuRadius}
            fill="none"
            stroke="hsl(168 100% 60%)"
            strokeOpacity={0.08 + intensity * 0.15}
            strokeWidth={0.4}
            strokeDasharray="1 3"
          />
        </g>

        {/* Connection lines */}
        <g filter="url(#jglow)">
          {links.map((l, i) => {
            const flow = (Math.sin(performance.now() / 600 + i * 0.4) + 1) / 2;
            const op = 0.08 + intensity * 0.55 * (0.4 + flow * 0.6);
            return (
              <line
                key={l.key}
                x1={l.a.x}
                y1={l.a.y}
                x2={l.b.x}
                y2={l.b.y}
                stroke="url(#jlink)"
                strokeWidth={0.5 + intensity * 0.9}
                strokeOpacity={op}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g filter="url(#jglow)">
          {allNodes.map((n, i) => {
            const t = performance.now() / 1000;
            const pulse = 0.5 + 0.5 * Math.sin(t * (1.2 + (i % 5) * 0.3) + n.phase);
            const r = n.r * (1 + intensity * 0.6 * pulse);
            const op = 0.4 + intensity * 0.6 * pulse;
            return (
              <circle
                key={i}
                cx={n.x}
                cy={n.y}
                r={r}
                fill={i % 3 === 0 ? "hsl(204 100% 60%)" : "hsl(168 100% 60%)"}
                opacity={op}
              />
            );
          })}
        </g>

        {/* Core */}
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `scale(${coreScale})`,
            transition: "transform 80ms linear",
          }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={22}
            fill="url(#jcore)"
            style={{ filter: `drop-shadow(0 0 ${6 + intensity * 14}px hsl(168 100% 50% / ${0.5 + intensity * 0.5}))` }}
          />
          <circle
            cx={cx}
            cy={cy}
            r={22}
            fill="none"
            stroke="hsl(168 100% 60%)"
            strokeOpacity={0.6}
            strokeWidth={0.6}
          />
        </g>
      </svg>

      {/* Core letter */}
      <motion.div
        animate={{ scale: state === "thinking" ? [1, 1.04, 1] : 1 }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ textShadow: `0 0 ${8 + intensity * 16}px hsl(168 100% 50% / ${0.6 + intensity * 0.4})` }}
      >
        <div
          className="font-display font-bold neon-text tracking-widest"
          style={{ fontSize: size * 0.13 }}
        >
          J
        </div>
      </motion.div>
    </div>
  );
};