/**
 * Navigation Configuration
 * Centralized navigation structure with role-based categorization
 */

import {
  Music,
  Search,
  Headphones,
  Grid3X3,
  Volume2,
  Sparkles,
  Brain,
  Users,
  Shield,
  Radio,
  Activity,
  Disc3,
  Upload,
  Megaphone,
  Layers,
  Mic,
  Wand2,
  FlaskConical,
  BarChart3,
  Code2,
  Palette,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { type UserRole } from '@/stores/developerModeStore';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  requiredRole: UserRole;
  badge?: 'new' | 'beta' | 'pro';
}

export interface NavCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  requiredRole: UserRole;
  items: NavItem[];
}

// Core navigation items visible to all users
export const CORE_NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: Sparkles, requiredRole: 'user' },
  { path: '/generate', label: 'Generate', icon: Music, requiredRole: 'user' },
  { path: '/dj-agent', label: 'DJ Mix', icon: Disc3, requiredRole: 'user' },
  { path: '/studio', label: 'Studio', icon: Layers, requiredRole: 'user' },
  { path: '/social', label: 'Social', icon: Users, requiredRole: 'user' },
];

// Categorized navigation
export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'create',
    label: 'Create',
    icon: Music,
    requiredRole: 'user',
    items: [
      { path: '/generate', label: 'AI Generate', icon: Wand2, description: 'Generate music with AI', requiredRole: 'user' },
      { path: '/studio', label: 'Studio', icon: Layers, description: 'Full production studio', requiredRole: 'user' },
      { path: '/daw', label: 'DAW', icon: Volume2, description: 'Digital audio workstation', requiredRole: 'creator' },
      { path: '/samples', label: 'Samples', icon: Headphones, description: 'Sample library', requiredRole: 'user' },
      { path: '/patterns', label: 'Patterns', icon: Grid3X3, description: 'Drum patterns', requiredRole: 'user' },
      { path: '/templates', label: 'Templates', icon: Grid3X3, description: 'Project templates', requiredRole: 'user' },
    ],
  },
  {
    id: 'produce',
    label: 'Produce',
    icon: Disc3,
    requiredRole: 'creator',
    items: [
      { path: '/audio-editor', label: 'Audio Editor', icon: Radio, description: 'Edit audio files', requiredRole: 'creator' },
      { path: '/amapianorize', label: 'Amapianorize', icon: Sparkles, description: 'Transform to Amapiano', requiredRole: 'creator', badge: 'new' },
      { path: '/master', label: 'Master', icon: Disc3, description: 'AI mastering', requiredRole: 'creator' },
      { path: '/analyze', label: 'Analyze', icon: Search, description: 'Audio analysis', requiredRole: 'user' },
    ],
  },
  {
    id: 'distribute',
    label: 'Distribute',
    icon: Upload,
    requiredRole: 'creator',
    items: [
      { path: '/release', label: 'Release', icon: Upload, description: 'Distribute music', requiredRole: 'creator' },
      { path: '/promote', label: 'Promote', icon: Megaphone, description: 'Marketing tools', requiredRole: 'creator' },
      { path: '/social', label: 'Social', icon: Users, description: 'Community feed', requiredRole: 'user' },
    ],
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    icon: Brain,
    requiredRole: 'developer',
    items: [
      { path: '/aura', label: 'AURA-X', icon: Brain, description: 'AI orchestration platform', requiredRole: 'developer', badge: 'beta' },
      { path: '/ai-hub', label: 'AI Hub', icon: Brain, description: 'AI model management', requiredRole: 'developer' },
      { path: '/aura808', label: 'Aura 808', icon: Music, description: '808 synth with AI', requiredRole: 'developer' },
      { path: '/voice-lab', label: 'Voice Lab', icon: Mic, description: 'Voice synthesis', requiredRole: 'developer' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    icon: FlaskConical,
    requiredRole: 'researcher',
    items: [
      { path: '/research', label: 'Research Hub', icon: FlaskConical, description: 'PhD research tools', requiredRole: 'researcher' },
      { path: '/performance', label: 'Performance', icon: Activity, description: 'System metrics', requiredRole: 'researcher' },
      { path: '/level5-dashboard', label: 'Level 5', icon: Shield, description: 'Agent dashboard', requiredRole: 'researcher' },
      { path: '/user-study', label: 'User Study', icon: Users, description: 'Conduct studies', requiredRole: 'researcher' },
      { path: '/study-analytics', label: 'Analytics', icon: BarChart3, description: 'Study analytics', requiredRole: 'researcher' },
      { path: '/audio-test-lab', label: 'Test Lab', icon: FlaskConical, description: 'Audio testing', requiredRole: 'researcher' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    requiredRole: 'admin',
    items: [
      { path: '/admin', label: 'Admin Panel', icon: Shield, description: 'System administration', requiredRole: 'admin' },
      { path: '/vast-demo', label: 'VAST Demo', icon: Code2, description: 'Integration demo', requiredRole: 'admin' },
      { path: '/training-data', label: 'Training Data', icon: GraduationCap, description: 'ML training data', requiredRole: 'admin' },
    ],
  },
];

// Quick access items for mobile (most used)
export const QUICK_ACCESS_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: Sparkles, requiredRole: 'user' },
  { path: '/generate', label: 'Generate', icon: Music, requiredRole: 'user' },
  { path: '/studio', label: 'Studio', icon: Layers, requiredRole: 'user' },
  { path: '/daw', label: 'DAW', icon: Volume2, requiredRole: 'creator' },
  { path: '/social', label: 'Social', icon: Users, requiredRole: 'user' },
];

// Get all nav items flattened
export const getAllNavItems = (): NavItem[] => {
  const items: NavItem[] = [...CORE_NAV_ITEMS];
  NAV_CATEGORIES.forEach(category => {
    category.items.forEach(item => {
      if (!items.find(i => i.path === item.path)) {
        items.push(item);
      }
    });
  });
  return items;
};

// Filter items by role
export const filterByRole = (items: NavItem[], userRole: UserRole, isDeveloperMode: boolean): NavItem[] => {
  if (isDeveloperMode) return items;
  
  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    creator: 1,
    developer: 2,
    researcher: 3,
    admin: 4,
  };
  
  return items.filter(item => roleHierarchy[userRole] >= roleHierarchy[item.requiredRole]);
};

// Filter categories by role
export const filterCategoriesByRole = (userRole: UserRole, isDeveloperMode: boolean): NavCategory[] => {
  if (isDeveloperMode) return NAV_CATEGORIES;
  
  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    creator: 1,
    developer: 2,
    researcher: 3,
    admin: 4,
  };
  
  return NAV_CATEGORIES.filter(
    category => roleHierarchy[userRole] >= roleHierarchy[category.requiredRole]
  ).map(category => ({
    ...category,
    items: category.items.filter(
      item => roleHierarchy[userRole] >= roleHierarchy[item.requiredRole]
    ),
  }));
};
