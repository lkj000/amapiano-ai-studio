/**
 * Audit Log Viewer Component
 * Displays workspace activity and system events
 */

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  RefreshCw, 
  Search, 
  XCircle,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditEvent {
  id: string;
  eventType: string;
  eventSource: string;
  userId: string | null;
  workspaceId: string | null;
  payload: any;
  priority: string;
  processed: boolean;
  createdAt: string;
}

export const AuditLogViewer = () => {
  const { currentWorkspace } = useWorkspace();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'normal' | 'low'>('all');

  const loadEvents = async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('system_events')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('priority', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedEvents: AuditEvent[] = (data || []).map((e: any) => ({
        id: e.id,
        eventType: e.event_type,
        eventSource: e.event_source,
        userId: e.user_id,
        workspaceId: e.workspace_id,
        payload: e.payload,
        priority: e.priority,
        processed: e.processed,
        createdAt: e.created_at,
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Failed to load audit events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // Subscribe to real-time updates
    if (currentWorkspace) {
      const channel = supabase
        .channel(`audit:${currentWorkspace.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'system_events',
            filter: `workspace_id=eq.${currentWorkspace.id}`,
          },
          (payload) => {
            setEvents((prev) => [payload.new as any, ...prev].slice(0, 100));
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [currentWorkspace, filter]);

  const getEventIcon = (event: AuditEvent) => {
    switch (event.priority) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'high':
        return <XCircle className="w-4 h-4 text-orange-500" />;
      case 'normal':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  if (!currentWorkspace) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No workspace selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Audit Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={loadEvents}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getEventIcon(event)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{event.eventType}</span>
                        <Badge variant={getPriorityColor(event.priority) as any} className="text-xs">
                          {event.priority}
                        </Badge>
                        {event.processed && (
                          <Badge variant="outline" className="text-xs">
                            ✓ Processed
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Source: {event.eventSource}
                      </div>
                      {event.payload && Object.keys(event.payload).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
