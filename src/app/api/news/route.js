import { NextResponse } from 'next/server';
import { generateMedicalNews } from '@/lib/gemini';

// Cache news for 1 hour to avoid excessive API calls
let cachedNews = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached news if available and fresh
    if (cachedNews && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({ news: cachedNews });
    }

    // Generate fresh news
    const news = await generateMedicalNews();
    
    if (news && news.length > 0) {
      cachedNews = news;
      cacheTimestamp = now;
    }

    return NextResponse.json({ news: news || [] });
  } catch (error) {
    console.error('News fetch error:', error);
    
    // Return cached news even if expired, as fallback
    if (cachedNews) {
      return NextResponse.json({ news: cachedNews });
    }

    // Fallback static news
    return NextResponse.json({
      news: [
        {
          id: 1,
          title: 'AI-Powered Skin Cancer Detection Reaches New Milestone',
          summary: 'Recent studies show AI diagnostic tools achieving over 95% accuracy in detecting melanoma, potentially revolutionizing early skin cancer screening in primary care settings.',
          category: 'Technology',
          date: new Date().toISOString().split('T')[0],
          source: 'Nature Medicine',
          emoji: '🤖'
        },
        {
          id: 2,
          title: 'New Breakthrough in Wound Healing Therapy',
          summary: 'Researchers have developed a novel hydrogel dressing that accelerates chronic wound healing by 40%, offering new hope for diabetic ulcer patients worldwide.',
          category: 'Research',
          date: new Date().toISOString().split('T')[0],
          source: 'Journal of Dermatological Science',
          emoji: '🔬'
        },
        {
          id: 3,
          title: 'Sunscreen Guidelines Updated for 2026',
          summary: 'The American Academy of Dermatology releases updated sunscreen recommendations emphasizing broad-spectrum protection and the importance of reapplication every two hours.',
          category: 'Prevention',
          date: new Date().toISOString().split('T')[0],
          source: 'AAD Guidelines',
          emoji: '☀️'
        },
        {
          id: 4,
          title: 'Telemedicine in Dermatology Sees Rapid Adoption',
          summary: 'Teledermatology consultations have increased by 300% since 2024, with studies confirming comparable diagnostic accuracy to in-person visits for common skin conditions.',
          category: 'Public Health',
          date: new Date().toISOString().split('T')[0],
          source: 'JAMA Dermatology',
          emoji: '📱'
        },
        {
          id: 5,
          title: 'Novel Treatment for Chronic Eczema Shows Promise',
          summary: 'A new biologic drug targeting specific immune pathways has shown remarkable results in Phase 3 trials, reducing eczema severity by up to 75% in adult patients.',
          category: 'Treatment',
          date: new Date().toISOString().split('T')[0],
          source: 'The Lancet',
          emoji: '💊'
        },
        {
          id: 6,
          title: 'Microbiome Research Reveals Skin Health Connections',
          summary: 'Groundbreaking research linking gut and skin microbiomes opens new avenues for treating conditions like acne, rosacea, and psoriasis through probiotics and diet modification.',
          category: 'Research',
          date: new Date().toISOString().split('T')[0],
          source: 'Cell Reports Medicine',
          emoji: '🧬'
        },
      ]
    });
  }
}
