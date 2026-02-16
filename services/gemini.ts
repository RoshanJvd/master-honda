
import { GoogleGenAI } from "@google/genai";
import { Part } from '../types';
import { logger } from './logger.ts';

let lastRequestTime = 0;
const RATE_LIMIT_MS = 3000; // 3 second cooldown

export const askInventoryAssistant = async (query: string, inventory: Part[]) => {
  const now = Date.now();
  if (now - lastRequestTime < RATE_LIMIT_MS) {
    return "Rate limit active. Please wait a moment before sending another query to ensure system stability.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const inventoryContext = JSON.stringify(inventory.map(i => ({
    name: i.name,
    stock: i.stock,
    minStock: i.minStock,
    price: i.price,
    partNumber: i.partNumber
  })));

  const systemPrompt = `You are the "Atlas Honda AI Assistant", an expert in motorcycle dealership operations. 
  You have access to the current inventory: ${inventoryContext}. 
  Provide professional, concise advice on inventory management, stock alerts, or customer compatibility. 
  If stock is below minStock, flag it as critical. Keep responses under 100 words. 
  Format using clear bullet points where appropriate. Use a premium, corporate tone reflecting Atlas Honda's standards in Pakistan.`;

  try {
    lastRequestTime = now;
    logger.info("Initiating AI synthesis request", { query });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    if (!response || !response.text) {
      throw new Error("Empty response received from GenAI node");
    }

    logger.success("AI synthesis complete");
    return response.text;
  } catch (error: any) {
    logger.error("Gemini AI Node Failure", { error: error.message });
    return `Operational Alert: The AI service is currently unavailable (${error.message || 'Network Timeout'}). Please proceed with manual inventory reconciliation.`;
  }
};
