import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple Button component for testing
function Button({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick}>{children}</button>;
}

describe('Button Component', () => {
  it('should render button with text', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const button = getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should render button with children', () => {
    const { getByText } = render(<Button>Test Button</Button>);
    expect(getByText('Test Button')).toBeInTheDocument();
  });

  it('should have button element', () => {
    const { container } = render(<Button>Submit</Button>);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });
});
