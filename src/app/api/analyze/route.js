import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { verifySkinImage, analyzeSkinCondition } from '@/lib/gemini';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { image, mimeType = 'image/jpeg' } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Extract base64 data (remove data URL prefix if present)
    let base64Data = image;
    let detectedMimeType = mimeType;
    if (image.startsWith('data:')) {
      const parts = image.split(',');
      base64Data = parts[1];
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      if (mimeMatch) detectedMimeType = mimeMatch[1];
    }

    // Get patient info for personalized analysis
    const { data: profile } = await supabase
      .from('profiles')
      .select('age, sex, height, weight')
      .eq('id', payload.userId)
      .single();

    // Step 1: Verify if the image is a skin image using Gemini
    const verification = await verifySkinImage(base64Data, detectedMimeType);

    if (!verification.is_skin) {
      // Save analysis with is_skin = false
      await supabase.from('analyses').insert({
        user_id: payload.userId,
        image_url: image.substring(0, 500), // Store truncated for non-skin
        is_skin: false,
        classification: null,
        report: { reason: verification.reason },
      });

      return NextResponse.json({
        is_skin: false,
        reason: verification.reason,
        message: 'The uploaded image does not appear to be a skin or dermatological image. Please upload a clear image of the affected skin area.',
      });
    }

    // Step 2: Full skin analysis with Gemini
    const report = await analyzeSkinCondition(base64Data, detectedMimeType, profile || {});

    // Step 3: Save to database
    const { data: analysis, error: saveError } = await supabase
      .from('analyses')
      .insert({
        user_id: payload.userId,
        image_url: image,
        is_skin: true,
        classification: report.classification,
        condition_name: report.condition_name,
        severity: report.severity,
        confidence: report.confidence,
        report: report,
      })
      .select('id, classification, condition_name, severity, confidence, report, created_at')
      .single();

    if (saveError) {
      console.error('Save analysis error:', saveError);
    }

    // Step 4: Create notification for the patient
    await supabase.from('notifications').insert({
      user_id: payload.userId,
      title: 'Analysis Complete',
      message: `Your skin analysis has been completed. Condition: ${report.condition_name} (${report.severity} severity)`,
      type: 'report',
      related_id: analysis?.id,
    });

    return NextResponse.json({
      is_skin: true,
      analysis: analysis || { report },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    );
  }
}
