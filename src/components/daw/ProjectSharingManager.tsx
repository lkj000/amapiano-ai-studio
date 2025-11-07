import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectSharing } from '@/hooks/useProjectSharing';
import { Share2, Copy, Trash2, Mail, Eye, Edit, Loader2, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProjectSharingManagerProps {
  projectId: string;
  projectName: string;
}

const ProjectSharingManager: React.FC<ProjectSharingManagerProps> = ({
  projectId,
  projectName,
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [expiresInDays, setExpiresInDays] = useState<string>('7');
  
  const { shares, createShare, loadShares, revokeShare, isLoading } = useProjectSharing();

  useEffect(() => {
    if (open && projectId) {
      loadShares(projectId);
    }
  }, [open, projectId]);

  const handleCreateShare = async () => {
    if (!email.trim()) return;

    try {
      await createShare(
        projectId,
        email,
        permission,
        expiresInDays ? parseInt(expiresInDays) : undefined
      );
      setEmail('');
      setPermission('view');
      loadShares(projectId);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share "{projectName}"
          </DialogTitle>
          <DialogDescription>
            Invite collaborators or create shareable links
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create Share Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create Share Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="permission">Permission</Label>
                  <Select
                    value={permission}
                    onValueChange={(value) => setPermission(value as 'view' | 'edit')}
                  >
                    <SelectTrigger id="permission">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Only
                        </div>
                      </SelectItem>
                      <SelectItem value="edit">
                        <div className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Can Edit
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires">Expires In</Label>
                  <Select
                    value={expiresInDays}
                    onValueChange={setExpiresInDays}
                  >
                    <SelectTrigger id="expires">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateShare}
                disabled={!email.trim()}
                className="w-full"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Create Share Link
              </Button>
            </CardContent>
          </Card>

          {/* Active Shares */}
          <div>
            <h4 className="text-sm font-medium mb-3">Active Shares</h4>
            <ScrollArea className="h-64">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : shares.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active shares</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {shares.map((share) => (
                    <Card key={share.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate">{share.shared_with_email}</span>
                              <Badge variant={share.permission === 'edit' ? 'default' : 'secondary'}>
                                {share.permission === 'edit' ? (
                                  <>
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </>
                                )}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created {formatDate(share.created_at)}
                              {share.expires_at && ` · Expires ${formatDate(share.expires_at)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(share.share_token)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeShare(share.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSharingManager;
