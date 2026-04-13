import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, profile.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = await generateToken({
      userId: profile.id,
      email: profile.email,
      role: profile.role,
    });

    // Remove sensitive data
    const { password_hash, ...safeProfile } = profile;

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: safeProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
