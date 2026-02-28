import { describe, it, expect } from '@jest/globals';

describe('Health Check', () => {
  it('should pass basic health check', () => {
    expect(true).toBe(true);
  });

  it('should have proper test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have mock objects available', () => {
    expect(global.mockPrisma).toBeDefined();
    expect(global.mockSupabase).toBeDefined();
    expect(global.mockIO).toBeDefined();
  });
}); 