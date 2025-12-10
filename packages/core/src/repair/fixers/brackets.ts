/**
 * Fix bracket-related issues in JSON.
 */

/**
 * Try to close unclosed brackets and braces.
 * This is a best-effort repair for incomplete JSON.
 *
 * @example
 * ```typescript
 * tryCloseBrackets('{"name": "test"');
 * // '{"name": "test"}'
 *
 * tryCloseBrackets('[1, 2, 3');
 * // '[1, 2, 3]'
 * ```
 */
export function tryCloseBrackets(input: string): string {
  const stack: string[] = [];
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

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

    if (char === '{') {
      stack.push('}');
    } else if (char === '[') {
      stack.push(']');
    } else if (char === '}' || char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === char) {
        stack.pop();
      }
    }
  }

  // Close any unclosed brackets
  let result = input;

  // If we're in an unclosed string, close it first
  if (inString) {
    result += '"';
  }

  // Add closing brackets/braces in reverse order
  while (stack.length > 0) {
    result += stack.pop();
  }

  return result;
}

/**
 * Balance brackets by removing extra closing brackets.
 */
export function balanceBrackets(input: string): string {
  const stack: { char: string; index: number }[] = [];
  const toRemove = new Set<number>();
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

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

    if (char === '{' || char === '[') {
      stack.push({ char, index: i });
    } else if (char === '}') {
      if (stack.length > 0 && stack[stack.length - 1]?.char === '{') {
        stack.pop();
      } else {
        toRemove.add(i);
      }
    } else if (char === ']') {
      if (stack.length > 0 && stack[stack.length - 1]?.char === '[') {
        stack.pop();
      } else {
        toRemove.add(i);
      }
    }
  }

  // Build result without extra closing brackets
  let result = '';
  for (let i = 0; i < input.length; i++) {
    if (!toRemove.has(i)) {
      result += input[i];
    }
  }

  // Close any unclosed brackets
  while (stack.length > 0) {
    const item = stack.pop();
    if (item?.char === '{') {
      result += '}';
    } else if (item?.char === '[') {
      result += ']';
    }
  }

  return result;
}
