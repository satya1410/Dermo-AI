import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const { data: doctors, error } = await supabase
      .from('profiles')
      .select('id, name, email, specialization, hospital, experience, phone, avatar_url, created_at')
      .eq('role', 'doctor')
      .order('experience', { ascending: false });

    if (error) {
      console.error('Doctors fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
    }

    return NextResponse.json({ doctors: doctors || [] });
  } catch (error) {
    console.error('Doctors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
