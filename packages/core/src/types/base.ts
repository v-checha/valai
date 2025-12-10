import type { ParseContext } from '../parse/context.js';
import type { ParseReturnType } from '../parse/result.js';
import type { JSONSchema } from './json-schema.js';

/**
 * Discriminated union for all first-party type kinds in Valai.
 * Used internally to identify the type of schema at runtime.
 */
export type ValaiFirstPartyTypeKind =
  | 'ValaiString'
  | 'ValaiNumber'
  | 'ValaiBoolean'
  | 'ValaiNull'
  | 'ValaiUndefined'
  | 'ValaiLiteral'
  | 'ValaiEnum'
  | 'ValaiUnion'
  | 'ValaiIntersection'
  | 'ValaiArray'
  | 'ValaiObject'
  | 'ValaiRecord'
  | 'ValaiTuple'
  | 'ValaiDate'
  | 'ValaiAny'
  | 'ValaiUnknown'
  | 'ValaiOptional'
  | 'ValaiNullable'
  | 'ValaiDefault';

/**
 * Base definition interface that all schema definitions extend.
 * Contains metadata common to all schema types.
 */
export interface ValaiTypeDef {
  /** The type discriminator */
  readonly typeName: ValaiFirstPartyTypeKind;
  /** Description for LLM prompts - critical for AI usage */
  readonly description?: string;
  /** Few-shot examples for LLM guidance */
  readonly examples?: readonly unknown[];
  /** Error message overrides */
  readonly errorMap?: ValaiErrorMap;
}

/**
 * Error map for custom error messages.
 */
export type ValaiErrorMap = (issue: ValaiIssueBase) => string | undefined;

/**
 * Base issue interface for error reporting.
 */
export interface ValaiIssueBase {
  /** Error code identifier */
  readonly code: string;
  /** Path to the error location in the data */
  readonly path: readonly (string | number)[];
  /** Human-readable error message */
  readonly message: string;
}

/**
 * String-specific definition.
 */
export interface ValaiStringDef extends ValaiTypeDef {
  readonly typeName: 'ValaiString';
  readonly checks?: readonly StringCheck[];
  readonly coerce?: boolean;
}

/**
 * String validation check types.
 */
export type StringCheck =
  | { readonly kind: 'min'; readonly value: number; readonly message?: string }
  | { readonly kind: 'max'; readonly value: number; readonly message?: string }
  | { readonly kind: 'length'; readonly value: number; readonly message?: string }
  | { readonly kind: 'email'; readonly message?: string }
  | { readonly kind: 'url'; readonly message?: string }
  | { readonly kind: 'uuid'; readonly message?: string }
  | { readonly kind: 'cuid'; readonly message?: string }
  | { readonly kind: 'regex'; readonly regex: RegExp; readonly message?: string }
  | { readonly kind: 'includes'; readonly value: string; readonly message?: string }
  | { readonly kind: 'startsWith'; readonly value: string; readonly message?: string }
  | { readonly kind: 'endsWith'; readonly value: string; readonly message?: string }
  | { readonly kind: 'trim' }
  | { readonly kind: 'toLowerCase' }
  | { readonly kind: 'toUpperCase' };

/**
 * Number-specific definition.
 */
export interface ValaiNumberDef extends ValaiTypeDef {
  readonly typeName: 'ValaiNumber';
  readonly checks?: readonly NumberCheck[];
  readonly coerce?: boolean;
}

/**
 * Number validation check types.
 */
export type NumberCheck =
  | { readonly kind: 'min'; readonly value: number; readonly inclusive: boolean; readonly message?: string }
  | { readonly kind: 'max'; readonly value: number; readonly inclusive: boolean; readonly message?: string }
  | { readonly kind: 'int'; readonly message?: string }
  | { readonly kind: 'positive'; readonly message?: string }
  | { readonly kind: 'negative'; readonly message?: string }
  | { readonly kind: 'nonpositive'; readonly message?: string }
  | { readonly kind: 'nonnegative'; readonly message?: string }
  | { readonly kind: 'multipleOf'; readonly value: number; readonly message?: string }
  | { readonly kind: 'finite'; readonly message?: string };

/**
 * Boolean-specific definition.
 */
export interface ValaiBooleanDef extends ValaiTypeDef {
  readonly typeName: 'ValaiBoolean';
  readonly coerce?: boolean;
}

/**
 * Null-specific definition.
 */
export interface ValaiNullDef extends ValaiTypeDef {
  readonly typeName: 'ValaiNull';
}

/**
 * Undefined-specific definition.
 */
export interface ValaiUndefinedDef extends ValaiTypeDef {
  readonly typeName: 'ValaiUndefined';
}

/**
 * Literal-specific definition.
 */
export interface ValaiLiteralDef<T extends LiteralValue = LiteralValue> extends ValaiTypeDef {
  readonly typeName: 'ValaiLiteral';
  readonly value: T;
}

export type LiteralValue = string | number | boolean | null | undefined;

/**
 * Enum-specific definition.
 */
export interface ValaiEnumDef<T extends readonly [string, ...string[]] = readonly [string, ...string[]]>
  extends ValaiTypeDef {
  readonly typeName: 'ValaiEnum';
  readonly values: T;
}

/**
 * Union-specific definition.
 */
export interface ValaiUnionDef<T extends readonly ValaiTypeAny[] = readonly ValaiTypeAny[]>
  extends ValaiTypeDef {
  readonly typeName: 'ValaiUnion';
  readonly options: T;
}

/**
 * Intersection-specific definition.
 */
export interface ValaiIntersectionDef<
  TLeft extends ValaiTypeAny = ValaiTypeAny,
  TRight extends ValaiTypeAny = ValaiTypeAny,
> extends ValaiTypeDef {
  readonly typeName: 'ValaiIntersection';
  readonly left: TLeft;
  readonly right: TRight;
}

/**
 * Array-specific definition.
 */
export interface ValaiArrayDef<T extends ValaiTypeAny = ValaiTypeAny> extends ValaiTypeDef {
  readonly typeName: 'ValaiArray';
  readonly element: T;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly exactLength?: number;
}

/**
 * Object shape type.
 */
export type ValaiRawShape = { readonly [k: string]: ValaiTypeAny };

/**
 * Object-specific definition.
 */
export interface ValaiObjectDef<TShape extends ValaiRawShape = ValaiRawShape> extends ValaiTypeDef {
  readonly typeName: 'ValaiObject';
  readonly shape: TShape;
  readonly unknownKeys?: 'strict' | 'strip' | 'passthrough';
  readonly catchall?: ValaiTypeAny;
}

/**
 * Record-specific definition.
 */
export interface ValaiRecordDef<
  TKey extends ValaiTypeAny = ValaiTypeAny,
  TValue extends ValaiTypeAny = ValaiTypeAny,
> extends ValaiTypeDef {
  readonly typeName: 'ValaiRecord';
  readonly keyType: TKey;
  readonly valueType: TValue;
}

/**
 * Tuple-specific definition.
 */
export interface ValaiTupleDef<T extends readonly ValaiTypeAny[] = readonly ValaiTypeAny[]>
  extends ValaiTypeDef {
  readonly typeName: 'ValaiTuple';
  readonly items: T;
  readonly rest?: ValaiTypeAny;
}

/**
 * Date-specific definition.
 */
export interface ValaiDateDef extends ValaiTypeDef {
  readonly typeName: 'ValaiDate';
  readonly checks?: readonly DateCheck[];
  readonly coerce?: boolean;
}

/**
 * Date validation check types.
 */
export type DateCheck =
  | { readonly kind: 'min'; readonly value: Date; readonly message?: string }
  | { readonly kind: 'max'; readonly value: Date; readonly message?: string };

/**
 * Any-specific definition.
 */
export interface ValaiAnyDef extends ValaiTypeDef {
  readonly typeName: 'ValaiAny';
}

/**
 * Unknown-specific definition.
 */
export interface ValaiUnknownDef extends ValaiTypeDef {
  readonly typeName: 'ValaiUnknown';
}

/**
 * Optional wrapper definition.
 */
export interface ValaiOptionalDef<T extends ValaiTypeAny = ValaiTypeAny> extends ValaiTypeDef {
  readonly typeName: 'ValaiOptional';
  readonly innerType: T;
}

/**
 * Nullable wrapper definition.
 */
export interface ValaiNullableDef<T extends ValaiTypeAny = ValaiTypeAny> extends ValaiTypeDef {
  readonly typeName: 'ValaiNullable';
  readonly innerType: T;
}

/**
 * Default wrapper definition.
 */
export interface ValaiDefaultDef<T extends ValaiTypeAny = ValaiTypeAny, TDefault = unknown>
  extends ValaiTypeDef {
  readonly typeName: 'ValaiDefault';
  readonly innerType: T;
  readonly defaultValue: TDefault;
}

/**
 * Type alias for any Valai schema type.
 * This is used internally as a constraint for generic type parameters.
 */
export interface ValaiTypeAny {
  readonly _output: unknown;
  readonly _input: unknown;
  readonly _def: ValaiTypeDef;
  /** Core parsing logic */
  _parse(ctx: ParseContext): ParseReturnType<unknown>;
  /** Convert to JSON Schema */
  _toJSONSchema(): JSONSchema;
  /** Make schema optional */
  optional(): ValaiTypeAny;
  /** Make schema nullable */
  nullable(): ValaiTypeAny;
}
