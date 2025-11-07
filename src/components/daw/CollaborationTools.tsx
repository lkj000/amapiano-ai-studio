import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CollaborationPanel from '@/components/CollaborationPanel';
import RealTimeCollaboration from '@/components/RealTimeCollaboration';
import type { DawProjectDataV2 } from '@/types/daw';

interface CollaborationToolsProps {
  projectId: string;
  projectName: string;
  projectData: DawProjectDataV2;
  onProjectUpdate: (data: DawProjectDataV2) => void;
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

const CollaborationTools: React.FC<CollaborationToolsProps> = ({
  projectId,
  projectName,
  projectData,
  onProjectUpdate,
  currentUser,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="w-4 h-4 mr-2" />
          Collaborate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Real-Time Collaboration
          </DialogTitle>
          <DialogDescription>
            Collaborate with others in real-time on {projectName}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="session" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="session">
              <Users className="w-4 h-4 mr-2" />
              Session
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat & Presence
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="session" className="flex-1 overflow-auto mt-4">
            <CollaborationPanel
              projectId={projectId}
              projectName={projectName}
              projectData={projectData}
              onClose={() => setOpen(false)}
              onProjectUpdate={onProjectUpdate}
            />
          </TabsContent>
          
          <TabsContent value="chat" className="flex-1 overflow-auto mt-4">
            {currentUser ? (
              <RealTimeCollaboration
                projectId={projectId}
                currentUser={currentUser}
                projectData={projectData}
                onProjectUpdate={onProjectUpdate}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Please sign in to use real-time collaboration
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CollaborationTools;
