import type { ValaiError } from '../errors/valai-error.js';

/**
 * Discriminated union for parse results.
 * Enables exhaustive type checking with TypeScript.
 */
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

/**
 * Successful parse result.
 */
export interface ParseSuccess<T> {
  /** Discriminator for success */
  readonly success: true;
  /** The parsed and validated data */
  readonly data: T;
}

/**
 * Failed parse result.
 */
export interface ParseFailure {
  /** Discriminator for failure */
  readonly success: false;
  /** The validation error with all issues */
  readonly error: ValaiError;
  /** Partial data extracted before failure (useful for LLM retry) */
  readonly partial?: unknown;
}

/**
 * Safe parse result that never throws.
 * Alias for ParseResult.
 */
export type SafeParseResult<T> = ParseResult<T>;

/**
 * Internal parse return type used by schema _parse methods.
 */
export type ParseReturnType<T> = ParseValid<T> | ParseInvalid;

/**
 * Internal valid parse state.
 */
export interface ParseValid<T> {
  readonly status: 'valid';
  readonly value: T;
}

/**
 * Internal invalid parse state.
 */
export interface ParseInvalid {
  readonly status: 'invalid';
}

/**
 * Create a valid parse return.
 */
export function valid<T>(value: T): ParseValid<T> {
  return { status: 'valid', value };
}

/**
 * Create an invalid parse return.
 */
export function invalid(): ParseInvalid {
  return { status: 'invalid' };
}

/**
 * Check if a parse return is valid.
 */
export function isValid<T>(result: ParseReturnType<T>): result is ParseValid<T> {
  return result.status === 'valid';
}

/**
 * Check if a parse return is invalid.
 */
export function isInvalid<T>(result: ParseReturnType<T>): result is ParseInvalid {
  return result.status === 'invalid';
}
