/**
 * Schema factory functions for Valai.
 *
 * @example
 * ```typescript
 * import { v } from 'valai';
 *
 * const schema = v.object({
 *   name: v.string().min(1),
 *   age: v.number().int().min(0),
 *   email: v.string().email().optional()
 * });
 *
 * type User = v.infer<typeof schema>;
 * ```
 */

import { ValaiString } from './schemas/string.js';
import { ValaiNumber } from './schemas/number.js';
import { ValaiBoolean } from './schemas/boolean.js';
import { ValaiLiteral, ValaiNull, ValaiUndefined, ValaiAny, ValaiUnknown } from './schemas/literals.js';
import { ValaiObject } from './schemas/object.js';
import { ValaiArray } from './schemas/array.js';
import { ValaiEnum, ValaiNativeEnum } from './schemas/enum.js';
import { ValaiUnion, ValaiDiscriminatedUnion, ValaiIntersection } from './schemas/union.js';
import { ValaiTuple } from './schemas/tuple.js';
import { ValaiRecord, createRecord, type RecordKeyType } from './schemas/record.js';
import type { ValaiRawShape, ValaiTypeAny, LiteralValue } from './types/base.js';
import type { infer as InferType, input as InputType, output as OutputType } from './types/inference.js';

// Re-export types for v.infer, v.input, v.output
export type { InferType as infer, InputType as input, OutputType as output };

/**
 * Create a string schema.
 *
 * @example
 * ```typescript
 * v.string() // Basic string
 * v.string().min(1).max(100) // With constraints
 * v.string().email() // Email validation
 * ```
 */
export function string(): ValaiString {
  return new ValaiString();
}

/**
 * Create a number schema.
 *
 * @example
 * ```typescript
 * v.number() // Basic number
 * v.number().int() // Integer only
 * v.number().min(0).max(100) // With constraints
 * ```
 */
export function number(): ValaiNumber {
  return new ValaiNumber();
}

/**
 * Create a boolean schema.
 *
 * @example
 * ```typescript
 * v.boolean() // Basic boolean
 * ```
 */
export function boolean(): ValaiBoolean {
  return new ValaiBoolean();
}

/**
 * Create a literal schema that matches an exact value.
 *
 * @example
 * ```typescript
 * v.literal('active') // Matches only 'active'
 * v.literal(42) // Matches only 42
 * v.literal(true) // Matches only true
 * ```
 */
export function literal<T extends LiteralValue>(value: T): ValaiLiteral<T> {
  return new ValaiLiteral(value);
}

/**
 * Create a null schema.
 *
 * @example
 * ```typescript
 * v.null() // Matches only null
 * ```
 */
function nullType(): ValaiNull {
  return new ValaiNull();
}

// Export with proper name
export { nullType as null };

/**
 * Create an undefined schema.
 *
 * @example
 * ```typescript
 * v.undefined() // Matches only undefined
 * ```
 */
function undefinedType(): ValaiUndefined {
  return new ValaiUndefined();
}

// Export with proper name
export { undefinedType as undefined };

/**
 * Create an any schema that accepts any value.
 *
 * @example
 * ```typescript
 * v.any() // Accepts anything, types as any
 * ```
 */
export function any(): ValaiAny {
  return new ValaiAny();
}

/**
 * Create an unknown schema that accepts any value but types as unknown.
 *
 * @example
 * ```typescript
 * v.unknown() // Accepts anything, types as unknown
 * ```
 */
export function unknown(): ValaiUnknown {
  return new ValaiUnknown();
}

/**
 * Create an object schema.
 *
 * @example
 * ```typescript
 * v.object({
 *   name: v.string(),
 *   age: v.number().optional()
 * })
 * ```
 */
export function object<T extends ValaiRawShape>(shape: T): ValaiObject<T> {
  return new ValaiObject(shape);
}

/**
 * Create an array schema.
 *
 * @example
 * ```typescript
 * v.array(v.string()) // Array of strings
 * v.array(v.number()).min(1).max(10) // With constraints
 * ```
 */
export function array<T extends ValaiTypeAny>(element: T): ValaiArray<T> {
  return new ValaiArray(element);
}

/**
 * Create an enum schema from string values.
 *
 * @example
 * ```typescript
 * v.enum(['pending', 'active', 'completed'])
 * type Status = v.infer<typeof schema>; // 'pending' | 'active' | 'completed'
 * ```
 */
function enumType<T extends readonly [string, ...string[]]>(values: T): ValaiEnum<T> {
  return new ValaiEnum(values);
}

// Export with proper name
export { enumType as enum };

/**
 * Create a schema from a TypeScript native enum.
 *
 * @example
 * ```typescript
 * enum Status { Pending, Active, Completed }
 * const schema = v.nativeEnum(Status);
 * ```
 */
export function nativeEnum<T extends Record<string, string | number>>(
  enumObject: T
): ValaiNativeEnum<T> {
  return new ValaiNativeEnum(enumObject);
}

/**
 * Create a union schema.
 *
 * @example
 * ```typescript
 * v.union([v.string(), v.number()])
 * type T = v.infer<typeof schema>; // string | number
 * ```
 */
export function union<T extends readonly [ValaiTypeAny, ...ValaiTypeAny[]]>(
  options: T
): ValaiUnion<T> {
  return new ValaiUnion(options);
}

/**
 * Create a discriminated union schema.
 * More efficient than regular union for objects with a common discriminator field.
 *
 * @example
 * ```typescript
 * v.discriminatedUnion('type', [
 *   v.object({ type: v.literal('success'), data: v.string() }),
 *   v.object({ type: v.literal('error'), message: v.string() })
 * ])
 * ```
 */
export function discriminatedUnion<
  TDiscriminator extends string,
  T extends readonly [ValaiTypeAny, ...ValaiTypeAny[]],
>(discriminator: TDiscriminator, options: T): ValaiDiscriminatedUnion<TDiscriminator, T> {
  return new ValaiDiscriminatedUnion(discriminator, options);
}

/**
 * Create an intersection schema.
 *
 * @example
 * ```typescript
 * const named = v.object({ name: v.string() });
 * const aged = v.object({ age: v.number() });
 * const person = v.intersection(named, aged);
 * type T = v.infer<typeof person>; // { name: string } & { age: number }
 * ```
 */
export function intersection<TLeft extends ValaiTypeAny, TRight extends ValaiTypeAny>(
  left: TLeft,
  right: TRight
): ValaiIntersection<TLeft, TRight> {
  return new ValaiIntersection(left, right);
}

/**
 * Create a tuple schema.
 *
 * @example
 * ```typescript
 * v.tuple([v.string(), v.number()])
 * type T = v.infer<typeof schema>; // [string, number]
 * ```
 */
export function tuple<T extends readonly [ValaiTypeAny, ...ValaiTypeAny[]]>(
  items: T
): ValaiTuple<T> {
  return new ValaiTuple(items);
}

/**
 * Create a record schema.
 *
 * @example
 * ```typescript
 * // String keys with number values
 * v.record(v.number())
 *
 * // Custom key type
 * v.record(v.string().uuid(), v.object({ ... }))
 * ```
 */
export function record<TValue extends ValaiTypeAny>(
  valueType: TValue
): ValaiRecord<ValaiString, TValue>;
export function record<TKey extends RecordKeyType, TValue extends ValaiTypeAny>(
  keyType: TKey,
  valueType: TValue
): ValaiRecord<TKey, TValue>;
export function record<TKey extends RecordKeyType, TValue extends ValaiTypeAny>(
  keyOrValue: TKey | TValue,
  maybeValue?: TValue
): ValaiRecord<TKey, TValue> | ValaiRecord<ValaiString, TValue> {
  return createRecord(keyOrValue as TKey, maybeValue as TValue);
}

/**
 * Type inference utilities.
 */
export type {
  InferType as Infer,
  InputType as Input,
  OutputType as Output,
};
