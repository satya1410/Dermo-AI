import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// GET: Fetch appointments for the current user
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query;
    
    if (payload.role === 'doctor') {
      // Doctors see appointments assigned to them
      query = supabase
        .from('appointments')
        .select(`
          id, status, scheduled_date, scheduled_time, reason, notes, created_at, updated_at,
          patient:patient_id (id, name, email, age, sex),
          analysis:analysis_id (id, condition_name, severity, classification)
        `)
        .eq('doctor_id', payload.userId)
        .order('created_at', { ascending: false });
    } else {
      // Patients see their own appointments
      query = supabase
        .from('appointments')
        .select(`
          id, status, scheduled_date, scheduled_time, reason, notes, created_at, updated_at,
          doctor:doctor_id (id, name, email, specialization, hospital),
          analysis:analysis_id (id, condition_name, severity, classification)
        `)
        .eq('patient_id', payload.userId)
        .order('created_at', { ascending: false });
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Appointments fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    return NextResponse.json({ appointments: appointments || [] });
  } catch (error) {
    console.error('Appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new appointment
export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { doctor_id, analysis_id, scheduled_date, scheduled_time, reason } = body;

    if (!doctor_id || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { error: 'Doctor, date, and time are required' },
        { status: 400 }
      );
    }

    // Create appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: payload.userId,
        doctor_id,
        analysis_id: analysis_id || null,
        scheduled_date,
        scheduled_time,
        reason: reason || null,
        status: 'pending',
      })
      .select('id, status, scheduled_date, scheduled_time, reason, created_at')
      .single();

    if (error) {
      console.error('Create appointment error:', error);
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }

    // Get patient name for notification
    const { data: patient } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', payload.userId)
      .single();

    // Get analysis info if provided
    let analysisInfo = '';
    if (analysis_id) {
      const { data: analysis } = await supabase
        .from('analyses')
        .select('condition_name, severity')
        .eq('id', analysis_id)
        .single();
      if (analysis) {
        analysisInfo = ` regarding ${analysis.condition_name} (${analysis.severity} severity)`;
      }
    }

    // Notify the doctor
    await supabase.from('notifications').insert({
      user_id: doctor_id,
      title: 'New Appointment Request',
      message: `${patient?.name || 'A patient'} has requested an appointment on ${scheduled_date} at ${scheduled_time}${analysisInfo}. Reason: ${reason || 'General consultation'}`,
      type: 'appointment',
      related_id: appointment.id,
    });

    return NextResponse.json({
      message: 'Appointment request sent successfully',
      appointment,
    }, { status: 201 });
  } catch (error) {
    console.error('Appointment creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
