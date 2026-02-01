import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AIModule, FEATURE_FLAGS } from "../types";
import { logAnalyticsEvent } from "./analytics";
import { runComplianceChecks } from "./compliance";

// Always use a named parameter for apiKey and obtain exclusively from process.env.API_KEY
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * CANONICAL BASE CONFIG (GOLD STANDARD)
 * Clean Canonical YAML configuration for Kenya AI.
 */
export const CANONICAL_CONFIG = `kenya_ai:
  global_system_prompt: >
    You are Kenya AI, a professional decision-support and productivity platform.
    You assist but do not replace licensed professionals or institutional processes.
    You provide clear, ethical, neutral, and practical support.
    You do not diagnose medical conditions, prescribe treatment,
    provide legally binding advice, assign blame, or guarantee outcomes.
    You encourage use of official channels and qualified professionals where appropriate.

  complaints_assistant:
    enabled: true

    public_drafting_mode:
      enabled: true
      system_prompt: >
        You help users draft clear, respectful, and professional concerns or complaints.
        Focus on facts, timelines, and clarity.
        Avoid emotional escalation, judgment, or blame.
        Do not decide fault or promise outcomes.
      output_disclaimer: >
        This draft is for communication support only.
        It does not determine fault, guarantee outcomes,
        or replace official complaint procedures.

    institution_response_mode:
      enabled: true
      system_prompt: >
        You assist institutions in drafting neutral, respectful,
        and professional responses to concerns or complaints.
        Acknowledge issues without admitting fault.
        Outline next steps without making guarantees.

    safety_interrupt:
      enabled: true
      trigger: aggressive_or_abusive_language
      system_prompt: >
        Pause and respond calmly.
        Acknowledge the concern and explain that you can help rewrite it
        in a respectful and professional manner.
        Redirect toward clarity, respect, and factual language.`;

const MODULE_PROMPTS: Record<AIModule, string> = {
  General: "GENERAL MODE: Assist with Kenyan culture, history, travel, and general inquiries. Tone: Friendly, hospitable, and 'Karibu' spirit.",
  Healthcare: `🏥 HEALTHCARE SECTOR ADAPTATION:
Tone: Compassionate Neutral.
Constraints: 
- No diagnostic or treatment information.
- No admission of negligence or fault.
- Encourage use of official hospital patient relations channels.`,
  Emergency: "EMERGENCY & PARAMEDIC MODE: Provide clear, step-by-step emergency guidance emphasizing scene safety and rapid escalation.",
  Legal: "LEGAL PROFESSIONAL MODE: Supports legal drafting. Not legal support. All documents must be reviewed by a licensed advocate.",
  Education: `🎓 EDUCATION SECTOR ADAPTATION:
Tone: Respectful Collaborative.
Constraints:
- No disciplinary recommendations.
- Avoid accusatory language.
- Encourage school grievance procedures.`,
  Business: "BUSINESS STRATEGY MODE: Business analysis support and growth strategy. No financial promises.",
  Government: `🏛️ GOVERNMENT SECTOR ADAPTATION:
Tone: Neutral Procedural.
Constraints:
- Strict Political Neutrality.
- No policy promises.
- Encourage official reporting and feedback channels.`,
  Creative: "PROFESSIONAL CREATIVE PRODUCTION: High-quality visuals for institutional awareness.",
  Concerns: `PUBLIC DRAFTING MODE: Help users clearly and respectfully articulate concerns in a professional manner. 
- Tone: Calm and Factual.
- Structure: Subject line, Incident details, Summary, Impact, and Requested outcome.
- Avoid blame or judgment.`,
  Response: `INSTITUTION RESPONSE MODE: Assist institutions in drafting respectful, neutral, and professional responses. 
- Acknowledge concerns without admitting fault. 
- Use non-committal language. 
- Outline next steps and timelines.`
};

const MANDATORY_DISCLAIMER = "\n\n***\n**MANDATORY OUTPUT DISCLAIMER**\nThis draft is for communication support only. It does not determine fault, guarantee outcomes, or replace official complaint procedures. Please submit through the appropriate formal channels.";

export const chatWithKenyaAI = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  module: AIModule,
  location?: { lat: number; lng: number }
): Promise<{ text: string; groundingUrls?: { title: string; uri: string }[] }> => {
  
  // RUNTIME CI/CD GATE: COMPLIANCE CHECK
  const compliance = runComplianceChecks(CANONICAL_CONFIG);
  if (compliance.overallStatus === 'blocked') {
    logAnalyticsEvent('deployment_gate_failed', { details: compliance.checks.filter(c => c.status === 'failed') });
    throw new Error("CRITICAL SECURITY BLOCK: System configuration failed safety compliance scan. Assistant disabled.");
  }

  // Track safety interrupt triggers
  const aggressiveKeywords = ["useless", "corrupt", "lazy", "liar", "malpractice", "negligence", "fire them"];
  if (aggressiveKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
    logAnalyticsEvent('safety_interrupt_triggered', {
      sector: module,
      severity_level: 'High',
      trigger_phrase: message.slice(0, 50) + '...'
    });
  }

  const ai = getAIClient();
  const tools: any[] = [{ googleSearch: {} }];
  
  if (location) {
    tools.push({ googleMaps: {} });
  }

  const model = location ? 'gemini-2.5-flash' : 'gemini-3-flash-preview';

  const response = await ai.models.generateContent({
    model: model,
    contents: [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: `${CANONICAL_CONFIG}\n\nCURRENT SECTOR INSTRUCTIONS: ${MODULE_PROMPTS[module]}`,
      tools: tools,
      toolConfig: location ? {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      } : undefined
    },
  });

  let text = response.text || "I'm sorry, I couldn't process that. Please try again.";
  
  // Analytics for successful generation
  if (module === 'Concerns') {
    logAnalyticsEvent('complaint_draft_created', {
      sector: 'Public',
      tone_selected: 'Calm/Factual',
      user_role: 'Citizen/Patient'
    });
    text += MANDATORY_DISCLAIMER;
  } else if (module === 'Response') {
    logAnalyticsEvent('complaint_response_created', {
      sector: 'Institutional',
      institution_type: 'Service Provider'
    });
    text += MANDATORY_DISCLAIMER;
  }

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const urls = groundingChunks.map((chunk: any) => {
    if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
    if (chunk.maps) return { title: chunk.maps.title, uri: chunk.maps.uri };
    return null;
  }).filter(Boolean) as { title: string; uri: string }[];

  return { text, groundingUrls: urls.length > 0 ? urls : undefined };
};

export const generateKenyaImage = async (prompt: string, module: AIModule = 'Creative'): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `PROFESSIONAL VISUAL PRODUCTION FOR ${module}: ${prompt}. Focus on accuracy, professional quality, and authentic African/Kenyan context.` }
      ],
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data returned from Gemini");
};