import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json({ error: 'doctor_id and date are required' }, { status: 400 });
    }

    // Get booked slots for this doctor on this date
    const { data: bookedSlots, error: bookedError } = await supabase
      .from('appointments')
      .select('scheduled_time')
      .eq('doctor_id', doctorId)
      .eq('scheduled_date', date)
      .in('status', ['pending', 'accepted']);

    if (bookedError) {
      console.error('Booked slots fetch error:', bookedError);
      return NextResponse.json({ error: 'Failed to fetch booked slots' }, { status: 500 });
    }

    // Define all possible slots (9 AM to 5 PM, 30 min intervals)
    const allSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
        allSlots.push(time);
      }
    }

    // Filter out booked slots
    const bookedTimes = bookedSlots.map(slot => slot.scheduled_time);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    return NextResponse.json({ available_slots: availableSlots });
  } catch (error) {
    console.error('Slots error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}