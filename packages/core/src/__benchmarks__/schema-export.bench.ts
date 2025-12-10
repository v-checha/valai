import { bench, describe } from 'vitest';
import * as v from '../factory.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Schema Export Benchmarks
 * Tests JSON Schema generation and LLM format exports
 */

// ============================================================================
// Simple Schema Export
// ============================================================================

describe('Simple Schema - JSON Schema Export', () => {
  const valaiSchema = v.object({
    name: v.string().describe('User name'),
    age: v.number().describe('User age'),
    email: v.string().email().describe('User email'),
  });

  const zodSchema = z.object({
    name: z.string().describe('User name'),
    age: z.number().describe('User age'),
    email: z.string().email().describe('User email'),
  });

  bench('valai - toJSONSchema()', () => {
    valaiSchema.toJSONSchema();
  });

  bench('zod - zodToJsonSchema()', () => {
    zodToJsonSchema(zodSchema);
  });
});

// ============================================================================
// Complex Schema Export
// ============================================================================

describe('Complex Schema - JSON Schema Export', () => {
  const valaiSchema = v.object({
    user: v.object({
      id: v.string().uuid().describe('Unique user ID'),
      name: v.string().min(1).max(100).describe('Full name'),
      email: v.string().email().describe('Email address'),
      age: v.number().int().min(0).max(150).describe('Age in years'),
      role: v.enum(['admin', 'user', 'guest']).describe('User role'),
      tags: v.array(v.string()).describe('User tags'),
      metadata: v.object({
        createdAt: v.string().describe('Creation timestamp'),
        updatedAt: v.string().describe('Last update timestamp'),
        version: v.number().int().describe('Version number'),
      }).describe('Metadata'),
    }).describe('User information'),
    settings: v.object({
      theme: v.enum(['light', 'dark', 'auto']).describe('UI theme'),
      notifications: v.boolean().describe('Enable notifications'),
      language: v.string().describe('Preferred language'),
    }).describe('User settings'),
    permissions: v.array(v.string()).describe('Permission list'),
  });

  const zodSchema = z.object({
    user: z.object({
      id: z.string().uuid().describe('Unique user ID'),
      name: z.string().min(1).max(100).describe('Full name'),
      email: z.string().email().describe('Email address'),
      age: z.number().int().min(0).max(150).describe('Age in years'),
      role: z.enum(['admin', 'user', 'guest']).describe('User role'),
      tags: z.array(z.string()).describe('User tags'),
      metadata: z.object({
        createdAt: z.string().describe('Creation timestamp'),
        updatedAt: z.string().describe('Last update timestamp'),
        version: z.number().int().describe('Version number'),
      }).describe('Metadata'),
    }).describe('User information'),
    settings: z.object({
      theme: z.enum(['light', 'dark', 'auto']).describe('UI theme'),
      notifications: z.boolean().describe('Enable notifications'),
      language: z.string().describe('Preferred language'),
    }).describe('User settings'),
    permissions: z.array(z.string()).describe('Permission list'),
  });

  bench('valai - complex toJSONSchema()', () => {
    valaiSchema.toJSONSchema();
  });

  bench('zod - complex zodToJsonSchema()', () => {
    zodToJsonSchema(zodSchema);
  });
});

// ============================================================================
// LLM Format Exports (valai only)
// ============================================================================

describe('LLM Format Exports (valai only)', () => {
  const schema = v.object({
    action: v.enum(['search', 'create', 'update', 'delete']).describe('Action to perform'),
    target: v.string().describe('Target resource'),
    params: v.object({
      query: v.string().optional().describe('Search query'),
      limit: v.number().int().min(1).max(100).default(10).describe('Result limit'),
      filters: v.array(v.string()).describe('Filter conditions'),
    }).describe('Action parameters'),
  });

  bench('valai - toOpenAI()', () => {
    schema.toOpenAI({
      name: 'perform_action',
      description: 'Perform an action on a resource',
    });
  });

  bench('valai - toClaude()', () => {
    schema.toClaude({
      name: 'perform_action',
      description: 'Perform an action on a resource',
    });
  });

  bench('valai - toGemini()', () => {
    schema.toGemini({
      name: 'perform_action',
      description: 'Perform an action on a resource',
    });
  });

  bench('valai - toJSONSchema() with options', () => {
    schema.toJSONSchema({
      includeSchema: true,
      id: 'https://example.com/schemas/action',
      includeExamples: true,
      includeDescriptions: true,
    });
  });
});

// ============================================================================
// Schema with Examples
// ============================================================================

describe('Schema with Examples', () => {
  const valaiSchema = v.object({
    product: v.string()
      .describe('Product name')
      .examples(['iPhone 15', 'MacBook Pro', 'AirPods']),
    price: v.number()
      .min(0)
      .describe('Price in USD')
      .examples([999, 1299, 199]),
    category: v.enum(['electronics', 'clothing', 'food'])
      .describe('Product category')
      .examples(['electronics']),
  });

  bench('valai - toJSONSchema() with examples', () => {
    valaiSchema.toJSONSchema({ includeExamples: true });
  });

  bench('valai - toOpenAI() with examples', () => {
    valaiSchema.toOpenAI({
      name: 'extract_product',
      description: 'Extract product information',
    });
  });
});

// ============================================================================
// Union Types Export
// ============================================================================

describe('Union Types Export', () => {
  const valaiSchema = v.object({
    result: v.union([
      v.object({
        success: v.literal(true),
        data: v.string(),
      }),
      v.object({
        success: v.literal(false),
        error: v.string(),
      }),
    ]).describe('Operation result'),
  });

  const zodSchema = z.object({
    result: z.union([
      z.object({
        success: z.literal(true),
        data: z.string(),
      }),
      z.object({
        success: z.literal(false),
        error: z.string(),
      }),
    ]).describe('Operation result'),
  });

  bench('valai - union toJSONSchema()', () => {
    valaiSchema.toJSONSchema();
  });

  bench('zod - union zodToJsonSchema()', () => {
    zodToJsonSchema(zodSchema);
  });
});

// ============================================================================
// Array Schemas Export
// ============================================================================

describe('Array Schemas Export', () => {
  const valaiSchema = v.object({
    items: v.array(
      v.object({
        id: v.number().int(),
        name: v.string(),
        tags: v.array(v.string()),
        nested: v.array(
          v.object({
            key: v.string(),
            value: v.union([v.string(), v.number(), v.boolean()]),
          })
        ),
      })
    ).min(1).max(100).describe('List of items'),
  });

  const zodSchema = z.object({
    items: z.array(
      z.object({
        id: z.number().int(),
        name: z.string(),
        tags: z.array(z.string()),
        nested: z.array(
          z.object({
            key: z.string(),
            value: z.union([z.string(), z.number(), z.boolean()]),
          })
        ),
      })
    ).min(1).max(100).describe('List of items'),
  });

  bench('valai - array toJSONSchema()', () => {
    valaiSchema.toJSONSchema();
  });

  bench('zod - array zodToJsonSchema()', () => {
    zodToJsonSchema(zodSchema);
  });
});

// ============================================================================
// Optional and Nullable Export
// ============================================================================

describe('Optional and Nullable Export', () => {
  const valaiSchema = v.object({
    required: v.string(),
    optional: v.string().optional(),
    nullable: v.string().nullable(),
    withDefault: v.string().default('default'),
    optionalNullable: v.string().optional().nullable(),
  });

  const zodSchema = z.object({
    required: z.string(),
    optional: z.string().optional(),
    nullable: z.string().nullable(),
    withDefault: z.string().default('default'),
    optionalNullable: z.string().optional().nullable(),
  });

  bench('valai - optional/nullable toJSONSchema()', () => {
    valaiSchema.toJSONSchema();
  });

  bench('zod - optional/nullable zodToJsonSchema()', () => {
    zodToJsonSchema(zodSchema);
  });
});

// ============================================================================
// Repeated Schema Export
// ============================================================================

describe('Repeated Schema Export (100 iterations)', () => {
  const schema = v.object({
    name: v.string(),
    age: v.number(),
  });

  const zodSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  bench('valai - 100x toJSONSchema()', () => {
    for (let i = 0; i < 100; i++) {
      schema.toJSONSchema();
    }
  });

  bench('zod - 100x zodToJsonSchema()', () => {
    for (let i = 0; i < 100; i++) {
      zodToJsonSchema(zodSchema);
    }
  });

  bench('valai - 100x toOpenAI()', () => {
    for (let i = 0; i < 100; i++) {
      schema.toOpenAI({ name: 'test', description: 'Test' });
    }
  });
});
