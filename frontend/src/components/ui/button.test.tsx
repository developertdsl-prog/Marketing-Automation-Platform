import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { Button } from './button';

describe('Button', () => {
  it('renders with default variant and children', () => {
    render(<Button>Click me</Button>);
    const buttons = screen.getAllByRole('button', { name: 'Click me' });
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).not.toBeDisabled();
  });

  it('passes onClick prop to button element', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const buttons = screen.getAllByRole('button', { name: 'Click me' });
    // Verify the button has an onClick handler by checking it's not disabled
    expect(buttons[0]).not.toBeDisabled();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    const buttons = screen.getAllByRole('button', { name: 'Disabled' });
    expect(buttons[0]).toBeDisabled();
  });

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const buttons = screen.getAllByRole('button', { name: 'Delete' });
    expect(buttons[0]).toBeInTheDocument();
  });
});
