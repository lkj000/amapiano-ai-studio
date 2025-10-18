/**
 * Real-time Cursors Component - Phase 2 Enhancement
 * Displays collaborative user cursors in real-time
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface CursorData {
  userId: string;
  userName: string;
  color: string;
  position: { x: number; y: number };
  trackId?: string;
  timePosition?: number;
  tool?: 'select' | 'draw' | 'erase' | 'split' | 'automation';
  lastUpdate: number;
}

interface RealtimeCursorsProps {
  cursors: Map<string, CursorData>;
  containerRef: React.RefObject<HTMLElement>;
  showLabels?: boolean;
  fadeTimeout?: number;
}

const CursorIcon: React.FC<{ tool?: string; color: string }> = ({ tool, color }) => {
  if (tool === 'draw') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill={color} />
      </svg>
    );
  }

  if (tool === 'erase') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 01-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0z" fill={color} />
      </svg>
    );
  }

  // Default cursor
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill={color} stroke="white" strokeWidth="1.5" />
    </svg>
  );
};

export const RealtimeCursors: React.FC<RealtimeCursorsProps> = ({
  cursors,
  containerRef,
  showLabels = true,
  fadeTimeout = 3000,
}) => {
  const [visibleCursors, setVisibleCursors] = useState<Map<string, CursorData>>(new Map());
  const [containerBounds, setContainerBounds] = useState<DOMRect | null>(null);

  // Update container bounds
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        setContainerBounds(containerRef.current.getBoundingClientRect());
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds);

    return () => {
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, [containerRef]);

  // Filter cursors by activity
  useEffect(() => {
    const now = Date.now();
    const filtered = new Map<string, CursorData>();

    cursors.forEach((cursor, userId) => {
      if (now - cursor.lastUpdate < fadeTimeout) {
        filtered.set(userId, cursor);
      }
    });

    setVisibleCursors(filtered);
  }, [cursors, fadeTimeout]);

  if (!containerBounds) return null;

  return (
    <TooltipProvider>
      <div className="pointer-events-none fixed inset-0 z-50">
        <AnimatePresence>
          {Array.from(visibleCursors.entries()).map(([userId, cursor]) => {
            const { x, y } = cursor.position;
            
            // Ensure cursor is within bounds
            const clampedX = Math.max(0, Math.min(x, window.innerWidth - 24));
            const clampedY = Math.max(0, Math.min(y, window.innerHeight - 24));

            return (
              <motion.div
                key={userId}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  left: clampedX,
                  top: clampedY,
                  transform: 'translate(-2px, -2px)',
                }}
                className="pointer-events-auto"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <CursorIcon tool={cursor.tool} color={cursor.color} />
                      
                      {/* Selection indicator */}
                      {cursor.trackId && (
                        <motion.div
                          className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full"
                          style={{ backgroundColor: cursor.color }}
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                          }}
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="px-2 py-1 text-xs"
                    style={{ backgroundColor: cursor.color }}
                  >
                    <div className="text-white">
                      <div className="font-semibold">{cursor.userName}</div>
                      {cursor.tool && (
                        <div className="text-xs opacity-90">
                          Tool: {cursor.tool}
                        </div>
                      )}
                      {cursor.trackId && (
                        <div className="text-xs opacity-90">
                          Track: {cursor.trackId.slice(0, 8)}
                        </div>
                      )}
                      {cursor.timePosition !== undefined && (
                        <div className="text-xs opacity-90">
                          Time: {cursor.timePosition.toFixed(2)}s
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* User label */}
                {showLabels && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-6 top-0 whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-white shadow-lg"
                    style={{ backgroundColor: cursor.color }}
                  >
                    {cursor.userName}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
};

/**
 * Hook for tracking and broadcasting cursor position
 */
export const useCursorTracking = (
  containerId: string,
  broadcast: (data: Partial<CursorData>) => void
) => {
  const [localCursor, setLocalCursor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      setLocalCursor({ x, y });

      // Throttle broadcasts to 60fps
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          broadcast({ position: { x, y }, lastUpdate: Date.now() });
          throttleTimeout = null;
        }, 16); // ~60fps
      }
    };

    const handleMouseLeave = () => {
      setLocalCursor(null);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [containerId, broadcast]);

  return localCursor;
};
