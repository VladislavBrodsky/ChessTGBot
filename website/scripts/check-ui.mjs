import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

// Check the actual generated stylesheet, rather than assuming a class exists.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const dependencies = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));
async function filesIn(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? filesIn(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}
const candidates = new Map();
const classPattern = /^(?:[\w/-]+:)*(?:bg|text|border|divide|ring|outline|fill|stroke|from|via|to|shadow|font|animate)-[a-z][\w-]*(?:\/[^\s]+)?$/;
for (const filename of await filesIn(path.join(root, "src"))) {
  if (!/\.(tsx|ts)$/.test(filename)) continue;
  const source = ts.createSourceFile(filename, await fs.readFile(filename, "utf8"), ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (!specifier.startsWith(".") && !specifier.startsWith("@/") && !specifier.startsWith("node:")) {
        const moduleName = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
        if (!dependencies.has(moduleName)) errors.push(`${path.relative(root, filename)}: undeclared dependency ${moduleName}`);
      }
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
      || [ts.SyntaxKind.TemplateHead, ts.SyntaxKind.TemplateMiddle, ts.SyntaxKind.TemplateTail].includes(node.kind)) {
      for (const candidate of node.text.split(/\s+/)) {
        if (!classPattern.test(candidate)) continue;
        const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        if (!candidates.has(candidate)) candidates.set(candidate, `${path.relative(root, filename)}:${line}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const globalsPath = path.join(root, "src/app/globals.css");
const globals = await fs.readFile(globalsPath, "utf8");
const imports = ['@import "tailwindcss";', '@import "../../../design-system/website/theme.css";', '@import "../styles/marketing-showcase.css";'];
if (!globals.startsWith(imports.join("\n"))) errors.push("globals.css: preserve Tailwind → website theme → showcase import order");
if (!globals.includes('@source "../"')) errors.push("globals.css: source scanning must include all website/src, including data files");
if (!globals.includes("--site-safe-gutter: max(")) errors.push("globals.css: missing symmetric safe-area gutter");

let stylesheet;
if (process.argv.includes("--compiled")) {
  const cssFiles = (await filesIn(path.join(root, ".next/static"))).filter((name) => name.endsWith(".css"));
  if (!cssFiles.length) throw new Error("Build the website before checking its production CSS");
  stylesheet = (await Promise.all(cssFiles.map((name) => fs.readFile(name, "utf8")))).join("\n");
} else {
  stylesheet = (await postcss([tailwind({ base: root })]).process(globals, { from: globalsPath })).css;
}
const css = postcss.parse(stylesheet);
const selectors = new Set();
const keyframes = new Set();
css.walkRules((rule) => selectors.add(rule.selector));
css.walkAtRules(/keyframes$/, (rule) => keyframes.add(rule.params));
const escapedSelector = (candidate) => "." + candidate.replace(/[^\w-]/g, (character) => "\\" + character);
const emitted = (candidate) => {
  const needle = escapedSelector(candidate);
  return [...selectors].some((selector) => {
    let position = selector.indexOf(needle);
    while (position !== -1) {
      const next = selector[position + needle.length];
      if (next === undefined || /[\s,:>+~.#\[)\]]/.test(next)) return true;
      position = selector.indexOf(needle, position + needle.length);
    }
    return false;
  });
};
for (const [candidate, location] of candidates) {
  if (!emitted(candidate)) errors.push(`${location}: ${candidate} has no generated CSS; use a defined website token`);
}
for (const keyframe of ["orbit", "marquee", "rippling"]) {
  if (!keyframes.has(keyframe)) errors.push(`Missing animation keyframes: ${keyframe}`);
}
if (process.argv.includes("--self-test")) {
  for (const invalid of ["bg-emerald-500", "text-fg-default", "text-heading-xs", "bg-surface-inverse", "shadow-md"]) {
    if (emitted(invalid)) errors.push(`Regression fixture unexpectedly resolves: ${invalid}`);
  }
  for (const valid of ["text-fg", "text-fg-win", "bg-inset", "bg-inverse", "text-title"]) {
    if (!emitted(valid)) errors.push(`Regression fixture is missing: ${valid}`);
  }
}
if (errors.length) {
  console.error("Website UI integration check failed:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`UI integration OK: ${candidates.size} generated utility classes, dependencies, import order, safe gutters, and animation keyframes${process.argv.includes("--compiled") ? " in production CSS" : ""}`);
}
