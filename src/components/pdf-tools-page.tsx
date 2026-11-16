"use client";

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Plus, 
  Trash2, 
  Sparkles,
  Layers,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export function PdfToolsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'imagesToPdf' | 'textToPdf'>('imagesToPdf');

  // Images to PDF state
  const [selectedImages, setSelectedImages] = useState<{ id: string; name: string; dataUrl: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Text / Document to PDF state
  const [docTitle, setDocTitle] = useState('My Document');
  const [docContent, setDocContent] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImages(prev => [
            ...prev,
            {
              id: 'img-' + Date.now() + Math.random().toString(36).substring(2, 5),
              name: file.name,
              dataUrl: event.target?.result as string
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    toast({ title: "Images Added", description: `${files.length} image(s) loaded.` });
    e.target.value = '';
  };

  const handleGenerateImagePdf = async () => {
    if (selectedImages.length === 0) {
      toast({ title: "No Images", description: "Please upload at least one image.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < selectedImages.length; i++) {
        if (i > 0) pdf.addPage();
        const img = selectedImages[i];

        // Center image nicely on A4
        const margin = 15;
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);

        pdf.addImage(img.dataUrl, 'JPEG', margin, margin, availableWidth, availableHeight, undefined, 'FAST');
      }

      pdf.save(`sutradhaar-images-${Date.now()}.pdf`);
      toast({ title: "PDF Created! 🎉", description: "Downloaded successfully." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateTextPdf = () => {
    if (!docContent.trim()) {
      toast({ title: "Empty Document", description: "Please enter some content.", variant: "destructive" });
      return;
    }

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text(docTitle || 'Document', margin, 25);

      // Line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, 30, pageWidth - margin, 30);

      // Body Content with wrapping
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      const splitText = pdf.splitTextToSize(docContent, pageWidth - (margin * 2));
      pdf.text(splitText, margin, 40);

      pdf.save(`${(docTitle || 'document').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
      toast({ title: "PDF Created! 🎉", description: "Document downloaded." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-4 pb-20 pt-2">
      {/* Top Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'imagesToPdf' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('imagesToPdf')}
          className={`flex-1 h-10 rounded-2xl font-bold text-xs gap-1.5 ${
            activeTab === 'imagesToPdf' ? 'bg-primary text-primary-foreground shadow-sm' : 'border-border/50'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Photos to PDF
        </Button>

        <Button
          variant={activeTab === 'textToPdf' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('textToPdf')}
          className={`flex-1 h-10 rounded-2xl font-bold text-xs gap-1.5 ${
            activeTab === 'textToPdf' ? 'bg-primary text-primary-foreground shadow-sm' : 'border-border/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Notes to PDF
        </Button>
      </div>

      {/* Mode 1: Photos to PDF */}
      {activeTab === 'imagesToPdf' && (
        <Card className="p-5 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground">Photos to PDF Maker</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Combine receipts or documents into a single PDF</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
              {selectedImages.length} Page{selectedImages.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Upload Button */}
          <label className="border-2 border-dashed border-border/60 hover:border-primary/60 hover:bg-primary/5 transition-all p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Select Photos or Scans</p>
              <p className="text-[10px] text-muted-foreground">PNG, JPG, or WEBP supported</p>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {/* Image Thumbnail Grid */}
          {selectedImages.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {selectedImages.map((img, idx) => (
                  <div key={img.id} className="relative rounded-xl overflow-hidden border border-border/60 aspect-square group bg-black/10">
                    <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      #{idx + 1}
                    </span>
                    <button
                      onClick={() => setSelectedImages(prev => prev.filter(item => item.id !== img.id))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleGenerateImagePdf}
                disabled={isGenerating}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-red-500 via-rose-600 to-orange-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 gap-1.5"
              >
                <Download className="w-4 h-4" />
                {isGenerating ? 'Converting Images...' : `Convert ${selectedImages.length} Images to PDF`}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Mode 2: Notes / Text to PDF */}
      {activeTab === 'textToPdf' && (
        <Card className="p-5 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg space-y-4">
          <div>
            <h3 className="font-bold text-sm text-foreground">Document / Notes to PDF</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Quickly turn draft notes into an A4 PDF document</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Document Title</Label>
            <Input
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              placeholder="e.g. Project Plan, Meeting Summary"
              className="h-11 rounded-xl text-xs bg-background/50 border-border/50 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Document Content</Label>
            <Textarea
              rows={8}
              value={docContent}
              onChange={e => setDocContent(e.target.value)}
              placeholder="Write or paste your notes here..."
              className="rounded-xl text-xs bg-background/50 border-border/50 leading-relaxed"
            />
          </div>

          <Button
            onClick={handleGenerateTextPdf}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 gap-1.5"
          >
            <Download className="w-4 h-4" /> Download Formatted PDF
          </Button>
        </Card>
      )}
    </div>
  );
}
