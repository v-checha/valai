/**
 * Remove comments from JSON strings.
 * JSON doesn't support comments, but LLMs often add them.
 */

/**
 * Remove JavaScript-style comments from JSON.
 *
 * @example
 * ```typescript
 * removeJSONComments('{"name": "test" // this is a comment\n}');
 * // '{"name": "test" \n}'
 *
 * removeJSONComments('{"name": "test" /* comment *\/}');
 * // '{"name": "test" }'
 * ```
 */
export function removeJSONComments(input: string): string {
  let result = '';
  let i = 0;
  let inString = false;
  let escapeNext = false;

  while (i < input.length) {
    const char = input[i];
    const nextChar = input[i + 1];

    // Handle escape sequences
    if (escapeNext) {
      result += char;
      escapeNext = false;
      i++;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      result += char;
      i++;
      continue;
    }

    // Handle string boundaries
    if (char === '"') {
      inString = !inString;
      result += char;
      i++;
      continue;
    }

    // Skip comments when not in string
    if (!inString) {
      // Single-line comment
      if (char === '/' && nextChar === '/') {
        // Skip until end of line
        i += 2;
        while (i < input.length && input[i] !== '\n') {
          i++;
        }
        continue;
      }

      // Multi-line comment
      if (char === '/' && nextChar === '*') {
        i += 2;
        while (i < input.length - 1) {
          if (input[i] === '*' && input[i + 1] === '/') {
            i += 2;
            break;
          }
          i++;
        }
        continue;
      }
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Remove hash-style comments (Python-style).
 */
export function removeHashComments(input: string): string {
  let result = '';
  let i = 0;
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

    if (char === '\\' && inString) {
      escapeNext = true;
      result += char;
      i++;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      i++;
      continue;
    }

    if (!inString && char === '#') {
      // Skip until end of line
      while (i < input.length && input[i] !== '\n') {
        i++;
      }
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Remove all types of comments.
 */
export function removeAllComments(input: string): string {
  let result = removeJSONComments(input);
  result = removeHashComments(result);
  return result;
}
