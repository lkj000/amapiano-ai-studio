# Amapiano AI - Development Guide

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Architecture](#project-architecture)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Guide](#deployment-guide)
7. [Debugging & Troubleshooting](#debugging--troubleshooting)
8. [Contributing Guidelines](#contributing-guidelines)

## Development Environment Setup

### Prerequisites

```bash
# Node.js (v18 or higher)
node --version  # Should be 18.x.x or higher

# npm (comes with Node.js)
npm --version

# Git
git --version
```

### Initial Setup

#### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/amapiano-ai.git
cd amapiano-ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

#### 2. Environment Configuration

Create `.env.local` with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://mywijmtszelyutssormy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Development Mode
NODE_ENV=development
VITE_APP_ENV=development
```

#### 3. Development Server

```bash
# Start development server
npm run dev

# The application will be available at:
# http://localhost:8080
```

#### 4. IDE Setup

**VS Code Extensions (Recommended):**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

**VS Code Settings (`.vscode/settings.json`):**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## Project Architecture

### Folder Structure

```
amapiano-ai/
├── public/                   # Static assets
│   ├── favicon.ico
│   └── robots.txt
│
├── src/                      # Source code
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── daw/             # DAW-specific components
│   │   └── *.tsx            # Feature components
│   │
│   ├── pages/               # Page components (routes)
│   │   ├── Index.tsx
│   │   ├── Generate.tsx
│   │   ├── Analyze.tsx
│   │   ├── Samples.tsx
│   │   ├── Patterns.tsx
│   │   ├── DAW.tsx
│   │   ├── Auth.tsx
│   │   └── NotFound.tsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAudioEngine.ts
│   │   ├── useAudioEffects.ts
│   │   ├── useDawProjects.ts
│   │   ├── useSubscription.ts
│   │   └── ...
│   │
│   ├── integrations/        # External integrations
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── daw.ts
│   │
│   ├── lib/                 # Utility functions
│   │   └── utils.ts
│   │
│   ├── App.tsx              # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles & design system
│
├── supabase/                # Supabase configuration
│   ├── functions/           # Edge functions
│   └── config.toml         # Supabase config
│
├── docs/                    # Documentation
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

### Technology Stack

```typescript
// Core Technologies
const techStack = {
  frontend: {
    framework: "React 18",
    language: "TypeScript",
    bundler: "Vite",
    styling: "Tailwind CSS",
    components: "shadcn/ui + Radix UI",
    routing: "React Router v6",
    state: "TanStack Query + React Context",
    forms: "React Hook Form + Zod"
  },
  backend: {
    platform: "Supabase",
    database: "PostgreSQL",
    auth: "Supabase Auth",
    storage: "Supabase Storage",
    functions: "Supabase Edge Functions (Deno)",
    realtime: "Supabase Realtime"
  },
  audio: {
    engine: "Web Audio API",
    processing: "WebAssembly",
    visualization: "Canvas API",
    formats: "MP3, WAV, FLAC, AAC"
  },
  payments: {
    provider: "Stripe",
    subscriptions: "Stripe Subscriptions",
    checkout: "Stripe Checkout"
  }
};
```

## Development Workflow

### 1. Creating New Features

```bash
# Create a new feature branch
git checkout -b feature/new-audio-effect

# Make your changes following the patterns below
# ...

# Commit your changes
git add .
git commit -m "feat: add new audio effect processor"

# Push and create PR
git push origin feature/new-audio-effect
```

### 2. Component Development Pattern

```typescript
// components/NewComponent.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NewComponentProps {
  title: string;
  description?: string;
  className?: string;
  onAction?: () => void;
}

export const NewComponent: React.FC<NewComponentProps> = ({
  title,
  description,
  className,
  onAction
}) => {
  return (
    <Card className={cn("p-6", className)}>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      )}
      {onAction && (
        <Button onClick={onAction} className="mt-4">
          Take Action
        </Button>
      )}
    </Card>
  );
};
```

### 3. Custom Hook Pattern

```typescript
// hooks/useNewFeature.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UseNewFeatureReturn {
  data: any[];
  loading: boolean;
  error: Error | null;
  createItem: (item: any) => Promise<void>;
  updateItem: (id: string, updates: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useNewFeature = (): UseNewFeatureReturn => {
  const queryClient = useQueryClient();

  // Fetch data
  const { data = [], isLoading: loading, error } = useQuery({
    queryKey: ['new-feature'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('new_table')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase
        .from('new_table')
        .insert([item]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-feature'] });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('new_table')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-feature'] });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('new_table')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-feature'] });
    }
  });

  return {
    data,
    loading,
    error: error as Error | null,
    createItem: createMutation.mutateAsync,
    updateItem: (id: string, updates: any) => 
      updateMutation.mutateAsync({ id, updates }),
    deleteItem: deleteMutation.mutateAsync
  };
};
```

### 4. Edge Function Development

```typescript
// supabase/functions/new-function/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const body = await req.json();

    // Business logic here
    const result = await processRequest(body, user);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function processRequest(body: any, user: any) {
  // Implement your business logic here
  return { success: true, data: body };
}
```

## Code Standards

### TypeScript Standards

```typescript
// Use explicit interfaces for props
interface ComponentProps {
  title: string;
  isActive: boolean;
  onToggle: (active: boolean) => void;
  children?: React.ReactNode;
}

// Use proper type definitions
type AudioFormat = 'mp3' | 'wav' | 'flac' | 'aac';
type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

// Use generics appropriately
interface ApiResponse<T> {
  data: T;
  error: string | null;
  meta: {
    total: number;
    page: number;
  };
}

// Use enums for constants
enum AudioEffectType {
  REVERB = 'reverb',
  DELAY = 'delay',
  COMPRESSOR = 'compressor',
  EQ = 'eq'
}
```

### React Standards

```typescript
// Use functional components with proper typing
const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, autoPlay = false }) => {
  // Use proper state typing
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Use useCallback for event handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // Use useMemo for expensive calculations
  const audioAnalysis = useMemo(() => {
    return analyzeAudioBuffer(audioBuffer);
  }, [audioBuffer]);

  // Proper cleanup in useEffect
  useEffect(() => {
    const audio = new Audio(src);
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
    };
  }, [src]);

  return (
    <div className="audio-player">
      {/* Component content */}
    </div>
  );
};
```

### CSS/Styling Standards

```css
/* Use semantic color tokens from design system */
.audio-waveform {
  @apply bg-card border border-border rounded-lg p-4;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
}

/* Use component classes for reusable styles */
.btn-glow {
  @apply transition-all duration-300 ease-smooth;
  box-shadow: var(--shadow-glow);
}

.btn-glow:hover {
  @apply transform -translate-y-0.5;
  box-shadow: 0 0 30px hsl(var(--primary) / 0.4);
}

/* Use custom properties for dynamic values */
.audio-progress {
  --progress: 0%;
  width: var(--progress);
  transition: width 0.1s ease-out;
}
```

### File Naming Conventions

```
# Components (PascalCase)
AudioPlayer.tsx
MixerChannel.tsx
EffectsPanel.tsx

# Hooks (camelCase with 'use' prefix)
useAudioEngine.ts
useSubscription.ts
useDawProjects.ts

# Utilities (camelCase)
audioUtils.ts
formatTime.ts
validateInput.ts

# Types (camelCase)
daw.ts
audio.ts
subscription.ts

# Constants (SCREAMING_SNAKE_CASE)
AUDIO_FORMATS.ts
SUBSCRIPTION_TIERS.ts
```

## Testing Strategy

### Unit Testing with Vitest

```typescript
// __tests__/utils/audioUtils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDuration, parseAudioFile } from '@/lib/audioUtils';

describe('audioUtils', () => {
  describe('formatDuration', () => {
    it('should format seconds to mm:ss', () => {
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(3661)).toBe('61:01');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0:00');
    });
  });

  describe('parseAudioFile', () => {
    it('should extract metadata from audio file', async () => {
      const mockFile = new File([''], 'test.mp3', { type: 'audio/mpeg' });
      const metadata = await parseAudioFile(mockFile);
      
      expect(metadata).toHaveProperty('duration');
      expect(metadata).toHaveProperty('format');
    });
  });
});
```

### Component Testing with React Testing Library

```typescript
// __tests__/components/AudioPlayer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AudioPlayer } from '@/components/AudioPlayer';

// Mock Web Audio API
const mockAudioContext = {
  createMediaElementSource: vi.fn(),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1 }
  }))
};

vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));

describe('AudioPlayer', () => {
  it('should render play button', () => {
    render(<AudioPlayer src="test.mp3" />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('should toggle play state when button clicked', () => {
    render(<AudioPlayer src="test.mp3" />);
    const playButton = screen.getByRole('button', { name: /play/i });
    
    fireEvent.click(playButton);
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });
});
```

### E2E Testing Setup

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should sign in user', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should create new project', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to DAW
    await page.goto('/daw');
    
    // Create new project
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[name="projectName"]', 'Test Project');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[data-testid="project-title"]')).toContainText('Test Project');
  });
});
```

### Test Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Deployment Guide

### Development Deployment

```bash
# Install dependencies
npm install

# Build for development
npm run build:dev

# Preview build
npm run preview
```

### Production Deployment

#### 1. Environment Variables

```bash
# Production environment (.env.production)
VITE_SUPABASE_URL=https://mywijmtszelyutssormy.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
NODE_ENV=production
```

#### 2. Build Process

```bash
# Production build
npm run build

# Verify build
npm run preview
```

#### 3. Deployment Platforms

**Vercel Deployment:**
```json
{
  "name": "amapiano-ai",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    { "src": "/[^.]+", "dest": "/", "status": 200 }
  ]
}
```

**Netlify Deployment:**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 4. Supabase Functions Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy ai-music-generation

# Set environment variables
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set OPENAI_API_KEY=sk-...
```

## Debugging & Troubleshooting

### Common Issues

#### 1. Audio Context Issues

```typescript
// Audio context debugging
const debugAudioContext = () => {
  console.log('AudioContext supported:', 'AudioContext' in window);
  console.log('webkitAudioContext supported:', 'webkitAudioContext' in window);
  
  const context = new (window.AudioContext || window.webkitAudioContext)();
  console.log('Context state:', context.state);
  console.log('Sample rate:', context.sampleRate);
  
  // Resume context if suspended
  if (context.state === 'suspended') {
    context.resume().then(() => {
      console.log('Context resumed');
    });
  }
};
```

#### 2. Supabase Connection Issues

```typescript
// Debug Supabase connection
const debugSupabase = async () => {
  try {
    // Test connection
    const { data, error } = await supabase.from('profiles').select('count');
    console.log('Supabase connection:', data ? 'Success' : 'Failed', error);
    
    // Test authentication
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    // Test edge function
    const { data: funcData, error: funcError } = await supabase.functions.invoke('demo-audio-files');
    console.log('Edge function test:', funcData ? 'Success' : 'Failed', funcError);
    
  } catch (error) {
    console.error('Supabase debug error:', error);
  }
};
```

#### 3. Performance Debugging

```typescript
// Performance monitoring
const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`${componentName} render time:`, endTime - startTime, 'ms');
    };
  });
};

// Memory usage monitoring
const logMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
};
```

### Development Tools

#### 1. Browser DevTools

```typescript
// Add to window for debugging
if (process.env.NODE_ENV === 'development') {
  (window as any).debugTools = {
    supabase,
    audioEngine: audioEngineInstance,
    queryClient,
    logMemoryUsage,
    debugAudioContext
  };
}
```

#### 2. React DevTools

```bash
# Install React DevTools browser extension
# https://chrome.google.com/webstore/detail/react-developer-tools/
```

#### 3. Redux DevTools (for complex state)

```typescript
// For debugging complex state management
import { devtools } from 'zustand/middleware';

const useAppStore = create(
  devtools(
    (set) => ({
      // store implementation
    }),
    {
      name: 'amapiano-ai-store'
    }
  )
);
```

## Contributing Guidelines

### 1. Code Review Checklist

- [ ] TypeScript types are properly defined
- [ ] Components follow naming conventions
- [ ] Proper error handling is implemented
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Performance impact is considered
- [ ] Accessibility guidelines are followed
- [ ] Design system tokens are used

### 2. Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
Include screenshots for UI changes

## Additional Notes
Any additional context or considerations
```

### 3. Commit Message Format

```bash
# Format: type(scope): description

feat(daw): add new audio effect processor
fix(auth): resolve login redirect issue
docs(api): update endpoint documentation
style(ui): update button component styling
refactor(audio): optimize audio processing pipeline
test(components): add unit tests for AudioPlayer
chore(deps): update dependencies
```

### 4. Code Documentation

```typescript
/**
 * Processes audio buffer for visualization
 * @param buffer - Audio buffer to process
 * @param sampleRate - Sample rate of the audio
 * @param options - Processing options
 * @returns Processed audio data for visualization
 */
export const processAudioForVisualization = (
  buffer: AudioBuffer,
  sampleRate: number,
  options: {
    resolution?: number;
    normalize?: boolean;
  } = {}
): Float32Array => {
  const { resolution = 1024, normalize = true } = options;
  
  // Implementation details...
  
  return processedData;
};
```

---

This development guide provides comprehensive instructions for setting up, developing, testing, and deploying the Amapiano AI platform. Follow these guidelines to maintain code quality and consistency across the project.