/**
 * Main JSON repair module for LLM outputs.
 */

import { extractFromMarkdown } from './extractors/markdown.js';
import { extractJSONFromText } from './extractors/text.js';
import { fixSingleQuotes } from './fixers/quotes.js';
import { fixUnquotedKeys } from './fixers/keys.js';
import { fixTrailingCommas } from './fixers/commas.js';
import { tryCloseBrackets } from './fixers/brackets.js';
import { removeJSONComments } from './fixers/comments.js';
import { fixSpecialNumbers, fixNumberFormats } from './fixers/numbers.js';

/**
 * Options for JSON repair.
 */
export interface RepairOptions {
  /** Extract JSON from markdown code blocks (default: true) */
  markdown?: boolean;
  /** Extract JSON from surrounding prose text (default: true) */
  extractFromText?: boolean;
  /** Remove JavaScript-style comments (default: true) */
  removeComments?: boolean;
  /** Fix single quotes to double quotes (default: true) */
  singleQuotes?: boolean;
  /** Fix unquoted object keys (default: true) */
  unquotedKeys?: boolean;
  /** Remove trailing commas (default: true) */
  trailingCommas?: boolean;
  /** Try to close unclosed brackets (default: true) */
  closeBrackets?: boolean;
  /** Handle special numbers like NaN, Infinity (default: true) */
  handleSpecialNumbers?: boolean;
  /** Fix non-standard number formats (default: true) */
  fixNumberFormats?: boolean;
}

/**
 * Record of a repair action.
 */
export interface RepairAction {
  /** Type of repair performed */
  type: string;
  /** Description of what was fixed */
  description?: string;
}

/**
 * Result of a repair operation.
 */
export interface RepairResult {
  /** Whether the repair produced valid JSON */
  success: boolean;
  /** The parsed JSON data (if successful) */
  data?: unknown;
  /** The repaired JSON string */
  text: string;
  /** Whether any repairs were made */
  repaired: boolean;
  /** List of repairs performed */
  repairs: RepairAction[];
  /** Error if parsing failed */
  error?: Error;
}

/**
 * Default repair options.
 */
const DEFAULT_OPTIONS: Required<RepairOptions> = {
  markdown: true,
  extractFromText: true,
  removeComments: true,
  singleQuotes: true,
  unquotedKeys: true,
  trailingCommas: true,
  closeBrackets: true,
  handleSpecialNumbers: true,
  fixNumberFormats: true,
};

/**
 * Repair malformed JSON from LLM output.
 *
 * This function applies a series of fixes to handle common issues:
 * - Markdown code block extraction
 * - Text extraction (JSON from prose)
 * - Comment removal
 * - Single quote to double quote conversion
 * - Unquoted key quoting
 * - Trailing comma removal
 * - Bracket closing
 * - Special number handling
 *
 * @example
 * ```typescript
 * const broken = `
 * Here's the data:
 * \`\`\`json
 * {
 *   name: 'test',     // comment
 *   value: 123,       // trailing comma
 * }
 * \`\`\`
 * `;
 *
 * const result = repairJSON(broken);
 * // {
 * //   success: true,
 * //   data: { name: 'test', value: 123 },
 * //   repaired: true,
 * //   repairs: [...]
 * // }
 * ```
 */
export function repairJSON(input: string, options: RepairOptions = {}): RepairResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const repairs: RepairAction[] = [];
  let text = input;
  const originalText = input;

  // Step 1: Extract from markdown
  if (opts.markdown) {
    const result = extractFromMarkdown(text);
    if (result.extracted) {
      text = result.text;
      repairs.push({ type: 'markdown', description: 'Extracted JSON from markdown code block' });
    }
  }

  // Step 2: Extract from surrounding text
  if (opts.extractFromText) {
    const result = extractJSONFromText(text);
    if (result.extracted) {
      text = result.text;
      repairs.push({ type: 'extractFromText', description: 'Extracted JSON from surrounding text' });
    }
  }

  // Step 3: Remove comments
  if (opts.removeComments) {
    const before = text;
    text = removeJSONComments(text);
    if (text !== before) {
      repairs.push({ type: 'removeComments', description: 'Removed comments' });
    }
  }

  // Step 4: Fix single quotes
  if (opts.singleQuotes) {
    const before = text;
    text = fixSingleQuotes(text);
    if (text !== before) {
      repairs.push({ type: 'singleQuotes', description: 'Converted single quotes to double quotes' });
    }
  }

  // Step 5: Fix unquoted keys
  if (opts.unquotedKeys) {
    const before = text;
    text = fixUnquotedKeys(text);
    if (text !== before) {
      repairs.push({ type: 'unquotedKeys', description: 'Added quotes to unquoted keys' });
    }
  }

  // Step 6: Handle special numbers
  if (opts.handleSpecialNumbers) {
    const before = text;
    text = fixSpecialNumbers(text);
    if (text !== before) {
      repairs.push({ type: 'specialNumbers', description: 'Replaced special number values' });
    }
  }

  // Step 7: Fix number formats
  if (opts.fixNumberFormats) {
    const before = text;
    text = fixNumberFormats(text);
    if (text !== before) {
      repairs.push({ type: 'numberFormats', description: 'Fixed non-standard number formats' });
    }
  }

  // Step 8: Fix trailing commas
  if (opts.trailingCommas) {
    const before = text;
    text = fixTrailingCommas(text);
    if (text !== before) {
      repairs.push({ type: 'trailingCommas', description: 'Removed trailing commas' });
    }
  }

  // Step 9: Close brackets (last resort)
  if (opts.closeBrackets) {
    const before = text;
    text = tryCloseBrackets(text);
    if (text !== before) {
      repairs.push({ type: 'closeBrackets', description: 'Closed unclosed brackets' });
    }
  }

  // Try to parse the result
  try {
    const data = JSON.parse(text);
    return {
      success: true,
      data,
      text,
      repaired: text !== originalText,
      repairs,
    };
  } catch (error) {
    return {
      success: false,
      text,
      repaired: text !== originalText,
      repairs,
      error: error as Error,
    };
  }
}

/**
 * Try to repair and parse JSON, returning the parsed data or throwing.
 *
 * @example
 * ```typescript
 * const data = parseAndRepair('{"name": "test",}');
 * // { name: 'test' }
 * ```
 */
export function parseAndRepair<T = unknown>(input: string, options?: RepairOptions): T {
  const result = repairJSON(input, options);
  if (!result.success) {
    throw result.error ?? new Error('Failed to parse JSON');
  }
  return result.data as T;
}

/**
 * Check if a string is valid JSON.
 */
export function isValidJSON(input: string): boolean {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string can be repaired to valid JSON.
 */
export function isRepairableJSON(input: string, options?: RepairOptions): boolean {
  return repairJSON(input, options).success;
}
