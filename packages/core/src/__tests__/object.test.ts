import { describe, it, expect } from 'vitest';
import { v } from '../index.js';

describe('ValaiObject', () => {
  describe('basic parsing', () => {
    it('parses valid objects', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
      });

      const result = schema.parse({ name: 'John', age: 30 });
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('rejects non-objects', () => {
      const schema = v.object({ name: v.string() });
      expect(schema.safeParse('not an object').success).toBe(false);
      expect(schema.safeParse(null).success).toBe(false);
      expect(schema.safeParse([]).success).toBe(false);
    });

    it('validates nested objects', () => {
      const schema = v.object({
        user: v.object({
          name: v.string(),
        }),
      });

      const result = schema.parse({ user: { name: 'John' } });
      expect(result).toEqual({ user: { name: 'John' } });
    });

    it('reports errors with paths', () => {
      const schema = v.object({
        user: v.object({
          name: v.string(),
        }),
      });

      const result = schema.safeParse({ user: { name: 123 } });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['user', 'name']);
      }
    });
  });

  describe('optional fields', () => {
    it('handles optional fields', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number().optional(),
      });

      expect(schema.safeParse({ name: 'John' }).success).toBe(true);
      expect(schema.safeParse({ name: 'John', age: 30 }).success).toBe(true);
    });

    it('includes optional values when present', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number().optional(),
      });

      const result = schema.parse({ name: 'John', age: 30 });
      expect(result.age).toBe(30);
    });
  });

  describe('default values', () => {
    it('uses default for missing fields', () => {
      const schema = v.object({
        name: v.string(),
        active: v.boolean().default(true),
      });

      const result = schema.parse({ name: 'John' });
      expect(result.active).toBe(true);
    });
  });

  describe('unknown keys handling', () => {
    it('strips unknown keys by default', () => {
      const schema = v.object({ name: v.string() });
      const result = schema.parse({ name: 'John', extra: true });
      expect(result).toEqual({ name: 'John' });
    });

    it('strict mode rejects unknown keys', () => {
      const schema = v.object({ name: v.string() }).strict();
      const result = schema.safeParse({ name: 'John', extra: true });
      expect(result.success).toBe(false);
    });

    it('passthrough keeps unknown keys', () => {
      const schema = v.object({ name: v.string() }).passthrough();
      const result = schema.parse({ name: 'John', extra: true });
      expect(result).toEqual({ name: 'John', extra: true });
    });
  });

  describe('object methods', () => {
    it('extend adds properties', () => {
      const base = v.object({ name: v.string() });
      const extended = base.extend({ age: v.number() });

      const result = extended.parse({ name: 'John', age: 30 });
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('merge combines objects', () => {
      const a = v.object({ name: v.string() });
      const b = v.object({ age: v.number() });
      const merged = a.merge(b);

      const result = merged.parse({ name: 'John', age: 30 });
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('pick selects properties', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
        email: v.string(),
      });

      const picked = schema.pick({ name: true, email: true });
      const result = picked.parse({ name: 'John', email: 'john@example.com' });
      expect(result).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('omit removes properties', () => {
      const schema = v.object({
        name: v.string(),
        password: v.string(),
      });

      const omitted = schema.omit({ password: true });
      const result = omitted.parse({ name: 'John' });
      expect(result).toEqual({ name: 'John' });
    });

    it('partial makes all optional', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
      });

      const partial = schema.partial();
      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ name: 'John' }).success).toBe(true);
    });
  });

  describe('LLM parsing', () => {
    it('parses from markdown', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
      });

      const result = schema.parseLLM(`
        Here's the data:
        \`\`\`json
        {"name": "John", "age": 30}
        \`\`\`
      `);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John', age: 30 });
      }
    });

    it('coerces string numbers', () => {
      const schema = v.object({
        age: v.number(),
      });

      const result = schema.parseLLM({ age: '30' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe(30);
      }
    });
  });

  describe('JSON Schema', () => {
    it('generates object schema', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number().optional(),
      });

      const jsonSchema = schema.toJSONSchema();
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties).toHaveProperty('name');
      expect(jsonSchema.properties).toHaveProperty('age');
      expect(jsonSchema.required).toEqual(['name']);
    });

    it('strict mode sets additionalProperties false', () => {
      const schema = v.object({ name: v.string() }).strict();
      const jsonSchema = schema.toJSONSchema();
      expect(jsonSchema.additionalProperties).toBe(false);
    });
  });

  describe('type inference', () => {
    it('infers correct types', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number().optional(),
        tags: v.array(v.string()),
      });

      type Inferred = v.infer<typeof schema>;

      // This is a compile-time check
      const valid: Inferred = {
        name: 'John',
        tags: ['a', 'b'],
      };

      expect(schema.safeParse(valid).success).toBe(true);
    });
  });
});
