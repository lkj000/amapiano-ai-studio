/**
 * Workspace Manager Component - Multi-Tenancy UI
 */

import { useState } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Plus, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const WorkspaceManager = () => {
  const {
    currentWorkspace,
    workspaces,
    members,
    isLoading,
    createWorkspace,
    switchWorkspace,
  } = useWorkspace();

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    setIsCreating(true);
    await createWorkspace(newWorkspaceName);
    setIsCreating(false);
    setNewWorkspaceName('');
    setDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workspaces</h2>
          <p className="text-muted-foreground">Manage your team collaboration spaces</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
              <DialogDescription>
                Create a new workspace for team collaboration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="My Music Studio"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkspace} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Workspace */}
      {currentWorkspace && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentWorkspace.name}
                  <Badge variant="default">Active</Badge>
                </CardTitle>
                <CardDescription>
                  <Users className="inline h-4 w-4 mr-1" />
                  {members.length} member{members.length !== 1 && 's'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* All Workspaces */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaces
          .filter(w => w.id !== currentWorkspace?.id)
          .map(workspace => (
            <Card
              key={workspace.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => switchWorkspace(workspace.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{workspace.name}</CardTitle>
                <CardDescription>
                  Click to switch to this workspace
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
      </div>

      {workspaces.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No workspaces yet. Create your first workspace to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
