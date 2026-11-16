"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile, DashboardWidgetItem, DashboardWidgetId } from '@/context/ProfileContext';
import { Reorder } from 'framer-motion';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface EditWidgetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  todo: 'To-Do Tasks',
  notes: 'Recent Note',
  budget: 'Budget Snapshot',
  history: 'Recent Activity',
  favorites: 'Favorites'
};

export function EditWidgetsDialog({ open, onOpenChange }: EditWidgetsDialogProps) {
  const { profile, updateDashboardWidgets } = useProfile();
  const [items, setItems] = useState<DashboardWidgetItem[]>([]);

  useEffect(() => {
    if (open) {
      // Ensure all 5 widgets exist in the array just in case profile has old data
      const currentIds = new Set(profile.dashboardWidgets?.map(w => w.id) || []);
      const defaultItems: DashboardWidgetItem[] = [
        { id: 'todo', hidden: false, size: 'small' },
        { id: 'notes', hidden: false, size: 'small' },
        { id: 'budget', hidden: false, size: 'small' },
        { id: 'history', hidden: false, size: 'small' },
        { id: 'favorites', hidden: false, size: 'small' },
      ];
      
      const merged = [
        ...(profile.dashboardWidgets || []),
        ...defaultItems.filter(w => !currentIds.has(w.id))
      ];
      setItems(merged);
    }
  }, [open, profile.dashboardWidgets]);

  const handleSave = () => {
    updateDashboardWidgets(items);
    onOpenChange(false);
  };

  const updateItem = (id: string, updates: Partial<DashboardWidgetItem>) => {
    setItems(current => current.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Customize Dashboard
          </DialogTitle>
          <DialogDescription>
            Drag to reorder widgets, toggle visibility, and change their size.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-3">
            {items.map((item) => (
              <Reorder.Item 
                key={item.id} 
                value={item}
                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50 shadow-sm cursor-grab active:cursor-grabbing hover:bg-secondary/50 transition-colors"
              >
                <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
                
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className={`font-semibold truncate ${item.hidden ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {WIDGET_LABELS[item.id]}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Select 
                    value={item.size || 'small'} 
                    onValueChange={(val: 'small' | 'large') => updateItem(item.id, { size: val })}
                    disabled={item.hidden}
                  >
                    <SelectTrigger className="w-[100px] h-8 text-xs border-border/50 bg-background/50">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Half Width</SelectItem>
                      <SelectItem value="large">Full Width</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    {item.hidden ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-primary" />}
                    <Switch 
                      checked={!item.hidden}
                      onCheckedChange={(checked) => updateItem(item.id, { hidden: !checked })}
                    />
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="font-bold shadow-md shadow-primary/20">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
