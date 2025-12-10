# valai

**AI-native TypeScript validation library** optimized for LLM outputs, function calling, and structured generation.

```typescript
import { v } from 'valai';

const ProductSchema = v.object({
  name: v.string().describe('Product name'),
  price: v.number().min(0),
  category: v.enum(['electronics', 'clothing', 'food']),
  inStock: v.boolean().default(true)
});

// Parse messy LLM output with auto-repair
const result = ProductSchema.parseLLM(`
  \`\`\`json
  {
    name: 'iPhone 15',    // unquoted key, single quotes
    price: 999,           // trailing comma
  }
  \`\`\`
`);

// Export for OpenAI function calling
const tool = ProductSchema.toOpenAI({ name: 'extract_product' });
```

## Features

- **LLM-First Design** - Built specifically for validating AI/LLM outputs
- **Auto JSON Repair** - Fixes trailing commas, single quotes, unquoted keys, comments, and more
- **Markdown Extraction** - Automatically extracts JSON from code blocks
- **Type Coercion** - Smart coercion in LLM mode (`"25"` → `25`)
- **Multi-Format Export** - JSON Schema, OpenAI, Claude, and Gemini formats
- **AI Metadata** - `.describe()` and `.examples()` for better LLM guidance
- **Partial Data on Failure** - Get what was parsed for retry scenarios
- **Full TypeScript Support** - Complete type inference like Zod

## Installation

```bash
npm install valai
```

## Quick Start

### Basic Validation

```typescript
import { v } from 'valai';

// Define a schema
const UserSchema = v.object({
  name: v.string().min(1),
  email: v.string().email(),
  age: v.number().int().min(0).optional()
});

// Infer TypeScript type
type User = v.infer<typeof UserSchema>;
// { name: string; email: string; age?: number }

// Strict parsing (throws on error)
const user = UserSchema.parse({ name: 'John', email: 'john@example.com' });

// Safe parsing (returns result object)
const result = UserSchema.safeParse(data);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.issues);
}
```

### LLM Output Parsing

```typescript
// parseLLM() handles common LLM output issues:
const schema = v.object({
  name: v.string(),
  score: v.number()
});

// Handles: markdown code blocks, single quotes, unquoted keys,
// trailing commas, comments, and type coercion
const result = schema.parseLLM(`
Here's the extracted data:
\`\`\`json
{
  name: 'Test',     // unquoted key + single quotes
  score: "95",      // string that should be number
}
\`\`\`
`);

console.log(result.data); // { name: 'Test', score: 95 }
```

### AI-Optimized Schemas

```typescript
const ProductSchema = v.object({
  name: v.string()
    .describe('The product name as it appears on the packaging')
    .examples(['iPhone 15 Pro', 'MacBook Air M3']),

  price: v.number()
    .min(0)
    .describe('Price in USD'),

  category: v.enum(['electronics', 'clothing', 'food', 'other'])
    .describe('Primary product category')
});

// Descriptions and examples are included in exported schemas
const jsonSchema = ProductSchema.toJSONSchema();
```

### Export for LLM APIs

```typescript
// OpenAI Function Calling
const openAITool = schema.toOpenAI({
  name: 'extract_product',
  description: 'Extract product information from text'
});

// Anthropic/Claude Tools
const claudeTool = schema.toClaude({
  name: 'extract_product',
  description: 'Extract product information from text'
});

// Google Gemini
const geminiFunc = schema.toGemini({
  name: 'extract_product',
  description: 'Extract product information from text'
});

// Standard JSON Schema (2020-12)
const jsonSchema = schema.toJSONSchema();
```

## Schema Types

### Primitives

```typescript
v.string()    // string
v.number()    // number
v.boolean()   // boolean
v.null()      // null
v.undefined() // undefined
v.any()       // any
v.unknown()   // unknown
```

### String Validations

```typescript
v.string()
  .min(1)              // Minimum length
  .max(100)            // Maximum length
  .length(10)          // Exact length
  .email()             // Email format
  .url()               // URL format
  .uuid()              // UUID format
  .regex(/pattern/)    // Custom regex
  .includes('text')    // Contains substring
  .startsWith('pre')   // Starts with
  .endsWith('suf')     // Ends with
  .trim()              // Trim whitespace (transform)
  .toLowerCase()       // To lowercase (transform)
  .toUpperCase()       // To uppercase (transform)
```

### Number Validations

```typescript
v.number()
  .min(0)              // Minimum (inclusive)
  .max(100)            // Maximum (inclusive)
  .gt(0)               // Greater than
  .lt(100)             // Less than
  .int()               // Integer only
  .positive()          // > 0
  .negative()          // < 0
  .nonnegative()       // >= 0
  .nonpositive()       // <= 0
  .multipleOf(5)       // Multiple of
  .finite()            // No Infinity
```

### Objects

```typescript
const schema = v.object({
  name: v.string(),
  age: v.number().optional()
});

// Object methods
schema.extend({ email: v.string() })  // Add properties
schema.merge(otherSchema)             // Merge schemas
schema.pick({ name: true })           // Pick properties
schema.omit({ age: true })            // Omit properties
schema.partial()                      // All optional
schema.required()                     // All required
schema.strict()                       // Error on extra keys
schema.passthrough()                  // Keep extra keys
schema.strip()                        // Remove extra keys (default)
```

### Arrays

```typescript
v.array(v.string())           // string[]
  .min(1)                     // Minimum length
  .max(10)                    // Maximum length
  .length(5)                  // Exact length
  .nonempty()                 // At least 1 element
```

### Tuples

```typescript
v.tuple([v.string(), v.number()])     // [string, number]
v.tuple([v.string()]).rest(v.number()) // [string, ...number[]]
```

### Unions & Enums

```typescript
// String enum
v.enum(['pending', 'active', 'completed'])

// Native TypeScript enum
enum Status { Pending, Active }
v.nativeEnum(Status)

// Union types
v.union([v.string(), v.number()])     // string | number

// Discriminated union
v.discriminatedUnion('type', [
  v.object({ type: v.literal('a'), value: v.string() }),
  v.object({ type: v.literal('b'), count: v.number() })
])

// Literal
v.literal('active')                    // 'active'
```

### Records

```typescript
v.record(v.number())                   // Record<string, number>
v.record(v.string().uuid(), v.any())   // Record with UUID keys
```

### Modifiers

```typescript
v.string().optional()           // string | undefined
v.string().nullable()           // string | null
v.string().default('anonymous') // Default value if undefined
```

## JSON Repair

valai includes powerful JSON repair utilities for handling malformed LLM outputs:

```typescript
import { repairJSON, parseAndRepair, isValidJSON } from 'valai';

// Full repair with detailed result
const result = repairJSON(`{
  name: 'test',     // unquoted key, single quotes
  value: 123,       // trailing comma
}`);

console.log(result.success);  // true
console.log(result.data);     // { name: 'test', value: 123 }
console.log(result.repairs);  // List of repairs made

// Parse and repair in one step
const data = parseAndRepair('{"a": 1,}');

// Check if valid JSON
isValidJSON('{"a": 1}');  // true
isValidJSON('{a: 1}');    // false
```

### Repair Capabilities

| Issue | Example | Fixed |
|-------|---------|-------|
| Markdown code blocks | `` ```json {...} ``` `` | `{...}` |
| Single quotes | `{'a': 'b'}` | `{"a": "b"}` |
| Unquoted keys | `{a: 1}` | `{"a": 1}` |
| Trailing commas | `{"a": 1,}` | `{"a": 1}` |
| Comments | `{"a": 1} // comment` | `{"a": 1}` |
| Unclosed brackets | `{"a": 1` | `{"a": 1}` |
| Special numbers | `{"a": NaN}` | `{"a": null}` |
| Hex/binary numbers | `{"a": 0xff}` | `{"a": 255}` |

### Individual Fixers

```typescript
import {
  extractFromMarkdown,
  extractJSONFromText,
  fixSingleQuotes,
  fixUnquotedKeys,
  fixTrailingCommas,
  tryCloseBrackets,
  removeJSONComments,
  fixSpecialNumbers
} from 'valai';

// Use individual fixers for fine-grained control
const text = extractFromMarkdown('```json\n{}\n```').text;
const fixed = fixTrailingCommas('{"a": 1,}');
```

## Error Handling

```typescript
const result = schema.safeParse(invalidData);

if (!result.success) {
  // Structured errors
  console.log(result.error.issues);
  // [{ code: 'invalid_type', path: ['name'], message: '...' }]

  // Flattened format
  console.log(result.error.flatten());
  // { formErrors: [], fieldErrors: { name: ['...'] } }

  // Formatted string
  console.log(result.error.format());
}
```

## Type Inference

```typescript
import { v } from 'valai';
import type { infer as Infer } from 'valai';

const UserSchema = v.object({
  name: v.string(),
  age: v.number().optional()
});

// Using v.infer
type User = v.infer<typeof UserSchema>;

// Using imported Infer type
type User2 = Infer<typeof UserSchema>;

// Input type (before transforms)
type UserInput = v.input<typeof UserSchema>;

// Output type (after transforms)
type UserOutput = v.output<typeof UserSchema>;
```

## Comparison with Zod

| Feature | valai | Zod |
|---------|-------|-----|
| Schema definition | Same API | Same API |
| Type inference | Full support | Full support |
| LLM parsing mode | `parseLLM()` | Manual |
| JSON repair | Built-in | External |
| Markdown extraction | Built-in | Manual |
| Type coercion | Auto in LLM mode | Manual coerce |
| OpenAI export | `toOpenAI()` | Manual |
| Claude export | `toClaude()` | Manual |
| Gemini export | `toGemini()` | Manual |
| AI metadata | `.describe()`, `.examples()` | `.describe()` only |
| Partial on failure | Yes | No |

### Run Benchmarks

```bash
npx vitest bench --run
```

## API Reference

### Schema Methods

| Method | Description |
|--------|-------------|
| `.parse(data)` | Strict parse, throws on error |
| `.safeParse(data)` | Safe parse, returns result object |
| `.parseLLM(data, options?)` | LLM-friendly parse with repair |
| `.describe(text)` | Add description for AI |
| `.examples(values)` | Add examples for AI |
| `.optional()` | Make optional |
| `.nullable()` | Make nullable |
| `.default(value)` | Set default value |
| `.toJSONSchema(options?)` | Export as JSON Schema |
| `.toOpenAI(options)` | Export for OpenAI |
| `.toClaude(options)` | Export for Claude |
| `.toGemini(options)` | Export for Gemini |

### LLM Parse Options

```typescript
interface LLMParseOptions {
  coerce?: boolean;              // Enable type coercion (default: true)
  repair?: boolean;              // Enable JSON repair (default: true)
  extractFromMarkdown?: boolean; // Extract from code blocks (default: true)
  useDefaults?: boolean;         // Use default values (default: true)
}
```

## License

MIT
