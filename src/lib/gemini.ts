import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const VIDEO_MODELS = {
  PREVIEW: "veo-3.1-lite-generate-preview",
  HIGH_QUALITY: "veo-3.1-generate-preview",
};

export const TEXT_MODELS = {
  FAST: "gemini-3-flash-preview",
  PRO: "gemini-3.1-pro-preview",
};
