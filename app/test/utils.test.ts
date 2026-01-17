import { describe, it, expect } from 'bun:test';
import { cn } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', 'class1')).toBe('class1 class1'); // twMerge doesn't deduplicate
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('class1', null, 'class2')).toBe('class1 class2');
      expect(cn('class1', false, 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('class1', true && 'class2')).toBe('class1 class2');
      expect(cn('class1', false && 'class2')).toBe('class1');
      expect(cn('class1', undefined && 'class2')).toBe('class1');
    });

    it('should handle object syntax', () => {
      expect(cn({ class1: true, class2: true })).toBe('class1 class2');
      expect(cn({ class1: true, class2: false })).toBe('class1');
      expect(cn({ class1: false, class2: false })).toBe('');
    });

    it('should handle array syntax', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
      expect(cn(['class1', false && 'class2'])).toBe('class1');
      expect(cn(['class1', ['class2', 'class3']])).toBe('class1 class2 class3');
    });

    it('should handle complex combinations', () => {
      expect(
        cn(
          'base',
          {
            'class-true': true,
            'class-false': false,
          },
          ['array1', 'array2'],
          true && 'conditional',
          false && 'unused'
        )
      ).toBe('base class-true array1 array2 conditional');
    });
  });
});
