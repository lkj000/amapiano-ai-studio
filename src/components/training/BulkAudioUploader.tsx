/**
 * Bulk Audio Uploader for Training Dataset
 * 
 * Handles multi-file upload with progress tracking,
 * automatic audio analysis, and metadata extraction.
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Upload, 
  FileAudio, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Music2,
  Trash2
} from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'analyzing' | 'complete' | 'error';
  progress: number;
  error?: string;
  sampleId?: string;
}

interface BulkAudioUploaderProps {
  onUploadComplete?: (sampleIds: string[]) => void;
  batchId?: string;
}

export function BulkAudioUploader({ onUploadComplete, batchId }: BulkAudioUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const audioFiles = selectedFiles.filter(f => 
      f.type.startsWith('audio/') || f.type.startsWith('video/')
    );

    const newFiles: UploadFile[] = audioFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const audioFiles = droppedFiles.filter(f => 
      f.type.startsWith('audio/') || f.type.startsWith('video/')
    );

    const newFiles: UploadFile[] = audioFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const uploadFile = async (uploadFile: UploadFile): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Update status to uploading
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 10 } : f
    ));

    // Generate storage path
    const ext = uploadFile.file.name.split('.').pop() || 'mp3';
    const storagePath = `${user.id}/${Date.now()}_${uploadFile.id}.${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('training-audio')
      .upload(storagePath, uploadFile.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, progress: 50, status: 'analyzing' as const } : f
    ));

    // Get duration from audio (client-side)
    let duration = 0;
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await uploadFile.file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      duration = audioBuffer.duration;
      await audioContext.close();
    } catch {
      console.warn('Could not extract audio duration');
    }

    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, progress: 70 } : f
    ));

    // Create database record
    const { data: sample, error: dbError } = await supabase
      .from('training_samples')
      .insert({
        user_id: user.id,
        filename: uploadFile.file.name,
        storage_path: storagePath,
        file_size_bytes: uploadFile.file.size,
        duration_seconds: duration > 0 ? duration : null,
        processing_status: 'pending',
        source_platform: 'suno'
      })
      .select('id')
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Link to batch if provided
    if (batchId && sample) {
      await supabase
        .from('training_batch_samples')
        .insert({
          batch_id: batchId,
          sample_id: sample.id
        });
    }

    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, progress: 100, status: 'complete' as const, sampleId: sample?.id } : f
    ));

    return sample?.id || null;
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast.info('No files to upload');
      return;
    }

    setIsUploading(true);
    const sampleIds: string[] = [];

    for (const file of pendingFiles) {
      try {
        const sampleId = await uploadFile(file);
        if (sampleId) {
          sampleIds.push(sampleId);
        }
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error' } 
            : f
        ));
      }
    }

    setIsUploading(false);

    const successCount = sampleIds.length;
    const failCount = pendingFiles.length - successCount;

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} files`);
      onUploadComplete?.(sampleIds);
    }
    if (failCount > 0) {
      toast.error(`${failCount} files failed to upload`);
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'complete'));
  };

  const totalFiles = files.length;
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completedCount = files.filter(f => f.status === 'complete').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'uploading':
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <FileAudio className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Audio Upload
        </CardTitle>
        <CardDescription>
          Upload Suno generations for training. Supports MP3, MP4, WAV, and other audio formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Music2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Drop audio files here</p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Stats */}
        {totalFiles > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{totalFiles} Total</Badge>
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount} Pending</Badge>
            )}
            {completedCount > 0 && (
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                {completedCount} Completed
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive">{errorCount} Failed</Badge>
            )}
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <ScrollArea className="h-[300px] rounded-md border border-border/50 p-2">
            <div className="space-y-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-card/50 hover:bg-card"
                >
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.file.size)}</span>
                      {file.status === 'uploading' && <span>Uploading...</span>}
                      {file.status === 'analyzing' && <span>Analyzing...</span>}
                      {file.error && <span className="text-destructive">{file.error}</span>}
                    </div>
                    {(file.status === 'uploading' || file.status === 'analyzing') && (
                      <Progress value={file.progress} className="h-1 mt-1" />
                    )}
                  </div>
                  {file.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleUploadAll}
            disabled={pendingCount === 0 || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {pendingCount} Files
              </>
            )}
          </Button>
          {completedCount > 0 && (
            <Button variant="outline" onClick={clearCompleted}>
              Clear Completed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
