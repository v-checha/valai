import { ValaiType } from './base.js';
import type { ValaiArrayDef, ValaiTypeAny } from '../types/base.js';
import type { JSONSchema } from '../types/json-schema.js';
import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';
import { isValid } from '../parse/result.js';

/**
 * Array schema type - validates arrays with a specific element type.
 *
 * @example
 * ```typescript
 * const numbersSchema = v.array(v.number());
 * const tagsSchema = v.array(v.string()).minLength(1).maxLength(5);
 * ```
 */
export class ValaiArray<T extends ValaiTypeAny> extends ValaiType<
  T['_output'][],
  T['_input'][],
  ValaiArrayDef<T>
> {
  constructor(element: T, def?: Partial<Omit<ValaiArrayDef<T>, 'element'>>) {
    super({
      typeName: 'ValaiArray',
      element,
      ...def,
    });
  }

  /**
   * Get the element schema.
   */
  get element(): T {
    return this._def.element;
  }

  _parse(ctx: ParseContext): ParseReturnType<T['_output'][]> {
    // Type check
    if (!Array.isArray(ctx.data)) {
      return ctx.addInvalidTypeIssue('array');
    }

    const input = ctx.data;
    const result: T['_output'][] = [];

    // Check length constraints
    if (this._def.minLength !== undefined && input.length < this._def.minLength) {
      ctx.addIssue({
        code: 'too_small',
        type: 'array',
        minimum: this._def.minLength,
        inclusive: true,
      });
    }

    if (this._def.maxLength !== undefined && input.length > this._def.maxLength) {
      ctx.addIssue({
        code: 'too_big',
        type: 'array',
        maximum: this._def.maxLength,
        inclusive: true,
      });
    }

    if (this._def.exactLength !== undefined && input.length !== this._def.exactLength) {
      ctx.addIssue({
        code: 'too_small',
        type: 'array',
        minimum: this._def.exactLength,
        inclusive: true,
        exact: true,
      });
    }

    // Validate each element
    for (let i = 0; i < input.length; i++) {
      const childCtx = ctx.child(input[i], i);
      const parseResult = this._def.element._parse(childCtx);

      if (isValid(parseResult)) {
        result.push(parseResult.value);
      }
    }

    if (ctx.hasIssues) {
      return { status: 'invalid' };
    }

    return ctx.success(result);
  }

  _toJSONSchema(): JSONSchema {
    const schema: JSONSchema = {
      type: 'array',
      items: this._def.element._toJSONSchema(),
    };

    if (this._def.minLength !== undefined) {
      schema.minItems = this._def.minLength;
    }

    if (this._def.maxLength !== undefined) {
      schema.maxItems = this._def.maxLength;
    }

    if (this._def.exactLength !== undefined) {
      schema.minItems = this._def.exactLength;
      schema.maxItems = this._def.exactLength;
    }

    return schema;
  }

  protected _clone(def: ValaiArrayDef<T>): this {
    return new ValaiArray(def.element, def) as this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ARRAY-SPECIFIC METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Minimum array length.
   *
   * @example
   * ```typescript
   * v.array(v.string()).minLength(1) // At least 1 element
   * ```
   */
  minLength(length: number): ValaiArray<T> {
    return new ValaiArray(this._def.element, { ...this._def, minLength: length });
  }

  /**
   * Alias for minLength.
   */
  min(length: number): ValaiArray<T> {
    return this.minLength(length);
  }

  /**
   * Maximum array length.
   *
   * @example
   * ```typescript
   * v.array(v.string()).maxLength(10) // At most 10 elements
   * ```
   */
  maxLength(length: number): ValaiArray<T> {
    return new ValaiArray(this._def.element, { ...this._def, maxLength: length });
  }

  /**
   * Alias for maxLength.
   */
  max(length: number): ValaiArray<T> {
    return this.maxLength(length);
  }

  /**
   * Exact array length.
   *
   * @example
   * ```typescript
   * v.array(v.number()).length(3) // Exactly 3 elements
   * ```
   */
  length(length: number): ValaiArray<T> {
    return new ValaiArray(this._def.element, { ...this._def, exactLength: length });
  }

  /**
   * Non-empty array (at least 1 element).
   *
   * @example
   * ```typescript
   * v.array(v.string()).nonempty() // At least 1 element
   * ```
   */
  nonempty(): ValaiArray<T> {
    return this.minLength(1);
  }
}
