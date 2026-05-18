import { useEffect, useState } from "react";
import { User, Volume2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoicePreference, pickVoice } from "@/hooks/useVoicePreference";

type Gender = "masculino" | "feminino" | "neutro";

const Settings = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<Gender>("neutro");
  const [voiceGender, setVoiceGender] = useVoicePreference();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maleVoiceInfo, setMaleVoiceInfo] = useState<{ name: string; lang: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const refresh = () => {
      const v = pickVoice("male");
      setMaleVoiceInfo(v ? { name: v.name, lang: v.lang } : null);
    };
    refresh();
    window.speechSynthesis.onvoiceschanged = refresh;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, gender")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setGender((data.gender as Gender) ?? "neutro");
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, display_name: displayName || null, gender },
        { onConflict: "user_id" }
      );
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado.");
  };

  const testVoice = () => {
    if (!("speechSynthesis" in window)) { toast.error("Voz não suportada neste navegador."); return; }
    const h = new Date().getHours();
    const greet = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    const treat = gender === "feminino" ? "senhora" : gender === "neutro" ? "" : "senhor";
    const u = new SpeechSynthesisUtterance(
      treat ? `${greet}, ${treat}. Sistema JARVIS online.` : `${greet}. Sistema JARVIS online.`
    );
    const v = pickVoice(voiceGender);
    if (v) u.voice = v;
    if (voiceGender === "male") {
      u.lang = "pt-BR";
      u.rate = 0.95;
      u.pitch = 0.8;
    } else {
      u.lang = v?.lang || "pt-BR";
      u.rate = 1;
      u.pitch = 1.15;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-mono tracking-[0.3em] text-primary">CONFIGURAÇÕES</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Personalize sua experiência</h1>
      </div>

      <div className="glass rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold">Perfil</div>
            <div className="text-xs text-muted-foreground">Como o JARVIS deve se dirigir a você</div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-mono">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Nome de exibição</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como devo chamá-lo?"
                className="w-full px-4 py-3 rounded-xl bg-input/50 border border-primary/20 focus:border-primary outline-none text-sm font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Tratamento por voz</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "masculino", label: "Senhor" },
                  { v: "feminino", label: "Senhora" },
                  { v: "neutro", label: "Neutro" },
                ] as { v: Gender; label: string }[]).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setGender(opt.v)}
                    className={`py-3 rounded-xl border text-sm font-mono tracking-wider transition-all ${
                      gender === opt.v
                        ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                        : "border-primary/20 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Voz do JARVIS</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "male", label: "♂ Masculina" },
                  { v: "female", label: "♀ Feminina" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setVoiceGender(opt.v)}
                    className={`py-3 rounded-xl border text-sm font-mono tracking-wider transition-all ${
                      voiceGender === opt.v
                        ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                        : "border-primary/20 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {voiceGender === "male" && (
                <div className="text-xs font-mono text-muted-foreground pt-1">
                  {maleVoiceInfo ? (
                    <>
                      Voz atual: <span className="text-primary">{maleVoiceInfo.name}</span>{" "}
                      <span className={maleVoiceInfo.lang?.toLowerCase().startsWith("pt") ? "text-primary" : "text-destructive"}>
                        ({maleVoiceInfo.lang})
                      </span>
                      {!maleVoiceInfo.lang?.toLowerCase().includes("br") && (
                        <span className="text-destructive"> — não é pt-BR</span>
                      )}
                    </>
                  ) : (
                    "Nenhuma voz disponível no navegador."
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-mono text-sm tracking-wider hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "SALVAR"}
              </button>
              <button
                onClick={testVoice}
                className="py-3 px-4 rounded-xl glass-strong text-sm font-mono tracking-wider hover:border-primary/40 transition-all flex items-center justify-center gap-2"
              >
                <Volume2 className="w-4 h-4" /> TESTAR VOZ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;