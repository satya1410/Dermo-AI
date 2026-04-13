import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// PATCH: Update appointment status (accept/reject by doctor)
export async function PATCH(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status || !['accepted', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be accepted, rejected, or completed.' },
        { status: 400 }
      );
    }

    // Get the appointment to verify ownership
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*, doctor:doctor_id(name), patient:patient_id(name)')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Only the assigned doctor can update status
    if (appointment.doctor_id !== payload.userId && payload.role !== 'doctor') {
      return NextResponse.json({ error: 'Not authorized to update this appointment' }, { status: 403 });
    }

    // Update the appointment
    const updateData = { status, updated_at: new Date().toISOString() };
    if (notes) updateData.notes = notes;

    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update appointment error:', updateError);
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }

    // Notify the patient
    const statusText = status === 'accepted' ? 'accepted ✅' : status === 'rejected' ? 'declined ❌' : 'completed ✓';
    await supabase.from('notifications').insert({
      user_id: appointment.patient_id,
      title: `Appointment ${statusText}`,
      message: `Dr. ${appointment.doctor?.name || 'Your doctor'} has ${statusText} your appointment for ${appointment.scheduled_date} at ${appointment.scheduled_time}.${notes ? ' Note: ' + notes : ''}`,
      type: 'appointment',
      related_id: id,
    });

    return NextResponse.json({
      message: `Appointment ${status} successfully`,
      appointment: updated,
    });
  } catch (error) {
    console.error('Appointment update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
