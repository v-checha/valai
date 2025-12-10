import { ValaiType } from './base.js';
import type { ValaiBooleanDef } from '../types/base.js';
import type { JSONSchema } from '../types/json-schema.js';
import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';

/**
 * Boolean schema type.
 *
 * @example
 * ```typescript
 * const activeSchema = v.boolean().describe('Whether the user is active');
 *
 * // In LLM mode, coerces strings
 * v.boolean().parseLLM('true'); // true
 * v.boolean().parseLLM('false'); // false
 * ```
 */
export class ValaiBoolean extends ValaiType<boolean, boolean, ValaiBooleanDef> {
  constructor(def?: Partial<ValaiBooleanDef>) {
    super({
      typeName: 'ValaiBoolean',
      ...def,
    });
  }

  _parse(ctx: ParseContext): ParseReturnType<boolean> {
    let value = ctx.data;

    // Coercion for LLM mode
    if (ctx.shouldCoerce && typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes') {
        value = true;
      } else if (lower === 'false' || lower === '0' || lower === 'no') {
        value = false;
      }
    }

    // Also coerce numbers in LLM mode
    if (ctx.shouldCoerce && typeof value === 'number') {
      if (value === 1) {
        value = true;
      } else if (value === 0) {
        value = false;
      }
    }

    // Type check
    if (typeof value !== 'boolean') {
      return ctx.addInvalidTypeIssue('boolean');
    }

    return ctx.success(value);
  }

  _toJSONSchema(): JSONSchema {
    return { type: 'boolean' };
  }

  protected _clone(def: ValaiBooleanDef): this {
    return new ValaiBoolean(def) as this;
  }
}
