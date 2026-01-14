
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Standard base64 decoding helper
export const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// PCM decoding helper according to guidelines
export const decodeAudioPCM = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

// Process input text using Gemini 3 Flash
export const processText = async (text: string): Promise<{ en: string; fa: string }[]> => {
  // Always use process.env.API_KEY directly in the constructor
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Split the following text into individual sentences and translate each into clear, contextual Persian. Return a JSON array of objects with keys "en" and "fa".\n\nText: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            en: { type: Type.STRING },
            fa: { type: Type.STRING }
          },
          required: ["en", "fa"]
        }
      }
    }
  });

  try {
    // response.text is a property, not a method
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

// Generate TTS audio using Gemini 2.5 Flash TTS
export const generateTTS = async (
  text: string, 
  language: 'en' | 'fa', 
  audioContext: AudioContext
): Promise<AudioBuffer | null> => {
  // Always use process.env.API_KEY directly in the constructor
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = language === 'en' 
    ? `Say clearly: ${text}` 
    : `بگو: ${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: language === 'en' ? 'Kore' : 'Puck' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return null;

  const bytes = decodeBase64(base64Audio);
  return await decodeAudioPCM(bytes, audioContext);
};
