-- ============================================
-- DermoAI - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (Patients + Doctors)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  sex TEXT CHECK (sex IN ('Male', 'Female', 'Other')),
  height REAL,           -- in cm
  weight REAL,           -- in kg
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
  specialization TEXT,   -- doctors only
  hospital TEXT,         -- doctors only
  experience INTEGER,    -- years of experience, doctors only
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ANALYSES TABLE (Skin Analysis Results)
-- ============================================
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  is_skin BOOLEAN DEFAULT TRUE,
  classification TEXT,     -- 'benign', 'malignant', 'wound', 'skin_condition'
  condition_name TEXT,     -- specific condition name
  severity TEXT CHECK (severity IN ('Low', 'Moderate', 'High', 'Critical')),
  confidence REAL,         -- 0.0 to 1.0
  report JSONB,            -- full detailed report
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  scheduled_date DATE,
  scheduled_time TIME,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'system' CHECK (type IN ('appointment', 'report', 'system')),
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- We use service_role key in API routes which bypasses RLS
-- These policies are for additional safety

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use service role key)
CREATE POLICY "service_role_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_analyses" ON analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET (run in Supabase Dashboard > Storage)
-- Create a public bucket called 'skin-images'
-- ============================================

-- Insert some sample doctors for testing
INSERT INTO profiles (email, password_hash, name, age, sex, role, specialization, hospital, experience, phone)
VALUES 
  ('dr.sarah@dermoai.com', '$2a$10$placeholder', 'Dr. Sarah Johnson', 42, 'Female', 'doctor', 'Dermatology', 'City General Hospital', 15, '+1-555-0101'),
  ('dr.mike@dermoai.com', '$2a$10$placeholder', 'Dr. Michael Chen', 38, 'Male', 'doctor', 'Dermatology & Oncology', 'Metro Medical Center', 12, '+1-555-0102'),
  ('dr.priya@dermoai.com', '$2a$10$placeholder', 'Dr. Priya Patel', 35, 'Female', 'doctor', 'Cosmetic Dermatology', 'Skin Care Institute', 8, '+1-555-0103'),
  ('dr.james@dermoai.com', '$2a$10$placeholder', 'Dr. James Wilson', 50, 'Male', 'doctor', 'Surgical Dermatology', 'University Hospital', 22, '+1-555-0104'),
  ('dr.aisha@dermoai.com', '$2a$10$placeholder', 'Dr. Aisha Rahman', 33, 'Female', 'doctor', 'Pediatric Dermatology', 'Children''s Medical Center', 6, '+1-555-0105');
