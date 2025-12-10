import { bench, describe } from 'vitest';
import {
  repairJSON,
  parseAndRepair,
  extractFromMarkdown,
  extractJSONFromText,
  fixSingleQuotes,
  fixUnquotedKeys,
  fixTrailingCommas,
  tryCloseBrackets,
  removeJSONComments,
  fixSpecialNumbers,
  fixNumberFormats,
  fixMissingCommas,
  balanceBrackets,
} from '../repair/index.js';

/**
 * JSON Repair Benchmarks
 * Tests individual repair functions and the full repair pipeline
 */

// Test data
const cleanJSON = '{"name": "John", "age": 30, "active": true}';
const singleQuotesJSON = "{'name': 'John', 'age': 30, 'active': true}";
const unquotedKeysJSON = '{name: "John", age: 30, active: true}';
const trailingCommasJSON = '{"name": "John", "age": 30, "active": true,}';
const withCommentsJSON = '{"name": "John", "age": 30 /* comment */, "active": true}';
const unclosedJSON = '{"name": "John", "age": 30, "active": true';
const specialNumbersJSON = '{"value": NaN, "infinity": Infinity, "undef": undefined}';

const markdownJSON = `\`\`\`json
{"name": "John", "age": 30}
\`\`\``;

const textWithJSON = 'Here is the data: {"name": "John", "age": 30} and more text.';

const largeJSON = JSON.stringify({
  users: Array.from({ length: 50 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    age: 20 + (i % 50),
    active: i % 2 === 0,
    tags: ['tag1', 'tag2', 'tag3'],
  })),
});

const largeSingleQuotesJSON = largeJSON.replace(/"/g, "'");
const largeTrailingCommasJSON = largeJSON.replace(/\}/g, ',}').replace(/\]/g, ',]');

// ============================================================================
// Full Repair Pipeline
// ============================================================================

describe('Full Repair Pipeline - repairJSON()', () => {
  bench('repairJSON - clean JSON (no repairs needed)', () => {
    repairJSON(cleanJSON);
  });

  bench('repairJSON - single quotes', () => {
    repairJSON(singleQuotesJSON);
  });

  bench('repairJSON - unquoted keys', () => {
    repairJSON(unquotedKeysJSON);
  });

  bench('repairJSON - trailing commas', () => {
    repairJSON(trailingCommasJSON);
  });

  bench('repairJSON - with comments', () => {
    repairJSON(withCommentsJSON);
  });

  bench('repairJSON - unclosed brackets', () => {
    repairJSON(unclosedJSON);
  });

  bench('repairJSON - special numbers', () => {
    repairJSON(specialNumbersJSON);
  });

  bench('repairJSON - markdown extraction', () => {
    repairJSON(markdownJSON);
  });

  bench('repairJSON - text extraction', () => {
    repairJSON(textWithJSON);
  });
});

// ============================================================================
// Parse and Repair
// ============================================================================

describe('parseAndRepair()', () => {
  bench('parseAndRepair - clean JSON', () => {
    parseAndRepair(cleanJSON);
  });

  bench('parseAndRepair - single quotes', () => {
    parseAndRepair(singleQuotesJSON);
  });

  bench('parseAndRepair - multiple issues', () => {
    parseAndRepair("{name: 'John', age: 30,}");
  });
});

// ============================================================================
// Individual Fixers
// ============================================================================

describe('Individual Fixers - Small Input', () => {
  bench('fixSingleQuotes', () => {
    fixSingleQuotes(singleQuotesJSON);
  });

  bench('fixUnquotedKeys', () => {
    fixUnquotedKeys(unquotedKeysJSON);
  });

  bench('fixTrailingCommas', () => {
    fixTrailingCommas(trailingCommasJSON);
  });

  bench('tryCloseBrackets', () => {
    tryCloseBrackets(unclosedJSON);
  });

  bench('removeJSONComments', () => {
    removeJSONComments(withCommentsJSON);
  });

  bench('fixSpecialNumbers', () => {
    fixSpecialNumbers(specialNumbersJSON);
  });

  bench('fixNumberFormats', () => {
    fixNumberFormats('{"hex": 0xff, "bin": 0b101, "leading": .5}');
  });

  bench('fixMissingCommas', () => {
    fixMissingCommas('{"a": 1 "b": 2 "c": 3}');
  });

  bench('balanceBrackets', () => {
    balanceBrackets('{"a": [1, 2}]');
  });
});

// ============================================================================
// Individual Fixers - Large Input
// ============================================================================

describe('Individual Fixers - Large Input (50 objects)', () => {
  bench('fixSingleQuotes - large', () => {
    fixSingleQuotes(largeSingleQuotesJSON);
  });

  bench('fixTrailingCommas - large', () => {
    fixTrailingCommas(largeTrailingCommasJSON);
  });

  bench('tryCloseBrackets - large', () => {
    tryCloseBrackets(largeJSON.slice(0, -2));
  });
});

// ============================================================================
// Extractors
// ============================================================================

describe('Extractors', () => {
  const markdownSimple = '```json\n{"a": 1}\n```';
  const markdownLarge = `\`\`\`json
${largeJSON}
\`\`\``;
  const textSimple = 'prefix {"a": 1} suffix';
  const textLarge = `Here is the data: ${largeJSON} end of data.`;

  bench('extractFromMarkdown - simple', () => {
    extractFromMarkdown(markdownSimple);
  });

  bench('extractFromMarkdown - large', () => {
    extractFromMarkdown(markdownLarge);
  });

  bench('extractJSONFromText - simple', () => {
    extractJSONFromText(textSimple);
  });

  bench('extractJSONFromText - large', () => {
    extractJSONFromText(textLarge);
  });
});

// ============================================================================
// Full Pipeline - Large Input
// ============================================================================

describe('Full Repair Pipeline - Large Input', () => {
  bench('repairJSON - large clean JSON', () => {
    repairJSON(largeJSON);
  });

  bench('repairJSON - large single quotes', () => {
    repairJSON(largeSingleQuotesJSON);
  });

  bench('repairJSON - large trailing commas', () => {
    repairJSON(largeTrailingCommasJSON);
  });

  bench('repairJSON - large markdown', () => {
    repairJSON(`\`\`\`json\n${largeJSON}\n\`\`\``);
  });
});

// ============================================================================
// Selective Repair Options
// ============================================================================

describe('Selective Repair Options', () => {
  const messyJSON = `{
    name: 'John', // comment
    age: 30,
  }`;

  bench('repairJSON - all options enabled (default)', () => {
    repairJSON(messyJSON);
  });

  bench('repairJSON - minimal options', () => {
    repairJSON(messyJSON, {
      markdown: false,
      extractFromText: false,
      removeComments: false,
      handleSpecialNumbers: false,
      fixNumberFormats: false,
      closeBrackets: false,
    });
  });

  bench('repairJSON - only quote fixes', () => {
    repairJSON(messyJSON, {
      markdown: false,
      extractFromText: false,
      removeComments: true,
      singleQuotes: true,
      unquotedKeys: true,
      trailingCommas: true,
      closeBrackets: false,
      handleSpecialNumbers: false,
      fixNumberFormats: false,
    });
  });
});

// ============================================================================
// Real-world LLM Output Scenarios
// ============================================================================

describe('Real-world LLM Output Scenarios', () => {
  const gptStyleOutput = `Based on the analysis, here's the extracted data:

\`\`\`json
{
  "sentiment": "positive",
  "confidence": 0.95,
  "entities": [
    {"type": "person", "name": "John Smith", "salience": 0.8},
    {"type": "organization", "name": "Acme Corp", "salience": 0.6}
  ],
  "keywords": ["innovation", "growth", "partnership"]
}
\`\`\`

Let me know if you need more details!`;

  const claudeStyleOutput = `I've analyzed the text and extracted the following information:

{
  sentiment: 'positive',
  confidence: 0.95,
  entities: [
    {type: 'person', name: 'John Smith'},
    {type: 'organization', name: 'Acme Corp'},
  ],
}`;

  const truncatedOutput = `{"users": [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}`;

  bench('repairJSON - GPT-style markdown output', () => {
    repairJSON(gptStyleOutput);
  });

  bench('repairJSON - Claude-style output (no markdown)', () => {
    repairJSON(claudeStyleOutput);
  });

  bench('repairJSON - truncated output', () => {
    repairJSON(truncatedOutput);
  });
});
