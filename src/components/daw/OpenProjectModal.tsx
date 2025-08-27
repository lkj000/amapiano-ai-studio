import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Clock } from "lucide-react";
import backend from "@/backend/client";
import LoadingSpinner from "../LoadingSpinner";
import ErrorMessage from "../ErrorMessage";

interface OpenProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (projectId: string) => void;
}

export default function OpenProjectModal({
  isOpen,
  onClose,
  onLoadProject,
}: OpenProjectModalProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ['dawProjectsList'],
    queryFn: () => backend.music.listProjects(),
    enabled: isOpen,
  });

  const handleLoadProject = () => {
    if (selectedProject) {
      onLoadProject(selectedProject);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Open Project
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner message="Loading projects..." />
            </div>
          )}

          {error && (
            <div className="flex justify-center py-8">
              <ErrorMessage error={error as Error} onRetry={refetch} />
            </div>
          )}

          {projects && projects.projects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No projects found. Create your first project!
            </div>
          )}

          {projects && projects.projects.length > 0 && (
            <div className="space-y-3">
              {projects.projects.map((project) => (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedProject === project.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedProject(project.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{project.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{project.bpm} BPM</span>
                          <span>{project.keySignature}</span>
                          <Badge variant="outline" className="text-xs">
                            v{project.version}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleLoadProject}
            disabled={!selectedProject}
          >
            Load Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}