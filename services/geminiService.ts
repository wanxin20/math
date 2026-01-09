
import { GoogleGenAI } from "@google/genai";
import { Language } from "../i18n";

export class GeminiSupportService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async getChatResponse(message: string, lang: Language = 'zh', context: string = "") {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          systemInstruction: `You are an intelligent assistant for the XXXX Competition Platform.
          Current User Interface Language: ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.
          Please reply in the SAME language as the User Interface (${lang}).
          Topics you can help with: registration, payment, template downloads, paper submission.
          Context: ${context}
          Keep responses concise, professional, and friendly.`,
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return lang === 'zh' ? "抱歉，我现在遇到了一点问题。" : "Sorry, I am having some trouble right now.";
    }
  }
}

export const geminiService = new GeminiSupportService();