import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  it('renders button with text', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    expect(getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders different variants', () => {
    const { rerender, getByRole } = render(<Button variant="default">Default</Button>);
    expect(getByRole('button')).toHaveClass('bg-primary');
    
    rerender(<Button variant="destructive">Destructive</Button>);
    expect(getByRole('button')).toHaveClass('bg-destructive');
    
    rerender(<Button variant="outline">Outline</Button>);
    expect(getByRole('button')).toHaveClass('border');
  });

  it('disables button when disabled prop is true', () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    expect(getByRole('button')).toBeDisabled();
  });

  it('applies different sizes', () => {
    const { rerender, getByRole } = render(<Button size="default">Default</Button>);
    expect(getByRole('button')).toHaveClass('h-10');
    
    rerender(<Button size="sm">Small</Button>);
    expect(getByRole('button')).toHaveClass('h-9');
    
    rerender(<Button size="lg">Large</Button>);
    expect(getByRole('button')).toHaveClass('h-11');
  });
});
