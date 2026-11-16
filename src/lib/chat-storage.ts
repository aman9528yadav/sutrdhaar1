import { supabase } from './supabaseClient';

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'admin';
    timestamp: number;
}

export interface ChatSession {
    userId: string;
    userName: string;
    messages: ChatMessage[];
    lastUpdated: number;
    unreadAdmin: number;
    unreadUser: number;
}

// Fetch all active sessions (Admin Inbox)
export async function fetchAllSessions(): Promise<Record<string, ChatSession>> {
    const { data: sessionsData, error: sessionsError } = await supabase
        .from('support_sessions')
        .select('*')
        .order('last_updated', { ascending: false });

    if (sessionsError) {
        console.error("Error fetching sessions", sessionsError);
        return {};
    }

    const { data: messagesData, error: messagesError } = await supabase
        .from('support_messages')
        .select('*')
        .order('timestamp', { ascending: true });

    if (messagesError) {
        console.error("Error fetching messages", messagesError);
        return {};
    }

    const sessionsMap: Record<string, ChatSession> = {};
    
    // Initialize sessions
    for (const s of sessionsData || []) {
        sessionsMap[s.user_id] = {
            userId: s.user_id,
            userName: s.user_name,
            lastUpdated: s.last_updated,
            unreadAdmin: s.unread_admin,
            unreadUser: s.unread_user,
            messages: []
        };
    }

    // Attach messages
    for (const m of messagesData || []) {
        if (sessionsMap[m.user_id]) {
            sessionsMap[m.user_id].messages.push({
                id: m.id,
                text: m.text,
                sender: m.sender as 'user' | 'admin',
                timestamp: m.timestamp
            });
        }
    }

    return sessionsMap;
}

// Fetch a specific session (User Widget)
export async function fetchSession(userId: string, defaultName: string): Promise<ChatSession> {
    const { data: sessionData, error: sessionError } = await supabase
        .from('support_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
        console.error("Error fetching session:", sessionError.message, sessionError.code, sessionError.details);
    }

    const { data: messagesData, error: messagesError } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });

    if (messagesError) {
        console.error("Error fetching messages", messagesError);
    }

    const messages = (messagesData || []).map(m => ({
        id: m.id,
        text: m.text,
        sender: m.sender as 'user' | 'admin',
        timestamp: m.timestamp
    }));

    if (sessionData) {
        return {
            userId: sessionData.user_id,
            userName: sessionData.user_name,
            lastUpdated: sessionData.last_updated,
            unreadAdmin: sessionData.unread_admin,
            unreadUser: sessionData.unread_user,
            messages
        };
    }

    // Default welcome session if none exists
    return {
        userId,
        userName: defaultName,
        lastUpdated: Date.now(),
        unreadAdmin: 0,
        unreadUser: 0,
        messages: [{
            id: 'welcome',
            text: 'Hello! I am the Admin. How can I help you with your account today?',
            sender: 'admin',
            timestamp: Date.now()
        }]
    };
}

export async function saveMessageSupabase(userId: string, userName: string, text: string, sender: 'user' | 'admin') {
    const timestamp = Date.now();
    const id = timestamp.toString() + Math.random().toString(36).substring(7);

    // Upsert session
    const { data: existingSession } = await supabase
        .from('support_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

    const sessionUpdate = {
        user_id: userId,
        user_name: sender === 'user' 
            ? (userName !== 'Guest' ? userName : (existingSession?.user_name || 'Guest User'))
            : (existingSession?.user_name || 'Guest User'),
        last_updated: timestamp,
        unread_admin: sender === 'user' ? ((existingSession?.unread_admin || 0) + 1) : (existingSession?.unread_admin || 0),
        unread_user: sender === 'admin' ? ((existingSession?.unread_user || 0) + 1) : (existingSession?.unread_user || 0)
    };

    await supabase.from('support_sessions').upsert(sessionUpdate);

    // Insert message
    await supabase.from('support_messages').insert({
        id,
        user_id: userId,
        text,
        sender,
        timestamp
    });
}

export async function markAsReadSupabase(userId: string, readBy: 'user' | 'admin') {
    const updatePayload = readBy === 'user' ? { unread_user: 0 } : { unread_admin: 0 };
    await supabase.from('support_sessions').update(updatePayload).eq('user_id', userId);
}

export async function deleteMessageSupabase(messageId: string) {
    await supabase.from('support_messages').delete().eq('id', messageId);
}

export async function deleteSessionSupabase(userId: string) {
    await supabase.from('support_messages').delete().eq('user_id', userId);
    await supabase.from('support_sessions').delete().eq('user_id', userId);
}

export async function deleteOldMessagesSupabase() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isoDate = sevenDaysAgo.toISOString();
    
    // Delete messages older than 7 days
    await supabase.from('support_messages').delete().lt('created_at', isoDate);
}
