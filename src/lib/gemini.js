import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Check if the uploaded image is a skin/dermatological image
 */
export async function verifySkinImage(imageBase64, mimeType = 'image/jpeg') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a medical image analysis expert. Analyze this image and determine if it shows human skin, a skin lesion, skin condition, wound, or any dermatological concern.

Respond ONLY with a valid JSON object (no markdown, no code fences):
{"is_skin": true/false, "reason": "brief explanation of what you see in the image"}

Rules:
- Return true if the image shows any part of human skin with a visible condition, lesion, wound, rash, mole, or any dermatological concern
- Return true even if it's a close-up of skin
- Return false if the image is not related to skin/dermatology (e.g., landscapes, objects, animals, text documents)
- Return false if the image is too blurry, dark, or unclear to make a medical assessment`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const response = result.response.text();
  
  try {
    // Clean the response - remove any markdown code fences
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // If parsing fails, try to extract the boolean
    const isSkin = response.toLowerCase().includes('"is_skin": true') || 
                   response.toLowerCase().includes('"is_skin":true');
    return { is_skin: isSkin, reason: 'Image analysis completed' };
  }
}

/**
 * Perform full skin analysis and generate detailed report
 */
export async function analyzeSkinCondition(imageBase64, mimeType = 'image/jpeg', patientInfo = {}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const bmi = patientInfo.height && patientInfo.weight
    ? (patientInfo.weight / ((patientInfo.height / 100) ** 2)).toFixed(1)
    : 'Unknown';

  const prompt = `You are an expert dermatologist AI assistant performing a detailed skin analysis. Analyze the following skin image and provide a comprehensive medical assessment.

Patient Information:
- Age: ${patientInfo.age || 'Unknown'}
- Sex: ${patientInfo.sex || 'Unknown'}
- BMI: ${bmi}
- Height: ${patientInfo.height ? patientInfo.height + ' cm' : 'Unknown'}
- Weight: ${patientInfo.weight ? patientInfo.weight + ' kg' : 'Unknown'}

Classification Categories:
1. BENIGN: Benign skin lesion (e.g., mole/nevus, seborrheic keratosis, dermatofibroma, skin tag, cherry angioma)
2. MALIGNANT: Malignant/pre-malignant skin lesion (e.g., melanoma, basal cell carcinoma, squamous cell carcinoma, actinic keratosis)
3. WOUND: Wound type (e.g., abrasion, laceration, burn, pressure ulcer, surgical wound, diabetic ulcer, venous ulcer)
4. SKIN_CONDITION: General skin condition (e.g., eczema, psoriasis, dermatitis, acne, fungal infection, rash, urticaria)

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact format:
{
  "classification": "benign|malignant|wound|skin_condition",
  "condition_name": "specific condition name",
  "severity": "Low|Moderate|High|Critical",
  "confidence": 0.85,
  "description": "Detailed description of what is observed in the image, including size, color, shape, borders, and texture",
  "affected_area": "Body part or region affected",
  "possible_causes": ["cause 1", "cause 2", "cause 3"],
  "risk_factors": ["risk factor 1", "risk factor 2"],
  "symptoms_to_watch": ["symptom 1", "symptom 2"],
  "home_remedies": [
    {"remedy": "remedy name", "description": "detailed instructions on how to apply", "effectiveness": "High|Moderate|Low"},
    {"remedy": "remedy name 2", "description": "detailed instructions", "effectiveness": "High|Moderate|Low"}
  ],
  "medical_recommendations": ["recommendation 1", "recommendation 2"],
  "when_to_see_doctor": "Clear description of warning signs that require immediate medical attention",
  "prevention_tips": ["prevention tip 1", "prevention tip 2"],
  "lifestyle_advice": "personalized advice based on the patient's age, sex, and BMI",
  "additional_notes": "any other relevant observations or considerations"
}

Important:
- Be thorough and medically accurate
- Consider the patient's demographics when providing advice
- Provide at least 3-5 home remedies with detailed instructions
- Include both immediate and long-term recommendations
- Be clear about severity - err on the side of caution for potentially serious conditions
- Always recommend professional consultation for anything that could be malignant`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const response = result.response.text();

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI analysis response. Please try again.');
  }
}

/**
 * Generate medical news summaries
 */
export async function generateMedicalNews() {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const today = new Date().toISOString().split('T')[0];

  const prompt = `Generate 6 recent and realistic medical news articles related to dermatology, skin health, and medical technology. These should be based on real trends and developments in the medical field as of ${today}.

Respond ONLY with a valid JSON array (no markdown, no code fences):
[
  {
    "id": 1,
    "title": "compelling headline",
    "summary": "2-3 sentence summary of the article",
    "category": "Dermatology|Research|Technology|Public Health|Treatment|Prevention",
    "date": "YYYY-MM-DD format, recent date",
    "source": "realistic medical journal or news source name",
    "emoji": "relevant emoji for the category"
  }
]

Make the articles diverse - cover topics like:
- New skin cancer research breakthroughs
- AI in dermatology
- New treatment methods
- Sun protection updates
- Skin health awareness
- Wound care innovations`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
