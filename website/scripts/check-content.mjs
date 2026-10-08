import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Chess } from 'chess.js';

const dir=resolve(process.cwd(),'src/content/articles');
const categories=['Tactics','Openings','Academy','Chess News','Chess Culture','Product','Match Rules'];
const files=(await readdir(dir)).filter(f=>f.endsWith('.json'));
const posts=await Promise.all(files.map(async f=>({file:f,...JSON.parse(await readFile(resolve(dir,f),'utf8'))})));
const draftFlag=process.argv.indexOf('--draft');
if(draftFlag>=0){
  if(!process.argv[draftFlag+1])throw new Error('Supply an article JSON path after --draft');
  const draft=JSON.parse(await readFile(resolve(process.argv[draftFlag+1]),'utf8'));
  posts.push({...draft,file:`${draft.slug}.json`});
}
const errors=[],slugs=new Set();
for(const p of posts){
  const fail=message=>errors.push(`${p.file}: ${message}`);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)||p.file!==`${p.slug}.json`||slugs.has(p.slug))fail('invalid or duplicate slug');
  slugs.add(p.slug);
  for(const field of ['title','subtitle','excerpt','readingTime','publishedAt','metaDescription'])if(typeof p[field]!=='string'||!p[field].trim())fail(`missing ${field}`);
  if(p.title?.length>100)fail('headline exceeds editorial limit');
  if(!categories.includes(p.category))fail('unsupported category');
  if(!p.author?.name||!p.author?.role||!['Person','Organization'].includes(p.author.kind))fail('provide an accountable author kind and name');
  for(const field of ['publishedAt','updatedAt'])if(p[field]&&(!/^\d{4}-\d{2}-\d{2}$/.test(p[field])||Number.isNaN(Date.parse(p[field]))||new Date(p[field]).toISOString().slice(0,10)!==p[field]))fail(`invalid ${field}`);
  if(p.updatedAt&&p.updatedAt<p.publishedAt)fail('updated date precedes publication');
  if(!p.takeaways?.length||!p.content?.length)fail('missing takeaways or article body');
  if(!p.sources?.length)fail('add sources or product references');
  for(const source of p.sources||[])if(!source.title||!/^https:\/\//.test(source.url))fail('invalid source');
  if(p.cta&&(!p.cta.label||!/^\/(?!\/)[a-z0-9/-]*$/.test(p.cta.href)))fail('invalid internal CTA');
  for(const block of p.content||[]){
    if(!['paragraph','heading','subheading','quote','callout','chess_position','list'].includes(block.type))fail('unknown block');
    if(block.type==='chess_position')try{
      new Chess(block.fen);
      if(block.moves){
        const game=new Chess(block.initialFen);
        for(const move of block.moves)game.move(move);
        if(game.fen()!==block.fen)fail('diagram does not match the supplied move sequence');
      }
    }catch{fail('invalid chess position or move sequence');}
    if(block.type==='list'&&(!Array.isArray(block.items)||!block.items.length))fail('empty list');
    if(!['chess_position','list'].includes(block.type)&&(!block.text||typeof block.text!=='string'))fail('empty text block');
  }
}
for(const p of posts)for(const slug of p.relatedSlugs||[])if(!slugs.has(slug)||slug===p.slug)errors.push(`${p.file}: broken related article ${slug}`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Verified ${posts.length} articles: slugs, metadata, dates, categories, sources, CTA links, chess positions and related links.`);
