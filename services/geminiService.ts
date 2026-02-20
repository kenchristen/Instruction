import { PlanType } from "../types";

function getApiBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (!baseUrl) throw new Error("VITE_API_URL non définie sur Render (Static Site).");
  return baseUrl.replace(/\/$/, "");
}

async function postJson<T>(path: string, body: any): Promise<T> {
  const resp = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Erreur API (${resp.status})`);
  }

  return (await resp.json()) as T;
}

export async function suggestObjectives(type: PlanType, title: string, exerciseType: string) {
  const context = type === PlanType.LESSON ? "leçon" : `instruction de sapeur-pompier (type: ${exerciseType})`;
  const prompt = `Suggère 4 thèmes ou objectifs clés pour une ${context} intitulée "${title}". Focus sur la sécurité et la technique opérationnelle.`;

  const data = await postJson<{ text: string }>("/generate", { prompt });
  // ton backend renvoie du texte : ici on tente de parser en JSON sinon fallback
  try {
    return JSON.parse(data.text.trim());
  } catch {
    return [];
  }
}

export async function suggestStructure(type: PlanType, title: string, phaseTitle: string, activity: string) {
  const context = type === PlanType.LESSON ? "une leçon" : "une instruction de sapeur-pompier";
  const prompt = `Pour ${context} sur "${title}", détaille le contenu technique et les points de sécurité pour la phase "${phaseTitle}". Sois direct et technique.`;

  const data = await postJson<{ text: string }>("/generate", { prompt });
  return data.text;
}

export async function suggestAssessment(plan: any) {
  const prompt = `Suggère des remarques finales ou des points de vigilance sécurité pour une instruction de type ${plan.exerciseType} portant sur ${plan.title}.`;

  const data = await postJson<{ text: string }>("/generate", { prompt });
  return data.text;
}
