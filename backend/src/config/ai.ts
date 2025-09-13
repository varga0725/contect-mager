import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getExternalApiKey } from '../utils/api-keys.js';

// Initialize Google AI client with secure API key management
let genAI: GoogleGenerativeAI;

try {
  const apiKey = getExternalApiKey('google');
  genAI = new GoogleGenerativeAI(apiKey);
} catch (error) {
  logger.warn('Google AI API key not configured, AI features will be disabled');
  genAI = new GoogleGenerativeAI(''); // Fallback for development
}

// Safety settings for content filtering
export const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Model configurations
export const modelConfigs = {
  gemini: {
    model: 'gemini-1.5-pro',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    safetySettings,
  },
  imagen: {
    model: 'imagen-3.0-generate-001',
    // Imagen 3 specific configurations will be added when API is available
  },
  veo: {
    model: 'veo-001',
    // Veo specific configurations will be added when API is available
  },
};

export { genAI };