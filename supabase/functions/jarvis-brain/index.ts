import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é JARVIS, assistente executivo de IA do usuário. Trate-o como "Senhor" ocasionalmente. Português brasileiro, objetivo, estratégico, em markdown quando útil.

Você tem acesso a uma ferramenta route_intent — use-a SEMPRE para classificar o pedido do usuário. Após chamá-la, responda em texto natural confirmando o que será feito.

Intenções disponíveis:
- chat: conversa livre, perguntas, conselhos
- create_calendar_event: agendar reunião/evento (extraia title, datetime_iso, attendees)
- create_task: criar uma tarefa (extraia title, due, priority)
- create_project: criar projeto (extraia name, description, goals)
- draft_email_response: rascunhar resposta de email (extraia to, subject, draft)
- send_whatsapp: enviar mensagem WhatsApp (extraia to, message) — SENSÍVEL
- check_saas_status: consultar status dos SaaS conectados
- create_social_media_plan: gerar plano de conteúdo (extraia platform, theme, days)
- save_memory: salvar uma preferência ou fato sobre o usuário (extraia memory_type, title, content)
- recall_memory: consultar memórias salvas`;

const tools = [{
  type: "function",
  function: {
    name: "route_intent",
    description: "Classifica a intenção do usuário e extrai parâmetros para executar a ação.",
    parameters: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          enum: ["chat", "create_calendar_event", "create_task", "create_project",
                 "draft_email_response", "send_whatsapp", "check_saas_status",
                 "create_social_media_plan", "save_memory", "recall_memory"],
        },
        confidence: { type: "number", description: "0 a 1" },
        action_summary: { type: "string", description: "1 frase curta sobre o que será feito" },
        requires_confirmation: { type: "boolean", description: "true se ação envia algo externo (email, whatsapp) ou é destrutiva" },
        target_system: { type: "string", description: "ex: google_calendar, gmail, whatsapp, internal, n8n" },
        payload: { type: "object", description: "parâmetros extraídos (title, datetime_iso, to, message, etc)" },
      },
      required: ["intent", "action_summary", "requires_confirmation", "payload"],
      additionalProperties: false,
    },
  },
}];

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

    const { messages, input_text } = await req.json();
    if (!input_text || typeof input_text !== "string" || input_text.length > 4000) {
      return new Response(JSON.stringify({ error: "Comando inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get tenant
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("user_id", user.id).maybeSingle();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile não encontrado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tenant_id = profile.tenant_id;

    // Recent memory for context
    const { data: memories } = await supabase
      .from("jarvis_memory")
      .select("memory_type,title,content")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    const memoryContext = memories?.length
      ? `\n\nContexto sobre o usuário:\n${memories.map((m) => `- [${m.memory_type}] ${m.title}: ${m.content}`).join("\n")}`
      : "";

    // Insert command record
    const { data: command, error: cmdErr } = await supabase
      .from("jarvis_commands")
      .insert({
        tenant_id, user_id: user.id, input_text, status: "processing",
      })
      .select()
      .single();
    if (cmdErr || !command) {
      console.error("cmd insert:", cmdErr);
      return new Response(JSON.stringify({ error: "Falha ao registrar comando" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call AI Gateway with tool
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT + memoryContext },
      ...(Array.isArray(messages) ? messages.slice(-8) : []),
      { role: "user", content: input_text },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools,
        tool_choice: { type: "function", function: { name: "route_intent" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      await supabase.from("jarvis_commands").update({ status: "error", response_text: "Falha na IA" }).eq("id", command.id);
      const status = aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500;
      const msg = status === 429 ? "Limite atingido. Aguarde." : status === 402 ? "Créditos esgotados." : "Erro IA";
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let intent = "chat", payload: Record<string, unknown> = {}, action_summary = "", requires_confirmation = false, target_system = "internal";
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        intent = args.intent ?? "chat";
        payload = args.payload ?? {};
        action_summary = args.action_summary ?? "";
        requires_confirmation = !!args.requires_confirmation;
        target_system = args.target_system ?? "internal";
      } catch (e) {
        console.error("tool args parse:", e);
      }
    }

    // Generate natural language response (second call, no tools)
    const replyResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + memoryContext },
          ...(Array.isArray(messages) ? messages.slice(-8) : []),
          { role: "user", content: input_text },
          { role: "assistant", content: `Intenção: ${intent}. ${action_summary}${requires_confirmation ? " (aguardando confirmação)" : ""}` },
          { role: "user", content: "Confirme em uma resposta breve, em português, em markdown se útil. Se requires_confirmation=true, peça confirmação. Não mencione 'intenção' ou JSON." },
        ],
      }),
    });

    let response_text = action_summary || "Entendido, Senhor.";
    if (replyResp.ok) {
      const replyData = await replyResp.json();
      response_text = replyData.choices?.[0]?.message?.content ?? response_text;
    }

    // Update command
    await supabase.from("jarvis_commands").update({
      detected_intent: intent,
      response_text,
      status: "completed",
      metadata: { target_system, requires_confirmation },
    }).eq("id", command.id);

    // Insert action if not pure chat
    let action_id: string | null = null;
    if (intent !== "chat") {
      const { data: action } = await supabase.from("jarvis_actions").insert({
        command_id: command.id,
        user_id: user.id,
        tenant_id,
        action_type: intent,
        target_system,
        payload,
        requires_confirmation,
        status: requires_confirmation ? "awaiting_confirmation" : "ready",
      }).select("id").single();
      action_id = action?.id ?? null;
    }

    return new Response(JSON.stringify({
      command_id: command.id,
      action_id,
      intent,
      response_text,
      requires_confirmation,
      action_summary,
      payload,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("jarvis-brain fatal:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
