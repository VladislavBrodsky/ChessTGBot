import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { parse } from '@formatjs/icu-messageformat-parser';

export function flattenMessages(messages, prefix = '') {
  return Object.fromEntries(Object.entries(messages).flatMap(([key, value]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [[full, value]] : value && typeof value === 'object' && !Array.isArray(value)
      ? Object.entries(flattenMessages(value, full)) : [[full, value]];
  }));
}
export function messageArguments(message) {
  const names = new Set();
  function walk(nodes) {
    for (const node of nodes) {
      if ([1, 2, 3, 4, 5, 6, 8].includes(node.type)) names.add(node.value);
      if (node.options) Object.values(node.options).forEach(option => walk(option.value));
      if (node.children) walk(node.children);
    }
  }
  walk(parse(message));
  return [...names].sort();
}
export function inspectCatalogs(catalogs) {
  const errors = [], english = flattenMessages(catalogs.en), signatures = new Map();
  for (const [locale, messages] of Object.entries(catalogs)) {
    const flat = flattenMessages(messages);
    for (const key of Object.keys(english)) if (!(key in flat)) errors.push(`${locale}: missing ${key}`);
    for (const [key, value] of Object.entries(flat)) {
      if (!(key in english)) errors.push(`${locale}: unexpected ${key}`);
      if (typeof value !== 'string' || !value.trim()) { errors.push(`${locale}: empty or invalid ${key}`); continue; }
      try { signatures.set(`${locale}:${key}`, messageArguments(value).join(',')); }
      catch (error) { errors.push(`${locale}: invalid ICU message ${key} (${error.message})`); }
    }
  }
  for (const locale of Object.keys(catalogs).filter(locale => locale !== 'en')) for (const key of Object.keys(english)) {
    const expected = signatures.get(`en:${key}`), actual = signatures.get(`${locale}:${key}`);
    if (expected !== undefined && actual !== undefined && expected !== actual) errors.push(`${locale}: ${key} arguments [${actual}] differ from en [${expected}]`);
  }
  return errors;
}
export function inspectSource(content, filename, englishMessages) {
  const english = flattenMessages(englishMessages), source = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const translators = new Map(), errors = [];
  function scopeOf(node) { while (node && !ts.isFunctionLike(node) && !ts.isSourceFile(node)) node = node.parent; return node; }
  const literal = node => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;
  function collect(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const initializer = ts.isAwaitExpression(node.initializer) ? node.initializer.expression : node.initializer;
      if (ts.isCallExpression(initializer) && ['useTranslations', 'getTranslations'].includes(initializer.expression.getText(source))) {
        let namespace = initializer.arguments.length ? literal(initializer.arguments[0]) : '';
        if (initializer.arguments[0] && ts.isObjectLiteralExpression(initializer.arguments[0])) namespace = literal(initializer.arguments[0].properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(source) === 'namespace')?.initializer);
        if (namespace !== null) {
          const scope = scopeOf(node);
          if (!translators.has(scope)) translators.set(scope, new Map());
          translators.get(scope).set(node.name.text, namespace);
        }
      }
    }
    ts.forEachChild(node, collect);
  }
  collect(source);
  function lookup(name, node) {
    for (let scope = scopeOf(node); scope; scope = scopeOf(scope.parent)) if (translators.get(scope)?.has(name)) return translators.get(scope).get(name);
    return null;
  }
  function inspect(node) {
    if (ts.isCallExpression(node) && node.arguments.length) {
      const expression = node.expression, name = ts.isIdentifier(expression) ? expression.text : ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression) ? expression.expression.text : null;
      const namespace = name ? lookup(name, node) : null, key = literal(node.arguments[0]);
      if (namespace !== null && key !== null && !(ts.isPropertyAccessExpression(expression) && expression.name.text === 'has')) {
        const full = namespace ? `${namespace}.${key}` : key;
        if (!(full in english)) errors.push(`${filename}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: missing ${full}`);
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(source);
  return errors;
}
export function auditMessages(frontendDir) {
  const messagesDir = path.join(frontendDir, 'src/messages');
  const catalogs = Object.fromEntries(readdirSync(messagesDir).filter(name => name.endsWith('.json')).map(name => [name.slice(0, -5), JSON.parse(readFileSync(path.join(messagesDir, name), 'utf8'))]));
  const errors = inspectCatalogs(catalogs);
  for (const locale of Object.keys(catalogs)) {
    const source = ts.parseJsonText(`${locale}.json`, readFileSync(path.join(messagesDir, `${locale}.json`), 'utf8'));
    function duplicates(node, prefix = '') {
      if (ts.isObjectLiteralExpression(node)) {
        const seen = new Set();
        for (const property of node.properties) if (ts.isPropertyAssignment(property)) {
          const key = property.name.text, full = prefix ? `${prefix}.${key}` : key;
          if (seen.has(key)) errors.push(`${locale}: duplicate ${full}`);
          seen.add(key); duplicates(property.initializer, full);
        }
      } else ts.forEachChild(node, child => duplicates(child, prefix));
    }
    duplicates(source);
  }
  function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) { if (!['tests', '__tests__', '__mocks__'].includes(entry.name)) scan(filename); }
      else if (/\.tsx?$/.test(entry.name)) errors.push(...inspectSource(readFileSync(filename, 'utf8'), path.relative(frontendDir, filename), catalogs.en));
    }
  }
  scan(path.join(frontendDir, 'src'));
  return { errors, locales: Object.keys(catalogs).length, messages: Object.keys(flattenMessages(catalogs.en)).length };
}
