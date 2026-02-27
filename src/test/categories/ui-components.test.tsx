import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

describe('🎨 UI Components Library', () => {
  describe('Button Component', () => {
    it('renders with default variant', () => {
      const { getByRole } = render(<Button>Click me</Button>);
      expect(getByRole('button')).toBeInTheDocument();
    });

    it('renders with all variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
      variants.forEach(variant => {
        const { container } = render(<Button variant={variant}>{variant}</Button>);
        expect(container.querySelector('button')).toBeInTheDocument();
      });
    });

    it('renders with all sizes', () => {
      const sizes = ['default', 'sm', 'lg', 'icon'] as const;
      sizes.forEach(size => {
        const { container } = render(<Button size={size}>Button</Button>);
        expect(container.querySelector('button')).toBeInTheDocument();
      });
    });

    it('handles disabled state', () => {
      const { getByRole } = render(<Button disabled>Disabled</Button>);
      expect(getByRole('button')).toBeDisabled();
    });
  });

  describe('Input Component', () => {
    it('renders input field', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('accepts value prop', () => {
      const { container } = render(<Input value="test" readOnly />);
      const input = container.querySelector('input');
      expect(input?.value).toBe('test');
    });

    it('handles disabled state', () => {
      const { container } = render(<Input disabled />);
      const input = container.querySelector('input');
      expect(input).toBeDisabled();
    });
  });

  describe('Card Component', () => {
    it('renders card container', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Checkbox Component', () => {
    it('renders checkbox', () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Switch Component', () => {
    it('renders switch', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('button[role="switch"]');
      expect(switchElement).toBeInTheDocument();
    });
  });

  describe('Tabs Component', () => {
    it('renders tabs structure', () => {
      const { getByRole } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );
      expect(getByRole('tablist')).toBeInTheDocument();
    });
  });

  describe('Dialog Component', () => {
    it('renders dialog trigger', () => {
      const { getByRole } = render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      expect(getByRole('button')).toBeInTheDocument();
    });
  });
});
