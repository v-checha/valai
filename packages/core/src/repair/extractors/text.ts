/**
 * Extract JSON from surrounding prose text.
 */

/**
 * Result of text extraction.
 */
export interface TextExtractionResult {
  /** Whether extraction was performed */
  extracted: boolean;
  /** The extracted or original text */
  text: string;
  /** The start position of the extracted JSON */
  startIndex?: number;
  /** The end position of the extracted JSON */
  endIndex?: number;
}

/**
 * Extract JSON object or array from surrounding text.
 *
 * @example
 * ```typescript
 * const input = 'Here is the data: {"name": "test"} Hope this helps!';
 * const result = extractJSONFromText(input);
 * // { extracted: true, text: '{"name": "test"}' }
 * ```
 */
export function extractJSONFromText(input: string): TextExtractionResult {
  const trimmed = input.trim();

  // If it already looks like valid JSON, return as-is
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return {
      extracted: false,
      text: trimmed,
    };
  }

  // Try to find JSON object
  const objectResult = findBalancedJSON(trimmed, '{', '}');
  if (objectResult) {
    return {
      extracted: true,
      text: objectResult.json,
      startIndex: objectResult.start,
      endIndex: objectResult.end,
    };
  }

  // Try to find JSON array
  const arrayResult = findBalancedJSON(trimmed, '[', ']');
  if (arrayResult) {
    return {
      extracted: true,
      text: arrayResult.json,
      startIndex: arrayResult.start,
      endIndex: arrayResult.end,
    };
  }

  // No JSON found
  return {
    extracted: false,
    text: trimmed,
  };
}

/**
 * Find balanced JSON structure in text.
 */
function findBalancedJSON(
  text: string,
  openChar: string,
  closeChar: string
): { json: string; start: number; end: number } | null {
  const startIndex = text.indexOf(openChar);
  if (startIndex === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        return {
          json: text.slice(startIndex, i + 1),
          start: startIndex,
          end: i + 1,
        };
      }
    }
  }

  // Unbalanced - return from start to end as partial
  return null;
}

/**
 * Extract multiple JSON objects/arrays from text.
 */
export function extractAllJSONFromText(input: string): string[] {
  const results: string[] = [];
  let remaining = input;
  let offset = 0;

  while (remaining.length > 0) {
    const objectResult = findBalancedJSON(remaining, '{', '}');
    const arrayResult = findBalancedJSON(remaining, '[', ']');

    // Take the one that appears first
    let result: { json: string; start: number; end: number } | null = null;

    if (objectResult && arrayResult) {
      result = objectResult.start < arrayResult.start ? objectResult : arrayResult;
    } else {
      result = objectResult ?? arrayResult;
    }

    if (!result) {
      break;
    }

    results.push(result.json);
    remaining = remaining.slice(result.end);
    offset += result.end;
  }

  return results;
}
