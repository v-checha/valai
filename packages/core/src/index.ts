/**
 * Valai - AI/LLM-native TypeScript validation library
 *
 * @example
 * ```typescript
 * import { v } from 'valai';
 *
 * const ProductSchema = v.object({
 *   name: v.string()
 *     .describe('Product name')
 *     .examples(['iPhone 15', 'MacBook Air']),
 *   price: v.number().min(0),
 *   category: v.enum(['electronics', 'clothing', 'food']),
 *   tags: v.array(v.string()).minLength(1),
 *   inStock: v.boolean().default(true)
 * });
 *
 * type Product = v.infer<typeof ProductSchema>;
 *
 * // Parse LLM output with auto-coercion and repair
 * const result = ProductSchema.parseLLM(llmOutput);
 *
 * // Export for OpenAI function calling
 * const tool = ProductSchema.toOpenAI({ name: 'extract_product' });
 * ```
 */

// Main factory export (v.string(), v.object(), etc.)
import * as v from './factory.js';
export { v };

// Type inference utilities
export type { infer, input, output } from './types/inference.js';
export type {
  Flatten,
  DeepPartial,
  ObjectOutputType,
  ObjectInputType,
} from './types/inference.js';

// Schema classes (for advanced use)
export {
  ValaiType,
  ValaiOptional,
  ValaiNullable,
  ValaiDefault,
} from './schemas/base.js';
export { ValaiString } from './schemas/string.js';
export { ValaiNumber } from './schemas/number.js';
export { ValaiBoolean } from './schemas/boolean.js';
export {
  ValaiLiteral,
  ValaiNull,
  ValaiUndefined,
  ValaiAny,
  ValaiUnknown,
} from './schemas/literals.js';
export { ValaiObject } from './schemas/object.js';
export { ValaiArray } from './schemas/array.js';
export { ValaiEnum, ValaiNativeEnum } from './schemas/enum.js';
export { ValaiUnion, ValaiDiscriminatedUnion, ValaiIntersection } from './schemas/union.js';
export { ValaiTuple } from './schemas/tuple.js';
export { ValaiRecord } from './schemas/record.js';

// Type definitions
export type {
  ValaiTypeDef,
  ValaiTypeAny,
  ValaiRawShape,
  ValaiStringDef,
  ValaiNumberDef,
  ValaiBooleanDef,
  ValaiLiteralDef,
  ValaiEnumDef,
  ValaiObjectDef,
  ValaiArrayDef,
  ValaiUnionDef,
  ValaiIntersectionDef,
  ValaiTupleDef,
  ValaiRecordDef,
  ValaiOptionalDef,
  ValaiNullableDef,
  ValaiDefaultDef,
  StringCheck,
  NumberCheck,
  LiteralValue,
} from './types/base.js';

// JSON Schema types
export type {
  JSONSchema,
  JSONSchemaOptions,
  OpenAITool,
  OpenAIFunction,
  OpenAIFunctionParameters,
  OpenAISchemaOptions,
  ClaudeTool,
  ClaudeToolInputSchema,
  ClaudeSchemaOptions,
  GeminiFunctionDeclaration,
  GeminiSchemaOptions,
} from './types/json-schema.js';

// Parse types
export type {
  ParseResult,
  ParseSuccess,
  ParseFailure,
  SafeParseResult,
} from './parse/result.js';
export type { ParseContext, LLMParseOptions, ParseMode } from './parse/context.js';

// Error types
export {
  ValaiError,
  type ValaiIssue,
  type ValaiIssueCode,
  type FlattenedError,
  type InvalidTypeIssue,
  type InvalidLiteralIssue,
  type InvalidEnumValueIssue,
  type InvalidUnionIssue,
  type TooSmallIssue,
  type TooBigIssue,
  type UnrecognizedKeysIssue,
  type CustomIssue,
} from './errors/valai-error.js';

// JSON Repair utilities
export {
  repairJSON,
  parseAndRepair,
  isValidJSON,
  isRepairableJSON,
  type RepairOptions,
  type RepairResult,
  type RepairAction,
  // Extractors
  extractFromMarkdown,
  extractAllFromMarkdown,
  type MarkdownExtractionResult,
  extractJSONFromText,
  extractAllJSONFromText,
  type TextExtractionResult,
  // Individual fixers
  fixSingleQuotes,
  ensureQuotedValues,
  fixUnquotedKeys,
  ensureQuotedKeys,
  fixTrailingCommas,
  fixMissingCommas,
  tryCloseBrackets,
  balanceBrackets,
  removeJSONComments,
  removeHashComments,
  removeAllComments,
  fixSpecialNumbers,
  fixNumberFormats,
} from './repair/index.js';
