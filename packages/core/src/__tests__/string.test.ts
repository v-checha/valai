import { describe, it, expect } from 'vitest';
import { v } from '../index.js';

describe('ValaiString', () => {
  describe('basic parsing', () => {
    it('parses valid strings', () => {
      const schema = v.string();
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse('')).toBe('');
    });

    it('rejects non-strings in strict mode', () => {
      const schema = v.string();
      expect(schema.safeParse(123).success).toBe(false);
      expect(schema.safeParse(null).success).toBe(false);
      expect(schema.safeParse(undefined).success).toBe(false);
      expect(schema.safeParse({}).success).toBe(false);
    });

    it('coerces in LLM mode', () => {
      const schema = v.string();
      const result = schema.parseLLM(123);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('123');
      }
    });
  });

  describe('validation methods', () => {
    it('min length', () => {
      const schema = v.string().min(3);
      expect(schema.safeParse('abc').success).toBe(true);
      expect(schema.safeParse('ab').success).toBe(false);
    });

    it('max length', () => {
      const schema = v.string().max(3);
      expect(schema.safeParse('abc').success).toBe(true);
      expect(schema.safeParse('abcd').success).toBe(false);
    });

    it('exact length', () => {
      const schema = v.string().length(3);
      expect(schema.safeParse('abc').success).toBe(true);
      expect(schema.safeParse('ab').success).toBe(false);
      expect(schema.safeParse('abcd').success).toBe(false);
    });

    it('nonempty', () => {
      const schema = v.string().nonempty();
      expect(schema.safeParse('a').success).toBe(true);
      expect(schema.safeParse('').success).toBe(false);
    });

    it('email', () => {
      const schema = v.string().email();
      expect(schema.safeParse('test@example.com').success).toBe(true);
      expect(schema.safeParse('invalid').success).toBe(false);
      expect(schema.safeParse('no@domain').success).toBe(false);
    });

    it('url', () => {
      const schema = v.string().url();
      expect(schema.safeParse('https://example.com').success).toBe(true);
      expect(schema.safeParse('http://test.org/path').success).toBe(true);
      expect(schema.safeParse('not-a-url').success).toBe(false);
    });

    it('uuid', () => {
      const schema = v.string().uuid();
      expect(schema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
      expect(schema.safeParse('not-a-uuid').success).toBe(false);
    });

    it('regex', () => {
      const schema = v.string().regex(/^[A-Z]+$/);
      expect(schema.safeParse('ABC').success).toBe(true);
      expect(schema.safeParse('abc').success).toBe(false);
    });

    it('includes', () => {
      const schema = v.string().includes('@');
      expect(schema.safeParse('test@test').success).toBe(true);
      expect(schema.safeParse('test').success).toBe(false);
    });

    it('startsWith', () => {
      const schema = v.string().startsWith('http');
      expect(schema.safeParse('https://').success).toBe(true);
      expect(schema.safeParse('ftp://').success).toBe(false);
    });

    it('endsWith', () => {
      const schema = v.string().endsWith('.com');
      expect(schema.safeParse('example.com').success).toBe(true);
      expect(schema.safeParse('example.org').success).toBe(false);
    });
  });

  describe('transforms', () => {
    it('trim', () => {
      const schema = v.string().trim();
      const result = schema.safeParse('  hello  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });

    it('toLowerCase', () => {
      const schema = v.string().toLowerCase();
      const result = schema.safeParse('HELLO');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });

    it('toUpperCase', () => {
      const schema = v.string().toUpperCase();
      const result = schema.safeParse('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('HELLO');
      }
    });
  });

  describe('method chaining', () => {
    it('chains multiple validations', () => {
      const schema = v.string().min(1).max(10).trim();
      expect(schema.safeParse('  hello  ').success).toBe(true);
      expect(schema.safeParse('').success).toBe(false);
    });
  });

  describe('JSON Schema', () => {
    it('generates basic schema', () => {
      const schema = v.string();
      expect(schema.toJSONSchema()).toEqual({ type: 'string' });
    });

    it('includes constraints', () => {
      const schema = v.string().min(1).max(100).email();
      const jsonSchema = schema.toJSONSchema();
      expect(jsonSchema.type).toBe('string');
      expect(jsonSchema.minLength).toBe(1);
      expect(jsonSchema.maxLength).toBe(100);
      expect(jsonSchema.format).toBe('email');
    });

    it('includes description', () => {
      const schema = v.string().describe('User name');
      const jsonSchema = schema.toJSONSchema();
      expect(jsonSchema.description).toBe('User name');
    });

    it('includes examples', () => {
      const schema = v.string().examples(['John', 'Jane']);
      const jsonSchema = schema.toJSONSchema();
      expect(jsonSchema.examples).toEqual(['John', 'Jane']);
    });
  });
});
