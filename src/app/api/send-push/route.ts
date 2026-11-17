import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const webpush = (await import('web-push')).default;
    const { createClient } = await import('@supabase/supabase-js');

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(
        'mailto:admin@sutradhaar.com',
        vapidPublicKey,
        vapidPrivateKey
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
