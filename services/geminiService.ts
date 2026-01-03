import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ImageSize, AspectRatio } from "../types";

// Helper to get AI instance - ensuring we use the latest key if selected via UI
const getAI = () => {
  // API key must be obtained exclusively from process.env.API_KEY
  const key = process.env.API_KEY;
  if (!key) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey: key });
};

export const generateText = async (
  prompt: string, 
  image: string | undefined,
  history: { role: string; parts: any[] }[] = []
): Promise<string> => {
  const ai = getAI();
  // Using Flash for general fast responses
  const model = "gemini-3-flash-preview"; 
  
  // Construct current turn content
  const currentParts: any[] = [{ text: prompt }];
  
  if (image) {
    // Basic base64 cleanup if needed, though usually passed clean
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
    currentParts.push({
      inlineData: {
        mimeType: 'image/png', // Assumption for simplicity, ideal to pass actual mime
        data: base64Data
      }
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history.map(h => ({ role: h.role, parts: h.parts })),
      { role: 'user', parts: currentParts }
    ]
  });

  return response.text || "No response generated.";
};

export const generateImagePro = async (
  prompt: string,
  size: ImageSize,
  aspectRatio: AspectRatio
): Promise<string> => {
  
  // Handling the High-Quality Model Key Selection Requirement
  // "When using gemini-3-pro-image-preview, users MUST select their own API key."
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
     const hasKey = await window.aistudio.hasSelectedApiKey();
     if (!hasKey) {
        // Trigger selection
        await window.aistudio.openSelectKey();
        // Race condition mitigation as per instructions: assume success immediately
     }
  }

  // Always create new instance to pick up potentially new key
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      }
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated in response.");
};

export const editImage = async (
  prompt: string,
  base64Image: string,
  mimeType: string = "image/png"
): Promise<string> => {
  const ai = getAI();
  
  // Using Nano Banana (Gemini 2.5 Flash Image) for editing
  const model = "gemini-2.5-flash-image";

  // Strip prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        },
        {
          text: prompt
        }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No edited image returned. The model might have returned text instead: " + response.text);
};

// Simulated Local LLM / Ollama Handler
export const generateLocal = async (
  prompt: string,
  baseUrl: string,
  modelName: string
): Promise<string> => {
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false
      })
    });
    
    if (!response.ok) throw new Error("Failed to connect to Local LLM");
    const data = await response.json();
    return data.response;
  } catch (e) {
    throw new Error(`Local LLM Error: ${e instanceof Error ? e.message : String(e)}`);
  }
};