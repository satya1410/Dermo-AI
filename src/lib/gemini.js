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

    const prompt = `You are an expert dermatologist AI with 20+ years of clinical experience. Perform a comprehensive, detailed medical analysis of this skin image.

Patient Info: Age ${patientInfo.age || 'Unknown'}, Sex ${patientInfo.sex || 'Unknown'}, BMI ${bmi}.

Respond ONLY with a valid JSON object (no markdown, no code fences):
{
  "classification": "benign|malignant",
  "condition_name": "specific medical condition name",
  "severity": "Low|Moderate|High|Critical",
  "confidence": 0.87,
  "summary": "2-3 sentence executive summary of findings for the patient",
  "description": "Detailed 4-5 sentence clinical description of the condition, its appearance, and pathophysiology",
  "affected_area": "Specific body area and tissue layers likely affected",
  "gradcam_region": "Plain-language description of which area/feature in the image is most diagnostically significant (e.g., 'The dark irregular border at the upper left of the lesion shows the highest concern and is the primary indicator of this diagnosis')",
  "likelihood_of_occurrence": {
    "general_population": "X in 1000 people",
    "your_age_group": "X%",
    "your_sex": "X% more/less common",
    "overall_risk_level": "Low|Moderate|High"
  },
  "differential_diagnosis": [
    {"condition": "...", "likelihood": "High|Moderate|Low", "distinguishing_factor": "..."},
    {"condition": "...", "likelihood": "High|Moderate|Low", "distinguishing_factor": "..."}
  ],
  "possible_causes": ["cause 1", "cause 2", "cause 3"],
  "risk_factors": ["risk factor 1", "risk factor 2", "risk factor 3"],
  "symptoms_to_watch": ["symptom 1", "symptom 2", "symptom 3"],
  "home_remedies": [
    {"remedy": "name", "instructions": "Step-by-step instructions on how to apply/use this remedy", "frequency": "How often to use", "effectiveness": "High|Moderate|Low", "caution": "Any warnings or contraindications"},
    {"remedy": "name", "instructions": "...", "frequency": "...", "effectiveness": "High|Moderate|Low", "caution": "..."},
    {"remedy": "name", "instructions": "...", "frequency": "...", "effectiveness": "High|Moderate|Low", "caution": "..."}
  ],
  "medical_recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "treatments_available": [
    {"treatment": "name", "type": "Topical|Oral|Procedural|Surgical", "description": "brief description"},
    {"treatment": "name", "type": "Topical|Oral|Procedural|Surgical", "description": "brief description"}
  ],
  "prognosis": "Detailed description of expected outcome with treatment vs without treatment",
  "when_to_seek_emergency": "Specific symptoms or changes that require immediate emergency care",
  "when_to_see_doctor": "Specific timeframe and symptoms that indicate a doctor visit is needed",
  "prevention_tips": ["prevention tip 1", "prevention tip 2", "prevention tip 3"],
  "lifestyle_advice": "Detailed 2-3 sentence lifestyle modification advice",
  "dietary_recommendations": ["food 1 to avoid/consume", "food 2", "food 3"],
  "additional_notes": "Any other clinically relevant information"
}`;

    const result = await executeWithFallback((model) =>
      model.generateContent([
        prompt,
        { inlineData: { mimeType, data: imageBase64 } },
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

    const prompt = `You are an expert dermatologist AI with 20+ years of clinical experience. A local PyTorch computer vision model has classified a skin image:
- Classification: ${localResult.classification}
- Condition: ${localResult.condition_name}
- Confidence: ${(localResult.confidence * 100).toFixed(1)}%
- Severity: ${localResult.severity}
Patient Info: Age ${patientInfo.age || 'Unknown'}, Sex ${patientInfo.sex || 'Unknown'}, BMI ${bmi}.

Generate a comprehensive, detailed medical report. Respond ONLY with a valid JSON object (no markdown):
{
  "classification": "${localResult.classification}",
  "condition_name": "${localResult.condition_name}",
  "severity": "${localResult.severity}",
  "confidence": ${localResult.confidence},
  "summary": "2-3 sentence plain-language executive summary for the patient",
  "description": "Detailed 4-5 sentence clinical description of this specific condition, its appearance, and pathophysiology",
  "affected_area": "Specific body areas and tissue layers typically affected",
  "gradcam_region": "Description of which visual features in the image are most diagnostically significant (e.g., 'Irregular asymmetric border and uneven pigmentation are the primary diagnostic markers for this classification')",
  "likelihood_of_occurrence": {
    "general_population": "X in 1000 people",
    "your_age_group": "X% of this age group",
    "your_sex": "X% more/less common in this sex",
    "overall_risk_level": "Low|Moderate|High"
  },
  "differential_diagnosis": [
    {"condition": "alternative condition name", "likelihood": "High|Moderate|Low", "distinguishing_factor": "what distinguishes it"},
    {"condition": "another alternative", "likelihood": "High|Moderate|Low", "distinguishing_factor": "what distinguishes it"}
  ],
  "possible_causes": ["specific cause 1", "specific cause 2", "specific cause 3"],
  "risk_factors": ["risk factor 1", "risk factor 2", "risk factor 3"],
  "symptoms_to_watch": ["warning symptom 1", "warning symptom 2", "warning symptom 3"],
  "home_remedies": [
    {"remedy": "remedy name", "instructions": "Detailed step-by-step application instructions", "frequency": "e.g. twice daily for 2 weeks", "effectiveness": "High|Moderate|Low", "caution": "warnings or contraindications"},
    {"remedy": "remedy name", "instructions": "...", "frequency": "...", "effectiveness": "High|Moderate|Low", "caution": "..."},
    {"remedy": "remedy name", "instructions": "...", "frequency": "...", "effectiveness": "High|Moderate|Low", "caution": "..."}
  ],
  "medical_recommendations": ["medical action 1", "medical action 2", "medical action 3"],
  "treatments_available": [
    {"treatment": "treatment name", "type": "Topical|Oral|Procedural|Surgical", "description": "how it works and typical duration"},
    {"treatment": "treatment name", "type": "Topical|Oral|Procedural|Surgical", "description": "..."}
  ],
  "prognosis": "Expected outcome with proper treatment vs if untreated, including timeline",
  "when_to_seek_emergency": "Specific red-flag symptoms requiring immediate ER visit",
  "when_to_see_doctor": "Specific timeframe and criteria for scheduling a dermatologist appointment",
  "prevention_tips": ["prevention tip 1", "prevention tip 2", "prevention tip 3"],
  "lifestyle_advice": "Detailed 2-3 sentence advice on diet, sun exposure, skin care routine",
  "dietary_recommendations": ["beneficial food 1", "food to avoid 1", "supplement suggestion"],
  "additional_notes": "Any other clinically relevant information or caveats"
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
