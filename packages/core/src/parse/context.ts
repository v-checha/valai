import type { ValaiIssue, ValaiIssueCode } from '../errors/valai-error.js';
import { ValaiError } from '../errors/valai-error.js';
import { getTypeName, getErrorMessage } from '../errors/messages.js';
import type { ParseResult, ParseReturnType } from './result.js';
import { valid, invalid, isValid } from './result.js';

/**
 * Parse mode for validation.
 */
export type ParseMode = 'strict' | 'llm';

/**
 * Options for LLM parsing mode.
 */
export interface LLMParseOptions {
  /** Enable string to type coercion (default: true) */
  coerce?: boolean;
  /** Enable JSON repair (default: true) */
  repair?: boolean;
  /** Extract JSON from markdown code blocks (default: true) */
  extractFromMarkdown?: boolean;
  /** Use default values for missing fields (default: true) */
  useDefaults?: boolean;
}

/**
 * Options for creating a parse context.
 */
export interface ParseContextOptions {
  /** The data being parsed */
  data: unknown;
  /** Parse mode (strict or llm) */
  mode: ParseMode;
  /** Current path in the data structure */
  path?: readonly (string | number)[];
  /** Parent context for nested parsing */
  parent?: ParseContext;
  /** LLM-specific options */
  llmOptions?: LLMParseOptions;
}

/**
 * Parse context that tracks validation state.
 * Used internally by schema _parse methods.
 */
export class ParseContext {
  /** The data being parsed */
  data: unknown;
  /** Parse mode */
  readonly mode: ParseMode;
  /** Current path in the data structure */
  readonly path: readonly (string | number)[];
  /** Collected validation issues */
  readonly issues: ValaiIssue[] = [];
  /** Parent context for nested parsing */
  readonly parent?: ParseContext;
  /** LLM-specific options */
  readonly llmOptions: LLMParseOptions;

  constructor(options: ParseContextOptions) {
    this.data = options.data;
    this.mode = options.mode;
    this.path = options.path ?? [];
    this.parent = options.parent;
    this.llmOptions = options.llmOptions ?? {
      coerce: true,
      repair: true,
      extractFromMarkdown: true,
      useDefaults: true,
    };
  }

  /**
   * Create a child context for nested parsing.
   */
  child(data: unknown, pathSegment: string | number): ParseContext {
    return new ParseContext({
      data,
      mode: this.mode,
      path: [...this.path, pathSegment],
      parent: this,
      llmOptions: this.llmOptions,
    });
  }

  /**
   * Create a sibling context with different data at the same path.
   */
  sibling(data: unknown): ParseContext {
    return new ParseContext({
      data,
      mode: this.mode,
      path: this.path,
      parent: this.parent,
      llmOptions: this.llmOptions,
    });
  }

  /**
   * Check if we're in LLM parsing mode.
   */
  get isLLMMode(): boolean {
    return this.mode === 'llm';
  }

  /**
   * Check if coercion is enabled.
   */
  get shouldCoerce(): boolean {
    return this.isLLMMode && (this.llmOptions.coerce ?? true);
  }

  /**
   * Check if defaults should be used.
   */
  get shouldUseDefaults(): boolean {
    return this.isLLMMode && (this.llmOptions.useDefaults ?? true);
  }

  /**
   * Add a validation issue.
   */
  addIssue(issue: { code: ValaiIssueCode; message?: string } & Record<string, unknown>): ParseReturnType<never> {
    const fullIssue: ValaiIssue = {
      ...issue,
      path: this.path,
      message: issue.message ?? getErrorMessage({ ...issue, path: this.path, message: '' } as ValaiIssue),
    } as ValaiIssue;

    this.issues.push(fullIssue);
    this.collectIssueInParent(fullIssue);

    return invalid();
  }

  /**
   * Add an invalid type issue.
   */
  addInvalidTypeIssue(expected: string, received?: unknown): ParseReturnType<never> {
    return this.addIssue({
      code: 'invalid_type',
      expected,
      received: getTypeName(received ?? this.data),
    });
  }

  /**
   * Add a custom issue.
   */
  addCustomIssue(message: string, params?: Record<string, unknown>): ParseReturnType<never> {
    return this.addIssue({
      code: 'custom',
      message,
      params,
    });
  }

  /**
   * Collect issue in parent context.
   */
  private collectIssueInParent(issue: ValaiIssue): void {
    if (this.parent) {
      this.parent.issues.push(issue);
      this.parent.collectIssueInParent(issue);
    }
  }

  /**
   * Return a successful parse result.
   */
  success<T>(value: T): ParseReturnType<T> {
    return valid(value);
  }

  /**
   * Finalize parsing and return the result.
   */
  finalize<T>(result: ParseReturnType<T>): ParseResult<T> {
    if (isValid(result) && this.issues.length === 0) {
      return { success: true, data: result.value };
    }

    return {
      success: false,
      error: new ValaiError(this.issues),
      partial: isValid(result) ? result.value : undefined,
    };
  }

  /**
   * Check if there are any issues.
   */
  get hasIssues(): boolean {
    return this.issues.length > 0;
  }

  /**
   * Get the root context.
   */
  get root(): ParseContext {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let ctx: ParseContext = this;
    while (ctx.parent) {
      ctx = ctx.parent;
    }
    return ctx;
  }
}

/**
 * Create a strict parse context.
 */
export function createStrictContext(data: unknown): ParseContext {
  return new ParseContext({ data, mode: 'strict' });
}

/**
 * Create an LLM parse context.
 */
export function createLLMContext(data: unknown, options?: LLMParseOptions): ParseContext {
  return new ParseContext({
    data,
    mode: 'llm',
    llmOptions: {
      coerce: true,
      repair: true,
      extractFromMarkdown: true,
      useDefaults: true,
      ...options,
    },
  });
}
