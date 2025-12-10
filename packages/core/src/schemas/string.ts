import { ValaiType } from './base.js';
import type { ValaiStringDef, StringCheck } from '../types/base.js';
import type { JSONSchema } from '../types/json-schema.js';
import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';

/**
 * Email regex pattern (simplified but practical).
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * URL regex pattern (supports http, https).
 */
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/**
 * UUID v4 regex pattern.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * CUID regex pattern.
 */
const CUID_REGEX = /^c[^\s-]{8,}$/i;

/**
 * String schema type.
 *
 * @example
 * ```typescript
 * const nameSchema = v.string()
 *   .min(1)
 *   .max(100)
 *   .describe('User name');
 *
 * const emailSchema = v.string().email();
 * ```
 */
export class ValaiString extends ValaiType<string, string, ValaiStringDef> {
  constructor(def?: Partial<ValaiStringDef>) {
    super({
      typeName: 'ValaiString',
      ...def,
    });
  }

  _parse(ctx: ParseContext): ParseReturnType<string> {
    let value = ctx.data;

    // Coercion for LLM mode
    if (ctx.shouldCoerce && value !== undefined && value !== null && typeof value !== 'string') {
      value = String(value);
    }

    // Type check
    if (typeof value !== 'string') {
      return ctx.addInvalidTypeIssue('string');
    }

    // Apply transforms and checks
    let result = value;

    for (const check of this._def.checks ?? []) {
      switch (check.kind) {
        case 'trim':
          result = result.trim();
          break;
        case 'toLowerCase':
          result = result.toLowerCase();
          break;
        case 'toUpperCase':
          result = result.toUpperCase();
          break;
        case 'min':
          if (result.length < check.value) {
            ctx.addIssue({
              code: 'too_small',
              type: 'string',
              minimum: check.value,
              inclusive: true,
              message: check.message,
            });
          }
          break;
        case 'max':
          if (result.length > check.value) {
            ctx.addIssue({
              code: 'too_big',
              type: 'string',
              maximum: check.value,
              inclusive: true,
              message: check.message,
            });
          }
          break;
        case 'length':
          if (result.length !== check.value) {
            ctx.addIssue({
              code: 'too_small',
              type: 'string',
              minimum: check.value,
              inclusive: true,
              exact: true,
              message: check.message,
            });
          }
          break;
        case 'email':
          if (!EMAIL_REGEX.test(result)) {
            ctx.addIssue({
              code: 'invalid_string',
              validation: 'email',
              message: check.message,
            });
          }
          break;
        case 'url':
          if (!URL_REGEX.test(result)) {
            ctx.addIssue({
              code: 'invalid_string',
              validation: 'url',
              message: check.message,
            });
          }
          break;
        case 'uuid':
          if (!UUID_REGEX.test(result)) {
            ctx.addIssue({
              code: 'invalid_string',
              validation: 'uuid',
              message: check.message,
            });
          }
          break;
        case 'cuid':
          if (!CUID_REGEX.test(result)) {
            ctx.addIssue({
              code: 'invalid_string',
              validation: 'cuid',
              message: check.message,
            });
          }
          break;
        case 'regex':
          if (!check.regex.test(result)) {
            ctx.addIssue({
              code: 'invalid_string',
              validation: 'regex',
              message: check.message,
            });
          }
          break;
        case 'includes':
          if (!result.includes(check.value)) {
            ctx.addIssue({
              code: 'invalid_string',
              validation: 'includes',
              message: check.message ?? `String must include "${check.value}"`,
            });
          }
          break;
        case 'startsWith':
          if (!result.startsWith(check.value)) {
            ctx.addIssue({
              code: 'invalid_string',
              validation: 'startsWith',
              message: check.message ?? `String must start with "${check.value}"`,
            });
          }
          break;
        case 'endsWith':
          if (!result.endsWith(check.value)) {
            ctx.addIssue({
              code: 'invalid_string',
              validation: 'endsWith',
              message: check.message ?? `String must end with "${check.value}"`,
            });
          }
          break;
      }
    }

    if (ctx.hasIssues) {
      return { status: 'invalid' };
    }

    return ctx.success(result);
  }

  _toJSONSchema(): JSONSchema {
    const schema: JSONSchema = { type: 'string' };

    for (const check of this._def.checks ?? []) {
      switch (check.kind) {
        case 'min':
          schema.minLength = check.value;
          break;
        case 'max':
          schema.maxLength = check.value;
          break;
        case 'length':
          schema.minLength = check.value;
          schema.maxLength = check.value;
          break;
        case 'email':
          schema.format = 'email';
          break;
        case 'url':
          schema.format = 'uri';
          break;
        case 'uuid':
          schema.format = 'uuid';
          break;
        case 'regex':
          schema.pattern = check.regex.source;
          break;
      }
    }

    return schema;
  }

  protected _clone(def: ValaiStringDef): this {
    return new ValaiString(def) as this;
  }

  private _addCheck(check: StringCheck): ValaiString {
    return new ValaiString({
      ...this._def,
      checks: [...(this._def.checks ?? []), check],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STRING-SPECIFIC METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Minimum string length.
   *
   * @example
   * ```typescript
   * v.string().min(1) // At least 1 character
   * ```
   */
  min(length: number, message?: string): ValaiString {
    return this._addCheck({ kind: 'min', value: length, message });
  }

  /**
   * Maximum string length.
   *
   * @example
   * ```typescript
   * v.string().max(100) // At most 100 characters
   * ```
   */
  max(length: number, message?: string): ValaiString {
    return this._addCheck({ kind: 'max', value: length, message });
  }

  /**
   * Exact string length.
   *
   * @example
   * ```typescript
   * v.string().length(10) // Exactly 10 characters
   * ```
   */
  length(length: number, message?: string): ValaiString {
    return this._addCheck({ kind: 'length', value: length, message });
  }

  /**
   * Non-empty string (min length 1).
   *
   * @example
   * ```typescript
   * v.string().nonempty() // At least 1 character
   * ```
   */
  nonempty(message?: string): ValaiString {
    return this.min(1, message ?? 'String cannot be empty');
  }

  /**
   * Validate as email address.
   *
   * @example
   * ```typescript
   * v.string().email() // Must be valid email
   * ```
   */
  email(message?: string): ValaiString {
    return this._addCheck({ kind: 'email', message });
  }

  /**
   * Validate as URL.
   *
   * @example
   * ```typescript
   * v.string().url() // Must be valid URL
   * ```
   */
  url(message?: string): ValaiString {
    return this._addCheck({ kind: 'url', message });
  }

  /**
   * Validate as UUID v4.
   *
   * @example
   * ```typescript
   * v.string().uuid() // Must be valid UUID
   * ```
   */
  uuid(message?: string): ValaiString {
    return this._addCheck({ kind: 'uuid', message });
  }

  /**
   * Validate as CUID.
   *
   * @example
   * ```typescript
   * v.string().cuid() // Must be valid CUID
   * ```
   */
  cuid(message?: string): ValaiString {
    return this._addCheck({ kind: 'cuid', message });
  }

  /**
   * Validate against a regex pattern.
   *
   * @example
   * ```typescript
   * v.string().regex(/^[A-Z]+$/) // Must match pattern
   * ```
   */
  regex(pattern: RegExp, message?: string): ValaiString {
    return this._addCheck({ kind: 'regex', regex: pattern, message });
  }

  /**
   * String must include a substring.
   *
   * @example
   * ```typescript
   * v.string().includes('@') // Must contain @
   * ```
   */
  includes(value: string, message?: string): ValaiString {
    return this._addCheck({ kind: 'includes', value, message });
  }

  /**
   * String must start with a prefix.
   *
   * @example
   * ```typescript
   * v.string().startsWith('http') // Must start with http
   * ```
   */
  startsWith(value: string, message?: string): ValaiString {
    return this._addCheck({ kind: 'startsWith', value, message });
  }

  /**
   * String must end with a suffix.
   *
   * @example
   * ```typescript
   * v.string().endsWith('.com') // Must end with .com
   * ```
   */
  endsWith(value: string, message?: string): ValaiString {
    return this._addCheck({ kind: 'endsWith', value, message });
  }

  /**
   * Trim whitespace from both ends.
   *
   * @example
   * ```typescript
   * v.string().trim() // Trims whitespace
   * ```
   */
  trim(): ValaiString {
    return this._addCheck({ kind: 'trim' });
  }

  /**
   * Convert to lowercase.
   *
   * @example
   * ```typescript
   * v.string().toLowerCase() // Converts to lowercase
   * ```
   */
  toLowerCase(): ValaiString {
    return this._addCheck({ kind: 'toLowerCase' });
  }

  /**
   * Convert to uppercase.
   *
   * @example
   * ```typescript
   * v.string().toUpperCase() // Converts to uppercase
   * ```
   */
  toUpperCase(): ValaiString {
    return this._addCheck({ kind: 'toUpperCase' });
  }
}
