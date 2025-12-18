import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_OCR, SYSTEM_INSTRUCTION_ADVISOR, SYSTEM_INSTRUCTION_REPORT, FOP_LIMITS, MILITARY_LEVY_RATE_G3, MILITARY_LEVY_FIXED } from "../constants";
import { FopGroup, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExtractedIncomeData {
  amount: number;
  currency: 'UAH' | 'USD' | 'EUR';
  date: string;
  description: string;
}

/**
 * Extracts income details from a receipt/invoice image.
 */
export const extractIncomeFromImage = async (base64Image: string): Promise<ExtractedIncomeData> => {
  try {
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          },
          {
            text: "Extract amount, currency, date, and description. Return strictly JSON."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_OCR,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING, enum: ['UAH', 'USD', 'EUR'] },
            date: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['amount', 'currency', 'date']
        }
      }
    });

    if (!response.text) {
      throw new Error("No text returned from AI");
    }

    const data = JSON.parse(response.text);
    return data as ExtractedIncomeData;

  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw new Error("Не вдалося обробити документ.");
  }
};

/**
 * Generates a friendly analysis of the current tax situation.
 */
export const generateTaxAdvice = async (profile: UserProfile, totalIncome: number): Promise<string> => {
  const limit = FOP_LIMITS[profile.group];
  const percentUsed = (totalIncome / limit) * 100;

  // Additional 2026 Context for Prompt
  let taxContext = "";
  if (profile.group === FopGroup.GROUP_3) {
      const ep = totalIncome * profile.taxRate;
      const vs = totalIncome * MILITARY_LEVY_RATE_G3;
      taxContext = `Єдиний податок: ${ep.toFixed(0)} грн. Військовий збір (1%): ${vs.toFixed(0)} грн.`;
  } else {
      const vs = MILITARY_LEVY_FIXED;
      taxContext = `Фіксований Військовий збір: ${vs} грн/міс.`;
  }

  const prompt = `
    Профіль користувача (2026 рік):
    - Група ФОП: ${profile.group}
    - Ставка податку: ${profile.taxRate * 100}%
    - Наявність співробітників: ${profile.hasEmployees ? 'Так' : 'Ні'}
    
    Поточний стан:
    - Загальний дохід (з початку року): ${totalIncome} UAH
    - Розрахункові податки: ${taxContext}
    - Ліміт групи: ${limit} UAH
    - Використано ліміту: ${percentUsed.toFixed(2)}%

    Надай короткий (2 речення) статус українською мовою. 
    Якщо ліміт близький (>80%), попередь ввічливо.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ADVISOR,
        maxOutputTokens: 150
      }
    });
    return response.text || "Статус нормальний.";
  } catch (e) {
    console.error("Gemini Advice Error", e);
    return "Система працює. Слідкуйте за лімітами.";
  }
};

/**
 * Generates report content for download.
 */
export const generateReportContent = async (reportType: string, dataSummary: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Згенеруй текст для звіту: "${reportType}".
      Дані для звіту:
      ${dataSummary}
      
      Сформуй це як офіційний текстовий документ з заголовками та підсумками.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_REPORT
      }
    });
    return response.text || "Помилка генерації звіту.";
  } catch (e) {
    return "Сервіс звітності тимчасово недоступний.";
  }
};