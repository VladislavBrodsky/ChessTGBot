// Catch missing translation keys before a Mini App export reaches users.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(frontendDir, 'src');
const messagesDir = path.join(sourceDir, 'messages');
const english = JSON.parse(readFileSync(path.join(messagesDir, 'en.json'), 'utf8'));
const errors = [];

for (const entry of readdirSync(messagesDir).filter(name => name.endsWith('.json') && name !== 'en.json')) {
  const locale = entry.replace('.json', '');
  const messages = JSON.parse(readFileSync(path.join(messagesDir, entry), 'utf8'));
  for (const [namespace, keys] of Object.entries(english)) {
    for (const key of Object.keys(keys)) {
      if (!(key in (messages[namespace] || {}))) errors.push(`${locale}: missing ${namespace}.${key}`);
    }
  }
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'tests' ? [] : sourceFiles(filename);
    return /\.tsx?$/.test(entry.name) ? [filename] : [];
  });
}

for (const filename of sourceFiles(sourceDir)) {
  const source = ts.createSourceFile(filename, readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const translators = new Map();
  function collect(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer &&
        ts.isCallExpression(node.initializer) && node.initializer.expression.getText(source) === 'useTranslations' &&
        ts.isStringLiteral(node.initializer.arguments[0])) {
      translators.set(node.name.text, node.initializer.arguments[0].text);
    }
    ts.forEachChild(node, collect);
  }
  collect(source);
  function inspect(node) {
    if (ts.isCallExpression(node) && node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
      const expression = node.expression;
      const name = ts.isIdentifier(expression) ? expression.text
        : ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression) ? expression.expression.text
        : null;
      if (name && translators.has(name)) {
        const namespace = translators.get(name);
        const key = node.arguments[0].text;
        if (!(key in (english[namespace] || {}))) {
          const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          errors.push(`${path.relative(frontendDir, filename)}:${line}: missing ${namespace}.${key}`);
        }
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(source);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Translation keys match across all locales and static call sites.');
}
