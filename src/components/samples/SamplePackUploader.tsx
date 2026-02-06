/**
 * SamplePackUploader - Drag-and-drop batch upload for audio packs
 * Uploads files to Supabase Storage and catalogs them in sample_library
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FolderUp, X, FileAudio, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSampleLibrary } from '@/hooks/useSampleLibrary';
import { cn } from '@/lib/utils';

interface FileEntry {
  file: File;
  name: string;
  category: string;
  sampleType: 'loop' | 'oneshot' | 'midi';
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

const CATEGORIES = [
  'Kicks', 'Snares', 'Hi-Hats', 'Claps', 'Percussion',
  'Log Drums', 'Bass', 'Piano', 'Synth', 'Vocals',
  'FX', 'Loops', 'One Shots', 'Other',
];

const ACCEPTED_AUDIO = '.wav,.mp3,.flac,.ogg,.aif,.aiff,.m4a';

export function SamplePackUploader({ onComplete }: { onComplete?: () => void }) {
  const { uploadSample } = useSampleLibrary();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [packName, setPackName] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('Other');
  const [defaultType, setDefaultType] = useState<'loop' | 'oneshot'>('oneshot');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inferCategory = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (/kick|bd/i.test(lower)) return 'Kicks';
    if (/snare|sd/i.test(lower)) return 'Snares';
    if (/hat|hh|hihat/i.test(lower)) return 'Hi-Hats';
    if (/clap|cp/i.test(lower)) return 'Claps';
    if (/perc/i.test(lower)) return 'Percussion';
    if (/log.?drum/i.test(lower)) return 'Log Drums';
    if (/bass/i.test(lower)) return 'Bass';
    if (/piano|keys/i.test(lower)) return 'Piano';
    if (/synth|pad/i.test(lower)) return 'Synth';
    if (/vox|vocal/i.test(lower)) return 'Vocals';
    if (/fx|effect|riser|sweep/i.test(lower)) return 'FX';
    if (/loop/i.test(lower)) return 'Loops';
    return defaultCategory;
  };

  const inferType = (filename: string): 'loop' | 'oneshot' => {
    if (/loop/i.test(filename)) return 'loop';
    return defaultType;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const entries: FileEntry[] = Array.from(newFiles)
      .filter(f => /\.(wav|mp3|flac|ogg|aif|aiff|m4a)$/i.test(f.name))
      .map(file => ({
        file,
        name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        category: inferCategory(file.name),
        sampleType: inferType(file.name),
        status: 'pending' as const,
      }));

    if (entries.length === 0) {
      toast.error('No supported audio files found');
      return;
    }

    setFiles(prev => [...prev, ...entries]);
    toast.success(`Added ${entries.length} file(s)`);
  }, [defaultCategory, defaultType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const updateFile = (idx: number, updates: Partial<FileEntry>) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, ...updates } : f));
  };

  const uploadAll = async () => {
    if (files.length === 0) return;
    if (!packName.trim()) {
      toast.error('Please enter a pack name');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    let completed = 0;
    let errors = 0;

    for (let i = 0; i < files.length; i++) {
      const entry = files[i];
      if (entry.status === 'done') { completed++; continue; }

      updateFile(i, { status: 'uploading' });

      try {
        await uploadSample.mutateAsync({
          file: entry.file,
          name: entry.name,
          category: entry.category,
          sampleType: entry.sampleType,
          packName: packName.trim(),
          isPublic: false,
          tags: [packName.trim().toLowerCase(), entry.category.toLowerCase()],
        });
        updateFile(i, { status: 'done' });
        completed++;
      } catch (err: any) {
        updateFile(i, { status: 'error', error: err.message || 'Upload failed' });
        errors++;
      }

      setProgress(Math.round(((completed + errors) / files.length) * 100));
    }

    setIsUploading(false);

    if (errors === 0) {
      toast.success(`✅ All ${completed} samples uploaded to "${packName}"`);
      onComplete?.();
      setOpen(false);
      setFiles([]);
      setPackName('');
    } else {
      toast.warning(`${completed} uploaded, ${errors} failed`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FolderUp className="w-4 h-4" />
          Upload Pack
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Audio Pack
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pack metadata */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="text-sm font-medium mb-1 block">Pack Name</label>
              <Input
                placeholder="e.g. AP Private Skool Vol 1"
                value={packName}
                onChange={e => setPackName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Default Category</label>
              <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Default Type</label>
              <Select value={defaultType} onValueChange={v => setDefaultType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="oneshot">One Shot</SelectItem>
                  <SelectItem value="loop">Loop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              isDragOver
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag & drop audio files or <span className="text-primary underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              WAV, MP3, FLAC, OGG, AIFF, M4A — categories auto-detected from filenames
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_AUDIO}
              className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{files.length} file(s)</p>
                {!isUploading && (
                  <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                    Clear all
                  </Button>
                )}
              </div>
              {files.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                >
                  {entry.status === 'done' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  ) : entry.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  ) : (
                    <FileAudio className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="flex-1 truncate">{entry.name}</span>
                  <Select
                    value={entry.category}
                    onValueChange={v => updateFile(idx, { category: v })}
                    disabled={isUploading}
                  >
                    <SelectTrigger className="w-28 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {entry.sampleType}
                  </Badge>
                  {!isUploading && entry.status !== 'done' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeFile(idx)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">
                Uploading… {progress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={uploadAll}
              disabled={files.length === 0 || isUploading || !packName.trim()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload {files.length} file(s)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
