import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// PATCH: Mark notification as read
export async function PATCH(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', payload.userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
