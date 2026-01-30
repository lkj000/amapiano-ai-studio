import React, { memo, useMemo } from 'react';

const TIME_SCALE_DIVISOR = 8;
const TRACK_HEADER_WIDTH_PX = 320;

interface TimelineRulerProps {
  zoom: number;
  laneMinWidthPx: number;
  bpm?: number;
}

interface Marker {
  position: number;
  label: string;
  isMajor: boolean;
}

export const TimelineRuler = memo<TimelineRulerProps>(({ zoom, laneMinWidthPx, bpm = 120 }) => {
  const markers = useMemo(() => {
    const result: Marker[] = [];
    const totalBeats = Math.ceil((laneMinWidthPx * TIME_SCALE_DIVISOR) / zoom);
    
    for (let beat = 0; beat <= totalBeats; beat += 4) {
      const bar = Math.floor(beat / 4) + 1;
      result.push({
        position: (beat / TIME_SCALE_DIVISOR) * zoom,
        label: `${bar}`,
        isMajor: true
      });
      
      // Add quarter beat markers
      for (let q = 1; q < 4 && beat + q <= totalBeats; q++) {
        result.push({
          position: ((beat + q) / TIME_SCALE_DIVISOR) * zoom,
          label: '',
          isMajor: false
        });
      }
    }
    return result;
  }, [zoom, laneMinWidthPx]);

  return (
    <div className="flex border-b border-border bg-muted/30 sticky top-0 z-30">
      {/* Pinned header cell - stays fixed during horizontal scroll */}
      <div 
        className="shrink-0 px-3 py-1.5 text-xs font-medium text-muted-foreground border-r bg-background sticky left-0 z-40"
        style={{ width: TRACK_HEADER_WIDTH_PX, minWidth: TRACK_HEADER_WIDTH_PX }}
      >
        Timeline
      </div>
      
      {/* Scrollable markers area */}
      <div className="relative h-6 flex-1" style={{ minWidth: laneMinWidthPx }}>
        {markers.map((marker, i) => (
          <div
            key={i}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: marker.position }}
          >
            <div 
              className={marker.isMajor 
                ? 'h-3 w-px bg-muted-foreground/60' 
                : 'h-1.5 w-px bg-muted-foreground/30'
              } 
            />
            {marker.isMajor && (
              <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                {marker.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

TimelineRuler.displayName = 'TimelineRuler';
