import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../use-toast';

describe('useToast', () => {
  it('creates a toast notification', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'This is a test',
      });
    });
    
    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
    expect(result.current.toasts[0].description).toBe('This is a test');
  });

  it('dismisses a toast', () => {
    const { result } = renderHook(() => useToast());
    
    let toastId: string;
    
    act(() => {
      const toast = result.current.toast({
        title: 'Test Toast',
      });
      toastId = toast.id;
    });
    
    expect(result.current.toasts.length).toBe(1);
    
    act(() => {
      result.current.dismiss(toastId);
    });
    
    expect(result.current.toasts.length).toBe(0);
  });

  it('creates different toast variants', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({
        title: 'Default',
        variant: 'default',
      });
      result.current.toast({
        title: 'Destructive',
        variant: 'destructive',
      });
    });
    
    expect(result.current.toasts.length).toBe(2);
    expect(result.current.toasts[0].variant).toBe('default');
    expect(result.current.toasts[1].variant).toBe('destructive');
  });
});
