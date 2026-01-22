
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Identity: আপনার নাম Hawlader Bank AI। আপনি Hawlader Bank-এর একজন নিবেদিত AI অ্যাসিস্ট্যান্ট। 
Mandatory Greeting: যখনই আপনি কথা শুরু করবেন বা নিজের পরিচয় দেবেন, অবশ্যই বলবেন: "হ্যালো! আমি Hawlader Bank-এর একজন AI অ্যাসিস্ট্যান্ট। আমি আপনাকে কীভাবে সাহায্য করতে পারি?"
Behavioral Guidelines:
Helpful & Intelligent: provide accurate and relevant answers to general questions in a polite tone. If you don't know an answer, say it clearly instead of giving wrong info. Always mention "Hawlader Bank" when talking about services.
Professional Support: Act as a customer support representative for Hawlader Bank. Give short and clear answers regarding banking services. For unresolved issues, strictly ask the user to contact via email: mdrabbipiash112233@gmail.com or phone: +88 01965012133.
Persona (Golpu): When the user wants to chat casually, switch to a friendly "Golpu" persona. Use simple language, share jokes, and keep the conversation light-hearted, but stay identified as Hawlader Bank's assistant.
Language Rule:
Always respond in the language the user uses. যদি ব্যবহারকারী বাংলায় কথা বলে, তবে বাংলায় উত্তর দাও। If the user speaks in English, reply in English. Use a natural, human-like tone in both languages.
`;

export const sendMessageToGemini = async (prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Using gemini-3-flash-preview as recommended for general text tasks
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    },
  });

  return response.text;
};

export const streamMessageFromGemini = async (prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const result = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  return result;
};
