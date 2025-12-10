/**
 * Extract JSON from markdown code blocks.
 */

/**
 * Result of markdown extraction.
 */
export interface MarkdownExtractionResult {
  /** Whether extraction was performed */
  extracted: boolean;
  /** The extracted or original text */
  text: string;
  /** The language hint from the code block if present */
  language?: string;
}

/**
 * Extract JSON from markdown code blocks.
 *
 * @example
 * ```typescript
 * const input = '```json\n{"name": "test"}\n```';
 * const result = extractFromMarkdown(input);
 * // { extracted: true, text: '{"name": "test"}', language: 'json' }
 * ```
 */
export function extractFromMarkdown(input: string): MarkdownExtractionResult {
  const trimmed = input.trim();

  // Try JSON-specific code blocks first
  const jsonBlockMatch = /```(?:json|JSON)\s*\n?([\s\S]*?)```/.exec(trimmed);
  if (jsonBlockMatch?.[1]) {
    return {
      extracted: true,
      text: jsonBlockMatch[1].trim(),
      language: 'json',
    };
  }

  // Try generic code blocks
  const genericBlockMatch = /```\s*\n?([\s\S]*?)```/.exec(trimmed);
  if (genericBlockMatch?.[1]) {
    const content = genericBlockMatch[1].trim();
    // Only extract if it looks like JSON
    if (content.startsWith('{') || content.startsWith('[')) {
      return {
        extracted: true,
        text: content,
      };
    }
  }

  // Try inline code for short JSON
  const inlineObjectMatch = /`(\{[^`]*\})`/.exec(trimmed);
  if (inlineObjectMatch?.[1]) {
    return {
      extracted: true,
      text: inlineObjectMatch[1],
    };
  }

  const inlineArrayMatch = /`(\[[^`]*\])`/.exec(trimmed);
  if (inlineArrayMatch?.[1]) {
    return {
      extracted: true,
      text: inlineArrayMatch[1],
    };
  }

  // No markdown code blocks found
  return {
    extracted: false,
    text: trimmed,
  };
}

/**
 * Extract all JSON code blocks from markdown.
 * Returns an array of all found JSON content.
 */
export function extractAllFromMarkdown(input: string): string[] {
  const results: string[] = [];
  const trimmed = input.trim();

  // Find all JSON code blocks
  const jsonBlockRegex = /```(?:json|JSON)\s*\n?([\s\S]*?)```/g;
  let match;
  while ((match = jsonBlockRegex.exec(trimmed)) !== null) {
    if (match[1]) {
      results.push(match[1].trim());
    }
  }

  // If no JSON blocks, try generic code blocks
  if (results.length === 0) {
    const genericBlockRegex = /```\s*\n?([\s\S]*?)```/g;
    while ((match = genericBlockRegex.exec(trimmed)) !== null) {
      if (match[1]) {
        const content = match[1].trim();
        if (content.startsWith('{') || content.startsWith('[')) {
          results.push(content);
        }
      }
    }
  }

  return results;
}
