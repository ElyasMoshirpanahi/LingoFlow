
import { GoogleGenAI, Type, Modality } from "@google/genai";

export const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

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

export const processText = async (
  text: string, 
  sourceLang: string, 
  targetLang: string
): Promise<{ en: string; fa: string }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Split the following text into individual sentences. The text is in ${sourceLang}. Translate each into clear, contextual ${targetLang}. Return a JSON array of objects with keys "en" (original) and "fa" (translation).\n\nText: ${text}`,
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
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const getWordDefinition = async (
  word: string, 
  context: string, 
  targetLang: string
): Promise<{ word: string, definition: string, example: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Explain the word "${word}" as used in this context: "${context}". Provide the definition and an example sentence in ${targetLang}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          definition: { type: Type.STRING },
          example: { type: Type.STRING }
        },
        required: ["word", "definition", "example"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

const VOICE_MAP: Record<string, string> = {
  'English': 'Kore',
  'Persian': 'Puck',
  'Spanish': 'Zephyr',
  'French': 'Charon',
  'German': 'Fenrir'
};

export const generateTTS = async (
  text: string, 
  langName: string, 
  audioContext: AudioContext
): Promise<AudioBuffer | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const voiceName = VOICE_MAP[langName] || 'Kore';
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return null;

  const bytes = decodeBase64(base64Audio);
  return await decodeAudioPCM(bytes, audioContext);
};
