/**
 * Fix quote-related issues in JSON strings.
 */

/**
 * Convert single quotes to double quotes in JSON.
 * Handles escaped quotes properly.
 *
 * @example
 * ```typescript
 * fixSingleQuotes("{'name': 'test'}");
 * // '{"name": "test"}'
 * ```
 */
export function fixSingleQuotes(input: string): string {
  let result = '';
  let inDoubleString = false;
  let inSingleString = false;
  let i = 0;

  while (i < input.length) {
    const char = input[i];
    const nextChar = input[i + 1];

    // Handle escape sequences
    if (char === '\\') {
      if (inSingleString && nextChar === "'") {
        // Escaped single quote in single-quoted string -> \"
        result += '\\"';
        i += 2;
        continue;
      }
      result += char;
      if (nextChar !== undefined) {
        result += nextChar;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // Handle double quotes
    if (char === '"' && !inSingleString) {
      inDoubleString = !inDoubleString;
      result += char;
      i++;
      continue;
    }

    // Handle single quotes
    if (char === "'" && !inDoubleString) {
      inSingleString = !inSingleString;
      result += '"';
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Ensure all string values are properly quoted.
 * This handles cases where values might be unquoted strings.
 */
export function ensureQuotedValues(input: string): string {
  // This is a simple heuristic - for complex cases, we'd need a parser
  // Match unquoted string values after colons
  return input.replace(
    /:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(,|\}|\])/g,
    (_, value: string, ending: string) => {
      // Skip known literals
      if (['true', 'false', 'null'].includes(value)) {
        return `: ${value}${ending}`;
      }
      return `: "${value}"${ending}`;
    }
  );
}
