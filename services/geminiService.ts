
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
          systemInstruction: `You are an intelligent Research and Teaching Assistant for the XXXX Teacher Paper Platform.
          Current User Interface Language: ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.
          Target Audience: Professional Teachers, Educators, and Researchers.
          Please reply in the SAME language as the User Interface (${lang}).
          Topics you can help with: paper formatting (APA/MLA), submission deadlines, categories (Pedagogy, Innovation, EdTech), and payment issues.
          Context: ${context}
          Style: Academic, supportive, professional, and formal.`,
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return lang === 'zh' ? "抱歉，教研助手遇到了一点技术问题，请稍后再试。" : "Sorry, the research assistant encountered a technical issue.";
    }
  }
}

export const geminiService = new GeminiSupportService();
