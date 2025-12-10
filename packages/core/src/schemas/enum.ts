import { ValaiType } from './base.js';
import type { ValaiEnumDef } from '../types/base.js';
import type { JSONSchema } from '../types/json-schema.js';
import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';

/**
 * Enum schema type - validates against a set of allowed string values.
 *
 * @example
 * ```typescript
 * const statusSchema = v.enum(['pending', 'active', 'completed']);
 * type Status = v.infer<typeof statusSchema>; // 'pending' | 'active' | 'completed'
 * ```
 */
export class ValaiEnum<T extends readonly [string, ...string[]]> extends ValaiType<
  T[number],
  T[number],
  ValaiEnumDef<T>
> {
  /**
   * The enum values.
   */
  readonly options: T;

  constructor(values: T, def?: Partial<Omit<ValaiEnumDef<T>, 'values'>>) {
    super({
      typeName: 'ValaiEnum',
      values,
      ...def,
    });
    this.options = values;
  }

  /**
   * Get the enum values.
   */
  get enum(): { [K in T[number]]: K } {
    const result = {} as { [K in T[number]]: K };
    for (const value of this.options) {
      (result as Record<string, string>)[value] = value;
    }
    return result;
  }

  /**
   * Get the enum values as an array.
   */
  get values(): T {
    return this.options;
  }

  _parse(ctx: ParseContext): ParseReturnType<T[number]> {
    const value = ctx.data;

    // Coerce to string in LLM mode
    let checkValue = value;
    if (ctx.shouldCoerce && typeof value !== 'string') {
      checkValue = String(value);
    }

    if (typeof checkValue !== 'string') {
      return ctx.addInvalidTypeIssue('string');
    }

    // Case-insensitive matching in LLM mode
    if (ctx.isLLMMode) {
      const lowerValue = checkValue.toLowerCase();
      const match = this.options.find((opt) => opt.toLowerCase() === lowerValue);
      if (match) {
        return ctx.success(match as T[number]);
      }
    }

    // Strict matching
    if (!this.options.includes(checkValue as T[number])) {
      return ctx.addIssue({
        code: 'invalid_enum_value',
        options: [...this.options],
        received: checkValue,
      });
    }

    return ctx.success(checkValue as T[number]);
  }

  _toJSONSchema(): JSONSchema {
    return {
      type: 'string',
      enum: [...this.options],
    };
  }

  protected _clone(def: ValaiEnumDef<T>): this {
    return new ValaiEnum(def.values, def) as this;
  }

  /**
   * Extract a specific enum value.
   *
   * @example
   * ```typescript
   * const status = v.enum(['pending', 'active']);
   * status.extract(['pending']); // v.enum(['pending'])
   * ```
   */
  extract<TExtract extends T[number]>(
    values: readonly [TExtract, ...TExtract[]]
  ): ValaiEnum<typeof values> {
    return new ValaiEnum(values);
  }

  /**
   * Exclude specific enum values.
   *
   * @example
   * ```typescript
   * const status = v.enum(['pending', 'active', 'deleted']);
   * status.exclude(['deleted']); // v.enum(['pending', 'active'])
   * ```
   */
  exclude<TExclude extends T[number]>(
    values: readonly TExclude[]
  ): ValaiEnum<readonly [Exclude<T[number], TExclude>, ...Exclude<T[number], TExclude>[]]> {
    const filtered = this.options.filter(
      (opt) => !values.includes(opt as TExclude)
    ) as unknown as readonly [Exclude<T[number], TExclude>, ...Exclude<T[number], TExclude>[]];
    return new ValaiEnum(filtered);
  }
}

/**
 * Native enum schema type - validates against TypeScript native enums.
 *
 * @example
 * ```typescript
 * enum Status {
 *   Pending = 'pending',
 *   Active = 'active'
 * }
 *
 * const statusSchema = v.nativeEnum(Status);
 * ```
 */
export class ValaiNativeEnum<T extends Record<string, string | number>> extends ValaiType<
  T[keyof T],
  T[keyof T],
  ValaiEnumDef<readonly [string, ...string[]]>
> {
  private readonly enumObject: T;
  private readonly enumValues: (string | number)[];

  constructor(enumObject: T) {
    // Extract enum values (handling both string and numeric enums)
    const values: (string | number)[] = [];
    for (const key of Object.keys(enumObject)) {
      const value = enumObject[key];
      if (value === undefined) continue;
      // Skip reverse mappings for numeric enums
      if (typeof value === 'number' || !Object.prototype.hasOwnProperty.call(enumObject, value)) {
        values.push(value);
      }
    }

    super({
      typeName: 'ValaiEnum',
      values: values.map(String) as unknown as readonly [string, ...string[]],
    });

    this.enumObject = enumObject;
    this.enumValues = values;
  }

  _parse(ctx: ParseContext): ParseReturnType<T[keyof T]> {
    const value = ctx.data;

    if (!this.enumValues.includes(value as string | number)) {
      return ctx.addIssue({
        code: 'invalid_enum_value',
        options: this.enumValues.map(String),
        received: value,
      });
    }

    return ctx.success(value as T[keyof T]);
  }

  _toJSONSchema(): JSONSchema {
    // If all values are strings, use enum
    if (this.enumValues.every((v) => typeof v === 'string')) {
      return {
        type: 'string',
        enum: this.enumValues,
      };
    }

    // If all values are numbers, use enum with type number
    if (this.enumValues.every((v) => typeof v === 'number')) {
      return {
        type: 'number',
        enum: this.enumValues,
      };
    }

    // Mixed - use oneOf
    return {
      oneOf: this.enumValues.map((v) => ({ const: v })),
    };
  }

  protected _clone(): this {
    return new ValaiNativeEnum(this.enumObject) as this;
  }

  /**
   * Get the enum object.
   */
  get enum(): T {
    return this.enumObject;
  }
}
