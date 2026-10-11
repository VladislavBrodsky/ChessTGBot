import { readFile, writeFile, mkdir, readdir, cp } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A static component fixture: actual shared components and actual built CSS.
// It contains no account, wallet, authentication or mocked product state.
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const frontendRequire = createRequire(resolve(root, 'frontend/package.json'));
const ts = frontendRequire('typescript');
const React = frontendRequire('react');
const { renderToStaticMarkup } = frontendRequire('react-dom/server');
const h = React.createElement;
const cache = new Map();
async function loadComponent(path) {
  if (cache.has(path)) return cache.get(path);
  const source = await readFile(path, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const imports = {};
  for (const [, name] of output.matchAll(/require\("([^"\n]+)"\)/g)) {
    if (name === '@/icons') imports[name] = await loadComponent(resolve(root, 'website/src/icons/index.tsx'));
    else if (name === './generated') imports[name] = await loadComponent(resolve(dirname(path), 'generated.ts'));
    else imports[name] = frontendRequire(name);
  }
  new Function('require', 'module', 'exports', output)(name => imports[name], module, module.exports);
  cache.set(path, module.exports);
  return module.exports;
}
const { Badge, BadgeRow } = await loadComponent(resolve(root, 'frontend/src/components/ui/Badge.tsx'));
const { Avatar } = await loadComponent(resolve(root, 'frontend/src/components/ui/Avatar.tsx'));
const site = await loadComponent(resolve(root, 'website/src/components/ui/Badge.tsx'));
const { Icon } = await loadComponent(resolve(root, 'website/src/icons/index.tsx'));
const icon = h('svg', {viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','aria-hidden':true}, h('path',{d:'m5 12 4 4 10-10',strokeWidth:2}));
const longEnglish = 'A completed lesson with a deliberately long translated status label';
const longArabic = 'اكتمل الدرس مع تسمية حالة طويلة لاختبار التفاف النص بشكل صحيح';
const variants = [['primary','Current'],['secondary','Level 24'],['outline','18+'],['emerald','Completed'],['amber','Pending'],['rose','Failed'],['cyan','Progress'],['purple','PRO']];
function gameFixture(theme, rtl = false) {
  return h('section', {className:'fixture-card', 'data-theme':theme, dir:rtl?'rtl':'ltr'},
    h('p',{className:'fixture-label'}, `Game UI / ${theme} / ${rtl?'RTL':'LTR'}`),
    h('div',{className:'fixture-heading'},h('h2',null,rtl?'أكاديمية الشطرنج':'Chess academy'),h(Badge,{variant:'secondary'},rtl?'المستوى ٢٤':'Level 24')),
    h(BadgeRow,null,...variants.map(([variant,label])=>h(Badge,{variant,icon:variant==='emerald'?icon:undefined,key:variant},label))),
    h('div',{className:'fixture-group'},h(Badge,{icon},rtl?longArabic:longEnglish)),
    h('div',{className:'fixture-group fixture-heading'},
      h(Avatar,{name:rtl?'لاعب الشطرنج':'Chess player',size:'xl',isOnline:true,badge:h(Badge,{variant:'purple'},rtl?'عضوية احترافية':'Professional member')}),
      h('div',null,h('h3',null,rtl?'التقدم اليومي':'Daily progress'),h(BadgeRow,null,h(Badge,{size:'counter'},'0'),h(Badge,{size:'counter'},'24'),h(Badge,{size:'counter'},'1200')))),
    h('button',{className:'fixture-action ui-tap-target',type:'button'},rtl?'متابعة الدرس':'Continue lesson'));
}
function siteFixture(surface) {
  return h('section',{className:`fixture-card website-${surface}`},
    h('p',{className:'fixture-label'},`Website / ${surface}`),
    h('div',{className:'fixture-heading'},h('h2',null,'Moves worth reading.'),h(site.Badge,{tone:'neutral',icon:'target'},'Tactics')),
    h(site.BadgeRow,null,h(site.Badge,{tone:'accent',icon:'telegram-logo'},'Practice in Telegram'),h(site.Badge,{tone:'outline'},'18+ wager matches')),
    h('div',{className:'fixture-group'},h(site.Eyebrow,null,'From the journal')),
    h('div',{className:'fixture-group'},h(site.Badge,{icon:'graduation-cap'},longEnglish)),
    h('button',{className:'fixture-action',type:'button'},'Read the lesson'));
}
async function cssBundle(directory, baseURL) {
  const files = [];
  async function collect(dir) { for (const item of await readdir(dir,{withFileTypes:true})) { const path=resolve(dir,item.name);if(item.isDirectory())await collect(path);else if(item.name.endsWith('.css'))files.push(path); } }
  await collect(directory);
  if(!files.length) throw Error(`No built CSS in ${directory}`);
  return (await Promise.all(files.map(async path=>(await readFile(path,'utf8')).replace(/url\((['"]?)\.\.\/media\//g,`url($1${baseURL}/media/`)))).join('\n');
}
const commonCSS = `body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#e5e5e5;color:#000}.fixture-intro{max-width:800px;margin:0 0 24px;font-size:16px;line-height:1.5}.fixture-intro h1{font:700 28px/1.1 system-ui;margin:0 0 12px}.fixture-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:20px}.fixture-card{padding:20px;border:1px solid var(--border-muted,#c6c6c6);border-radius:16px;background:var(--bg-surface,#fff);color:var(--text-primary,#000);min-width:0}.fixture-label{font-size:12px;line-height:18px;margin:0 0 20px;color:var(--text-muted,#444)}.fixture-heading{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;min-width:0}.fixture-heading h2{font:600 22px/1.2 system-ui;margin:0}.fixture-heading h3{font:600 16px/1.3 system-ui;margin:0 0 8px}.fixture-group{margin-block:20px;min-width:0}.fixture-action{display:inline-flex;align-items:center;justify-content:center;max-width:100%;min-height:44px;border:1px solid var(--border-muted,#000);border-radius:8px;padding:10px 16px;font:600 14px/1.4 system-ui;background:var(--action-bg,#000);color:var(--action-ink,#fff)}.website-canvas{background:#e5e5e5}.website-paper{background:#fff}.website-canvas,.website-paper{--text-primary:#000;--text-muted:#444;--border-muted:#c6c6c6} @media(max-width:400px){body{padding:16px}.fixture-card{padding:16px}}`;
const intro = title=>`<header class="fixture-intro"><h1>${title}</h1><p>Component audit fixture using the shared Badge and Avatar components with the built stylesheet. Long labels are test copy. These are isolated layout samples.</p><a href="../../AUDIT.html">Open the audit</a></header>`;
const out = resolve(here,'exports/badge-fixtures');
await mkdir(out,{recursive:true});
const gameCSS = await cssBundle(resolve(root,'frontend/out/_next/static/css'),'./game-assets');
const siteStatic = process.env.W3_WEBSITE_STATIC || '/private/tmp/w3chess-badge-website-preview/website/.next/static';
const websiteCSS = await cssBundle(siteStatic,'./website-assets');
const siteClasses = [...websiteCSS.matchAll(/\.([\w-]+__variable)\s*\{/g)].map(match=>match[1]).join(' ');
await cp(resolve(siteStatic,'media'),resolve(out,'website-assets/media'),{recursive:true});
// Website and Mini App styles are deliberately in separate documents.
await writeFile(resolve(out,'game.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Game badge audit</title><style>${gameCSS}</style><style>${commonCSS}</style></head><body>${intro('Badges. Space to read.')}<main class="fixture-grid">${renderToStaticMarkup(h(React.Fragment,null,...['dark','light','nebula'].flatMap(theme=>[gameFixture(theme),gameFixture(theme,true)])))}</main></body></html>`);
await writeFile(resolve(out,'website.html'),`<!doctype html><html lang="en" class="${siteClasses}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Website badge audit</title><style>${websiteCSS}</style><style>${commonCSS}</style></head><body>${intro('Quiet labels. Clear hierarchy.')}<main class="fixture-grid">${renderToStaticMarkup(h(React.Fragment,null,siteFixture('canvas'),siteFixture('paper')))}</main></body></html>`);
console.log('Rendered actual Badge and Avatar component fixtures for three game themes, RTL/LTR and two website surfaces.');
