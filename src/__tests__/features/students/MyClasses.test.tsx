import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock component for testing
function ClassCard({ className, status }: { className: string; status: string }) {
  return (
    <div data-testid="class-card">
      <h3>{className}</h3>
      <span>{status}</span>
    </div>
  );
}

describe('My Classes Feature', () => {
  it('should render class card', () => {
    const { getByTestId } = render(
      <ClassCard className="Java Core" status="Đang học" />
    );
    expect(getByTestId('class-card')).toBeInTheDocument();
  });

  it('should display class name', () => {
    const { getByText } = render(
      <ClassCard className="React Advanced" status="Hoàn thành" />
    );
    expect(getByText('React Advanced')).toBeInTheDocument();
  });

  it('should show status', () => {
    const { getByText } = render(
      <ClassCard className="Spring Boot" status="Sắp học" />
    );
    expect(getByText('Sắp học')).toBeInTheDocument();
  });
});
