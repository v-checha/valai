/**
 * JSON Schema 2020-12 type definitions.
 * @see https://json-schema.org/draft/2020-12/json-schema-core
 */

/**
 * JSON Schema primitive types.
 */
export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'null'
  | 'array'
  | 'object';

/**
 * JSON Schema 2020-12 definition.
 */
export interface JSONSchema {
  /** Schema dialect identifier */
  $schema?: string;
  /** Schema identifier */
  $id?: string;
  /** Reference to another schema */
  $ref?: string;
  /** Dynamic reference */
  $dynamicRef?: string;
  /** Anchor for referencing */
  $anchor?: string;
  /** Dynamic anchor */
  $dynamicAnchor?: string;
  /** Vocabulary declarations */
  $vocabulary?: Record<string, boolean>;
  /** Schema definitions (replaces definitions in 2020-12) */
  $defs?: Record<string, JSONSchema>;
  /** Comment/documentation */
  $comment?: string;

  /** Type constraint */
  type?: JSONSchemaType | JSONSchemaType[];
  /** Enumeration of allowed values */
  enum?: readonly unknown[];
  /** Constant value */
  const?: unknown;

  // String validation
  /** Minimum string length */
  minLength?: number;
  /** Maximum string length */
  maxLength?: number;
  /** Regex pattern */
  pattern?: string;
  /** Format hint (email, uri, etc.) */
  format?: string;
  /** Content encoding */
  contentEncoding?: string;
  /** Content media type */
  contentMediaType?: string;
  /** Content schema */
  contentSchema?: JSONSchema;

  // Number validation
  /** Minimum value */
  minimum?: number;
  /** Maximum value */
  maximum?: number;
  /** Exclusive minimum */
  exclusiveMinimum?: number;
  /** Exclusive maximum */
  exclusiveMaximum?: number;
  /** Multiple of constraint */
  multipleOf?: number;

  // Array validation
  /** Schema for array items */
  items?: JSONSchema | false;
  /** Schema for tuple items (2020-12) */
  prefixItems?: JSONSchema[];
  /** Schema for additional items */
  unevaluatedItems?: JSONSchema | false;
  /** Minimum array length */
  minItems?: number;
  /** Maximum array length */
  maxItems?: number;
  /** Unique items constraint */
  uniqueItems?: boolean;
  /** Contains constraint */
  contains?: JSONSchema;
  /** Minimum contains */
  minContains?: number;
  /** Maximum contains */
  maxContains?: number;

  // Object validation
  /** Property schemas */
  properties?: Record<string, JSONSchema>;
  /** Pattern properties */
  patternProperties?: Record<string, JSONSchema>;
  /** Additional properties schema */
  additionalProperties?: JSONSchema | boolean;
  /** Unevaluated properties */
  unevaluatedProperties?: JSONSchema | boolean;
  /** Required properties */
  required?: string[];
  /** Property names schema */
  propertyNames?: JSONSchema;
  /** Minimum properties */
  minProperties?: number;
  /** Maximum properties */
  maxProperties?: number;
  /** Dependent required */
  dependentRequired?: Record<string, string[]>;
  /** Dependent schemas */
  dependentSchemas?: Record<string, JSONSchema>;

  // Composition
  /** All of these schemas must validate */
  allOf?: JSONSchema[];
  /** Any of these schemas must validate */
  anyOf?: JSONSchema[];
  /** Exactly one of these schemas must validate */
  oneOf?: JSONSchema[];
  /** Must not validate against this schema */
  not?: JSONSchema;
  /** Conditional: if */
  if?: JSONSchema;
  /** Conditional: then */
  then?: JSONSchema;
  /** Conditional: else */
  else?: JSONSchema;

  // Metadata
  /** Human-readable title */
  title?: string;
  /** Human-readable description */
  description?: string;
  /** Default value */
  default?: unknown;
  /** Deprecation flag */
  deprecated?: boolean;
  /** Read only */
  readOnly?: boolean;
  /** Write only */
  writeOnly?: boolean;
  /** Example values */
  examples?: unknown[];
}

/**
 * Options for JSON Schema generation.
 */
export interface JSONSchemaOptions {
  /** Target JSON Schema draft version */
  draft?: '2020-12' | 'draft-07';
  /** Include $schema declaration */
  includeSchema?: boolean;
  /** Schema $id */
  id?: string;
  /** Include examples in output */
  includeExamples?: boolean;
  /** Include descriptions in output */
  includeDescriptions?: boolean;
  /** Custom definitions to include */
  definitions?: Record<string, JSONSchema>;
}

/**
 * OpenAI function calling parameter schema.
 */
export interface OpenAIFunctionParameters {
  type: 'object';
  properties: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * OpenAI function definition.
 */
export interface OpenAIFunction {
  name: string;
  description?: string;
  parameters: OpenAIFunctionParameters;
  strict?: boolean;
}

/**
 * OpenAI tool definition (for newer API versions).
 */
export interface OpenAITool {
  type: 'function';
  function: OpenAIFunction;
}

/**
 * Options for OpenAI schema generation.
 */
export interface OpenAISchemaOptions {
  /** Function name */
  name: string;
  /** Function description */
  description?: string;
  /** Enable strict mode (no additional properties) */
  strict?: boolean;
}

/**
 * Anthropic/Claude tool input schema.
 */
export interface ClaudeToolInputSchema {
  type: 'object';
  properties: Record<string, JSONSchema>;
  required?: string[];
}

/**
 * Anthropic/Claude tool definition.
 */
export interface ClaudeTool {
  name: string;
  description?: string;
  input_schema: ClaudeToolInputSchema;
}

/**
 * Options for Claude schema generation.
 */
export interface ClaudeSchemaOptions {
  /** Tool name */
  name: string;
  /** Tool description */
  description?: string;
}

/**
 * Google Gemini function declaration.
 */
export interface GeminiFunctionDeclaration {
  name: string;
  description?: string;
  parameters: JSONSchema;
}

/**
 * Options for Gemini schema generation.
 */
export interface GeminiSchemaOptions {
  /** Function name */
  name: string;
  /** Function description */
  description?: string;
}
