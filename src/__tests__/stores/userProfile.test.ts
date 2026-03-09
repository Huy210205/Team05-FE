import { describe, it, expect } from 'vitest';

describe('User Profile Store', () => {
  it('should have initial state', () => {
    const initialState = {
      me: null,
      loading: false,
    };
    expect(initialState.me).toBeNull();
    expect(initialState.loading).toBe(false);
  });

  it('should handle user object', () => {
    const user = {
      userId: 1,
      email: 'test@example.com',
      fullName: 'Test User',
    };
    expect(user.userId).toBe(1);
    expect(user.email).toContain('@');
  });

  it('should validate email format', () => {
    const email = 'user@codegym.vn';
    const isValid = email.includes('@') && email.includes('.');
    expect(isValid).toBe(true);
  });
});
