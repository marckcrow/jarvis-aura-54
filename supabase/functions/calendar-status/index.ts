import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VERIFY_URL = "https://connector-gateway.lovable.dev/api/v1/verify_credentials";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ connected: false, reason: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ connected: false, reason: "invalid_session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_CALENDAR_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");

    if (!LOVABLE_API_KEY || !GOOGLE_CALENDAR_API_KEY) {
      return new Response(JSON.stringify({
        connected: false,
        reason: "not_linked",
        message: "Google Calendar não está vinculado ao projeto.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resp = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_CALENDAR_API_KEY,
        "Content-Type": "application/json",
      },
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return new Response(JSON.stringify({
        connected: false,
        reason: "gateway_error",
        status: resp.status,
        message: (data as { message?: string })?.message ?? "Falha ao verificar credenciais",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const outcome = (data as { outcome?: string })?.outcome;
    const connected = outcome === "verified" || outcome === "skipped";
    return new Response(JSON.stringify({
      connected,
      outcome,
      latency_ms: (data as { latency_ms?: number })?.latency_ms,
      error: (data as { error?: string })?.error,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({
      connected: false, reason: "exception",
      message: e instanceof Error ? e.message : "Erro",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});