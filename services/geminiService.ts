
import { GoogleGenAI } from "@google/genai";
import { Subject } from "../types";

export async function askGemini(prompt: string, subject: Subject) {
  try {
    // Initializing with the required named parameter and using process.env.API_KEY directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `You are a professional ${subject} professor. 
    Explain technical concepts clearly for first-year engineering students. 
    Focus only on ${subject === Subject.ELECTRICAL ? 'Power Systems, Transformers, Circuit Laws, and Machines' : 'Microprocessors, Integrated Circuits, Digital Signal Processing, and Semiconductor Devices'}.`;

    // Using gemini-3-pro-preview for complex engineering reasoning tasks as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Directly accessing the .text property as per the latest SDK requirements.
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I am currently calibrating my circuits. Please try again in a moment.";
  }
}
