/**
 * Fix unquoted keys in JSON objects.
 */

/**
 * Quote unquoted object keys.
 *
 * @example
 * ```typescript
 * fixUnquotedKeys('{name: "test", age: 25}');
 * // '{"name": "test", "age": 25}'
 * ```
 */
export function fixUnquotedKeys(input: string): string {
  // Match unquoted keys at the start of objects or after commas
  // This pattern handles keys that are valid JavaScript identifiers
  return input.replace(
    /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
    (_, prefix: string, key: string) => `${prefix}"${key}":`
  );
}

/**
 * Ensure all keys are properly quoted, including those with special characters.
 * This is a more thorough version that handles edge cases.
 */
export function ensureQuotedKeys(input: string): string {
  let result = '';
  let i = 0;
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  while (i < input.length) {
    const char = input[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      i++;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      result += char;
      i++;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      result += char;
      i++;
      continue;
    }

    if (inString) {
      result += char;
      i++;
      continue;
    }

    if (char === '{') {
      depth++;
      result += char;
      i++;
      continue;
    }

    if (char === '}') {
      depth--;
      result += char;
      i++;
      continue;
    }

    // Look for potential unquoted keys after { or ,
    if ((char === '{' || char === ',') && depth > 0) {
      result += char;
      i++;

      // Skip whitespace
      while (i < input.length && /\s/.test(input[i]!)) {
        result += input[i];
        i++;
      }

      // Check if next is an unquoted key
      if (i < input.length && input[i] !== '"' && input[i] !== '}') {
        // Read the key
        let key = '';
        while (i < input.length && /[a-zA-Z0-9_$]/.test(input[i]!)) {
          key += input[i];
          i++;
        }

        // Skip whitespace before colon
        while (i < input.length && /\s/.test(input[i]!)) {
          i++;
        }

        // If followed by colon, quote the key
        if (i < input.length && input[i] === ':') {
          result += `"${key}"`;
        } else {
          // Not a key, just add as-is
          result += key;
        }
      }
      continue;
    }

    result += char;
    i++;
  }

  // Fallback to regex approach if the above didn't work
  if (result === input) {
    return fixUnquotedKeys(input);
  }

  return result;
}
