import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// GET: Fetch notifications for the current user
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Notifications fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Count unread
    const unreadCount = (notifications || []).filter(n => !n.is_read).length;

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
