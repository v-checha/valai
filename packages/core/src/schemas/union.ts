import { ValaiType } from './base.js';
import type { ValaiUnionDef, ValaiIntersectionDef, ValaiTypeAny } from '../types/base.js';
import type { JSONSchema } from '../types/json-schema.js';
import type { UnionOutputType, UnionInputType } from '../types/inference.js';
import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';
import { isValid } from '../parse/result.js';
import type { ValaiIssue } from '../errors/valai-error.js';

/**
 * Union schema type - validates against any of the provided schemas.
 *
 * @example
 * ```typescript
 * const stringOrNumber = v.union([v.string(), v.number()]);
 * type T = v.infer<typeof stringOrNumber>; // string | number
 * ```
 */
export class ValaiUnion<T extends readonly [ValaiTypeAny, ...ValaiTypeAny[]]> extends ValaiType<
  UnionOutputType<T>,
  UnionInputType<T>,
  ValaiUnionDef<T>
> {
  /**
   * The union options.
   */
  readonly options: T;

  constructor(options: T, def?: Partial<Omit<ValaiUnionDef<T>, 'options'>>) {
    super({
      typeName: 'ValaiUnion',
      options,
      ...def,
    });
    this.options = options;
  }

  _parse(ctx: ParseContext): ParseReturnType<UnionOutputType<T>> {
    const unionErrors: ValaiIssue[] = [];

    // Try each option in order
    for (const option of this.options) {
      // Create a new context to isolate issues
      const testCtx = ctx.sibling(ctx.data);
      const result = option._parse(testCtx);

      if (isValid(result) && !testCtx.hasIssues) {
        return ctx.success(result.value as UnionOutputType<T>);
      }

      // Collect errors for this option
      unionErrors.push(...testCtx.issues);
    }

    // None matched - report union error
    return ctx.addIssue({
      code: 'invalid_union',
      unionErrors,
    });
  }

  _toJSONSchema(): JSONSchema {
    return {
      anyOf: this.options.map((opt) => opt._toJSONSchema()),
    };
  }

  protected _clone(def: ValaiUnionDef<T>): this {
    return new ValaiUnion(def.options, def) as this;
  }
}

/**
 * Discriminated union schema type - validates based on a discriminator field.
 * More efficient than regular union for object types with a common discriminator.
 *
 * @example
 * ```typescript
 * const result = v.discriminatedUnion('type', [
 *   v.object({ type: v.literal('success'), data: v.string() }),
 *   v.object({ type: v.literal('error'), message: v.string() })
 * ]);
 * ```
 */
export class ValaiDiscriminatedUnion<
  TDiscriminator extends string,
  T extends readonly [ValaiTypeAny, ...ValaiTypeAny[]],
> extends ValaiType<UnionOutputType<T>, UnionInputType<T>, ValaiUnionDef<T>> {
  readonly discriminator: TDiscriminator;
  readonly options: T;
  private readonly optionsMap: Map<unknown, ValaiTypeAny>;

  constructor(
    discriminator: TDiscriminator,
    options: T,
    def?: Partial<Omit<ValaiUnionDef<T>, 'options'>>
  ) {
    super({
      typeName: 'ValaiUnion',
      options,
      ...def,
    });
    this.discriminator = discriminator;
    this.options = options;

    // Build map from discriminator value to schema
    this.optionsMap = new Map();
    for (const option of options) {
      // Extract discriminator value from schema definition
      const shape = (option as { shape?: Record<string, ValaiTypeAny> }).shape;
      if (shape && shape[discriminator]) {
        const discSchema = shape[discriminator];
        const discValue = (discSchema as { _def?: { value?: unknown } })._def?.value;
        if (discValue !== undefined) {
          this.optionsMap.set(discValue, option);
        }
      }
    }
  }

  _parse(ctx: ParseContext): ParseReturnType<UnionOutputType<T>> {
    if (typeof ctx.data !== 'object' || ctx.data === null) {
      return ctx.addInvalidTypeIssue('object');
    }

    const input = ctx.data as Record<string, unknown>;
    const discriminatorValue = input[this.discriminator];

    // Find matching schema
    const matchingSchema = this.optionsMap.get(discriminatorValue);

    if (!matchingSchema) {
      const validOptions = Array.from(this.optionsMap.keys()).map(String);
      return ctx.addIssue({
        code: 'invalid_union_discriminator',
        options: validOptions,
        received: discriminatorValue,
      });
    }

    // Parse with matching schema
    return matchingSchema._parse(ctx) as ParseReturnType<UnionOutputType<T>>;
  }

  _toJSONSchema(): JSONSchema {
    return {
      oneOf: this.options.map((opt) => opt._toJSONSchema()),
      discriminator: {
        propertyName: this.discriminator,
      },
    } as JSONSchema;
  }

  protected _clone(def: ValaiUnionDef<T>): this {
    return new ValaiDiscriminatedUnion(this.discriminator, def.options, def) as this;
  }
}

/**
 * Intersection schema type - validates against all of the provided schemas.
 *
 * @example
 * ```typescript
 * const named = v.object({ name: v.string() });
 * const aged = v.object({ age: v.number() });
 * const person = v.intersection(named, aged);
 * type T = v.infer<typeof person>; // { name: string } & { age: number }
 * ```
 */
export class ValaiIntersection<
  TLeft extends ValaiTypeAny,
  TRight extends ValaiTypeAny,
> extends ValaiType<
  TLeft['_output'] & TRight['_output'],
  TLeft['_input'] & TRight['_input'],
  ValaiIntersectionDef<TLeft, TRight>
> {
  constructor(
    left: TLeft,
    right: TRight,
    def?: Partial<Omit<ValaiIntersectionDef<TLeft, TRight>, 'left' | 'right'>>
  ) {
    super({
      typeName: 'ValaiIntersection',
      left,
      right,
      ...def,
    });
  }

  _parse(ctx: ParseContext): ParseReturnType<TLeft['_output'] & TRight['_output']> {
    const leftResult = this._def.left._parse(ctx);
    const rightResult = this._def.right._parse(ctx.sibling(ctx.data));

    if (!isValid(leftResult) || !isValid(rightResult)) {
      return { status: 'invalid' };
    }

    // Merge results (assumes both are objects)
    const leftValue = leftResult.value;
    const rightValue = rightResult.value;

    if (
      typeof leftValue === 'object' &&
      leftValue !== null &&
      typeof rightValue === 'object' &&
      rightValue !== null
    ) {
      return ctx.success({ ...leftValue, ...rightValue } as TLeft['_output'] & TRight['_output']);
    }

    // For non-objects, both must be equal
    if (leftValue === rightValue) {
      return ctx.success(leftValue as TLeft['_output'] & TRight['_output']);
    }

    return ctx.addIssue({
      code: 'invalid_intersection_types',
      message: 'Intersection results could not be merged',
    });
  }

  _toJSONSchema(): JSONSchema {
    return {
      allOf: [this._def.left._toJSONSchema(), this._def.right._toJSONSchema()],
    };
  }

  protected _clone(def: ValaiIntersectionDef<TLeft, TRight>): this {
    return new ValaiIntersection(def.left, def.right, def) as this;
  }
}
