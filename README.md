# DermoAI - AI-Powered Skin Analysis Platform

An advanced AI-powered web application for skin condition analysis, featuring Google Gemini AI integration for intelligent skin image classification, detailed medical reports, and doctor appointment management.

## 🚀 Features

- **AI Skin Analysis**: Upload or capture skin images for instant AI-powered diagnosis
- **Gemini AI Integration**: Uses Google Gemini to verify skin images and generate detailed reports
- **Classification**: Detects benign lesions, malignant conditions, wound types, and skin conditions
- **Detailed Reports**: Causes, risk factors, home remedies, medical recommendations
- **Doctor Appointments**: Book appointments with specialist dermatologists
- **Notification System**: Real-time notifications for appointment updates
- **Medical News**: Latest medical news on the landing page
- **User Profiles**: Complete medical profiles with BMI tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Auth**: Custom JWT (jose + bcryptjs)
- **Styling**: Vanilla CSS (Premium dark theme)
- **Deployment**: Vercel

## 📝 Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd "Major project 2"
npm install
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** → **New Query**
3. Copy the contents of `supabase/schema.sql` and run it
4. Go to **Storage** → Create a new **public bucket** called `skin-images`
5. Go to **Settings** → **API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 3. Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click **Get API key** → **Create API key**
3. Copy the API key

### 4. Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Vercel Deployment

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit - DermoAI Skin Analysis Platform"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) → Import the GitHub repository
3. Add the same environment variables from `.env.local` to Vercel project settings
4. Deploy!

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, features, medical news |
| Login | `/login` | Email & password login |
| Signup | `/signup` | Patient/Doctor registration |
| Analysis | `/dashboard` | Upload/capture skin image for AI analysis |
| History | `/dashboard/history` | Past analyses timeline |
| Doctors | `/dashboard/doctors` | Browse & book doctor appointments |
| Notifications | `/dashboard/notifications` | Appointment & report updates |
| Profile | `/dashboard/profile` | View/edit personal info |
| Doctor Dashboard | `/doctor-dashboard` | Manage appointments (accept/reject) |
| Doctor Notifications | `/doctor-dashboard/notifications` | Appointment request alerts |

## 🔒 Security

- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens with 7-day expiry
- Server-side API routes (no direct DB access from client)
- Supabase Row Level Security enabled

## ⚠️ Disclaimer

This tool provides AI-assisted analysis for informational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.
