import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X, CheckCircle, AlertCircle, FileAudio, FileVideo } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  id: string;
}

export const EnhancedFileUpload = ({ 
  onFileSelect, 
  className,
  maxSize = 500,
  acceptedFormats = [
    'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aiff', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/wma',
    'video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm', 'video/3gp', 'video/flv', 'video/wmv'
  ]
}: FileUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxSize * 1024 * 1024) {
      return { valid: false, error: `File size exceeds ${maxSize}MB limit` };
    }

    if (!acceptedFormats.includes(file.type) && !acceptedFormats.some(format => file.name.toLowerCase().endsWith(format.split('/')[1]))) {
      return { valid: false, error: 'File format not supported' };
    }

    return { valid: true };
  };

  const simulateUpload = async (fileId: string) => {
    const updateProgress = (progress: number) => {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress } : f
      ));
    };

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateProgress(i);
    }

    // Mark as completed
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'completed' as const } : f
    ));
  };

  const handleFileSelect = async (files: FileList) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        toast.error(validation.error);
        continue;
      }

      const fileId = Math.random().toString(36).substr(2, 9);
      const uploadFile: UploadedFile = {
        file,
        progress: 0,
        status: 'uploading',
        id: fileId
      };

      setUploadedFiles(prev => [...prev, uploadFile]);
      
      try {
        await simulateUpload(fileId);
        onFileSelect(file);
        toast.success(`File "${file.name}" uploaded successfully`);
      } catch (error) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'error' as const } : f
        ));
        toast.error(`Upload failed for "${file.name}"`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('audio/')) {
      return <FileAudio className="w-4 h-4" />;
    } else if (file.type.startsWith('video/')) {
      return <FileVideo className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const supportedFormats = [
    { category: "Audio", formats: ["MP3", "WAV", "FLAC", "AIFF", "M4A", "AAC", "OGG", "WMA"] },
    { category: "Video", formats: ["MP4", "AVI", "MOV", "MKV", "WebM", "3GP", "FLV", "WMV"] }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Enhanced File Upload
        </CardTitle>
        <CardDescription>
          Upload audio/video files up to {maxSize}MB in multiple formats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-muted-foreground">
              or click to browse your files
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFormats.join(',')}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Files
          </Button>
          
          <p className="text-xs text-muted-foreground mt-2">
            Maximum file size: {maxSize}MB per file
          </p>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Uploaded Files</h4>
            {uploadedFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex-shrink-0">
                  {getFileIcon(uploadFile.file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </span>
                    {uploadFile.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(uploadFile.file.size)}</span>
                    <span>•</span>
                    <span className="capitalize">{uploadFile.file.type.split('/')[1] || 'Unknown'}</span>
                  </div>
                  
                  {uploadFile.status === 'uploading' && (
                    <div className="mt-1">
                      <Progress value={uploadFile.progress} className="h-1" />
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadFile.id)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Supported Formats */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Supported Formats</h4>
          {supportedFormats.map((category) => (
            <div key={category.category} className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">{category.category}:</div>
              <div className="flex flex-wrap gap-1">
                {category.formats.map((format) => (
                  <Badge key={format} variant="outline" className="text-xs">
                    {format}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};