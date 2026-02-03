/**
 * Developer Mode Store
 * Real implementation - persisted to localStorage and synced with user roles
 * Controls visibility of research/dev tools for progressive disclosure
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'user' | 'creator' | 'developer' | 'researcher' | 'admin';

export interface NavigationCategory {
  id: string;
  label: string;
  description: string;
  requiredRole: UserRole;
  isExpanded?: boolean;
}

interface DeveloperModeState {
  // Core state
  isDeveloperMode: boolean;
  userRole: UserRole;
  isLoading: boolean;
  
  // UI preferences
  showAdvancedNav: boolean;
  showResearchTools: boolean;
  showPerformanceMetrics: boolean;
  showDebugInfo: boolean;
  
  // Category expansion state
  expandedCategories: string[];
  
  // Actions
  setDeveloperMode: (enabled: boolean) => void;
  setUserRole: (role: UserRole) => void;
  toggleAdvancedNav: () => void;
  toggleResearchTools: () => void;
  togglePerformanceMetrics: () => void;
  toggleDebugInfo: () => void;
  toggleCategory: (categoryId: string) => void;
  
  // Sync with database
  syncUserRole: (userId: string) => Promise<void>;
  
  // Permission checks
  hasRole: (requiredRole: UserRole) => boolean;
  canAccessFeature: (feature: string) => boolean;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  creator: 1,
  developer: 2,
  researcher: 3,
  admin: 4,
};

// Features mapped to minimum required roles
const FEATURE_ROLES: Record<string, UserRole> = {
  // User features (everyone)
  'generate': 'user',
  'studio': 'user',
  'social': 'user',
  'samples': 'user',
  'templates': 'user',
  
  // Creator features
  'daw': 'creator',
  'master': 'creator',
  'release': 'creator',
  'promote': 'creator',
  'audio-editor': 'creator',
  
  // Developer features
  'aura': 'developer',
  'ai-hub': 'developer',
  'aura808': 'developer',
  'amapianorize': 'developer',
  'plugin-dev': 'developer',
  
  // Researcher features
  'research': 'researcher',
  'performance': 'researcher',
  'level5-dashboard': 'researcher',
  'user-study': 'researcher',
  'study-analytics': 'researcher',
  'ab-pair-generator': 'researcher',
  'audio-test-lab': 'researcher',
  'training-data': 'researcher',
  
  // Admin features
  'admin': 'admin',
  'vast-demo': 'admin',
};

export const useDeveloperModeStore = create<DeveloperModeState>()(
  persist(
    (set, get) => ({
      // Initial state
      isDeveloperMode: false,
      userRole: 'user',
      isLoading: true,
      showAdvancedNav: false,
      showResearchTools: false,
      showPerformanceMetrics: false,
      showDebugInfo: false,
      expandedCategories: ['create'],
      
      // Actions
      setDeveloperMode: (enabled) => set({ 
        isDeveloperMode: enabled,
        showAdvancedNav: enabled,
        showResearchTools: enabled,
        showPerformanceMetrics: enabled,
      }),
      
      setUserRole: (role) => set({ userRole: role }),
      
      toggleAdvancedNav: () => set((state) => ({ 
        showAdvancedNav: !state.showAdvancedNav 
      })),
      
      toggleResearchTools: () => set((state) => ({ 
        showResearchTools: !state.showResearchTools 
      })),
      
      togglePerformanceMetrics: () => set((state) => ({ 
        showPerformanceMetrics: !state.showPerformanceMetrics 
      })),
      
      toggleDebugInfo: () => set((state) => ({ 
        showDebugInfo: !state.showDebugInfo 
      })),
      
      toggleCategory: (categoryId) => set((state) => ({
        expandedCategories: state.expandedCategories.includes(categoryId)
          ? state.expandedCategories.filter(id => id !== categoryId)
          : [...state.expandedCategories, categoryId]
      })),
      
      // Sync user role from database
      syncUserRole: async (userId) => {
        set({ isLoading: true });
        
        try {
          // Query user's role from profiles - using raw select to avoid type issues
          // The columns were added via migration but types may not be regenerated yet
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (error) {
            console.warn('Could not fetch user role, using default:', error.message);
            set({ userRole: 'user', isLoading: false });
            return;
          }
          
          // Cast to any to access potentially new columns safely
          const profileData = profile as Record<string, unknown>;
          
          // Determine highest role based on flags
          let role: UserRole = 'user';
          
          if (profileData?.is_admin === true) {
            role = 'admin';
          } else if (profileData?.is_researcher === true) {
            role = 'researcher';
          } else if (profileData?.is_developer === true) {
            role = 'developer';
          } else if (typeof profileData?.role === 'string' && profileData.role in ROLE_HIERARCHY) {
            role = profileData.role as UserRole;
          }
          
          set({ 
            userRole: role, 
            isLoading: false,
            // Auto-enable dev mode for developers+
            isDeveloperMode: ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['developer'],
          });
        } catch (error) {
          console.error('Error syncing user role:', error);
          set({ userRole: 'user', isLoading: false });
        }
      },
      
      // Check if user has required role or higher
      hasRole: (requiredRole) => {
        const { userRole, isDeveloperMode } = get();
        
        // Developer mode bypasses role checks (for testing)
        if (isDeveloperMode) return true;
        
        return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
      },
      
      // Check feature access
      canAccessFeature: (feature) => {
        const requiredRole = FEATURE_ROLES[feature] || 'user';
        return get().hasRole(requiredRole);
      },
    }),
    {
      name: 'amapiano-developer-mode',
      partialize: (state) => ({
        isDeveloperMode: state.isDeveloperMode,
        showAdvancedNav: state.showAdvancedNav,
        showResearchTools: state.showResearchTools,
        showPerformanceMetrics: state.showPerformanceMetrics,
        showDebugInfo: state.showDebugInfo,
        expandedCategories: state.expandedCategories,
      }),
    }
  )
);

// Hook for easy access to developer mode status
export const useIsDeveloperMode = () => 
  useDeveloperModeStore((state) => state.isDeveloperMode);

// Hook for role-based access
export const useHasRole = (requiredRole: UserRole) =>
  useDeveloperModeStore((state) => state.hasRole(requiredRole));

// Hook for feature access
export const useCanAccessFeature = (feature: string) =>
  useDeveloperModeStore((state) => state.canAccessFeature(feature));
