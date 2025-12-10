import { ValaiType } from './base.js';
import type {
  ValaiLiteralDef,
  ValaiNullDef,
  ValaiUndefinedDef,
  ValaiAnyDef,
  ValaiUnknownDef,
  LiteralValue,
} from '../types/base.js';
import type { JSONSchema } from '../types/json-schema.js';
import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';

/**
 * Literal schema type - matches an exact value.
 *
 * @example
 * ```typescript
 * const activeSchema = v.literal('active');
 * activeSchema.parse('active'); // 'active'
 * activeSchema.parse('inactive'); // throws
 * ```
 */
export class ValaiLiteral<T extends LiteralValue> extends ValaiType<T, T, ValaiLiteralDef<T>> {
  constructor(value: T, def?: Partial<Omit<ValaiLiteralDef<T>, 'value'>>) {
    super({
      typeName: 'ValaiLiteral',
      value,
      ...def,
    });
  }

  /**
   * Get the literal value.
   */
  get value(): T {
    return this._def.value;
  }

  _parse(ctx: ParseContext): ParseReturnType<T> {
    if (ctx.data !== this._def.value) {
      return ctx.addIssue({
        code: 'invalid_literal',
        expected: this._def.value,
        received: ctx.data,
      });
    }

    return ctx.success(this._def.value);
  }

  _toJSONSchema(): JSONSchema {
    const value = this._def.value;

    if (value === null) {
      return { type: 'null' };
    }

    return { const: value };
  }

  protected _clone(def: ValaiLiteralDef<T>): this {
    return new ValaiLiteral(def.value, def) as this;
  }
}

/**
 * Null schema type - matches only null.
 *
 * @example
 * ```typescript
 * v.null().parse(null); // null
 * v.null().parse(undefined); // throws
 * ```
 */
export class ValaiNull extends ValaiType<null, null, ValaiNullDef> {
  constructor(def?: Partial<ValaiNullDef>) {
    super({
      typeName: 'ValaiNull',
      ...def,
    });
  }

  _parse(ctx: ParseContext): ParseReturnType<null> {
    if (ctx.data !== null) {
      return ctx.addInvalidTypeIssue('null');
    }

    return ctx.success(null);
  }

  _toJSONSchema(): JSONSchema {
    return { type: 'null' };
  }

  protected _clone(def: ValaiNullDef): this {
    return new ValaiNull(def) as this;
  }
}

/**
 * Undefined schema type - matches only undefined.
 *
 * @example
 * ```typescript
 * v.undefined().parse(undefined); // undefined
 * v.undefined().parse(null); // throws
 * ```
 */
export class ValaiUndefined extends ValaiType<undefined, undefined, ValaiUndefinedDef> {
  constructor(def?: Partial<ValaiUndefinedDef>) {
    super({
      typeName: 'ValaiUndefined',
      ...def,
    });
  }

  _parse(ctx: ParseContext): ParseReturnType<undefined> {
    if (ctx.data !== undefined) {
      return ctx.addInvalidTypeIssue('undefined');
    }

    return ctx.success(undefined);
  }

  _toJSONSchema(): JSONSchema {
    // JSON Schema doesn't have undefined, closest is not having a value
    return {};
  }

  protected _clone(def: ValaiUndefinedDef): this {
    return new ValaiUndefined(def) as this;
  }
}

/**
 * Any schema type - accepts any value without validation.
 *
 * @example
 * ```typescript
 * v.any().parse('anything'); // 'anything'
 * v.any().parse(123); // 123
 * ```
 */
export class ValaiAny extends ValaiType<any, any, ValaiAnyDef> {
  constructor(def?: Partial<ValaiAnyDef>) {
    super({
      typeName: 'ValaiAny',
      ...def,
    });
  }

  _parse(ctx: ParseContext): ParseReturnType<any> {
    return ctx.success(ctx.data);
  }

  _toJSONSchema(): JSONSchema {
    return {};
  }

  protected _clone(def: ValaiAnyDef): this {
    return new ValaiAny(def) as this;
  }
}

/**
 * Unknown schema type - accepts any value but types as unknown.
 *
 * @example
 * ```typescript
 * const value: unknown = v.unknown().parse(something);
 * // Must narrow type before use
 * ```
 */
export class ValaiUnknown extends ValaiType<unknown, unknown, ValaiUnknownDef> {
  constructor(def?: Partial<ValaiUnknownDef>) {
    super({
      typeName: 'ValaiUnknown',
      ...def,
    });
  }

  _parse(ctx: ParseContext): ParseReturnType<unknown> {
    return ctx.success(ctx.data);
  }

  _toJSONSchema(): JSONSchema {
    return {};
  }

  protected _clone(def: ValaiUnknownDef): this {
    return new ValaiUnknown(def) as this;
  }
}
