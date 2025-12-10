/**
 * Issue codes for validation errors.
 */
export type ValaiIssueCode =
  | 'invalid_type'
  | 'invalid_literal'
  | 'invalid_enum_value'
  | 'invalid_union'
  | 'invalid_union_discriminator'
  | 'invalid_arguments'
  | 'invalid_return_type'
  | 'invalid_date'
  | 'invalid_string'
  | 'invalid_intersection_types'
  | 'not_multiple_of'
  | 'not_finite'
  | 'too_small'
  | 'too_big'
  | 'unrecognized_keys'
  | 'custom';

/**
 * Base issue interface.
 */
export interface ValaiIssueBase {
  /** Error code identifier */
  readonly code: ValaiIssueCode;
  /** Path to the error location */
  readonly path: readonly (string | number)[];
  /** Human-readable error message */
  readonly message: string;
  /** Whether this is a fatal error */
  readonly fatal?: boolean;
}

/**
 * Invalid type issue.
 */
export interface InvalidTypeIssue extends ValaiIssueBase {
  readonly code: 'invalid_type';
  readonly expected: string;
  readonly received: string;
}

/**
 * Invalid literal issue.
 */
export interface InvalidLiteralIssue extends ValaiIssueBase {
  readonly code: 'invalid_literal';
  readonly expected: unknown;
  readonly received: unknown;
}

/**
 * Invalid enum value issue.
 */
export interface InvalidEnumValueIssue extends ValaiIssueBase {
  readonly code: 'invalid_enum_value';
  readonly options: readonly string[];
  readonly received: unknown;
}

/**
 * Invalid union issue.
 */
export interface InvalidUnionIssue extends ValaiIssueBase {
  readonly code: 'invalid_union';
  readonly unionErrors: readonly ValaiIssue[];
}

/**
 * Invalid union discriminator issue.
 */
export interface InvalidUnionDiscriminatorIssue extends ValaiIssueBase {
  readonly code: 'invalid_union_discriminator';
  readonly options: readonly string[];
  readonly received: unknown;
}

/**
 * Invalid string issue.
 */
export interface InvalidStringIssue extends ValaiIssueBase {
  readonly code: 'invalid_string';
  readonly validation: 'email' | 'url' | 'uuid' | 'cuid' | 'regex' | 'includes' | 'startsWith' | 'endsWith';
}

/**
 * Invalid date issue.
 */
export interface InvalidDateIssue extends ValaiIssueBase {
  readonly code: 'invalid_date';
}

/**
 * Not multiple of issue.
 */
export interface NotMultipleOfIssue extends ValaiIssueBase {
  readonly code: 'not_multiple_of';
  readonly multipleOf: number;
}

/**
 * Not finite issue.
 */
export interface NotFiniteIssue extends ValaiIssueBase {
  readonly code: 'not_finite';
}

/**
 * Too small issue.
 */
export interface TooSmallIssue extends ValaiIssueBase {
  readonly code: 'too_small';
  readonly type: 'string' | 'number' | 'array' | 'set' | 'date';
  readonly minimum: number | bigint | Date;
  readonly inclusive: boolean;
  readonly exact?: boolean;
}

/**
 * Too big issue.
 */
export interface TooBigIssue extends ValaiIssueBase {
  readonly code: 'too_big';
  readonly type: 'string' | 'number' | 'array' | 'set' | 'date';
  readonly maximum: number | bigint | Date;
  readonly inclusive: boolean;
  readonly exact?: boolean;
}

/**
 * Unrecognized keys issue.
 */
export interface UnrecognizedKeysIssue extends ValaiIssueBase {
  readonly code: 'unrecognized_keys';
  readonly keys: readonly string[];
}

/**
 * Custom issue.
 */
export interface CustomIssue extends ValaiIssueBase {
  readonly code: 'custom';
  readonly params?: Record<string, unknown>;
}

/**
 * Union of all issue types.
 */
export type ValaiIssue =
  | InvalidTypeIssue
  | InvalidLiteralIssue
  | InvalidEnumValueIssue
  | InvalidUnionIssue
  | InvalidUnionDiscriminatorIssue
  | InvalidStringIssue
  | InvalidDateIssue
  | NotMultipleOfIssue
  | NotFiniteIssue
  | TooSmallIssue
  | TooBigIssue
  | UnrecognizedKeysIssue
  | CustomIssue;

/**
 * Flattened error format for forms.
 */
export interface FlattenedError {
  /** Form-level errors (no path) */
  readonly formErrors: readonly string[];
  /** Field-level errors keyed by path */
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;
}

/**
 * Valai validation error class.
 */
export class ValaiError extends Error {
  /** All validation issues */
  readonly issues: readonly ValaiIssue[];

  constructor(issues: readonly ValaiIssue[]) {
    super(formatValaiError(issues));
    this.name = 'ValaiError';
    this.issues = issues;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ValaiError.prototype);
  }

  /**
   * Get flattened error format for forms.
   */
  flatten(): FlattenedError {
    const formErrors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of this.issues) {
      if (issue.path.length === 0) {
        formErrors.push(issue.message);
      } else {
        const key = issue.path.join('.');
        if (!fieldErrors[key]) {
          fieldErrors[key] = [];
        }
        fieldErrors[key].push(issue.message);
      }
    }

    return { formErrors, fieldErrors };
  }

  /**
   * Format errors for LLM retry prompts.
   * Returns a concise, actionable error description.
   */
  formatForLLM(): string {
    const lines: string[] = ['Validation errors:'];

    for (const issue of this.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      lines.push(`- ${path}: ${issue.message}`);
    }

    return lines.join('\n');
  }

  /**
   * Get the first issue.
   */
  get firstIssue(): ValaiIssue | undefined {
    return this.issues[0];
  }

  /**
   * Get issues for a specific path.
   */
  getIssuesAtPath(path: readonly (string | number)[]): readonly ValaiIssue[] {
    const pathStr = path.join('.');
    return this.issues.filter((issue) => issue.path.join('.') === pathStr);
  }

  /**
   * Check if there are errors at a specific path.
   */
  hasErrorsAtPath(path: readonly (string | number)[]): boolean {
    return this.getIssuesAtPath(path).length > 0;
  }

  /**
   * Create a ValaiError from a single issue.
   */
  static fromIssue(issue: ValaiIssue): ValaiError {
    return new ValaiError([issue]);
  }

  /**
   * Create a custom error with a message.
   */
  static custom(message: string, path: readonly (string | number)[] = []): ValaiError {
    return new ValaiError([
      {
        code: 'custom',
        message,
        path,
      },
    ]);
  }
}

/**
 * Format a list of issues into an error message.
 */
function formatValaiError(issues: readonly ValaiIssue[]): string {
  if (issues.length === 0) {
    return 'Unknown validation error';
  }

  if (issues.length === 1 && issues[0]) {
    const issue = issues[0];
    const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';
    return `${issue.message}${path}`;
  }

  const lines = issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `  ${path}${issue.message}`;
  });

  return `${issues.length} validation errors:\n${lines.join('\n')}`;
}
