import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// GET: Get current user profile
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, email, age, sex, height, weight, role, specialization, hospital, experience, phone, avatar_url, created_at')
      .eq('id', payload.userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get analysis count
    const { count: analysisCount } = await supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', payload.userId)
      .eq('is_skin', true);

    // Get appointment count
    const { count: appointmentCount } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .or(`patient_id.eq.${payload.userId},doctor_id.eq.${payload.userId}`);

    return NextResponse.json({
      profile,
      stats: {
        analyses: analysisCount || 0,
        appointments: appointmentCount || 0,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update user profile
export async function PUT(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, age, sex, height, weight, phone, specialization, hospital, experience } = body;

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateData.name = name;
    if (age !== undefined) updateData.age = parseInt(age);
    if (sex) updateData.sex = sex;
    if (height !== undefined) updateData.height = parseFloat(height);
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (phone !== undefined) updateData.phone = phone;
    
    // Doctor-specific fields
    if (payload.role === 'doctor') {
      if (specialization) updateData.specialization = specialization;
      if (hospital) updateData.hospital = hospital;
      if (experience !== undefined) updateData.experience = parseInt(experience);
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', payload.userId)
      .select('id, name, email, age, sex, height, weight, role, specialization, hospital, experience, phone, avatar_url, created_at, updated_at')
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
