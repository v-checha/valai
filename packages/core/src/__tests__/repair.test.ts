import { describe, it, expect } from 'vitest';
import {
  repairJSON,
  parseAndRepair,
  isValidJSON,
  extractFromMarkdown,
  extractJSONFromText,
  fixSingleQuotes,
  fixUnquotedKeys,
  fixTrailingCommas,
  tryCloseBrackets,
  removeJSONComments,
} from '../repair/index.js';

describe('repairJSON', () => {
  describe('basic repair', () => {
    it('returns valid JSON unchanged', () => {
      const input = '{"name": "test"}';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(false);
      expect(result.data).toEqual({ name: 'test' });
    });

    it('repairs multiple issues', () => {
      const input = `{
        name: 'test',     // unquoted key, single quotes
        value: 123,       // trailing comma
      }`;
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.data).toEqual({ name: 'test', value: 123 });
    });
  });

  describe('markdown extraction', () => {
    it('extracts from JSON code block', () => {
      const input = `
        Here's the data:
        \`\`\`json
        {"name": "test"}
        \`\`\`
      `;
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'test' });
    });

    it('extracts from generic code block', () => {
      const input = `
        \`\`\`
        {"name": "test"}
        \`\`\`
      `;
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'test' });
    });
  });

  describe('text extraction', () => {
    it('extracts JSON from prose', () => {
      const input = 'Here is the result: {"name": "test"} I hope this helps!';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'test' });
    });

    it('extracts arrays from prose', () => {
      const input = 'The list is: [1, 2, 3] as requested.';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });
  });

  describe('quote fixes', () => {
    it('converts single quotes to double quotes', () => {
      const input = "{'name': 'test'}";
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'test' });
    });

    it('handles escaped quotes', () => {
      const input = "{'name': 'test\\'s value'}";
      const result = repairJSON(input);
      expect(result.success).toBe(true);
    });
  });

  describe('key fixes', () => {
    it('quotes unquoted keys', () => {
      const input = '{name: "test", age: 25}';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'test', age: 25 });
    });

    it('handles keys with underscores', () => {
      const input = '{user_name: "test", user_age: 25}';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ user_name: 'test', user_age: 25 });
    });
  });

  describe('comma fixes', () => {
    it('removes trailing commas in objects', () => {
      const input = '{"a": 1, "b": 2,}';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ a: 1, b: 2 });
    });

    it('removes trailing commas in arrays', () => {
      const input = '[1, 2, 3,]';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it('removes nested trailing commas', () => {
      const input = '{"items": [1, 2,], "nested": {"a": 1,},}';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
    });
  });

  describe('bracket fixes', () => {
    it('closes unclosed objects', () => {
      const input = '{"name": "test"';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'test' });
    });

    it('closes unclosed arrays', () => {
      const input = '[1, 2, 3';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it('closes deeply nested structures', () => {
      const input = '{"a": {"b": [1, 2';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
    });
  });

  describe('comment removal', () => {
    it('removes single-line comments', () => {
      const input = `{
        "name": "test" // this is a comment
      }`;
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'test' });
    });

    it('removes multi-line comments', () => {
      const input = `{
        "name": "test" /* comment */
      }`;
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'test' });
    });
  });

  describe('special numbers', () => {
    it('replaces NaN with null', () => {
      const input = '{"value": NaN}';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ value: null });
    });

    it('replaces Infinity with null', () => {
      const input = '{"value": Infinity}';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ value: null });
    });

    it('replaces undefined with null', () => {
      const input = '{"value": undefined}';
      const result = repairJSON(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ value: null });
    });
  });
});

describe('extractFromMarkdown', () => {
  it('extracts JSON code block content', () => {
    const result = extractFromMarkdown('```json\n{"a": 1}\n```');
    expect(result.extracted).toBe(true);
    expect(result.text).toBe('{"a": 1}');
    expect(result.language).toBe('json');
  });

  it('extracts generic code block', () => {
    const result = extractFromMarkdown('```\n{"a": 1}\n```');
    expect(result.extracted).toBe(true);
    expect(result.text).toBe('{"a": 1}');
  });

  it('returns original if no code block', () => {
    const result = extractFromMarkdown('{"a": 1}');
    expect(result.extracted).toBe(false);
    expect(result.text).toBe('{"a": 1}');
  });
});

describe('extractJSONFromText', () => {
  it('extracts object from text', () => {
    const result = extractJSONFromText('prefix {"a": 1} suffix');
    expect(result.extracted).toBe(true);
    expect(result.text).toBe('{"a": 1}');
  });

  it('extracts array from text', () => {
    const result = extractJSONFromText('prefix [1, 2] suffix');
    expect(result.extracted).toBe(true);
    expect(result.text).toBe('[1, 2]');
  });

  it('returns original if already JSON', () => {
    const result = extractJSONFromText('{"a": 1}');
    expect(result.extracted).toBe(false);
  });
});

describe('individual fixers', () => {
  describe('fixSingleQuotes', () => {
    it('converts single to double quotes', () => {
      expect(fixSingleQuotes("{'a': 'b'}")).toBe('{"a": "b"}');
    });

    it('preserves double quotes', () => {
      expect(fixSingleQuotes('{"a": "b"}')).toBe('{"a": "b"}');
    });
  });

  describe('fixUnquotedKeys', () => {
    it('quotes unquoted keys', () => {
      expect(fixUnquotedKeys('{a: 1}')).toBe('{"a": 1}');
    });

    it('handles multiple keys', () => {
      expect(fixUnquotedKeys('{a: 1, b: 2}')).toBe('{"a": 1, "b": 2}');
    });
  });

  describe('fixTrailingCommas', () => {
    it('removes trailing comma in object', () => {
      expect(fixTrailingCommas('{"a": 1,}')).toBe('{"a": 1}');
    });

    it('removes trailing comma in array', () => {
      expect(fixTrailingCommas('[1,]')).toBe('[1]');
    });
  });

  describe('tryCloseBrackets', () => {
    it('closes unclosed brace', () => {
      expect(tryCloseBrackets('{"a": 1')).toBe('{"a": 1}');
    });

    it('closes unclosed bracket', () => {
      expect(tryCloseBrackets('[1, 2')).toBe('[1, 2]');
    });

    it('closes nested structures', () => {
      expect(tryCloseBrackets('{"a": [1')).toBe('{"a": [1]}');
    });
  });

  describe('removeJSONComments', () => {
    it('removes // comments', () => {
      expect(removeJSONComments('{"a": 1} // comment')).toBe('{"a": 1} ');
    });

    it('removes /* */ comments', () => {
      expect(removeJSONComments('{"a": 1 /* comment */}')).toBe('{"a": 1 }');
    });

    it('preserves comments in strings', () => {
      expect(removeJSONComments('{"a": "// not a comment"}')).toBe('{"a": "// not a comment"}');
    });
  });
});

describe('parseAndRepair', () => {
  it('returns parsed data on success', () => {
    const data = parseAndRepair('{"a": 1,}');
    expect(data).toEqual({ a: 1 });
  });

  it('throws on failure', () => {
    expect(() => parseAndRepair('not json at all')).toThrow();
  });
});

describe('isValidJSON', () => {
  it('returns true for valid JSON', () => {
    expect(isValidJSON('{"a": 1}')).toBe(true);
    expect(isValidJSON('[1, 2, 3]')).toBe(true);
    expect(isValidJSON('"string"')).toBe(true);
    expect(isValidJSON('123')).toBe(true);
    expect(isValidJSON('null')).toBe(true);
  });

  it('returns false for invalid JSON', () => {
    expect(isValidJSON('{a: 1}')).toBe(false);
    expect(isValidJSON("{'a': 1}")).toBe(false);
    expect(isValidJSON('{}')).toBe(true); // Empty object is valid
  });
});
