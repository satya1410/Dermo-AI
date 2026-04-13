import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('id, image_url, is_skin, classification, condition_name, severity, confidence, report, created_at')
      .eq('user_id', payload.userId)
      .eq('is_skin', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('History fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json({ analyses: analyses || [] });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
