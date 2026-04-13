import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    // First check if there are any doctors
    const { data: existingDoctors, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'doctor')
      .limit(1);

    if (checkError) {
      console.error('Check doctors error:', checkError);
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // If no doctors exist, seed some Indian doctors
    if (!existingDoctors || existingDoctors.length === 0) {
      const indianDoctors = [
        {
          name: 'Dr. Priya Sharma',
          email: 'dr.priya.sharma@aiimsdelhi.com',
          password_hash: '$2b$10$8K7VzJ8X9Y2LmNpQrTtOeO8KQ8VzJ8X9Y2LmNpQrTtOeO8KQ8VzJ',
          role: 'doctor',
          specialization: 'Dermatology',
          hospital: 'AIIMS Delhi',
          experience: 12,
          phone: '+91-9876543210',
          country: 'India'
        },
        {
          name: 'Dr. Rajesh Kumar',
          email: 'dr.rajesh.kumar@apollomumbai.com',
          password_hash: '$2b$10$8K7VzJ8X9Y2LmNpQrTtOeO8KQ8VzJ8X9Y2LmNpQrTtOeO8KQ8VzJ',
          role: 'doctor',
          specialization: 'Dermatology',
          hospital: 'Apollo Hospitals Mumbai',
          experience: 15,
          phone: '+91-9876543211',
          country: 'India'
        },
        {
          name: 'Dr. Anjali Patel',
          email: 'dr.anjali.patel@medantagurgaon.com',
          password_hash: '$2b$10$8K7VzJ8X9Y2LmNpQrTtOeO8KQ8VzJ8X9Y2LmNpQrTtOeO8KQ8VzJ',
          role: 'doctor',
          specialization: 'Pediatric Dermatology',
          hospital: 'Medanta Hospital Gurgaon',
          experience: 10,
          phone: '+91-9876543212',
          country: 'India'
        },
        {
          name: 'Dr. Vikram Singh',
          email: 'dr.vikram.singh@fortisbangalore.com',
          password_hash: '$2b$10$8K7VzJ8X9Y2LmNpQrTtOeO8KQ8VzJ8X9Y2LmNpQrTtOeO8KQ8VzJ',
          role: 'doctor',
          specialization: 'Cosmetic Dermatology',
          hospital: 'Fortis Hospital Bangalore',
          experience: 8,
          phone: '+91-9876543213',
          country: 'India'
        },
        {
          name: 'Dr. Meera Joshi',
          email: 'dr.meera.joshi@tatamumbai.com',
          password_hash: '$2b$10$8K7VzJ8X9Y2LmNpQrTtOeO8KQ8VzJ8X9Y2LmNpQrTtOeO8KQ8VzJ',
          role: 'doctor',
          specialization: 'Dermatopathology',
          hospital: 'Tata Memorial Hospital Mumbai',
          experience: 18,
          phone: '+91-9876543214',
          country: 'India'
        }
      ];

      const { error: seedError } = await supabase
        .from('profiles')
        .insert(indianDoctors);

      if (seedError) {
        console.error('Seeding doctors error:', seedError);
        // If seeding fails due to missing country column, try without it
        const doctorsWithoutCountry = indianDoctors.map(({ country, ...doc }) => doc);
        const { error: seedError2 } = await supabase
          .from('profiles')
          .insert(doctorsWithoutCountry);
        
        if (seedError2) {
          console.error('Seeding doctors without country error:', seedError2);
        }
      }
    }

    // Fetch doctors - try with country filter first, fallback without
    let query = supabase
      .from('profiles')
      .select('id, name, email, specialization, hospital, experience, phone, avatar_url, created_at')
      .eq('role', 'doctor')
      .order('experience', { ascending: false });

    let { data: doctors, error } = await query.eq('country', 'India');

    if (error && error.message.includes('country')) {
      // If country column doesn't exist, fetch without filter
      const { data: doctorsFallback, error: errorFallback } = await supabase
        .from('profiles')
        .select('id, name, email, specialization, hospital, experience, phone, avatar_url, created_at')
        .eq('role', 'doctor')
        .order('experience', { ascending: false });
      
      doctors = doctorsFallback;
      error = errorFallback;
    }

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
