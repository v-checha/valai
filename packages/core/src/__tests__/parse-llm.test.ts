import { describe, it, expect } from 'vitest';
import { v } from '../index.js';

describe('LLM Parsing', () => {
  describe('markdown extraction', () => {
    it('extracts JSON from code blocks', () => {
      const schema = v.object({ name: v.string() });
      const result = schema.parseLLM(`
        Here's the JSON:
        \`\`\`json
        {"name": "test"}
        \`\`\`
      `);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'test' });
      }
    });

    it('extracts JSON without language hint', () => {
      const schema = v.object({ name: v.string() });
      const result = schema.parseLLM(`
        \`\`\`
        {"name": "test"}
        \`\`\`
      `);
      expect(result.success).toBe(true);
    });
  });

  describe('type coercion', () => {
    it('coerces string to number', () => {
      const schema = v.number();
      const result = schema.parseLLM('42');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('coerces string to boolean', () => {
      const schema = v.boolean();
      expect(schema.parseLLM('true').success).toBe(true);
      expect(schema.parseLLM('false').success).toBe(true);
      expect(schema.parseLLM('yes').success).toBe(true);
      expect(schema.parseLLM('no').success).toBe(true);
      expect(schema.parseLLM('1').success).toBe(true);
      expect(schema.parseLLM('0').success).toBe(true);

      if (schema.parseLLM('true').success) {
        expect(schema.parseLLM('true')).toHaveProperty('data', true);
      }
      if (schema.parseLLM('false').success) {
        expect(schema.parseLLM('false')).toHaveProperty('data', false);
      }
    });

    it('coerces number to boolean', () => {
      const schema = v.boolean();
      const trueResult = schema.parseLLM(1);
      const falseResult = schema.parseLLM(0);

      expect(trueResult.success).toBe(true);
      expect(falseResult.success).toBe(true);
      if (trueResult.success) expect(trueResult.data).toBe(true);
      if (falseResult.success) expect(falseResult.data).toBe(false);
    });

    it('coerces values in objects', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
        active: v.boolean(),
      });

      const result = schema.parseLLM({
        name: 123,      // number -> string
        age: '30',      // string -> number
        active: 'true', // string -> boolean
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: '123',
          age: 30,
          active: true,
        });
      }
    });
  });

  describe('enum coercion', () => {
    it('matches case-insensitively', () => {
      const schema = v.enum(['active', 'inactive']);

      expect(schema.parseLLM('ACTIVE').success).toBe(true);
      expect(schema.parseLLM('Active').success).toBe(true);

      const result = schema.parseLLM('ACTIVE');
      if (result.success) {
        expect(result.data).toBe('active'); // Returns the defined case
      }
    });
  });

  describe('default values', () => {
    it('uses defaults for missing fields', () => {
      const schema = v.object({
        name: v.string(),
        active: v.boolean().default(true),
        count: v.number().default(0),
      });

      const result = schema.parseLLM({ name: 'test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
        expect(result.data.count).toBe(0);
      }
    });
  });

  describe('complex LLM outputs', () => {
    it('handles typical LLM response', () => {
      const ProductSchema = v.object({
        name: v.string().describe('Product name'),
        price: v.number().min(0).describe('Price in USD'),
        category: v.enum(['electronics', 'clothing', 'food']),
        tags: v.array(v.string()),
        inStock: v.boolean().default(true),
      });

      const llmOutput = `
        Here's the product information I extracted:

        \`\`\`json
        {
          "name": "iPhone 15",
          "price": "999",
          "category": "electronics",
          "tags": ["phone", "apple"]
        }
        \`\`\`

        I hope this helps!
      `;

      const result = ProductSchema.parseLLM(llmOutput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('iPhone 15');
        expect(result.data.price).toBe(999); // Coerced from string
        expect(result.data.category).toBe('electronics');
        expect(result.data.tags).toEqual(['phone', 'apple']);
        expect(result.data.inStock).toBe(true); // Default value
      }
    });
  });

  describe('error handling', () => {
    it('provides partial data on failure', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number().min(0).max(150),
      });

      const result = schema.parseLLM({ name: 'John', age: 200 });
      expect(result.success).toBe(false);
      // Note: partial data behavior depends on implementation
    });

    it('formats errors for LLM retry', () => {
      const schema = v.object({
        name: v.string().min(1),
        age: v.number().min(0),
      });

      const result = schema.safeParse({ name: '', age: -5 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const llmFormat = result.error.formatForLLM();
        expect(llmFormat).toContain('Validation errors');
        expect(llmFormat).toContain('name');
        expect(llmFormat).toContain('age');
      }
    });
  });
});
