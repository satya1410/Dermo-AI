import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, age, sex, height, weight, role = 'patient',
            specialization, hospital, experience, phone } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create profile
    const profileData = {
      name,
      email: email.toLowerCase(),
      password_hash,
      age: age ? parseInt(age) : null,
      sex: sex || null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      role,
    };

    // Add doctor-specific fields
    if (role === 'doctor') {
      profileData.specialization = specialization || null;
      profileData.hospital = hospital || null;
      profileData.experience = experience ? parseInt(experience) : null;
      profileData.phone = phone || null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select('id, name, email, age, sex, height, weight, role, specialization, hospital, experience, created_at')
      .single();

    if (error) {
      console.error('Signup error:', error);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Generate JWT
    const token = await generateToken({
      userId: profile.id,
      email: profile.email,
      role: profile.role,
    });

    return NextResponse.json({
      message: 'Account created successfully',
      token,
      user: profile,
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
