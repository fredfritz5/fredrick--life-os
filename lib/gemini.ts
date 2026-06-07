import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface VerificationResult {
  matches_goal: boolean;
  different_from_yesterday: boolean;
  confidence: number;
  reasoning: string;
  concerns: string[];
}

export interface VerificationPayload {
  goalText: string;
  verificationCriteria: string;
  todayImageBase64: string;
  todayMimeType?: string;
  yesterdayImageBase64?: string | null;
}

export async function verifyProofImage(payload: VerificationPayload): Promise<VerificationResult> {
  const {
    goalText,
    verificationCriteria,
    todayImageBase64,
    todayMimeType = 'image/jpeg',
    yesterdayImageBase64,
  } = payload;

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const prompt = `You are a strict but fair verification assistant. The user committed to a daily goal: "${goalText}". The sector's verification criteria for this kind of goal: "${verificationCriteria}". The user has submitted an image as proof of completing this goal.${yesterdayImageBase64 ? ' A second image is provided showing what they submitted yesterday for the same sector.' : ' No yesterday image was provided, so assume the new work check passes.'}

Evaluate:
1. Does today's image plausibly show evidence of the stated goal being done?
2. Is today's image meaningfully different from yesterday's, indicating actual new work rather than re-submitting the same proof?

Be skeptical but not paranoid. A screenshot of a code editor with new code is good evidence of coding; an identical screenshot to yesterday's is not.

Return ONLY strict JSON in this exact format, no extra text:
{
  "matches_goal": boolean,
  "different_from_yesterday": boolean,
  "confidence": number between 0 and 1,
  "reasoning": "brief explanation",
  "concerns": ["concern1"]
}`;

  const parts: Parameters<typeof model.generateContent>[0] = [
    prompt,
    {
      inlineData: {
        mimeType: todayMimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        data: todayImageBase64,
      },
    },
  ];

  if (yesterdayImageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: yesterdayImageBase64,
      },
    });
  }

  const response = await model.generateContent(parts);
  const text = response.response.text();

  try {
    const result = JSON.parse(text) as VerificationResult;
    return {
      matches_goal: Boolean(result.matches_goal),
      different_from_yesterday: result.different_from_yesterday !== false,
      confidence: Number(result.confidence) || 0.5,
      reasoning: String(result.reasoning || ''),
      concerns: Array.isArray(result.concerns) ? result.concerns : [],
    };
  } catch {
    return {
      matches_goal: false,
      different_from_yesterday: true,
      confidence: 0,
      reasoning: 'Failed to parse verification response.',
      concerns: ['Verification service returned an unexpected response.'],
    };
  }
}
