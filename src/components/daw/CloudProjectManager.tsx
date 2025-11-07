import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { Cloud, Save, FolderOpen, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DawProjectDataV2 } from '@/types/daw';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CloudProjectManagerProps {
  currentProject: DawProjectDataV2;
  onLoadProject?: (project: DawProjectDataV2) => void;
}

const CloudProjectManager: React.FC<CloudProjectManagerProps> = ({
  currentProject,
  onLoadProject,
}) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  
  const { saveProject, loadProjects, deleteProject, isSaving, isLoading } = useCloudStorage();
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const data = await loadProjects();
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    if (showLoadDialog) {
      fetchProjects();
    }
  }, [showLoadDialog]);

  const handleSave = async () => {
    if (!projectName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a project name',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveProject(projectName, currentProject, description, isPublic);
      setProjectName('');
      setDescription('');
      setIsPublic(false);
      setShowSaveDialog(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleLoad = (project: any) => {
    onLoadProject?.(project.project_data as DawProjectDataV2);
    setShowLoadDialog(false);
    toast({
      title: 'Project Loaded',
      description: `Loaded "${project.name}"`,
    });
  };

  const handleDelete = async (projectId: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      try {
        await deleteProject(projectId);
        fetchProjects();
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save to Cloud
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Save Project to Cloud
            </DialogTitle>
            <DialogDescription>
              Store your project securely in the cloud
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome Track"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Make project public</Label>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Project
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-2" />
            Load from Cloud
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Your Cloud Projects
            </DialogTitle>
            <DialogDescription>
              Select a project to load
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No saved projects yet
              </p>
            ) : (
              projects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        {project.description && (
                          <CardDescription className="mt-1">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project.id, project.name);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleLoad(project)}
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Load
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CloudProjectManager;
