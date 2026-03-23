import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (class name utility)', () => {
  it('merges simple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end');
    expect(cn('base', true && 'visible', 'end')).toBe('base visible end');
  });

  it('deduplicates conflicting Tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('handles undefined and null inputs', () => {
    expect(cn(undefined, null, 'valid')).toBe('valid');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('merges complex Tailwind responsive classes', () => {
    const result = cn('px-4 md:px-8', 'px-2');
    expect(result).toBe('md:px-8 px-2');
  });
});
