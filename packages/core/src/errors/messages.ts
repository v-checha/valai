import type { ValaiIssue, ValaiIssueCode } from './valai-error.js';

/**
 * Get the display name for a JavaScript type.
 */
export function getTypeName(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (value instanceof Set) return 'set';
  if (value instanceof Map) return 'map';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

/**
 * Default error messages for each issue code.
 */
export const defaultErrorMessages: Record<ValaiIssueCode, (issue: ValaiIssue) => string> = {
  invalid_type: (issue) => {
    if (issue.code !== 'invalid_type') return 'Invalid type';
    return `Expected ${issue.expected}, received ${issue.received}`;
  },

  invalid_literal: (issue) => {
    if (issue.code !== 'invalid_literal') return 'Invalid literal value';
    return `Expected ${JSON.stringify(issue.expected)}, received ${JSON.stringify(issue.received)}`;
  },

  invalid_enum_value: (issue) => {
    if (issue.code !== 'invalid_enum_value') return 'Invalid enum value';
    const options = issue.options.map((o) => `'${o}'`).join(' | ');
    return `Expected ${options}, received ${JSON.stringify(issue.received)}`;
  },

  invalid_union: () => {
    return 'Invalid input';
  },

  invalid_union_discriminator: (issue) => {
    if (issue.code !== 'invalid_union_discriminator') return 'Invalid discriminator';
    const options = issue.options.map((o) => `'${o}'`).join(' | ');
    return `Invalid discriminator. Expected ${options}`;
  },

  invalid_arguments: () => {
    return 'Invalid function arguments';
  },

  invalid_return_type: () => {
    return 'Invalid function return type';
  },

  invalid_date: () => {
    return 'Invalid date';
  },

  invalid_string: (issue) => {
    if (issue.code !== 'invalid_string') return 'Invalid string';
    const validationMessages: Record<string, string> = {
      email: 'Invalid email address',
      url: 'Invalid URL',
      uuid: 'Invalid UUID',
      cuid: 'Invalid CUID',
      regex: 'Invalid format',
      includes: 'Invalid input',
      startsWith: 'Invalid input',
      endsWith: 'Invalid input',
    };
    return validationMessages[issue.validation] ?? 'Invalid string';
  },

  invalid_intersection_types: () => {
    return 'Intersection results could not be merged';
  },

  not_multiple_of: (issue) => {
    if (issue.code !== 'not_multiple_of') return 'Number must be a multiple';
    return `Number must be a multiple of ${issue.multipleOf}`;
  },

  not_finite: () => {
    return 'Number must be finite';
  },

  too_small: (issue) => {
    if (issue.code !== 'too_small') return 'Value is too small';

    const { type, minimum, inclusive, exact } = issue;

    if (exact) {
      switch (type) {
        case 'string':
          return `String must be exactly ${minimum} character(s)`;
        case 'array':
          return `Array must contain exactly ${minimum} element(s)`;
        default:
          return `Value must be exactly ${minimum}`;
      }
    }

    switch (type) {
      case 'string':
        return inclusive
          ? `String must be at least ${minimum} character(s)`
          : `String must be more than ${minimum} character(s)`;
      case 'number':
        return inclusive
          ? `Number must be greater than or equal to ${minimum}`
          : `Number must be greater than ${minimum}`;
      case 'array':
        return inclusive
          ? `Array must contain at least ${minimum} element(s)`
          : `Array must contain more than ${minimum} element(s)`;
      case 'date':
        return inclusive
          ? `Date must be greater than or equal to ${minimum}`
          : `Date must be greater than ${minimum}`;
      default:
        return `Value is too small`;
    }
  },

  too_big: (issue) => {
    if (issue.code !== 'too_big') return 'Value is too big';

    const { type, maximum, inclusive, exact } = issue;

    if (exact) {
      switch (type) {
        case 'string':
          return `String must be exactly ${maximum} character(s)`;
        case 'array':
          return `Array must contain exactly ${maximum} element(s)`;
        default:
          return `Value must be exactly ${maximum}`;
      }
    }

    switch (type) {
      case 'string':
        return inclusive
          ? `String must be at most ${maximum} character(s)`
          : `String must be less than ${maximum} character(s)`;
      case 'number':
        return inclusive
          ? `Number must be less than or equal to ${maximum}`
          : `Number must be less than ${maximum}`;
      case 'array':
        return inclusive
          ? `Array must contain at most ${maximum} element(s)`
          : `Array must contain less than ${maximum} element(s)`;
      case 'date':
        return inclusive
          ? `Date must be less than or equal to ${maximum}`
          : `Date must be less than ${maximum}`;
      default:
        return `Value is too big`;
    }
  },

  unrecognized_keys: (issue) => {
    if (issue.code !== 'unrecognized_keys') return 'Unrecognized keys';
    const keys = issue.keys.map((k) => `'${k}'`).join(', ');
    return `Unrecognized key(s): ${keys}`;
  },

  custom: (issue) => {
    return issue.message;
  },
};

/**
 * Get the error message for an issue.
 */
export function getErrorMessage(issue: ValaiIssue): string {
  const handler = defaultErrorMessages[issue.code];
  return handler(issue);
}
