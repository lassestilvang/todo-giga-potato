import { describe, it, expect } from 'bun:test';

describe('Simple Test', () => {
  it('should add numbers correctly', () => {
    const sum = 1 + 2;
    expect(sum).toBe(3);
  });

  it('should concatenate strings correctly', () => {
    const str = 'Hello' + 'World';
    expect(str).toBe('HelloWorld');
  });
});
