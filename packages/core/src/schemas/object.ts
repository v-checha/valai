import { ValaiType, ValaiOptional } from './base.js';
import type { ValaiObjectDef, ValaiRawShape, ValaiTypeAny } from '../types/base.js';
import type { JSONSchema } from '../types/json-schema.js';
import type { ObjectOutputType, ObjectInputType, Flatten } from '../types/inference.js';
import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';
import { isValid } from '../parse/result.js';

/**
 * Object schema type - validates object shapes.
 *
 * @example
 * ```typescript
 * const userSchema = v.object({
 *   name: v.string(),
 *   age: v.number().optional(),
 *   email: v.string().email()
 * });
 *
 * type User = v.infer<typeof userSchema>;
 * // { name: string; age?: number; email: string }
 * ```
 */
export class ValaiObject<
  TShape extends ValaiRawShape,
  TOutput = ObjectOutputType<TShape>,
  TInput = ObjectInputType<TShape>,
> extends ValaiType<TOutput, TInput, ValaiObjectDef<TShape>> {
  /**
   * The shape definition containing all property schemas.
   */
  readonly shape: TShape;

  constructor(shape: TShape, def?: Partial<Omit<ValaiObjectDef<TShape>, 'shape'>>) {
    super({
      typeName: 'ValaiObject',
      shape,
      unknownKeys: 'strip',
      ...def,
    });
    this.shape = shape;
  }

  _parse(ctx: ParseContext): ParseReturnType<TOutput> {
    // Type check
    if (typeof ctx.data !== 'object' || ctx.data === null || Array.isArray(ctx.data)) {
      return ctx.addInvalidTypeIssue('object');
    }

    const input = ctx.data as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const shapeKeys = Object.keys(this.shape);

    // Validate each property in the shape
    for (const key of shapeKeys) {
      const schema = this.shape[key];
      if (!schema) continue;

      const value = input[key];
      const childCtx = ctx.child(value, key);
      const parseResult = schema._parse(childCtx);

      if (isValid(parseResult)) {
        // Only include if not undefined, or if it's explicitly in the input
        if (parseResult.value !== undefined || key in input) {
          result[key] = parseResult.value;
        }
      }
    }

    // Handle unknown keys based on unknownKeys setting
    const unknownKeys = this._def.unknownKeys ?? 'strip';
    const inputKeys = Object.keys(input);
    const extraKeys = inputKeys.filter((k) => !shapeKeys.includes(k));

    if (extraKeys.length > 0) {
      if (unknownKeys === 'strict') {
        ctx.addIssue({
          code: 'unrecognized_keys',
          keys: extraKeys,
        });
      } else if (unknownKeys === 'passthrough') {
        for (const key of extraKeys) {
          result[key] = input[key];
        }
      }
      // 'strip' is default - just ignore extra keys
    }

    if (ctx.hasIssues) {
      return { status: 'invalid' };
    }

    return ctx.success(result as TOutput);
  }

  _toJSONSchema(): JSONSchema {
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];

    for (const [key, schema] of Object.entries(this.shape)) {
      if (!schema) continue;

      properties[key] = schema._toJSONSchema();

      // Add description and examples if present
      if (schema._def.description) {
        properties[key]!.description = schema._def.description;
      }
      if (schema._def.examples) {
        properties[key]!.examples = [...schema._def.examples];
      }

      // Determine if required (not optional)
      if (!(schema instanceof ValaiOptional) && schema._def.typeName !== 'ValaiOptional') {
        required.push(key);
      }
    }

    const schema: JSONSchema = {
      type: 'object',
      properties,
    };

    if (required.length > 0) {
      schema.required = required;
    }

    if (this._def.unknownKeys === 'strict') {
      schema.additionalProperties = false;
    }

    return schema;
  }

  protected _clone(def: ValaiObjectDef<TShape>): this {
    return new ValaiObject(def.shape, def) as this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OBJECT-SPECIFIC METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Extend the object with additional properties.
   *
   * @example
   * ```typescript
   * const baseUser = v.object({ name: v.string() });
   * const fullUser = baseUser.extend({
   *   email: v.string().email(),
   *   age: v.number()
   * });
   * ```
   */
  extend<TExtend extends ValaiRawShape>(
    shape: TExtend
  ): ValaiObject<Flatten<TShape & TExtend>> {
    const newShape = { ...this.shape, ...shape } as Flatten<TShape & TExtend>;
    return new ValaiObject(newShape, {
      unknownKeys: this._def.unknownKeys,
      description: this._def.description,
      examples: this._def.examples,
    });
  }

  /**
   * Merge with another object schema.
   *
   * @example
   * ```typescript
   * const a = v.object({ name: v.string() });
   * const b = v.object({ age: v.number() });
   * const merged = a.merge(b);
   * // { name: string; age: number }
   * ```
   */
  merge<TMerge extends ValaiObject<ValaiRawShape>>(
    other: TMerge
  ): ValaiObject<Flatten<TShape & TMerge['shape']>> {
    const newShape = { ...this.shape, ...other.shape } as Flatten<TShape & TMerge['shape']>;
    return new ValaiObject(newShape, {
      unknownKeys: this._def.unknownKeys,
      description: this._def.description,
      examples: this._def.examples,
    });
  }

  /**
   * Pick specific keys from the object.
   *
   * @example
   * ```typescript
   * const user = v.object({ name: v.string(), email: v.string(), age: v.number() });
   * const nameOnly = user.pick({ name: true });
   * // { name: string }
   * ```
   */
  pick<TKeys extends keyof TShape>(
    keys: { [K in TKeys]: true }
  ): ValaiObject<Pick<TShape, TKeys>> {
    const newShape = {} as Pick<TShape, TKeys>;
    for (const key of Object.keys(keys) as TKeys[]) {
      if (key in this.shape) {
        newShape[key] = this.shape[key];
      }
    }
    return new ValaiObject(newShape);
  }

  /**
   * Omit specific keys from the object.
   *
   * @example
   * ```typescript
   * const user = v.object({ name: v.string(), email: v.string(), password: v.string() });
   * const publicUser = user.omit({ password: true });
   * // { name: string; email: string }
   * ```
   */
  omit<TKeys extends keyof TShape>(
    keys: { [K in TKeys]: true }
  ): ValaiObject<Omit<TShape, TKeys>> {
    const newShape = { ...this.shape } as Omit<TShape, TKeys>;
    for (const key of Object.keys(keys) as TKeys[]) {
      delete (newShape as Record<string, unknown>)[key as string];
    }
    return new ValaiObject(newShape);
  }

  /**
   * Make all properties optional.
   *
   * @example
   * ```typescript
   * const user = v.object({ name: v.string(), age: v.number() });
   * const partialUser = user.partial();
   * // { name?: string; age?: number }
   * ```
   */
  partial(): ValaiObject<{
    [K in keyof TShape]: ValaiOptional<TShape[K]>;
  }> {
    const newShape = {} as { [K in keyof TShape]: ValaiOptional<TShape[K]> };
    for (const [key, schema] of Object.entries(this.shape)) {
      (newShape as Record<string, ValaiTypeAny>)[key] = (schema as ValaiTypeAny).optional();
    }
    return new ValaiObject(newShape);
  }

  /**
   * Make all properties required (remove optional).
   *
   * @example
   * ```typescript
   * const partialUser = v.object({ name: v.string().optional() });
   * const fullUser = partialUser.required();
   * // { name: string }
   * ```
   */
  required(): ValaiObject<{
    [K in keyof TShape]: TShape[K] extends ValaiOptional<infer T> ? T : TShape[K];
  }> {
    const newShape = {} as {
      [K in keyof TShape]: TShape[K] extends ValaiOptional<infer T> ? T : TShape[K];
    };
    for (const [key, schema] of Object.entries(this.shape)) {
      if (schema instanceof ValaiOptional) {
        (newShape as Record<string, ValaiTypeAny>)[key] = schema.unwrap();
      } else {
        (newShape as Record<string, ValaiTypeAny>)[key] = schema as ValaiTypeAny;
      }
    }
    return new ValaiObject(newShape);
  }

  /**
   * Set unknown keys handling to strict (error on extra keys).
   *
   * @example
   * ```typescript
   * const schema = v.object({ name: v.string() }).strict();
   * schema.parse({ name: 'John', extra: true }); // throws
   * ```
   */
  strict(): ValaiObject<TShape, TOutput, TInput> {
    return new ValaiObject(this.shape, { ...this._def, unknownKeys: 'strict' });
  }

  /**
   * Set unknown keys handling to strip (remove extra keys).
   *
   * @example
   * ```typescript
   * const schema = v.object({ name: v.string() }).strip();
   * schema.parse({ name: 'John', extra: true }); // { name: 'John' }
   * ```
   */
  strip(): ValaiObject<TShape, TOutput, TInput> {
    return new ValaiObject(this.shape, { ...this._def, unknownKeys: 'strip' });
  }

  /**
   * Set unknown keys handling to passthrough (keep extra keys).
   *
   * @example
   * ```typescript
   * const schema = v.object({ name: v.string() }).passthrough();
   * schema.parse({ name: 'John', extra: true }); // { name: 'John', extra: true }
   * ```
   */
  passthrough(): ValaiObject<TShape, TOutput, TInput> {
    return new ValaiObject(this.shape, { ...this._def, unknownKeys: 'passthrough' });
  }

  /**
   * Get the keyof this object schema.
   */
  get keyof(): (keyof TShape)[] {
    return Object.keys(this.shape) as (keyof TShape)[];
  }
}
