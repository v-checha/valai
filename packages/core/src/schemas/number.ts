import { ValaiType } from './base.js';
import type { ValaiNumberDef, NumberCheck } from '../types/base.js';
import type { JSONSchema } from '../types/json-schema.js';
import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';

/**
 * Number schema type.
 *
 * @example
 * ```typescript
 * const ageSchema = v.number()
 *   .int()
 *   .min(0)
 *   .max(150)
 *   .describe('Age in years');
 *
 * const priceSchema = v.number().positive();
 * ```
 */
export class ValaiNumber extends ValaiType<number, number, ValaiNumberDef> {
  constructor(def?: Partial<ValaiNumberDef>) {
    super({
      typeName: 'ValaiNumber',
      ...def,
    });
  }

  _parse(ctx: ParseContext): ParseReturnType<number> {
    let value = ctx.data;

    // Coercion for LLM mode
    if (ctx.shouldCoerce && typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        value = parsed;
      }
    }

    // Type check
    if (typeof value !== 'number') {
      return ctx.addInvalidTypeIssue('number');
    }

    // NaN check
    if (Number.isNaN(value)) {
      return ctx.addInvalidTypeIssue('number', 'NaN');
    }

    // Apply checks
    for (const check of this._def.checks ?? []) {
      switch (check.kind) {
        case 'min':
          if (check.inclusive ? value < check.value : value <= check.value) {
            ctx.addIssue({
              code: 'too_small',
              type: 'number',
              minimum: check.value,
              inclusive: check.inclusive,
              message: check.message,
            });
          }
          break;
        case 'max':
          if (check.inclusive ? value > check.value : value >= check.value) {
            ctx.addIssue({
              code: 'too_big',
              type: 'number',
              maximum: check.value,
              inclusive: check.inclusive,
              message: check.message,
            });
          }
          break;
        case 'int':
          if (!Number.isInteger(value)) {
            ctx.addIssue({
              code: 'invalid_type',
              expected: 'integer',
              received: 'float',
              message: check.message,
            });
          }
          break;
        case 'positive':
          if (value <= 0) {
            ctx.addIssue({
              code: 'too_small',
              type: 'number',
              minimum: 0,
              inclusive: false,
              message: check.message ?? 'Number must be positive',
            });
          }
          break;
        case 'negative':
          if (value >= 0) {
            ctx.addIssue({
              code: 'too_big',
              type: 'number',
              maximum: 0,
              inclusive: false,
              message: check.message ?? 'Number must be negative',
            });
          }
          break;
        case 'nonnegative':
          if (value < 0) {
            ctx.addIssue({
              code: 'too_small',
              type: 'number',
              minimum: 0,
              inclusive: true,
              message: check.message ?? 'Number must be non-negative',
            });
          }
          break;
        case 'nonpositive':
          if (value > 0) {
            ctx.addIssue({
              code: 'too_big',
              type: 'number',
              maximum: 0,
              inclusive: true,
              message: check.message ?? 'Number must be non-positive',
            });
          }
          break;
        case 'multipleOf':
          // Handle floating point precision issues
          const remainder = Math.abs(value % check.value);
          const isMultiple = remainder < Number.EPSILON || Math.abs(remainder - check.value) < Number.EPSILON;
          if (!isMultiple) {
            ctx.addIssue({
              code: 'not_multiple_of',
              multipleOf: check.value,
              message: check.message,
            });
          }
          break;
        case 'finite':
          if (!Number.isFinite(value)) {
            ctx.addIssue({
              code: 'not_finite',
              message: check.message,
            });
          }
          break;
      }
    }

    if (ctx.hasIssues) {
      return { status: 'invalid' };
    }

    return ctx.success(value);
  }

  _toJSONSchema(): JSONSchema {
    const schema: JSONSchema = { type: 'number' };

    for (const check of this._def.checks ?? []) {
      switch (check.kind) {
        case 'min':
          if (check.inclusive) {
            schema.minimum = check.value;
          } else {
            schema.exclusiveMinimum = check.value;
          }
          break;
        case 'max':
          if (check.inclusive) {
            schema.maximum = check.value;
          } else {
            schema.exclusiveMaximum = check.value;
          }
          break;
        case 'int':
          schema.type = 'integer';
          break;
        case 'multipleOf':
          schema.multipleOf = check.value;
          break;
      }
    }

    return schema;
  }

  protected _clone(def: ValaiNumberDef): this {
    return new ValaiNumber(def) as this;
  }

  private _addCheck(check: NumberCheck): ValaiNumber {
    return new ValaiNumber({
      ...this._def,
      checks: [...(this._def.checks ?? []), check],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NUMBER-SPECIFIC METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Minimum value (inclusive by default).
   *
   * @example
   * ```typescript
   * v.number().min(0) // >= 0
   * ```
   */
  min(value: number, message?: string): ValaiNumber {
    return this._addCheck({ kind: 'min', value, inclusive: true, message });
  }

  /**
   * Maximum value (inclusive by default).
   *
   * @example
   * ```typescript
   * v.number().max(100) // <= 100
   * ```
   */
  max(value: number, message?: string): ValaiNumber {
    return this._addCheck({ kind: 'max', value, inclusive: true, message });
  }

  /**
   * Greater than (exclusive minimum).
   *
   * @example
   * ```typescript
   * v.number().gt(0) // > 0
   * ```
   */
  gt(value: number, message?: string): ValaiNumber {
    return this._addCheck({ kind: 'min', value, inclusive: false, message });
  }

  /**
   * Greater than or equal (inclusive minimum).
   *
   * @example
   * ```typescript
   * v.number().gte(0) // >= 0
   * ```
   */
  gte(value: number, message?: string): ValaiNumber {
    return this._addCheck({ kind: 'min', value, inclusive: true, message });
  }

  /**
   * Less than (exclusive maximum).
   *
   * @example
   * ```typescript
   * v.number().lt(100) // < 100
   * ```
   */
  lt(value: number, message?: string): ValaiNumber {
    return this._addCheck({ kind: 'max', value, inclusive: false, message });
  }

  /**
   * Less than or equal (inclusive maximum).
   *
   * @example
   * ```typescript
   * v.number().lte(100) // <= 100
   * ```
   */
  lte(value: number, message?: string): ValaiNumber {
    return this._addCheck({ kind: 'max', value, inclusive: true, message });
  }

  /**
   * Must be an integer.
   *
   * @example
   * ```typescript
   * v.number().int() // Integer only
   * ```
   */
  int(message?: string): ValaiNumber {
    return this._addCheck({ kind: 'int', message });
  }

  /**
   * Must be positive (> 0).
   *
   * @example
   * ```typescript
   * v.number().positive() // > 0
   * ```
   */
  positive(message?: string): ValaiNumber {
    return this._addCheck({ kind: 'positive', message });
  }

  /**
   * Must be negative (< 0).
   *
   * @example
   * ```typescript
   * v.number().negative() // < 0
   * ```
   */
  negative(message?: string): ValaiNumber {
    return this._addCheck({ kind: 'negative', message });
  }

  /**
   * Must be non-negative (>= 0).
   *
   * @example
   * ```typescript
   * v.number().nonnegative() // >= 0
   * ```
   */
  nonnegative(message?: string): ValaiNumber {
    return this._addCheck({ kind: 'nonnegative', message });
  }

  /**
   * Must be non-positive (<= 0).
   *
   * @example
   * ```typescript
   * v.number().nonpositive() // <= 0
   * ```
   */
  nonpositive(message?: string): ValaiNumber {
    return this._addCheck({ kind: 'nonpositive', message });
  }

  /**
   * Must be a multiple of a number.
   *
   * @example
   * ```typescript
   * v.number().multipleOf(5) // 0, 5, 10, 15, ...
   * ```
   */
  multipleOf(value: number, message?: string): ValaiNumber {
    return this._addCheck({ kind: 'multipleOf', value, message });
  }

  /**
   * Must be a finite number (not Infinity or -Infinity).
   *
   * @example
   * ```typescript
   * v.number().finite() // Not Infinity
   * ```
   */
  finite(message?: string): ValaiNumber {
    return this._addCheck({ kind: 'finite', message });
  }

  /**
   * Alias for nonnegative - must be safe for JSON.
   */
  safe(message?: string): ValaiNumber {
    return this.min(Number.MIN_SAFE_INTEGER, message).max(Number.MAX_SAFE_INTEGER, message);
  }
}
