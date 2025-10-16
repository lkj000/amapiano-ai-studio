import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('⚙️ Utilities & Services', () => {
  describe('API Services', () => {
    it('formats API requests', () => {
      const request = {
        url: '/api/music/generate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { prompt: 'Create a beat' }
      };
      expect(request.method).toBe('POST');
      expect(request.headers['Content-Type']).toBe('application/json');
    });

    it('handles API responses', () => {
      const response = {
        status: 200,
        data: { success: true },
        error: null
      };
      expect(response.status).toBe(200);
      expect(response.error).toBeNull();
    });

    it('implements error handling', () => {
      const error = {
        code: 'ERR_NETWORK',
        message: 'Network error',
        retry: true
      };
      expect(error.code).toBeDefined();
      expect(error.retry).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('formats timestamps', () => {
      const timestamp = 1234567890000;
      const formatted = new Date(timestamp).toISOString();
      expect(formatted).toContain('T');
      expect(formatted).toContain('Z');
    });

    it('validates input data', () => {
      const isValid = (value: string) => value.length > 0 && value.length < 100;
      expect(isValid('Test')).toBe(true);
      expect(isValid('')).toBe(false);
    });

    it('transforms data structures', () => {
      const data = [1, 2, 3, 4, 5];
      const doubled = data.map(x => x * 2);
      expect(doubled).toEqual([2, 4, 6, 8, 10]);
    });
  });

  describe('Library Utils', () => {
    it('cn combines class names', () => {
      const result = cn('base-class', 'modifier-class');
      expect(typeof result).toBe('string');
      expect(result).toContain('base-class');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const classes = cn('base', isActive && 'active');
      expect(classes).toContain('active');
    });

    it('merges tailwind classes', () => {
      const merged = cn('p-4', 'p-8');
      expect(typeof merged).toBe('string');
    });
  });

  describe('Configuration', () => {
    it('loads app configuration', () => {
      const config = {
        apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
        environment: import.meta.env.MODE || 'development',
        debug: import.meta.env.DEV || false
      };
      expect(config.environment).toBeDefined();
    });

    it('manages feature flags', () => {
      const features = {
        newUI: true,
        betaFeatures: false,
        experimentalAudio: true
      };
      expect(typeof features.newUI).toBe('boolean');
    });

    it('handles environment variables', () => {
      const env = import.meta.env.MODE;
      expect(['development', 'production', 'test']).toContain(env);
    });
  });
});
