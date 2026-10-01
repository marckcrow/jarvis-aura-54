import { supabase } from "@/integrations/supabase/client";

type ActionLike = { id: string; action_type: string; payload: Record<string, unknown> | null };

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

const normPriority = (p: unknown) => {
  const s = (str(p) ?? "").toLowerCase();
  if (s.startsWith("a") || s.startsWith("h")) return "alta";
  if (s.startsWith("b") || s.startsWith("l")) return "baixa";
  return "media";
};

const toDate = (v: unknown) => {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

export const isInternalAction = (t: string) => t === "create_task" || t === "create_project";

/** Executes create_task / create_project by writing real rows, then marks the action executed. */
export async function executeInternalAction(action: ActionLike) {
  const p = action.payload ?? {};
  try {
    let result: Record<string, unknown>;
    if (action.action_type === "create_task") {
      const title = str(p.title) ?? str(p.name) ?? "Nova tarefa";
      const { data, error } = await (supabase as any).from("tasks").insert({
        title,
        description: str(p.description),
        priority: normPriority(p.priority),
        due_at: toDate(p.due ?? p.due_at ?? p.datetime_iso),
        source_action_id: action.id,
      }).select("id").single();
      if (error) throw error;
      result = { task_id: data.id, title };
    } else {
      const name = str(p.name) ?? str(p.title) ?? "Novo projeto";
      const goals = Array.isArray(p.goals) ? (p.goals as unknown[]).join("\n") : str(p.goals);
      const { data, error } = await (supabase as any).from("projects").insert({
        name,
        description: str(p.description),
        goals,
        source_action_id: action.id,
      }).select("id").single();
      if (error) throw error;
      result = { project_id: data.id, name };
    }
    await supabase.from("jarvis_actions").update({
      status: "executed", executed_at: new Date().toISOString(), result: result as any, error_message: null,
    }).eq("id", action.id);
    return { ok: true as const, result };
  } catch (e: any) {
    await supabase.from("jarvis_actions").update({ status: "error", error_message: e?.message ?? "Falha" }).eq("id", action.id);
    return { ok: false as const, error: e?.message ?? "Falha" };
  }
}
