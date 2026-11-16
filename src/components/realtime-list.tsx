"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Plus, Loader2, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast'; // Assuming this exists, or I'll use a simple alert or just console

interface ListItem {
    id: string;
    text: string;
    createdAt: number;
}

export function RealtimeList() {
    const [items, setItems] = useState<ListItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let subscription: any;

        const fetchItems = async () => {
            try {
                const { data, error } = await supabase
                    .from('realtime_list')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                const loadedItems = data?.map(item => ({
                    id: item.id,
                    text: item.text,
                    createdAt: item.created_at
                })) || [];
                
                setItems(loadedItems);
            } catch (err: any) {
                console.error("Supabase Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();

        const channelName = `realtime_list_channel-${Math.random()}`;
        subscription = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'realtime_list' }, () => {
                fetchItems();
            })
            .subscribe();

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, []);

    const handleAddItem = async () => {
        if (!newItem.trim()) return;

        try {
            const { error } = await supabase
                .from('realtime_list')
                .insert([{ text: newItem, created_at: Date.now() }]);
                
            if (error) throw error;
            setNewItem('');
        } catch (err: any) {
            console.error("Error adding item:", err);
            alert("Failed to add item: " + err.message);
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            const { error } = await supabase
                .from('realtime_list')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
        } catch (err: any) {
            console.error("Error deleting item:", err);
            alert("Failed to delete item: " + err.message);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto border-white/10 bg-black/20 backdrop-blur-xl">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    <CardTitle>Supabase Realtime List</CardTitle>
                </div>
                <CardDescription>Items are synced in real-time across all devices.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-6">
                    <Input
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Add new item..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className="bg-white/5 border-white/10 focus-visible:ring-blue-500"
                    />
                    <Button onClick={handleAddItem} disabled={!newItem.trim()} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {error && (
                    <div className="p-3 mb-4 text-sm text-red-400 bg-red-900/20 rounded-md border border-red-900/50">
                        Error: {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    </div>
                ) : (
                    <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {items.map((item) => (
                            <li key={item.id} className="group flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                <span className="text-sm">{item.text}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400 h-8 w-8"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </li>
                        ))}
                        {items.length === 0 && !error && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No items yet.</p>
                                <p className="text-xs mt-1 opacity-50">Add one above to get started!</p>
                            </div>
                        )}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
