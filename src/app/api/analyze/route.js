import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { verifySkinImage, generateReportFromLocalClass, analyzeSkinCondition } from '@/lib/gemini';
import { classifyLocally } from '@/lib/ml';

export const maxDuration = 60; // Allow 60 seconds for Vercel Serverless execution


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

    // --- NEW: Upload to Supabase Storage ---
    let finalImageUrl = image; // Default to original base64 as fallback
    try {
      const fileName = `${payload.userId}/${Date.now()}.${detectedMimeType.split('/')[1] || 'jpg'}`;
      const buffer = Buffer.from(base64Data, 'base64');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('skin-images')
        .upload(fileName, buffer, {
          contentType: detectedMimeType,
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('skin-images')
          .getPublicUrl(fileName);
        
        finalImageUrl = publicUrl;
      }
    } catch (storageErr) {
      console.error('Buffer/Storage error:', storageErr);
    }
    // ----------------------------------------

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
        image_url: finalImageUrl, 
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

    // --- CLASSIFICATION LOGIC ---
    let report;

    if (process.env.VERCEL || (process.env.NODE_ENV === 'production' && !process.env.LOCAL_SERVER)) {
      // ON VERCEL: Directly use Gemini Vision to analyze the image
      report = await analyzeSkinCondition(base64Data, detectedMimeType, profile || {});
    } else {
      // LOCALLY: Use the PyTorch model via python classification
      const localResult = await classifyLocally(base64Data);
      report = await generateReportFromLocalClass(localResult, profile || {});
    }
    // ------------------------------------------------

    // Step 4: Save to database
    const { data: analysis, error: saveError } = await supabase
      .from('analyses')
      .insert({
        user_id: payload.userId,
        image_url: finalImageUrl, // Use the new cloud URL
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
    console.error('CRITICAL Analysis route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image. Please try again.' },
      { status: 500 }
    );
  }
}
