/**
 * Fix comma-related issues in JSON.
 */

/**
 * Remove trailing commas from arrays and objects.
 *
 * @example
 * ```typescript
 * fixTrailingCommas('{"a": 1, "b": 2,}');
 * // '{"a": 1, "b": 2}'
 *
 * fixTrailingCommas('[1, 2, 3,]');
 * // '[1, 2, 3]'
 * ```
 */
export function fixTrailingCommas(input: string): string {
  let result = '';
  let i = 0;
  let inString = false;
  let escapeNext = false;

  while (i < input.length) {
    const char = input[i]!;

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

    if (inString) {
      result += char;
      i++;
      continue;
    }

    // Check for trailing comma
    if (char === ',') {
      // Look ahead for closing bracket/brace
      let j = i + 1;
      while (j < input.length && /\s/.test(input[j]!)) {
        j++;
      }

      if (j < input.length && (input[j] === '}' || input[j] === ']')) {
        // Skip the comma
        i++;
        continue;
      }
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Add missing commas between array/object elements.
 *
 * @example
 * ```typescript
 * fixMissingCommas('{"a": 1 "b": 2}');
 * // '{"a": 1, "b": 2}'
 * ```
 */
export function fixMissingCommas(input: string): string {
  let result = '';
  let i = 0;
  let inString = false;
  let escapeNext = false;
  let lastNonWhitespaceChar = '';

  while (i < input.length) {
    const char = input[i]!;

    if (escapeNext) {
      result += char;
      escapeNext = false;
      lastNonWhitespaceChar = char;
      i++;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      result += char;
      lastNonWhitespaceChar = char;
      i++;
      continue;
    }

    if (char === '"') {
      // Check if we need a comma before this string (potential key)
      if (!inString && lastNonWhitespaceChar !== '' &&
          !',:{['.includes(lastNonWhitespaceChar)) {
        result += ',';
      }
      inString = !inString;
      result += char;
      lastNonWhitespaceChar = char;
      i++;
      continue;
    }

    if (inString) {
      result += char;
      lastNonWhitespaceChar = char;
      i++;
      continue;
    }

    // Check for missing comma before { or [
    if ((char === '{' || char === '[') &&
        lastNonWhitespaceChar !== '' &&
        !',:{['.includes(lastNonWhitespaceChar)) {
      result += ',';
    }

    result += char;
    if (!/\s/.test(char)) {
      lastNonWhitespaceChar = char;
    }
    i++;
  }

  return result;
}
