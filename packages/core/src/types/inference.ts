import type { ValaiTypeAny, ValaiRawShape } from './base.js';

/**
 * Phantom type markers for type-level identification.
 * These symbols are never used at runtime but enable TypeScript to track types
 * through method chains.
 */
declare const OUTPUT_TYPE: unique symbol;
declare const INPUT_TYPE: unique symbol;

/**
 * Internal type marker for output types.
 */
export type OutputMarker<T> = { readonly [OUTPUT_TYPE]: T };

/**
 * Internal type marker for input types.
 */
export type InputMarker<T> = { readonly [INPUT_TYPE]: T };

/**
 * Extract the output type from a Valai schema.
 * This is the type after parsing/transformation.
 *
 * @example
 * ```typescript
 * const schema = v.string();
 * type Output = v.infer<typeof schema>; // string
 * ```
 */
export type infer<T extends ValaiTypeAny> = T['_output'];

/**
 * Extract the input type from a Valai schema.
 * This is the type before parsing/transformation.
 *
 * @example
 * ```typescript
 * const schema = v.string().transform(s => s.length);
 * type Input = v.input<typeof schema>; // string
 * type Output = v.output<typeof schema>; // number
 * ```
 */
export type input<T extends ValaiTypeAny> = T['_input'];

/**
 * Alias for infer - extract the output type from a Valai schema.
 */
export type output<T extends ValaiTypeAny> = T['_output'];

/**
 * Utility type to flatten intersection types for better readability.
 * Converts `{ a: 1 } & { b: 2 }` to `{ a: 1, b: 2 }`.
 */
export type Flatten<T> = { [K in keyof T]: T[K] } & {};

/**
 * Utility type to make all properties optional.
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/**
 * Extract keys that are required (not optional) from a shape.
 */
export type RequiredKeys<T extends ValaiRawShape> = {
  [K in keyof T]: undefined extends T[K]['_output'] ? never : K;
}[keyof T];

/**
 * Extract keys that are optional from a shape.
 */
export type OptionalKeys<T extends ValaiRawShape> = {
  [K in keyof T]: undefined extends T[K]['_output'] ? K : never;
}[keyof T];

/**
 * Build the output type for an object schema.
 * Handles optional vs required keys properly.
 */
export type ObjectOutputType<TShape extends ValaiRawShape> = Flatten<
  { [K in RequiredKeys<TShape>]: TShape[K]['_output'] } & {
    [K in OptionalKeys<TShape>]?: TShape[K]['_output'];
  }
>;

/**
 * Build the input type for an object schema.
 */
export type ObjectInputType<TShape extends ValaiRawShape> = Flatten<
  { [K in RequiredKeys<TShape>]: TShape[K]['_input'] } & {
    [K in OptionalKeys<TShape>]?: TShape[K]['_input'];
  }
>;

/**
 * Extract the output type from a tuple schema.
 */
export type TupleOutputType<T extends readonly ValaiTypeAny[]> = {
  [K in keyof T]: T[K]['_output'];
};

/**
 * Extract the input type from a tuple schema.
 */
export type TupleInputType<T extends readonly ValaiTypeAny[]> = {
  [K in keyof T]: T[K]['_input'];
};

/**
 * Extract the output type from a union schema.
 */
export type UnionOutputType<T extends readonly ValaiTypeAny[]> = T[number]['_output'];

/**
 * Extract the input type from a union schema.
 */
export type UnionInputType<T extends readonly ValaiTypeAny[]> = T[number]['_input'];

/**
 * Make specific keys of an object optional.
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific keys of an object required.
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Primitive types in JavaScript.
 */
export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/**
 * Check if a type is any.
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Check if a type is never.
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Check if a type is unknown.
 */
export type IsUnknown<T> = IsAny<T> extends true
  ? false
  : unknown extends T
    ? true
    : false;

/**
 * Merge two types, with the second type taking precedence.
 */
export type Merge<T, U> = Omit<T, keyof U> & U;

/**
 * Make all properties of T writable (remove readonly).
 */
export type Writable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Get the element type of an array.
 */
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;
