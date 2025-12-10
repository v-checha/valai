/**
 * JSON repair utilities for LLM outputs.
 *
 * @example
 * ```typescript
 * import { v, repairJSON, parseAndRepair } from 'valai';
 *
 * // Repair malformed JSON
 * const result = repairJSON(`{
 *   name: 'test',     // unquoted key, single quotes
 *   value: 123,       // trailing comma
 * }`);
 *
 * if (result.success) {
 *   console.log(result.data); // { name: 'test', value: 123 }
 * }
 *
 * // Parse and repair in one step
 * const data = parseAndRepair('{"name": "test",}');
 * ```
 */

// Main repair function
export {
  repairJSON,
  parseAndRepair,
  isValidJSON,
  isRepairableJSON,
  type RepairOptions,
  type RepairResult,
  type RepairAction,
} from './repair.js';

// Extractors
export {
  extractFromMarkdown,
  extractAllFromMarkdown,
  type MarkdownExtractionResult,
} from './extractors/markdown.js';

export {
  extractJSONFromText,
  extractAllJSONFromText,
  type TextExtractionResult,
} from './extractors/text.js';

// Individual fixers (for advanced use)
export { fixSingleQuotes, ensureQuotedValues } from './fixers/quotes.js';
export { fixUnquotedKeys, ensureQuotedKeys } from './fixers/keys.js';
export { fixTrailingCommas, fixMissingCommas } from './fixers/commas.js';
export { tryCloseBrackets, balanceBrackets } from './fixers/brackets.js';
export { removeJSONComments, removeHashComments, removeAllComments } from './fixers/comments.js';
export { fixSpecialNumbers, fixNumberFormats } from './fixers/numbers.js';
