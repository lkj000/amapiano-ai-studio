import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectVersions } from '@/hooks/useProjectVersions';
import { History, RotateCcw, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProjectVersionHistoryProps {
  projectId: string;
  onRestore: (projectData: any) => void;
}

const ProjectVersionHistory: React.FC<ProjectVersionHistoryProps> = ({
  projectId,
  onRestore,
}) => {
  const [open, setOpen] = useState(false);
  const { versions, loadVersions, restoreVersion, isLoading } = useProjectVersions();

  useEffect(() => {
    if (open && projectId) {
      loadVersions(projectId);
    }
  }, [open, projectId]);

  const handleRestore = async (versionId: string, projectData: any) => {
    try {
      await restoreVersion(versionId);
      onRestore(projectData);
      setOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Project Version History
          </DialogTitle>
          <DialogDescription>
            Restore previous versions of your project
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-96 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No version history yet</p>
              <p className="text-sm mt-2">Versions are created automatically when you save</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <Card
                  key={version.id}
                  className={index === 0 ? 'border-primary' : ''}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          Version {version.version_number}
                          {index === 0 && (
                            <Badge variant="default" className="ml-2">
                              Current
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2 text-xs">
                          <Clock className="w-3 h-3" />
                          {formatDate(version.created_at)}
                        </CardDescription>
                      </div>
                      {index !== 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleRestore(version.id, version.project_data)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  {version.change_description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {version.change_description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectVersionHistory;
