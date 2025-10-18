/**
 * Presence Indicators Component
 * Shows real-time presence of workspace members
 */

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { Circle } from 'lucide-react';

interface MemberPresence {
  userId: string;
  displayName: string;
  email?: string;
  isOnline: boolean;
  lastSeen: string;
  color: string;
}

export const PresenceIndicators = () => {
  const { currentWorkspace, members } = useWorkspace();
  const [memberPresences, setMemberPresences] = useState<MemberPresence[]>([]);

  useEffect(() => {
    if (!currentWorkspace) return;

    // Load member profiles and presence
    const loadPresence = async () => {
      const presences: MemberPresence[] = [];

      for (const member of members) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', member.userId)
          .single();

        presences.push({
          userId: member.userId,
          displayName: profile?.display_name || 'Unknown User',
          isOnline: false, // Will be updated by presence system
          lastSeen: new Date().toISOString(),
          color: generateColor(member.userId)
        });
      }

      setMemberPresences(presences);
    };

    loadPresence();

    // Subscribe to presence updates
    const channel = supabase.channel(`workspace:${currentWorkspace.id}:presence`);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        
        setMemberPresences(prev => 
          prev.map(p => ({
            ...p,
            isOnline: !!state[p.userId]
          }))
        );
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setMemberPresences(prev =>
          prev.map(p => p.userId === key ? { ...p, isOnline: true } : p)
        );
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setMemberPresences(prev =>
          prev.map(p => p.userId === key ? { ...p, isOnline: false } : p)
        );
      })
      .subscribe();

    // Announce our presence
    channel.track({
      online_at: new Date().toISOString(),
    });

    return () => {
      channel.unsubscribe();
    };
  }, [currentWorkspace, members]);

  if (!currentWorkspace || memberPresences.length === 0) {
    return null;
  }

  const onlineMembers = memberPresences.filter(m => m.isOnline);

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <div className="flex -space-x-2">
          {memberPresences.slice(0, 5).map((member) => (
            <Tooltip key={member.userId}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar 
                    className="w-8 h-8 border-2 border-background cursor-pointer hover:z-10"
                    style={{ borderColor: member.isOnline ? member.color : undefined }}
                  >
                    <AvatarFallback style={{ backgroundColor: member.color }}>
                      {member.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {member.isOnline && (
                    <Circle 
                      className="w-3 h-3 absolute bottom-0 right-0 text-green-500 fill-green-500" 
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium">{member.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {member.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {memberPresences.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="w-8 h-8 border-2 border-background cursor-pointer">
                  <AvatarFallback className="bg-muted text-xs">
                    +{memberPresences.length - 5}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  {memberPresences.slice(5).map(m => (
                    <div key={m.userId}>{m.displayName}</div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {onlineMembers.length > 0 && (
        <Badge variant="secondary" className="text-xs">
          {onlineMembers.length} online
        </Badge>
      )}
    </div>
  );
};

/**
 * Generate consistent color for user ID
 */
function generateColor(userId: string): string {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#f97316', // orange
    '#6366f1', // indigo
  ];

  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}
