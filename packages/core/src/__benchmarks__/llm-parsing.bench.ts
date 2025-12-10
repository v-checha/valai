import { bench, describe } from 'vitest';
import * as v from '../factory.js';

/**
 * LLM Parsing Benchmarks
 * Tests valai's unique LLM-specific parsing capabilities
 */

// Test schemas
const simpleSchema = v.object({
  name: v.string(),
  age: v.number(),
  active: v.boolean(),
});

const complexSchema = v.object({
  user: v.object({
    name: v.string(),
    email: v.string().email(),
    age: v.number(),
  }),
  items: v.array(
    v.object({
      id: v.number(),
      name: v.string(),
      price: v.number(),
    })
  ),
  status: v.enum(['pending', 'active', 'completed']),
});

// ============================================================================
// Clean JSON (Baseline)
// ============================================================================

describe('Clean JSON Parsing', () => {
  const cleanSimple = '{"name": "John", "age": 30, "active": true}';
  const cleanComplex = JSON.stringify({
    user: { name: 'John', email: 'john@test.com', age: 30 },
    items: [
      { id: 1, name: 'Item 1', price: 9.99 },
      { id: 2, name: 'Item 2', price: 19.99 },
    ],
    status: 'pending',
  });

  bench('valai - parse() clean JSON', () => {
    simpleSchema.parse(JSON.parse(cleanSimple));
  });

  bench('valai - parseLLM() clean JSON', () => {
    simpleSchema.parseLLM(cleanSimple);
  });

  bench('valai - parse() complex clean JSON', () => {
    complexSchema.parse(JSON.parse(cleanComplex));
  });

  bench('valai - parseLLM() complex clean JSON', () => {
    complexSchema.parseLLM(cleanComplex);
  });
});

// ============================================================================
// Markdown Code Block Extraction
// ============================================================================

describe('Markdown Code Block Extraction', () => {
  const markdownJson = `Here's the data you requested:

\`\`\`json
{"name": "John", "age": 30, "active": true}
\`\`\`

Let me know if you need anything else!`;

  const markdownComplex = `I've extracted the following information:

\`\`\`json
{
  "user": {
    "name": "John",
    "email": "john@test.com",
    "age": 30
  },
  "items": [
    {"id": 1, "name": "Item 1", "price": 9.99},
    {"id": 2, "name": "Item 2", "price": 19.99}
  ],
  "status": "pending"
}
\`\`\``;

  bench('valai - parseLLM() markdown simple', () => {
    simpleSchema.parseLLM(markdownJson);
  });

  bench('valai - parseLLM() markdown complex', () => {
    complexSchema.parseLLM(markdownComplex);
  });
});

// ============================================================================
// Type Coercion
// ============================================================================

describe('Type Coercion (LLM Mode)', () => {
  // Strings that need coercion to numbers/booleans
  const needsCoercion = '{"name": "John", "age": "30", "active": "true"}';

  const numberSchema = v.object({
    value: v.number(),
    count: v.number(),
    ratio: v.number(),
  });
  const stringNumbers = '{"value": "42", "count": "100", "ratio": "3.14"}';

  bench('valai - parseLLM() with type coercion', () => {
    simpleSchema.parseLLM(needsCoercion);
  });

  bench('valai - parseLLM() number coercion', () => {
    numberSchema.parseLLM(stringNumbers);
  });
});

// ============================================================================
// Single Quotes to Double Quotes
// ============================================================================

describe('Single Quote Fixing', () => {
  const singleQuotes = "{'name': 'John', 'age': 30, 'active': true}";
  const singleQuotesComplex = `{
    'user': {
      'name': 'John',
      'email': 'john@test.com',
      'age': 30
    },
    'items': [
      {'id': 1, 'name': 'Item 1', 'price': 9.99}
    ],
    'status': 'pending'
  }`;

  bench('valai - parseLLM() single quotes simple', () => {
    simpleSchema.parseLLM(singleQuotes);
  });

  bench('valai - parseLLM() single quotes complex', () => {
    complexSchema.parseLLM(singleQuotesComplex);
  });
});

// ============================================================================
// Unquoted Keys
// ============================================================================

describe('Unquoted Key Fixing', () => {
  const unquotedKeys = '{name: "John", age: 30, active: true}';
  const unquotedKeysComplex = `{
    user: {
      name: "John",
      email: "john@test.com",
      age: 30
    },
    items: [
      {id: 1, name: "Item 1", price: 9.99}
    ],
    status: "pending"
  }`;

  bench('valai - parseLLM() unquoted keys simple', () => {
    simpleSchema.parseLLM(unquotedKeys);
  });

  bench('valai - parseLLM() unquoted keys complex', () => {
    complexSchema.parseLLM(unquotedKeysComplex);
  });
});

// ============================================================================
// Trailing Commas
// ============================================================================

describe('Trailing Comma Fixing', () => {
  const trailingCommas = '{"name": "John", "age": 30, "active": true,}';
  const trailingCommasComplex = `{
    "user": {
      "name": "John",
      "email": "john@test.com",
      "age": 30,
    },
    "items": [
      {"id": 1, "name": "Item 1", "price": 9.99,},
      {"id": 2, "name": "Item 2", "price": 19.99,},
    ],
    "status": "pending",
  }`;

  bench('valai - parseLLM() trailing commas simple', () => {
    simpleSchema.parseLLM(trailingCommas);
  });

  bench('valai - parseLLM() trailing commas complex', () => {
    complexSchema.parseLLM(trailingCommasComplex);
  });
});

// ============================================================================
// Comments Removal
// ============================================================================

describe('Comment Removal', () => {
  const withComments = `{
    "name": "John", // user name
    "age": 30, // user age
    "active": true /* is active */
  }`;

  const withCommentsComplex = `{
    // User information
    "user": {
      "name": "John", // full name
      "email": "john@test.com",
      "age": 30
    },
    /* List of items */
    "items": [
      {"id": 1, "name": "Item 1", "price": 9.99} // first item
    ],
    "status": "pending" // current status
  }`;

  bench('valai - parseLLM() with comments simple', () => {
    simpleSchema.parseLLM(withComments);
  });

  bench('valai - parseLLM() with comments complex', () => {
    complexSchema.parseLLM(withCommentsComplex);
  });
});

// ============================================================================
// Multiple Issues Combined
// ============================================================================

describe('Multiple Issues Combined', () => {
  // Combines: markdown, single quotes, unquoted keys, trailing commas, comments
  const messyLLMOutput = `Here's the extracted data:

\`\`\`json
{
  name: 'John', // user's name
  age: "30", // string that should be number
  active: true,
}
\`\`\`

Hope this helps!`;

  const veryMessyLLMOutput = `I found the following information:

\`\`\`
{
  // User details
  user: {
    name: 'John Doe',
    email: 'john@test.com',
    age: "30", // needs coercion
  },
  items: [
    {id: 1, name: 'Item 1', price: "9.99",}, // trailing comma
    {id: 2, name: 'Item 2', price: "19.99",},
  ],
  status: 'pending', /* current status */
}
\`\`\``;

  bench('valai - parseLLM() multiple issues simple', () => {
    simpleSchema.parseLLM(messyLLMOutput);
  });

  bench('valai - parseLLM() multiple issues complex', () => {
    complexSchema.parseLLM(veryMessyLLMOutput);
  });
});

// ============================================================================
// Unclosed Brackets
// ============================================================================

describe('Unclosed Bracket Fixing', () => {
  const unclosedSimple = '{"name": "John", "age": 30, "active": true';
  const unclosedComplex = `{
    "user": {
      "name": "John",
      "email": "john@test.com",
      "age": 30
    },
    "items": [
      {"id": 1, "name": "Item 1", "price": 9.99}
    ],
    "status": "pending"`;

  bench('valai - parseLLM() unclosed simple', () => {
    simpleSchema.parseLLM(unclosedSimple);
  });

  bench('valai - parseLLM() unclosed complex', () => {
    complexSchema.parseLLM(unclosedComplex);
  });
});
