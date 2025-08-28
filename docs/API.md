# Amapiano AI - API Reference

## Overview

Amapiano AI uses Supabase as its backend platform, providing authentication, database, storage, and serverless functions. This document outlines all available APIs, their endpoints, authentication requirements, and usage examples.

## Base Configuration

### Supabase Client Setup

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://mywijmtszelyutssormy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## Authentication API

### Sign Up

**Endpoint:** `supabase.auth.signUp(credentials)`

```typescript
interface SignUpCredentials {
  email: string;
  password: string;
  options?: {
    data?: {
      display_name?: string;
    };
  };
}

// Example usage
const signUp = async (email: string, password: string, displayName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });
  
  if (error) throw error;
  return data;
};
```

### Sign In

**Endpoint:** `supabase.auth.signInWithPassword(credentials)`

```typescript
interface SignInCredentials {
  email: string;
  password: string;
}

// Example usage
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};
```

### Sign Out

**Endpoint:** `supabase.auth.signOut()`

```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

### Get Current User

**Endpoint:** `supabase.auth.getUser()`

```typescript
const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};
```

## Database API

### Profiles

#### Get Profile

```typescript
const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  return data;
};
```

#### Update Profile

```typescript
interface ProfileUpdate {
  display_name?: string;
  avatar_url?: string;
}

const updateProfile = async (userId: string, updates: ProfileUpdate) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
```

### DAW Projects

#### Get User Projects

```typescript
const getUserProjects = async () => {
  const { data, error } = await supabase
    .from('daw_projects')
    .select('*')
    .order('updated_at', { ascending: false });
    
  if (error) throw error;
  return data;
};
```

#### Create Project

```typescript
interface CreateProjectData {
  name: string;
  bpm?: number;
  key_signature?: string;
  time_signature?: string;
  project_data?: any;
}

const createProject = async (projectData: CreateProjectData) => {
  const { data, error } = await supabase
    .from('daw_projects')
    .insert([{
      ...projectData,
      user_id: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
```

#### Update Project

```typescript
const updateProject = async (projectId: string, updates: Partial<CreateProjectData>) => {
  const { data, error } = await supabase
    .from('daw_projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
```

#### Delete Project

```typescript
const deleteProject = async (projectId: string) => {
  const { error } = await supabase
    .from('daw_projects')
    .delete()
    .eq('id', projectId);
    
  if (error) throw error;
};
```

### Marketplace Items

#### Get Marketplace Items

```typescript
interface MarketplaceFilter {
  category?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

const getMarketplaceItems = async (filters: MarketplaceFilter = {}) => {
  let query = supabase
    .from('marketplace_items')
    .select('*')
    .eq('active', true);
    
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  
  if (filters.featured) {
    query = query.eq('featured', true);
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }
  
  query = query.order('featured', { ascending: false })
               .order('created_at', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
```

### Samples

#### Get Public Samples

```typescript
interface SampleFilter {
  category?: string;
  search?: string;
  bpm_min?: number;
  bpm_max?: number;
  key_signature?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

const getPublicSamples = async (filters: SampleFilter = {}) => {
  let query = supabase
    .from('samples')
    .select('*')
    .eq('is_public', true);
    
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  
  if (filters.bpm_min) {
    query = query.gte('bpm', filters.bpm_min);
  }
  
  if (filters.bpm_max) {
    query = query.lte('bpm', filters.bpm_max);
  }
  
  if (filters.key_signature) {
    query = query.eq('key_signature', filters.key_signature);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
```

#### Upload Sample

```typescript
interface SampleUpload {
  name: string;
  description?: string;
  file: File;
  category: string;
  bpm?: number;
  key_signature?: string;
  tags?: string[];
  is_public?: boolean;
}

const uploadSample = async (sampleData: SampleUpload) => {
  // Upload file to storage
  const fileName = `${Date.now()}-${sampleData.file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('samples')
    .upload(fileName, sampleData.file);
    
  if (uploadError) throw uploadError;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('samples')
    .getPublicUrl(fileName);
  
  // Create sample record
  const { data, error } = await supabase
    .from('samples')
    .insert([{
      name: sampleData.name,
      description: sampleData.description,
      file_url: publicUrl,
      category: sampleData.category,
      bpm: sampleData.bpm,
      key_signature: sampleData.key_signature,
      duration: 0, // Will be calculated on server
      file_size: sampleData.file.size,
      tags: sampleData.tags || [],
      is_public: sampleData.is_public || false,
      user_id: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
```

### Subscriptions

#### Get User Subscription

```typescript
const getUserSubscription = async () => {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
};
```

## Edge Functions API

### AI Music Generation

**Endpoint:** `ai-music-generation`
**Authentication:** Not Required (verify_jwt = false)

```typescript
interface GenerationParams {
  prompt?: string;
  genre: 'classic' | 'private-school';
  bpm: number;
  key_signature: string;
  mood: string;
  duration: number; // in seconds
  instrumentation: string[];
  reference_audio?: string; // URL or base64
}

const generateMusic = async (params: GenerationParams) => {
  const { data, error } = await supabase.functions.invoke('ai-music-generation', {
    body: params
  });
  
  if (error) throw error;
  return data;
};

// Response format
interface GenerationResponse {
  success: boolean;
  audio_url?: string;
  metadata: {
    bpm: number;
    key: string;
    duration: number;
    instruments: string[];
  };
  analysis?: {
    harmonic_structure: string;
    rhythmic_patterns: string[];
  };
}
```

### Check Subscription

**Endpoint:** `check-subscription`
**Authentication:** Required

```typescript
const checkSubscription = async () => {
  const { data, error } = await supabase.functions.invoke('check-subscription');
  
  if (error) throw error;
  return data;
};

// Response format
interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: 'basic' | 'premium' | 'enterprise';
  subscription_end?: string;
}
```

### Create Purchase

**Endpoint:** `create-purchase`
**Authentication:** Required

```typescript
interface PurchaseData {
  item_id: string;
  quantity?: number;
}

const createPurchase = async (purchaseData: PurchaseData) => {
  const { data, error } = await supabase.functions.invoke('create-purchase', {
    body: purchaseData
  });
  
  if (error) throw error;
  return data;
};

// Response format
interface PurchaseResponse {
  url: string; // Stripe checkout URL
}
```

### Create Subscription

**Endpoint:** `create-subscription`
**Authentication:** Required

```typescript
interface SubscriptionData {
  tier: 'basic' | 'premium' | 'enterprise';
}

const createSubscription = async (subscriptionData: SubscriptionData) => {
  const { data, error } = await supabase.functions.invoke('create-subscription', {
    body: subscriptionData
  });
  
  if (error) throw error;
  return data;
};

// Response format
interface SubscriptionResponse {
  url: string; // Stripe checkout URL
}
```

### Customer Portal

**Endpoint:** `customer-portal`
**Authentication:** Required

```typescript
const openCustomerPortal = async () => {
  const { data, error } = await supabase.functions.invoke('customer-portal');
  
  if (error) throw error;
  
  // Open in new tab
  window.open(data.url, '_blank');
  return data;
};

// Response format
interface PortalResponse {
  url: string; // Stripe customer portal URL
}
```

### Demo Audio Files

**Endpoint:** `demo-audio-files`
**Authentication:** Not Required (verify_jwt = false)

```typescript
interface DemoFileRequest {
  type: 'sample' | 'pattern' | 'generated';
  category?: string;
  duration?: number;
}

const getDemoAudioFile = async (request: DemoFileRequest) => {
  const { data, error } = await supabase.functions.invoke('demo-audio-files', {
    body: request
  });
  
  if (error) throw error;
  return data;
};

// Response format
interface DemoFileResponse {
  audio_url: string;
  metadata: {
    type: string;
    duration: number;
    format: string;
  };
}
```

## Storage API

### File Upload

```typescript
const uploadFile = async (bucket: string, file: File, path?: string) => {
  const fileName = path || `${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);
    
  if (error) throw error;
  return data;
};
```

### Get Public URL

```typescript
const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return data.publicUrl;
};
```

### Download File

```typescript
const downloadFile = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);
    
  if (error) throw error;
  return data;
};
```

## Real-time API

### Subscribe to Table Changes

```typescript
interface RealtimeSubscription {
  channel: string;
  table: string;
  filter?: string;
  callback: (payload: any) => void;
}

const subscribeToChanges = (subscription: RealtimeSubscription) => {
  const channel = supabase
    .channel(subscription.channel)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: subscription.table,
      filter: subscription.filter
    }, subscription.callback)
    .subscribe();
    
  return () => channel.unsubscribe();
};

// Example: Subscribe to project changes
const unsubscribe = subscribeToChanges({
  channel: 'daw_projects',
  table: 'daw_projects',
  filter: 'user_id=eq.123e4567-e89b-12d3-a456-426614174000',
  callback: (payload) => {
    console.log('Project changed:', payload);
  }
});
```

## Error Handling

### Common Error Patterns

```typescript
// Error handling wrapper
const apiCall = async <T>(
  operation: () => Promise<{ data: T; error: any }>
): Promise<T> => {
  try {
    const { data, error } = await operation();
    
    if (error) {
      // Log error for debugging
      console.error('API Error:', error);
      
      // Handle specific error types
      switch (error.code) {
        case 'PGRST116':
          throw new Error('No data found');
        case '23505':
          throw new Error('Data already exists');
        case '42501':
          throw new Error('Insufficient permissions');
        default:
          throw new Error(error.message || 'An unexpected error occurred');
      }
    }
    
    return data;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      throw new Error('Network error - please check your connection');
    }
    
    throw error;
  }
};

// Usage example
const safeGetProjects = () => apiCall(() => 
  supabase.from('daw_projects').select('*')
);
```

### Error Codes Reference

| Code | Description | Common Cause |
|------|-------------|--------------|
| PGRST116 | No rows returned | Query returned empty result |
| 23505 | Unique violation | Duplicate data insertion |
| 42501 | Insufficient privilege | RLS policy violation |
| 23503 | Foreign key violation | Referenced record doesn't exist |
| 42P01 | Table doesn't exist | Migration not applied |
| 08006 | Connection failure | Network/database connectivity |

## Rate Limits

### Edge Functions
- **Default:** 100 requests per minute per IP
- **Authenticated:** 1000 requests per minute per user
- **Subscription tiers:** Higher limits for premium users

### Database Operations
- **Read operations:** 10,000 per minute
- **Write operations:** 1,000 per minute
- **Real-time connections:** 100 concurrent per project

### Storage Operations
- **Upload:** 100 files per minute
- **Download:** 1,000 requests per minute
- **File size limit:** 50MB per file (5GB for premium)

## TypeScript Types

### Database Types

```typescript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daw_projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          version: number;
          bpm: number;
          key_signature: string;
          time_signature: string;
          project_data: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          version?: number;
          bpm?: number;
          key_signature?: string;
          time_signature?: string;
          project_data?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          version?: number;
          bpm?: number;
          key_signature?: string;
          time_signature?: string;
          project_data?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      // ... other table types
    };
    Enums: {
      subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
    };
  };
}
```

---

This API reference provides comprehensive documentation for all available endpoints and operations in the Amapiano AI platform. For additional examples and advanced usage patterns, refer to the component implementations in the codebase.
