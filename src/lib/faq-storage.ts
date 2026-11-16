import { supabase } from './supabaseClient';

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    created_at?: string;
}

export async function fetchFAQs(): Promise<FAQ[]> {
    const { data, error } = await supabase
        .from('support_faqs')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching FAQs:", error);
        return [];
    }
    return data || [];
}

export async function addFAQ(question: string, answer: string): Promise<{ data: FAQ | null, error: any }> {
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(7);
    const { data, error } = await supabase
        .from('support_faqs')
        .insert([{ id, question, answer }])
        .select()
        .single();

    if (error) {
        console.error("Error adding FAQ:", error);
    }
    return { data, error };
}

export async function updateFAQ(id: string, question: string, answer: string): Promise<boolean> {
    const { error } = await supabase
        .from('support_faqs')
        .update({ question, answer })
        .eq('id', id);

    if (error) {
        console.error("Error updating FAQ:", error);
        return false;
    }
    return true;
}

export async function deleteFAQ(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('support_faqs')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting FAQ:", error);
        return false;
    }
    return true;
}
