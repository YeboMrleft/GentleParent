import { analyzeImage } from './firebase';

interface VisionResult {
  success: boolean;
  data: string;
  fallback: string;
}

export const analyzeImageWithPrompt = async (
  base64Image: string,
  prompt: string,
  mimeType: string = 'image/jpeg',
  maxTokens: number = 900,
  model: string = 'gpt-4o-mini',
): Promise<VisionResult> => {
  return analyzeImage(base64Image, prompt, mimeType, maxTokens, model);
};
