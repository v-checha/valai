import { ValaiType } from './base.js';
import type { ValaiTupleDef, ValaiTypeAny } from '../types/base.js';
import type { JSONSchema } from '../types/json-schema.js';
import type { TupleOutputType, TupleInputType } from '../types/inference.js';
import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';
import { isValid } from '../parse/result.js';

/**
 * Tuple schema type - validates fixed-length arrays with specific types at each position.
 *
 * @example
 * ```typescript
 * const pointSchema = v.tuple([v.number(), v.number()]);
 * type Point = v.infer<typeof pointSchema>; // [number, number]
 *
 * const namedPoint = v.tuple([v.string(), v.number(), v.number()]);
 * type NamedPoint = v.infer<typeof namedPoint>; // [string, number, number]
 * ```
 */
export class ValaiTuple<T extends readonly [ValaiTypeAny, ...ValaiTypeAny[]]> extends ValaiType<
  TupleOutputType<T>,
  TupleInputType<T>,
  ValaiTupleDef<T>
> {
  /**
   * The tuple item schemas.
   */
  readonly items: T;

  constructor(items: T, def?: Partial<Omit<ValaiTupleDef<T>, 'items'>>) {
    super({
      typeName: 'ValaiTuple',
      items,
      ...def,
    });
    this.items = items;
  }

  _parse(ctx: ParseContext): ParseReturnType<TupleOutputType<T>> {
    // Type check
    if (!Array.isArray(ctx.data)) {
      return ctx.addInvalidTypeIssue('array');
    }

    const input = ctx.data;
    const items = this._def.items;
    const rest = this._def.rest;

    // Length check (without rest)
    if (!rest && input.length !== items.length) {
      ctx.addIssue({
        code: 'too_small',
        type: 'array',
        minimum: items.length,
        inclusive: true,
        exact: true,
      });
      return { status: 'invalid' };
    }

    // Length check (with rest) - must have at least items.length elements
    if (rest && input.length < items.length) {
      ctx.addIssue({
        code: 'too_small',
        type: 'array',
        minimum: items.length,
        inclusive: true,
      });
      return { status: 'invalid' };
    }

    const result: unknown[] = [];

    // Validate fixed items
    for (let i = 0; i < items.length; i++) {
      const itemSchema = items[i];
      if (!itemSchema) continue;

      const childCtx = ctx.child(input[i], i);
      const parseResult = itemSchema._parse(childCtx);

      if (isValid(parseResult)) {
        result.push(parseResult.value);
      }
    }

    // Validate rest items
    if (rest) {
      for (let i = items.length; i < input.length; i++) {
        const childCtx = ctx.child(input[i], i);
        const parseResult = rest._parse(childCtx);

        if (isValid(parseResult)) {
          result.push(parseResult.value);
        }
      }
    }

    if (ctx.hasIssues) {
      return { status: 'invalid' };
    }

    return ctx.success(result as TupleOutputType<T>);
  }

  _toJSONSchema(): JSONSchema {
    const schema: JSONSchema = {
      type: 'array',
      prefixItems: this._def.items.map((item) => item._toJSONSchema()),
    };

    if (this._def.rest) {
      schema.items = this._def.rest._toJSONSchema();
    } else {
      schema.items = false;
      schema.minItems = this._def.items.length;
      schema.maxItems = this._def.items.length;
    }

    return schema;
  }

  protected _clone(def: ValaiTupleDef<T>): this {
    return new ValaiTuple(def.items, def) as this;
  }

  /**
   * Add a rest element type for additional items.
   *
   * @example
   * ```typescript
   * const schema = v.tuple([v.string()]).rest(v.number());
   * type T = v.infer<typeof schema>; // [string, ...number[]]
   * ```
   */
  rest<TRest extends ValaiTypeAny>(
    rest: TRest
  ): ValaiTuple<T> & { _output: [...TupleOutputType<T>, ...TRest['_output'][]] } {
    return new ValaiTuple(this._def.items, { ...this._def, rest }) as ValaiTuple<T> & {
      _output: [...TupleOutputType<T>, ...TRest['_output'][]];
    };
  }
}
