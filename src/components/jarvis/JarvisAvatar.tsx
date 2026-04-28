import { motion } from "framer-motion";

interface JarvisAvatarProps {
  state?: "idle" | "thinking" | "speaking";
  size?: number;
}

export const JarvisAvatar = ({ state = "idle", size = 200 }: JarvisAvatarProps) => {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer rotating rings */}
      <div className="absolute inset-0 animate-orbit">
        <div className="absolute inset-0 rounded-full border border-primary/30" />
        <div className="absolute inset-0 rounded-full border-t-2 border-primary" />
      </div>
      <div className="absolute inset-2 animate-orbit-slow">
        <div className="absolute inset-0 rounded-full border border-accent/20" />
        <div className="absolute inset-0 rounded-full border-r-2 border-accent" />
      </div>

      {/* Pulse rings */}
      <div className="absolute inset-4 rounded-full bg-primary/5 animate-pulse-ring" />
      <div className="absolute inset-6 rounded-full bg-primary/10 animate-pulse-ring" style={{ animationDelay: "0.6s" }} />

      {/* Core orb */}
      <motion.div
        animate={state === "thinking" ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="absolute inset-8 rounded-full glass-strong flex items-center justify-center overflow-hidden"
        style={{
          background: "radial-gradient(circle at 30% 30%, hsl(168 100% 50% / 0.4), hsl(204 100% 50% / 0.2) 50%, hsl(0 0% 4%) 80%)",
          boxShadow: "var(--shadow-neon), inset 0 0 40px hsl(168 100% 50% / 0.3)",
        }}
      >
        <div className="font-display font-bold text-2xl neon-text tracking-widest">J</div>
      </motion.div>

      {/* Speaking waveform */}
      {state === "speaking" && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full"
              style={{
                animation: `wave 0.8s ease-in-out ${i * 0.1}s infinite`,
                height: "100%",
                transformOrigin: "bottom",
              }}
            />
          ))}
          <style>{`@keyframes wave { 0%,100% { transform: scaleY(0.2); } 50% { transform: scaleY(1); } }`}</style>
        </div>
      )}
    </div>
  );
};