import { bench, describe } from 'vitest';
import * as v from '../factory.js';
import { z } from 'zod';

/**
 * Parsing Performance Benchmarks
 * Compares valai vs Zod parsing performance
 */

// Test data
const validSimpleObject = { name: 'John Doe', age: 30, email: 'john@example.com' };
const validComplexObject = {
  user: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    isActive: true,
    tags: ['developer', 'typescript', 'nodejs'],
    metadata: {
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15',
    },
  },
  items: [
    { id: 1, name: 'Item 1', price: 9.99, quantity: 2 },
    { id: 2, name: 'Item 2', price: 19.99, quantity: 1 },
    { id: 3, name: 'Item 3', price: 29.99, quantity: 3 },
  ],
  total: 99.94,
  status: 'pending',
};

const validArray = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  value: Math.random() * 100,
}));

// ============================================================================
// Simple Object Parsing
// ============================================================================

describe('Simple Object Parsing', () => {
  // Valai schema
  const valaiSchema = v.object({
    name: v.string(),
    age: v.number(),
    email: v.string().email(),
  });

  // Zod schema
  const zodSchema = z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  });

  bench('valai - parse()', () => {
    valaiSchema.parse(validSimpleObject);
  });

  bench('zod - parse()', () => {
    zodSchema.parse(validSimpleObject);
  });

  bench('valai - safeParse()', () => {
    valaiSchema.safeParse(validSimpleObject);
  });

  bench('zod - safeParse()', () => {
    zodSchema.safeParse(validSimpleObject);
  });
});

// ============================================================================
// Complex Nested Object Parsing
// ============================================================================

describe('Complex Nested Object Parsing', () => {
  // Valai schema
  const valaiSchema = v.object({
    user: v.object({
      id: v.string().uuid(),
      name: v.string().min(1),
      email: v.string().email(),
      age: v.number().int().min(0),
      isActive: v.boolean(),
      tags: v.array(v.string()),
      metadata: v.object({
        createdAt: v.string(),
        updatedAt: v.string(),
      }),
    }),
    items: v.array(
      v.object({
        id: v.number(),
        name: v.string(),
        price: v.number().min(0),
        quantity: v.number().int().min(1),
      })
    ),
    total: v.number(),
    status: v.enum(['pending', 'completed', 'cancelled']),
  });

  // Zod schema
  const zodSchema = z.object({
    user: z.object({
      id: z.string().uuid(),
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().int().min(0),
      isActive: z.boolean(),
      tags: z.array(z.string()),
      metadata: z.object({
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    }),
    items: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        price: z.number().min(0),
        quantity: z.number().int().min(1),
      })
    ),
    total: z.number(),
    status: z.enum(['pending', 'completed', 'cancelled']),
  });

  bench('valai - complex parse()', () => {
    valaiSchema.parse(validComplexObject);
  });

  bench('zod - complex parse()', () => {
    zodSchema.parse(validComplexObject);
  });

  bench('valai - complex safeParse()', () => {
    valaiSchema.safeParse(validComplexObject);
  });

  bench('zod - complex safeParse()', () => {
    zodSchema.safeParse(validComplexObject);
  });
});

// ============================================================================
// Array Parsing
// ============================================================================

describe('Array Parsing (100 items)', () => {
  // Valai schema
  const valaiSchema = v.array(
    v.object({
      id: v.number(),
      name: v.string(),
      value: v.number(),
    })
  );

  // Zod schema
  const zodSchema = z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      value: z.number(),
    })
  );

  bench('valai - array parse()', () => {
    valaiSchema.parse(validArray);
  });

  bench('zod - array parse()', () => {
    zodSchema.parse(validArray);
  });
});

// ============================================================================
// String Validations
// ============================================================================

describe('String Validations', () => {
  const testEmail = 'test@example.com';
  const testUrl = 'https://example.com/path?query=1';
  const testUuid = '123e4567-e89b-12d3-a456-426614174000';

  // Email
  const valaiEmail = v.string().email();
  const zodEmail = z.string().email();

  bench('valai - email validation', () => {
    valaiEmail.parse(testEmail);
  });

  bench('zod - email validation', () => {
    zodEmail.parse(testEmail);
  });

  // URL
  const valaiUrl = v.string().url();
  const zodUrl = z.string().url();

  bench('valai - url validation', () => {
    valaiUrl.parse(testUrl);
  });

  bench('zod - url validation', () => {
    zodUrl.parse(testUrl);
  });

  // UUID
  const valaiUuid = v.string().uuid();
  const zodUuid = z.string().uuid();

  bench('valai - uuid validation', () => {
    valaiUuid.parse(testUuid);
  });

  bench('zod - uuid validation', () => {
    zodUuid.parse(testUuid);
  });
});

// ============================================================================
// Union Types
// ============================================================================

describe('Union Types', () => {
  const testString = 'hello';
  const testNumber = 42;

  // Valai union
  const valaiUnion = v.union([v.string(), v.number(), v.boolean()]);

  // Zod union
  const zodUnion = z.union([z.string(), z.number(), z.boolean()]);

  bench('valai - union (string)', () => {
    valaiUnion.parse(testString);
  });

  bench('zod - union (string)', () => {
    zodUnion.parse(testString);
  });

  bench('valai - union (number)', () => {
    valaiUnion.parse(testNumber);
  });

  bench('zod - union (number)', () => {
    zodUnion.parse(testNumber);
  });
});

// ============================================================================
// Schema Creation
// ============================================================================

describe('Schema Creation', () => {
  bench('valai - create simple schema', () => {
    v.object({
      name: v.string(),
      age: v.number(),
    });
  });

  bench('zod - create simple schema', () => {
    z.object({
      name: z.string(),
      age: z.number(),
    });
  });

  bench('valai - create complex schema', () => {
    v.object({
      user: v.object({
        id: v.string().uuid(),
        name: v.string().min(1).max(100),
        email: v.string().email(),
        tags: v.array(v.string()),
      }),
      items: v.array(
        v.object({
          id: v.number().int(),
          name: v.string(),
          price: v.number().min(0),
        })
      ),
      status: v.enum(['active', 'inactive']),
    });
  });

  bench('zod - create complex schema', () => {
    z.object({
      user: z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100),
        email: z.string().email(),
        tags: z.array(z.string()),
      }),
      items: z.array(
        z.object({
          id: z.number().int(),
          name: z.string(),
          price: z.number().min(0),
        })
      ),
      status: z.enum(['active', 'inactive']),
    });
  });
});
