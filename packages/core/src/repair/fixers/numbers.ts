/**
 * Fix special number values in JSON.
 * JSON doesn't support NaN, Infinity, or -Infinity.
 */

/**
 * Replace special number values with null or strings.
 *
 * @example
 * ```typescript
 * fixSpecialNumbers('{"value": NaN}');
 * // '{"value": null}'
 *
 * fixSpecialNumbers('{"value": Infinity}', { asStrings: true });
 * // '{"value": "Infinity"}'
 * ```
 */
export function fixSpecialNumbers(
  input: string,
  options: { asStrings?: boolean } = {}
): string {
  const { asStrings = false } = options;

  let result = input;

  // Replace NaN
  if (asStrings) {
    result = result.replace(/:\s*NaN\b/g, ': "NaN"');
  } else {
    result = result.replace(/:\s*NaN\b/g, ': null');
  }

  // Replace Infinity
  if (asStrings) {
    result = result.replace(/:\s*Infinity\b/g, ': "Infinity"');
    result = result.replace(/:\s*-Infinity\b/g, ': "-Infinity"');
  } else {
    result = result.replace(/:\s*-?Infinity\b/g, ': null');
  }

  // Replace undefined (not valid in JSON)
  result = result.replace(/:\s*undefined\b/g, ': null');

  return result;
}

/**
 * Fix number formats that JSON doesn't support.
 */
export function fixNumberFormats(input: string): string {
  let result = input;

  // Fix leading decimal point (.5 -> 0.5)
  result = result.replace(/:\s*\.(\d)/g, ': 0.$1');

  // Fix trailing decimal point (5. -> 5.0)
  result = result.replace(/:\s*(\d+)\.\s*(,|\}|\])/g, ': $1.0$2');

  // Fix hex numbers (0x1f -> 31)
  result = result.replace(/:\s*0x([0-9a-fA-F]+)\b/g, (_, hex: string) => {
    return `: ${parseInt(hex, 16)}`;
  });

  // Fix octal numbers (0o17 -> 15)
  result = result.replace(/:\s*0o([0-7]+)\b/g, (_, octal: string) => {
    return `: ${parseInt(octal, 8)}`;
  });

  // Fix binary numbers (0b101 -> 5)
  result = result.replace(/:\s*0b([01]+)\b/g, (_, binary: string) => {
    return `: ${parseInt(binary, 2)}`;
  });

  return result;
}
