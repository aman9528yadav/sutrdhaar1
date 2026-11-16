import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@sutradhaar.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

// We need the service role key to bypass RLS if this is called from a cron job or webhook
// If not available, fallback to anon key (assuming RLS allows select)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, title, message } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'Subscriptions not found' }, { status: 404 });
    }

    const notifications = subscriptions.map((sub: any) => {
      const pushSubscription = sub.subscription;
      const payload = JSON.stringify({
        title: title,
        body: message,
        icon: '/icon-192x192.png'
      });
      return webpush.sendNotification(pushSubscription, payload).catch(err => console.error("Error sending push", err));
    });

    await Promise.all(notifications);

    return NextResponse.json({ success: true, sent: notifications.length });
  } catch (err: any) {
    console.error("Push API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
