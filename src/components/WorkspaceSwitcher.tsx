/**
 * Workspace Switcher Component
 * Allows users to switch between different workspaces
 */

import { useState } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Check, ChevronDown, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

export const WorkspaceSwitcher = () => {
  const { currentWorkspace, workspaces, switchWorkspace, createWorkspace, members } = useWorkspace();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    setIsCreating(true);
    try {
      await createWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setIsCreateDialogOpen(false);
      toast.success(`Workspace "${newWorkspaceName}" created successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No workspace</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="max-w-[150px] truncate">{currentWorkspace.name}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>
            <div className="flex items-center justify-between">
              <span>Workspaces</span>
              <Badge variant="secondary" className="text-xs">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => switchWorkspace(workspace.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span className="truncate max-w-[180px]">{workspace.name}</span>
              </div>
              {workspace.id === currentWorkspace.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workspace
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    placeholder="My Studio Team"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateWorkspace();
                      }
                    }}
                  />
                </div>
                <Button 
                  onClick={handleCreateWorkspace} 
                  disabled={isCreating || !newWorkspaceName.trim()}
                  className="w-full"
                >
                  {isCreating ? 'Creating...' : 'Create Workspace'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <Badge variant="outline" className="gap-1">
        <Users className="w-3 h-3" />
        {members.length}
      </Badge>
    </div>
  );
};
