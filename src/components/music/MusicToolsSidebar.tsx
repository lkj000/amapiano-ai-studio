import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Music, 
  Mic, 
  MicOff, 
  FileText, 
  Scissors, 
  Volume2, 
  Music2, 
  Radio,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MusicToolsSidebarProps {
  activeTool?: string;
}

const tools = [
  {
    id: 'music-generator',
    name: 'Music Generator',
    icon: Music,
    path: '/generate-song-suno',
    description: 'AI-powered song generation',
  },
  {
    id: 'vocal-generator',
    name: 'Vocal Generator',
    icon: Mic,
    path: '/generate-song-elevenlabs-singing',
    description: 'ElevenLabs singing vocals',
  },
  {
    id: 'instrumental',
    name: 'Instrumental',
    icon: Music2,
    path: '/generate-instrumental',
    description: 'Pure instrumental tracks',
  },
  {
    id: 'backing-intro',
    name: 'Backing + Intro',
    icon: Radio,
    path: '/generate-backing-with-intro',
    description: 'Backing with spoken intro',
  },
  {
    id: 'vocal-remover',
    name: 'Vocal Remover',
    icon: MicOff,
    path: '/vocal-remover',
    description: 'Remove vocals from songs',
  },
  {
    id: 'lyrics-generator',
    name: 'AI Lyrics',
    icon: FileText,
    path: '/ai-lyrics-generator',
    description: 'Generate song lyrics',
  },
  {
    id: 'stem-splitter',
    name: 'Stem Splitter',
    icon: Scissors,
    path: '/stem-splitter',
    description: 'Split into stems',
  },
  {
    id: 'sound-effect',
    name: 'Sound Effects',
    icon: Volume2,
    path: '/sound-effect',
    description: 'Generate sound effects',
  },
];

export const MusicToolsSidebar: React.FC<MusicToolsSidebarProps> = ({ activeTool }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-screen sticky top-0 border-r bg-card transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="font-semibold text-lg">Music Tools</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {tools.map((tool) => {
            const isActive = activeTool === tool.id || location.pathname === tool.path;
            return (
              <Link
                key={tool.id}
                to={tool.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                )}
                title={isCollapsed ? tool.name : undefined}
              >
                <tool.icon className={cn("h-5 w-5 shrink-0", isActive && "text-inherit")} />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tool.name}</p>
                    <p className={cn(
                      "text-xs truncate",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {tool.description}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default MusicToolsSidebar;
