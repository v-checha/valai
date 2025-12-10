import type { ValaiTypeDef, ValaiTypeAny } from '../types/base.js';
import type { JSONSchema, JSONSchemaOptions, OpenAISchemaOptions, ClaudeSchemaOptions, GeminiSchemaOptions, OpenAITool, ClaudeTool, GeminiFunctionDeclaration } from '../types/json-schema.js';
import type { ParseResult, ParseReturnType } from '../parse/result.js';
import { ParseContext, createStrictContext, createLLMContext, type LLMParseOptions } from '../parse/context.js';

/**
 * Abstract base class for all Valai schema types.
 *
 * Generic parameters:
 * - TOutput: The type after parsing (what v.infer extracts)
 * - TInput: The type before parsing (what v.input extracts)
 * - TDef: The internal definition object
 */
export abstract class ValaiType<
  TOutput = unknown,
  TInput = unknown,
  TDef extends ValaiTypeDef = ValaiTypeDef,
> implements ValaiTypeAny {
  /**
   * Phantom type for output type inference.
   * @internal
   */
  readonly _output!: TOutput;

  /**
   * Phantom type for input type inference.
   * @internal
   */
  readonly _input!: TInput;

  /**
   * Internal schema definition.
   */
  readonly _def: TDef;

  constructor(def: TDef) {
    this._def = def;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ABSTRACT METHODS - Each schema type must implement these
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Core parsing logic - must be implemented by each type.
   * @internal
   */
  abstract _parse(ctx: ParseContext): ParseReturnType<TOutput>;

  /**
   * Convert to JSON Schema.
   * @internal
   */
  abstract _toJSONSchema(): JSONSchema;

  /**
   * Clone with a new definition.
   * @internal
   */
  protected abstract _clone(def: TDef): this;

  // ═══════════════════════════════════════════════════════════════════════════
  // AI-SPECIFIC METHODS (shared by all types)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a description - CRITICAL for LLM prompts.
   * The description becomes part of the schema and is used in prompts.
   *
   * @example
   * ```typescript
   * v.string().describe('The user\'s full name')
   * ```
   */
  describe(description: string): this {
    return this._clone({ ...this._def, description } as TDef);
  }

  /**
   * Add few-shot examples for LLM guidance.
   * Examples help the LLM understand the expected format.
   *
   * @example
   * ```typescript
   * v.string()
   *   .describe('Product name')
   *   .examples(['iPhone 15 Pro', 'MacBook Air M3'])
   * ```
   */
  examples(examples: readonly TOutput[]): this {
    return this._clone({ ...this._def, examples } as TDef);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PARSING METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Parse data with strict validation.
   * Throws ValaiError on validation failure.
   *
   * @example
   * ```typescript
   * const name = v.string().parse('John'); // 'John'
   * v.string().parse(123); // throws ValaiError
   * ```
   */
  parse(data: unknown): TOutput {
    const result = this.safeParse(data);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  /**
   * Parse data with strict validation, returning a result object.
   * Never throws, returns success/failure result.
   *
   * @example
   * ```typescript
   * const result = v.string().safeParse('John');
   * if (result.success) {
   *   console.log(result.data); // 'John'
   * } else {
   *   console.log(result.error);
   * }
   * ```
   */
  safeParse(data: unknown): ParseResult<TOutput> {
    const ctx = createStrictContext(data);
    const result = this._parse(ctx);
    return ctx.finalize(result);
  }

  /**
   * Alias for safeParse - strict validation without throwing.
   */
  parseStrict(data: unknown): ParseResult<TOutput> {
    return this.safeParse(data);
  }

  /**
   * Parse data with LLM-friendly lenient validation.
   * Automatically coerces types and repairs common JSON errors.
   *
   * @example
   * ```typescript
   * const result = v.number().parseLLM('42');
   * // Coerces string '42' to number 42
   *
   * const result = v.object({ name: v.string() }).parseLLM(`
   *   \`\`\`json
   *   { name: 'John', }
   *   \`\`\`
   * `);
   * // Extracts JSON from markdown, fixes trailing comma
   * ```
   */
  parseLLM(data: unknown, options?: LLMParseOptions): ParseResult<TOutput> {
    // Pre-process data if it's a string that might contain JSON
    let processedData = data;

    if (typeof data === 'string' && (options?.extractFromMarkdown ?? true)) {
      processedData = this._extractAndRepairJSON(data, options);
    }

    const ctx = createLLMContext(processedData, options);
    const result = this._parse(ctx);
    return ctx.finalize(result);
  }

  /**
   * Extract and repair JSON from a string.
   * @internal
   */
  protected _extractAndRepairJSON(input: string, _options?: LLMParseOptions): unknown {
    let text = input.trim();

    // Extract from markdown code blocks
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (markdownMatch?.[1]) {
      text = markdownMatch[1].trim();
    }

    // Try to extract JSON object/array from surrounding text
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch?.[1]) {
      text = jsonMatch[1];
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch {
      // Return original string if not valid JSON
      // The repair module will handle further processing
      return text;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEMA EXPORT METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Convert to JSON Schema (draft 2020-12 by default).
   *
   * @example
   * ```typescript
   * const schema = v.object({
   *   name: v.string().describe('User name'),
   *   age: v.number().min(0)
   * });
   *
   * const jsonSchema = schema.toJSONSchema();
   * // {
   * //   type: 'object',
   * //   properties: {
   * //     name: { type: 'string', description: 'User name' },
   * //     age: { type: 'number', minimum: 0 }
   * //   },
   * //   required: ['name', 'age']
   * // }
   * ```
   */
  toJSONSchema(options?: JSONSchemaOptions): JSONSchema {
    const schema = this._toJSONSchema();

    // Add metadata
    if (this._def.description && (options?.includeDescriptions ?? true)) {
      schema.description = this._def.description;
    }

    if (this._def.examples && (options?.includeExamples ?? true)) {
      schema.examples = [...this._def.examples];
    }

    // Add $schema if requested
    if (options?.includeSchema) {
      schema.$schema = options.draft === 'draft-07'
        ? 'http://json-schema.org/draft-07/schema#'
        : 'https://json-schema.org/draft/2020-12/schema';
    }

    // Add $id if provided
    if (options?.id) {
      schema.$id = options.id;
    }

    return schema;
  }

  /**
   * Convert to OpenAI function calling format.
   *
   * @example
   * ```typescript
   * const schema = v.object({
   *   name: v.string(),
   *   age: v.number()
   * });
   *
   * const tool = schema.toOpenAI({
   *   name: 'get_user',
   *   description: 'Get user information'
   * });
   * ```
   */
  toOpenAI(options: OpenAISchemaOptions): OpenAITool {
    const jsonSchema = this.toJSONSchema();

    return {
      type: 'function',
      function: {
        name: options.name,
        description: options.description ?? this._def.description,
        parameters: {
          type: 'object',
          properties: jsonSchema.properties ?? {},
          required: jsonSchema.required,
          additionalProperties: options.strict ? false : undefined,
        },
        strict: options.strict,
      },
    };
  }

  /**
   * Convert to Anthropic/Claude tool format.
   *
   * @example
   * ```typescript
   * const schema = v.object({
   *   query: v.string().describe('Search query')
   * });
   *
   * const tool = schema.toClaude({
   *   name: 'search',
   *   description: 'Search for information'
   * });
   * ```
   */
  toClaude(options: ClaudeSchemaOptions): ClaudeTool {
    const jsonSchema = this.toJSONSchema();

    return {
      name: options.name,
      description: options.description ?? this._def.description,
      input_schema: {
        type: 'object',
        properties: jsonSchema.properties ?? {},
        required: jsonSchema.required,
      },
    };
  }

  /**
   * Convert to Google Gemini function declaration format.
   *
   * @example
   * ```typescript
   * const schema = v.object({
   *   location: v.string()
   * });
   *
   * const func = schema.toGemini({
   *   name: 'get_weather',
   *   description: 'Get weather for a location'
   * });
   * ```
   */
  toGemini(options: GeminiSchemaOptions): GeminiFunctionDeclaration {
    return {
      name: options.name,
      description: options.description ?? this._def.description,
      parameters: this.toJSONSchema(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSFORMATION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Make this schema optional (can be undefined).
   * Creates a new schema that accepts undefined.
   *
   * @example
   * ```typescript
   * const schema = v.string().optional();
   * type T = v.infer<typeof schema>; // string | undefined
   * ```
   */
  optional(): ValaiOptional<this> {
    return new ValaiOptional({ typeName: 'ValaiOptional', innerType: this });
  }

  /**
   * Make this schema nullable (can be null).
   * Creates a new schema that accepts null.
   *
   * @example
   * ```typescript
   * const schema = v.string().nullable();
   * type T = v.infer<typeof schema>; // string | null
   * ```
   */
  nullable(): ValaiNullable<this> {
    return new ValaiNullable({ typeName: 'ValaiNullable', innerType: this });
  }

  /**
   * Set a default value.
   * If the input is undefined, the default value is used.
   *
   * @example
   * ```typescript
   * const schema = v.string().default('anonymous');
   * schema.parse(undefined); // 'anonymous'
   * ```
   */
  default(defaultValue: TOutput): ValaiDefault<this, TOutput> {
    return new ValaiDefault({
      typeName: 'ValaiDefault',
      innerType: this,
      defaultValue,
    });
  }

  /**
   * Get the description if set.
   */
  get description(): string | undefined {
    return this._def.description;
  }

  /**
   * Check if this is an optional type.
   */
  isOptional(): boolean {
    return this._def.typeName === 'ValaiOptional';
  }

  /**
   * Check if this is a nullable type.
   */
  isNullable(): boolean {
    return this._def.typeName === 'ValaiNullable';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRAPPER TYPES (defined here to avoid circular imports)
// ═══════════════════════════════════════════════════════════════════════════════

import type { ValaiOptionalDef, ValaiNullableDef, ValaiDefaultDef } from '../types/base.js';

/**
 * Optional wrapper - makes a schema accept undefined.
 */
export class ValaiOptional<T extends ValaiTypeAny> extends ValaiType<
  T['_output'] | undefined,
  T['_input'] | undefined,
  ValaiOptionalDef<T>
> {
  get innerType(): T {
    return this._def.innerType;
  }

  _parse(ctx: ParseContext): ParseReturnType<T['_output'] | undefined> {
    if (ctx.data === undefined) {
      return ctx.success(undefined);
    }
    return this._def.innerType._parse(ctx) as ParseReturnType<T['_output'] | undefined>;
  }

  _toJSONSchema(): JSONSchema {
    // In JSON Schema, optional is typically handled at the object level
    // via required array, not in the property schema itself
    return this._def.innerType._toJSONSchema();
  }

  protected _clone(def: ValaiOptionalDef<T>): this {
    return new ValaiOptional(def) as this;
  }

  /**
   * Unwrap the optional to get the inner type.
   */
  unwrap(): T {
    return this._def.innerType;
  }
}

/**
 * Nullable wrapper - makes a schema accept null.
 */
export class ValaiNullable<T extends ValaiTypeAny> extends ValaiType<
  T['_output'] | null,
  T['_input'] | null,
  ValaiNullableDef<T>
> {
  get innerType(): T {
    return this._def.innerType;
  }

  _parse(ctx: ParseContext): ParseReturnType<T['_output'] | null> {
    if (ctx.data === null) {
      return ctx.success(null);
    }
    return this._def.innerType._parse(ctx) as ParseReturnType<T['_output'] | null>;
  }

  _toJSONSchema(): JSONSchema {
    const innerSchema = this._def.innerType._toJSONSchema();
    // Add null to the type
    if (typeof innerSchema.type === 'string') {
      return { ...innerSchema, type: [innerSchema.type, 'null'] };
    }
    if (Array.isArray(innerSchema.type)) {
      return { ...innerSchema, type: [...innerSchema.type, 'null'] };
    }
    // For schemas without explicit type, use anyOf
    return {
      anyOf: [innerSchema, { type: 'null' }],
    };
  }

  protected _clone(def: ValaiNullableDef<T>): this {
    return new ValaiNullable(def) as this;
  }

  /**
   * Unwrap the nullable to get the inner type.
   */
  unwrap(): T {
    return this._def.innerType;
  }
}

/**
 * Default wrapper - provides a default value for undefined input.
 */
export class ValaiDefault<T extends ValaiTypeAny, TDefault extends T['_output']> extends ValaiType<
  T['_output'],
  T['_input'] | undefined,
  ValaiDefaultDef<T, TDefault>
> {
  get innerType(): T {
    return this._def.innerType;
  }

  get defaultValue(): TDefault {
    return this._def.defaultValue;
  }

  _parse(ctx: ParseContext): ParseReturnType<T['_output']> {
    if (ctx.data === undefined) {
      return ctx.success(this._def.defaultValue);
    }
    return this._def.innerType._parse(ctx) as ParseReturnType<T['_output']>;
  }

  _toJSONSchema(): JSONSchema {
    const innerSchema = this._def.innerType._toJSONSchema();
    return {
      ...innerSchema,
      default: this._def.defaultValue,
    };
  }

  protected _clone(def: ValaiDefaultDef<T, TDefault>): this {
    return new ValaiDefault(def) as this;
  }

  /**
   * Remove the default to get the inner type.
   */
  removeDefault(): T {
    return this._def.innerType;
  }
}
