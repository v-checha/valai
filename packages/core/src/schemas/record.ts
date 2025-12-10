import { ValaiType } from './base.js';
import type { ValaiRecordDef, ValaiTypeAny } from '../types/base.js';
import type { JSONSchema } from '../types/json-schema.js';
import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';
import { isValid } from '../parse/result.js';
import { ValaiString } from './string.js';

/**
 * Valid key types for records (must produce string keys).
 */
export type RecordKeyType = ValaiTypeAny & { _output: string; _input: string };

/**
 * Record schema type - validates objects with dynamic keys.
 *
 * @example
 * ```typescript
 * // Record with string keys and number values
 * const scores = v.record(v.string(), v.number());
 * type Scores = v.infer<typeof scores>; // Record<string, number>
 *
 * // Shorthand (string keys implied)
 * const ages = v.record(v.number());
 * type Ages = v.infer<typeof ages>; // Record<string, number>
 * ```
 */
export class ValaiRecord<
  TKey extends RecordKeyType,
  TValue extends ValaiTypeAny,
> extends ValaiType<
  Record<TKey['_output'], TValue['_output']>,
  Record<TKey['_input'], TValue['_input']>,
  ValaiRecordDef<TKey, TValue>
> {
  constructor(
    keyType: TKey,
    valueType: TValue,
    def?: Partial<Omit<ValaiRecordDef<TKey, TValue>, 'keyType' | 'valueType'>>
  ) {
    super({
      typeName: 'ValaiRecord',
      keyType,
      valueType,
      ...def,
    });
  }

  /**
   * Get the key schema.
   */
  get keySchema(): TKey {
    return this._def.keyType;
  }

  /**
   * Get the value schema.
   */
  get valueSchema(): TValue {
    return this._def.valueType;
  }

  _parse(ctx: ParseContext): ParseReturnType<Record<TKey['_output'], TValue['_output']>> {
    // Type check
    if (typeof ctx.data !== 'object' || ctx.data === null || Array.isArray(ctx.data)) {
      return ctx.addInvalidTypeIssue('object');
    }

    const input = ctx.data as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    // Validate each key-value pair
    for (const [key, value] of Object.entries(input)) {
      // Validate key
      const keyCtx = ctx.child(key, key);
      const keyResult = this._def.keyType._parse(keyCtx);

      // Validate value
      const valueCtx = ctx.child(value, key);
      const valueResult = this._def.valueType._parse(valueCtx);

      if (isValid(keyResult) && isValid(valueResult)) {
        result[keyResult.value as string] = valueResult.value;
      }
    }

    if (ctx.hasIssues) {
      return { status: 'invalid' };
    }

    return ctx.success(result as Record<TKey['_output'], TValue['_output']>);
  }

  _toJSONSchema(): JSONSchema {
    const valueSchema = this._def.valueType._toJSONSchema();

    // If key type has constraints, use patternProperties
    const keySchema = this._def.keyType._toJSONSchema();
    if (keySchema.pattern) {
      return {
        type: 'object',
        patternProperties: {
          [keySchema.pattern]: valueSchema,
        },
        additionalProperties: false,
      };
    }

    // Default: additionalProperties
    return {
      type: 'object',
      additionalProperties: valueSchema,
    };
  }

  protected _clone(def: ValaiRecordDef<TKey, TValue>): this {
    return new ValaiRecord(def.keyType, def.valueType, def) as this;
  }
}

/**
 * Create a record schema with string keys.
 * Convenience factory for the common case.
 */
export function createRecord<TValue extends ValaiTypeAny>(
  valueType: TValue
): ValaiRecord<ValaiString, TValue>;

/**
 * Create a record schema with custom key and value types.
 */
export function createRecord<TKey extends RecordKeyType, TValue extends ValaiTypeAny>(
  keyType: TKey,
  valueType: TValue
): ValaiRecord<TKey, TValue>;

export function createRecord<TKey extends RecordKeyType, TValue extends ValaiTypeAny>(
  keyOrValue: TKey | TValue,
  maybeValue?: TValue
): ValaiRecord<TKey, TValue> | ValaiRecord<ValaiString, TValue> {
  if (maybeValue === undefined) {
    // Single argument - use string keys
    return new ValaiRecord(new ValaiString(), keyOrValue as TValue) as ValaiRecord<
      ValaiString,
      TValue
    >;
  }

  // Two arguments - custom key type
  return new ValaiRecord(keyOrValue as TKey, maybeValue);
}
