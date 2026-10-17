const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

/**
 * The .env.example template is the first thing anyone setting up staging or a
 * teammate's machine reads. GITHUB_APP_ID and GITHUB_PRIVATE_KEY once went
 * unmentioned there while env.ts validated them and githubApp.service consumed
 * them — the template silently under-described the system, and the only way to
 * discover the variables was to read the source.
 *
 * This pins template completeness to the schema: every variable the backend
 * validates must be documented in .env.example. It reads names only — the test
 * never parses or compares values, and .env (the real file) is never opened.
 */

const BACKEND_ROOT = path.resolve(__dirname, '..');

/** Variable names declared in the envSchema z.object in src/config/env.ts. */
function schemaVariableNames() {
  const source = fs.readFileSync(path.join(BACKEND_ROOT, 'src/config/env.ts'), 'utf8');
  const schemaStart = source.indexOf('const envSchema = z.object({');
  assert.notEqual(schemaStart, -1, 'env.ts no longer declares envSchema as expected');

  // Walk braces from the object literal so nested defaults (e.g. parseInt
  // callbacks) cannot be mistaken for schema keys.
  let depth = 0;
  let objectEnd = -1;
  for (let i = source.indexOf('({', schemaStart); i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) {
        objectEnd = i;
        break;
      }
    }
  }
  assert.notEqual(objectEnd, -1, 'could not locate the end of the envSchema object');

  const objectBody = source.slice(schemaStart, objectEnd);
  return [...objectBody.matchAll(/^\s{2}([A-Z][A-Z0-9_]*):/gm)].map((m) => m[1]);
}

/** Variable names documented as assignments in .env.example. */
function templateVariableNames() {
  const template = fs.readFileSync(path.join(BACKEND_ROOT, '.env.example'), 'utf8');
  return [...template.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]);
}

test('every variable env.ts validates is documented in .env.example', () => {
  const schema = schemaVariableNames();
  const template = new Set(templateVariableNames());

  assert.ok(schema.length >= 10, `expected a substantial schema, parsed ${schema.length}`);

  const undocumented = schema.filter((name) => !template.has(name));
  assert.deepEqual(
    undocumented,
    [],
    `.env.example is missing: ${undocumented.join(', ')} — staging setup cannot discover these from the template`
  );
});

test('the template documents no variables the schema does not know about', () => {
  const schema = new Set(schemaVariableNames());

  const unknown = templateVariableNames().filter((name) => !schema.has(name));
  assert.deepEqual(
    unknown,
    [],
    `.env.example documents variables env.ts never reads: ${unknown.join(', ')} — remove them or add them to the schema`
  );
});
