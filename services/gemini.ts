
import { GoogleGenAI } from "@google/genai";
import { Part } from '../types';
import { logger } from './logger.ts';

let lastRequestTime = 0;
const RATE_LIMIT_MS = 3000;

export const askInventoryAssistant = async (query: string, inventory: Part[]) => {
  const now = Date.now();
  if (now - lastRequestTime < RATE_LIMIT_MS) {
    return "Please wait a moment before sending another query.";
  }

  // Safe check for API key
  const apiKey = (window as any).process?.env?.API_KEY || '';
  if (!apiKey) {
    logger.warn("AI Assistant: Missing API_KEY configuration");
    return "AI system is offline (API Key not configured). Please contact support.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const inventoryContext = JSON.stringify(inventory.map(i => ({
    name: i.name,
    stock: i.stock,
    minStock: i.minStock,
    price: i.price
  })));

  const systemPrompt = `You are the Master Honda AI Assistant. Context: ${inventoryContext}. Keep responses professional, brief (under 100 words), and focused on dealership operations.`;

  try {
    lastRequestTime = now;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    logger.error("AI Node Failure", { error: error.message });
    return `Error connecting to AI service.`;
  }
};
