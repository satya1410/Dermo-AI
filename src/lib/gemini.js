import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Provide fallback models in case the first one is disabled or not found
const FALLBACK_MODELS = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-pro',
  'gemini-1.0-pro'
];

async function executeWithFallback(action) {
  let lastError;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      return await action(model);
    } catch (error) {
      console.warn(`[Gemini Fallback] Model ${modelName} failed:`, error.message || error);
      lastError = error;
      // If it's a rate limit or API key error, don't fall back, throw immediately
      if (error.message?.includes('429') || error.message?.includes('403') || error.message?.includes('API key')) {
        throw error;
      }
    }
  }
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Check if the uploaded image is a skin/dermatological image
 */
export async function verifySkinImage(imageBase64, mimeType = 'image/jpeg') {
  try {
    const prompt = `You are a medical image analysis expert. Analyze this image and determine if it shows human skin, a skin lesion, skin condition, or any dermatological concern.

Respond ONLY with a valid JSON object (no markdown, no code fences):
{"is_skin": true/false, "reason": "brief explanation of what you see in the image"}

Rules:
- Return true if the image shows any part of human skin with a visible condition, lesion, rash, mole, or any dermatological concern
- Return true even if it's a close-up of skin
- Return false if the image is not related to skin/dermatology
- Return false if the image is too blurry, dark, or unclear`;

    const result = await executeWithFallback((model) => 
      model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
      ])
    );

    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Verify skin error:', error);
    // Fallback: Default to true if Gemini fails but try to be safe
    return { is_skin: true, reason: 'Analysis fallback enabled' };
  }
}

/**
 * Perform full skin analysis and generate detailed report
 */
export async function analyzeSkinCondition(imageBase64, mimeType = 'image/jpeg', patientInfo = {}) {
  try {
    const bmi = patientInfo.height && patientInfo.weight
      ? (patientInfo.weight / ((patientInfo.height / 100) ** 2)).toFixed(1)
      : 'Unknown';

    const prompt = `You are an expert dermatologist AI. Analyze the following skin image and provide a comprehensive medical assessment.

Patient Info: Age ${patientInfo.age || 'Unknown'}, Sex ${patientInfo.sex || 'Unknown'}, BMI ${bmi}.

Respond ONLY with a valid JSON object:
{
  "classification": "benign|malignant",
  "condition_name": "specific condition name",
  "severity": "Low|Moderate|High|Critical",
  "confidence": 0.85,
  "description": "...",
  "affected_area": "...",
  "possible_causes": ["..."],
  "risk_factors": ["..."],
  "symptoms_to_watch": ["..."],
  "home_remedies": [
    {"remedy": "...", "description": "...", "effectiveness": "High|Moderate|Low"}
  ],
  "medical_recommendations": ["..."],
  "when_to_see_doctor": "...",
  "prevention_tips": ["..."],
  "lifestyle_advice": "...",
  "additional_notes": "..."
}`;

    const result = await executeWithFallback((model) =>
      model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
      ])
    );

    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('FULL Gemini Error:', error);
    throw new Error(error.message?.includes('429') 
      ? 'AI quota exceeded. Please wait a minute and try again.' 
      : `AI Error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate a detailed medical report based on local model classification
 */
export async function generateReportFromLocalClass(localResult, patientInfo = {}) {
  try {
    const bmi = patientInfo.height && patientInfo.weight
      ? (patientInfo.weight / ((patientInfo.height / 100) ** 2)).toFixed(1)
      : 'Unknown';

    const prompt = `You are an expert dermatologist AI. A local computer vision model has classified a skin image with the following results:
- Classification: ${localResult.classification}
- Condition Name: ${localResult.condition_name}
- Confidence: ${(localResult.confidence * 100).toFixed(1)}%
- Base Severity: ${localResult.severity}

Patient Info: Age ${patientInfo.age || 'Unknown'}, Sex ${patientInfo.sex || 'Unknown'}, BMI ${bmi}.

Based on this classification, generate a comprehensive medical report. 
Respond ONLY with a valid JSON object:
{
  "classification": "${localResult.classification}",
  "condition_name": "${localResult.condition_name}",
  "severity": "${localResult.severity}",
  "confidence": ${localResult.confidence},
  "description": "Detailed description of this condition and what it looks like",
  "affected_area": "Likely affected body areas",
  "possible_causes": ["..."],
  "risk_factors": ["..."],
  "symptoms_to_watch": ["..."],
  "home_remedies": [
    {"remedy": "...", "description": "...", "effectiveness": "High|Moderate|Low"}
  ],
  "medical_recommendations": ["..."],
  "when_to_see_doctor": "...",
  "prevention_tips": ["..."],
  "lifestyle_advice": "...",
  "additional_notes": "..."
}`;

    const result = await executeWithFallback((model) => model.generateContent(prompt));
    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Report generation error:', error);
    // Return a basic report if Gemini fails
    return {
      ...localResult,
      description: `Analysis complete. Condition detected: ${localResult.condition_name}.`,
      home_remedies: [{ remedy: 'Consult doctor', description: 'Please consult a dermatologist for treatment advice.', effectiveness: 'High' }],
      medical_recommendations: ['Seek professional medical advice.']
    };
  }
}

/**
 * Generate medical news summaries
 */
export async function generateMedicalNews() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const prompt = `Generate 6 recent dermatology/medical news headlines as a JSON array. 
Category: Dermatology|Research|Technology|Treatment.
Structure: {"id", "title", "summary", "category", "date", "source", "emoji"}. 
Date near ${today}.`;

    const result = await executeWithFallback((model) => model.generateContent(prompt));
    const response = result.response.text();
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('News generation error:', error);
    return []; // Return empty array so API route can use static fallback
  }
}
