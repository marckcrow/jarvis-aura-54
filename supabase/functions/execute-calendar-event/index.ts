import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action_id } = await req.json();
    if (!action_id || typeof action_id !== "string") {
      return new Response(JSON.stringify({ error: "action_id inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load the action (RLS ensures it belongs to the user)
    const { data: action, error: actErr } = await supabase
      .from("jarvis_actions")
      .select("*")
      .eq("id", action_id)
      .maybeSingle();

    if (actErr || !action) {
      return new Response(JSON.stringify({ error: "Ação não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action.action_type !== "create_calendar_event") {
      return new Response(JSON.stringify({ error: "Tipo de ação não suportado por esta função" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action.status === "executed" || action.status === "completed") {
      return new Response(JSON.stringify({ ok: true, already: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_CALENDAR_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    if (!GOOGLE_CALENDAR_API_KEY) throw new Error("GOOGLE_CALENDAR_API_KEY não configurada");

    const payload = (action.payload ?? {}) as Record<string, unknown>;
    const title = (payload.title as string) || (payload.summary as string) || "Evento JARVIS";
    const startIso = (payload.datetime_iso as string) || (payload.start as string);
    const endIso = (payload.end_iso as string) || (payload.end as string);
    const description = (payload.description as string) || "";
    const location = (payload.location as string) || "";
    const attendeesRaw = payload.attendees;

    if (!startIso) {
      const errMsg = "payload.datetime_iso ausente — JARVIS não conseguiu extrair data/hora.";
      await supabase.from("jarvis_actions").update({
        status: "error", error_message: errMsg,
      }).eq("id", action.id);
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startDate = new Date(startIso);
    const endDate = endIso ? new Date(endIso) : new Date(startDate.getTime() + 60 * 60 * 1000);
    const timeZone = (payload.timezone as string) || "America/Sao_Paulo";

    let attendees: { email: string }[] | undefined;
    if (Array.isArray(attendeesRaw)) {
      attendees = (attendeesRaw as unknown[])
        .map((a) => (typeof a === "string" ? { email: a } : (a as { email?: string })))
        .filter((a): a is { email: string } => !!a && typeof a.email === "string" && a.email.includes("@"));
    }

    const eventBody: Record<string, unknown> = {
      summary: title,
      description,
      location,
      start: { dateTime: startDate.toISOString(), timeZone },
      end:   { dateTime: endDate.toISOString(),   timeZone },
    };
    if (attendees && attendees.length > 0) eventBody.attendees = attendees;

    const calendarId = (payload.calendar_id as string) || "primary";

    const gResp = await fetch(`${GATEWAY_URL}/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_CALENDAR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    });

    const gData = await gResp.json().catch(() => ({}));
    if (!gResp.ok) {
      const errMsg = `Google Calendar [${gResp.status}]: ${JSON.stringify(gData).slice(0, 500)}`;
      console.error(errMsg);
      await supabase.from("jarvis_actions").update({
        status: "error", error_message: errMsg,
      }).eq("id", action.id);
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("jarvis_actions").update({
      status: "executed",
      executed_at: new Date().toISOString(),
      result: {
        event_id: gData.id,
        html_link: gData.htmlLink,
        hangout_link: gData.hangoutLink ?? null,
        summary: gData.summary,
        start: gData.start,
        end: gData.end,
      },
      error_message: null,
    }).eq("id", action.id);

    return new Response(JSON.stringify({
      ok: true,
      event_id: gData.id,
      html_link: gData.htmlLink,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("execute-calendar-event fatal:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});