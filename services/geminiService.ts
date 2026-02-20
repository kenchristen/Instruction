
import { GoogleGenAI, Type } from "@google/genai";
import { PlanType } from "../types";

// Always initialize with the direct environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestObjectives = async (type: PlanType, title: string, exerciseType: string) => {
  const context = type === PlanType.LESSON ? "leçon" : `instruction de sapeur-pompier (type: ${exerciseType})`;
  const prompt = `Suggère 4 thèmes ou objectifs clés pour une ${context} intitulée "${title}". Focus sur la sécurité et la technique opérationnelle.`;
  
  // Directly use ai.models.generateContent.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  
  // Extract output text via the .text property.
  const text = response.text;
  if (!text) return [];
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    return [];
  }
};

export const suggestStructure = async (type: PlanType, title: string, phaseTitle: string, activity: string) => {
  const context = type === PlanType.LESSON ? "une leçon" : "une instruction de sapeur-pompier";
  const prompt = `Pour ${context} sur "${title}", détaille le contenu technique et les points de sécurité pour la phase "${phaseTitle}". Sois direct et technique.`;
    
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  
  return response.text;
};

export const suggestAssessment = async (plan: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggère des remarques finales ou des points de vigilance sécurité pour une instruction de type ${plan.exerciseType} portant sur ${plan.title}.`,
  });
  
  return response.text;
};
