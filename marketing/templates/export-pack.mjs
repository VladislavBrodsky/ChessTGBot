import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here=dirname(fileURLToPath(import.meta.url));
const require=createRequire(resolve(process.env.W3_NODE_MODULES || resolve(dirname(process.execPath),'../node_modules'),'package.json'));
const { chromium }=require('playwright');
const JSZip=require('jszip');
const sharp=require('sharp');
const out=resolve(here,'exports');
await mkdir(resolve(out,'png'),{recursive:true});
await mkdir(resolve(out,'svg'),{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:1});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>/^(file|data|blob):/.test(route.request().url())?route.continue():route.abort());
  await page.goto(pathToFileURL(resolve(here,'studio.html')).href);
  await page.waitForFunction(()=>window.W3Renderer && document.getElementById('render-status').textContent==='Ready to export.');
  const jobs=await page.evaluate(async()=>{
    await W3Renderer.ready;
    return W3Campaigns.flatMap(c=>Object.keys(W3Formats).map(format=>({id:c.id,format,reveal:false}))).concat(Object.keys(W3Formats).map(format=>({id:'puzzle',format,reveal:true})),W3Campaigns.map(c=>({id:c.id,format:'story',placement:'reels',reveal:false})),[{id:'puzzle',format:'story',placement:'reels',reveal:true}]);
  });
  const preflight=await page.evaluate(jobs=>jobs.map(job=>({ ...job,warnings:W3Renderer.scene(W3Campaigns.find(c=>c.id===job.id),job.format,job).warnings })).filter(x=>x.warnings.length),jobs);
  if(preflight.length)throw Error(`Layout preflight: ${JSON.stringify(preflight)}`);
  const manifest={version:2,brand:'CHESS / Web3Chess',designSystem:'Concrete Poster 2.6 / open-rook identity',generated:new Date().toISOString(),canvases:await page.evaluate(()=>W3Formats),placements:await page.evaluate(()=>W3Placements),campaigns:await page.evaluate(()=>W3Campaigns),outputs:[]};
  const zip=new JSZip();
  for(const job of jobs){
    const result=await page.evaluate(async job=>{
      const c=W3Campaigns.find(c=>c.id===job.id),scene=W3Renderer.scene(c,job.format,job);
      const canvas=document.createElement('canvas');await W3Renderer.draw(scene,canvas);
      return {warnings:scene.warnings,width:scene.width,height:scene.height,png:canvas.toDataURL('image/png').split(',')[1],svg:W3Renderer.svg(scene)};
    },job);
    if(result.warnings.length)throw Error(`${job.id}/${job.format}: ${result.warnings.join(' ')}`);
    const name=`${job.id}-${job.format}${job.placement==='reels'?'-reels':''}${job.reveal?'-answer':''}`;
    const png=Buffer.from(result.png,'base64');
    if(png.readUInt32BE(16)!==result.width||png.readUInt32BE(20)!==result.height)throw Error('Exported PNG resolution does not match the selected canvas.');
    await writeFile(resolve(out,`png/${name}.png`),png);
    await writeFile(resolve(out,`svg/${name}.svg`),result.svg);
    zip.file(`exports/png/${name}.png`,png);zip.file(`exports/svg/${name}.svg`,result.svg);
    manifest.outputs.push({...job,width:result.width,height:result.height,png:`png/${name}.png`,svg:`svg/${name}.svg`});
  }
  const previews=await page.evaluate(async()=>{
    const all=document.createElement('canvas');all.width=1536;all.height=190+Math.ceil(W3Campaigns.length/3)*690;
    const ctx=all.getContext('2d');ctx.fillStyle=W3Assets.colors.canvas;ctx.fillRect(0,0,all.width,all.height);
    ctx.fillStyle='#000';ctx.font='700 80px "W3 Display"';ctx.fillText('ONE BRAND. EVERY MOVE.',48,100);
    ctx.font='400 21px "W3 Body"';ctx.fillText('CHESS / CAMPAIGN COLLECTION 01 / SEVEN FAMILIES · FOUR FORMATS',48,141);
    for(let i=0;i<W3Campaigns.length;i++){
      const c=W3Campaigns[i],canvas=document.createElement('canvas');await W3Renderer.draw(W3Renderer.scene(c,'portrait'),canvas);
      const x=48+(i%3)*496,y=190+Math.floor(i/3)*690;
      ctx.drawImage(canvas,x,y,448,560);ctx.font='650 19px "W3 Body"';ctx.fillStyle='#000';ctx.fillText(`${c.number} / ${c.name}`,x,y+595);ctx.font='400 17px "W3 Body"';ctx.fillStyle='#444';ctx.fillText(c.purpose,x,y+625);
    }
    const formats=document.createElement('canvas');formats.width=1250;formats.height=1260;const fx=formats.getContext('2d');fx.fillStyle=W3Assets.colors.canvas;fx.fillRect(0,0,1250,1260);fx.fillStyle='#000';fx.font='700 76px "W3 Display"';fx.fillText('COMPOSED FOR THE CANVAS.',48,98);fx.font='400 22px "W3 Body"';fx.fillText('Four layouts. One message. No automatic crops.',48,142);
    let x=48;for(const [key,w,h] of [['square',370,370],['portrait',330,412.5],['story',330,586.667],['wide',626,352.125]]){
      const canvas=document.createElement('canvas');await W3Renderer.draw(W3Renderer.scene(W3Campaigns[0],key),canvas);const y=220;
      // Stack the wide layout below the feed examples to preserve legibility.
      const xx=key==='wide'?48:x,yy=key==='wide'?790:y;fx.drawImage(canvas,xx,yy,w,h);fx.font='650 20px "W3 Body"';fx.fillStyle='#000';fx.fillText(`${W3Formats[key].label} / ${W3Formats[key].width} × ${W3Formats[key].height}`,xx,yy+h+35);
      if(key!=='wide')x+=w+42;
    }
    return {collection:all.toDataURL('image/png').split(',')[1],formats:formats.toDataURL('image/png').split(',')[1]};
  });
  await writeFile(resolve(here,'collection-preview.png'),Buffer.from(previews.collection,'base64'));
  await writeFile(resolve(here,'format-preview.png'),Buffer.from(previews.formats,'base64'));
  // Proof sheets let reviewers inspect every native format at a useful scale.
  for(const format of ['square','story','wide']){
    const png=await page.evaluate(async format=>{
      const cols=format==='wide'?2:3,tw=format==='wide'?700:format==='story'?350:440;
      const th=tw*W3Formats[format].height/W3Formats[format].width,rows=Math.ceil(W3Campaigns.length/cols);
      const canvas=document.createElement('canvas');canvas.width=cols*(tw+36)+36;canvas.height=Math.ceil(rows*(th+70)+130);const ctx=canvas.getContext('2d');ctx.fillStyle=W3Assets.colors.canvas;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000';ctx.font='700 54px "W3 Display"';ctx.fillText(`CHESS / ${W3Formats[format].label} COLLECTION`,36,72);
      for(let i=0;i<W3Campaigns.length;i++){const c=W3Campaigns[i],item=document.createElement('canvas');await W3Renderer.draw(W3Renderer.scene(c,format),item);const x=36+(i%cols)*(tw+36),y=120+Math.floor(i/cols)*(th+70);ctx.drawImage(item,x,y,tw,th);ctx.fillStyle='#000';ctx.font='400 17px "W3 Body"';ctx.fillText(`${c.number} / ${c.name}`,x,y+th+30);}
      return canvas.toDataURL('image/png').split(',')[1];
    },format);
    const bytes=Buffer.from(png,'base64');await writeFile(resolve(out,`${format}-overview.png`),bytes);zip.file(`exports/${format}-overview.png`,bytes);
  }
  const svgPage=await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
  await svgPage.route('**/*',route=>/^(file|data|blob):/.test(route.request().url())?route.continue():route.abort());
  await svgPage.goto(pathToFileURL(resolve(out,'svg/opening-portrait.svg')).href);
  await svgPage.evaluate(()=>document.fonts.ready);
  const svgCheck=await svgPage.evaluate(()=>({fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),xmlErrors:document.querySelectorAll('parsererror').length}));
  if(svgCheck.xmlErrors||svgCheck.fonts.length!==2||svgCheck.fonts.some(f=>f.status!=='loaded'))throw Error('SVG fonts or document failed verification.');
  await svgPage.screenshot({path:resolve(out,'svg-render-check.png')});
  const nativePixels=await sharp(resolve(out,'png/opening-portrait.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const svgPixels=await sharp(resolve(out,'svg-render-check.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(nativePixels.info.width!==svgPixels.info.width||nativePixels.info.height!==svgPixels.info.height)throw Error('SVG canvas dimensions differ.');
  let total=0,changed=0;
  for(let i=0;i<nativePixels.data.length;i+=4){let delta=0;for(let c=0;c<3;c++)delta+=Math.abs(nativePixels.data[i+c]-svgPixels.data[i+c]);total+=delta;if(delta>60)changed++;}
  svgCheck.meanChannelDifference=total/(nativePixels.info.width*nativePixels.info.height*3);
  svgCheck.changedPixelFraction=changed/(nativePixels.info.width*nativePixels.info.height);
  if(svgCheck.meanChannelDifference>2||svgCheck.changedPixelFraction>.02)throw Error(`Canvas / SVG appearance differs: ${JSON.stringify(svgCheck)}`);
  await svgPage.close();
  const qa={version:2,layouts:jobs.length,layoutWarnings:0,consoleErrors:errors,svgCheck};
  // Browser-control QA is recorded separately from the native image renderer.
  try{qa.studio=JSON.parse(await readFile(resolve(out,'ui-qa-report.json'),'utf8'));}catch{}
  try{qa.badges=JSON.parse(await readFile(resolve(out,'badge-qa-report.json'),'utf8')).summary;}catch{}
  qa.matrix=await page.evaluate(jobs=>{
    return jobs.flatMap(job=>['canvas','paper','ink'].flatMap(theme=>[false,true].map(alternate=>{
      const c=W3Campaigns.find(c=>c.id===job.id);
      const scene=W3Renderer.scene(c,job.format,{...job,theme,...(alternate&&!job.reveal?{headline:c.alternate}:{})});
      return {...job,theme,alternate,warnings:scene.warnings,smallestBody:Math.min(...scene.shapes.filter(s=>s.type==='text'&&['body','note','cta'].includes(s.role)).map(s=>s.size))};
    })));
  },jobs);
  const failures=qa.matrix.filter(x=>x.warnings.length);
  if(failures.length)throw Error(`Layout matrix: ${JSON.stringify(failures)}`);
  qa.regressions=await page.evaluate(()=>{
    const c=W3Campaigns[0],base=W3Renderer.scene(c,'story');
    const longBadge=W3Renderer.scene(c,'story',{tag:'A deliberately overlong campaign label that cannot share the brand row'});
    const moved=role=>{const s=structuredClone(base);const item=s.shapes.find(i=>i.role===role);item.x=0;return W3Renderer.validate(s).some(w=>w.includes('safe area'));};
    const collision=structuredClone(base);collision.blocks.find(b=>b.role==='body').y=collision.blocks.find(b=>b.role==='headline').y;
    const overflow=field=>W3Renderer.scene(c,'story',{[field]:('LONG COPY THAT CANNOT FIT. ').repeat(20)}).warnings.length>0;
    return {longBadgeMovesBelowLogo:longBadge.blocks.find(b=>b.role==='tag').y>=longBadge.blocks.find(b=>b.role==='brand').y+longBadge.blocks.find(b=>b.role==='brand').h+48,badgeTypeNeverShrinks:longBadge.shapes.find(s=>s.role==='tag').size===30,unsafeProofBlocked:moved('proof-title'),unsafeArtworkBlocked:moved('artwork'),unsafeLogoBlocked:moved('brand-lockup'),unsafeIconBlocked:moved('icon'),unsafeTermsBlocked:moved('note'),headlineBodyCollisionBlocked:W3Renderer.validate(collision).some(w=>w.includes('separation')),overlongHookBlocked:overflow('headline'),overlongBodyBlocked:overflow('body'),overlongActionBlocked:overflow('cta'),overlongTermsBlocked:overflow('note'),emptyHookBlocked:W3Renderer.scene(c,'story',{headline:''}).warnings.length>0,legacyYellowMigratesToPaper:W3Renderer.scene(c,'story',{theme:'voltage'}).shapes[0].fill===W3Assets.colors.paper};
  });
  if(Object.values(qa.regressions).some(v=>!v)||errors.length)throw Error(`Regression checks: ${JSON.stringify(qa.regressions)} / ${errors}`);
  // Placement proof: shaded excluded UI bands are review guides, never upload art.
  for(const guided of [false,true]){
    const data=await page.evaluate(async guided=>{
      const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1220;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#e5e5e5';ctx.fillRect(0,0,1240,1220);ctx.fillStyle='#000';ctx.font='700 64px "W3 Display"';ctx.fillText(guided?'THE MESSAGE STAYS PROTECTED.':'STORY AND REELS. RECOMPOSED.',48,88);ctx.font='400 22px "W3 Body"';ctx.fillText(guided?'Shaded areas reserve room for platform controls. Dashed lines are house guides.':'Same message. Different UI clearance. No stretched or cropped master.',48,132);
      for(const [i,placement]of ['story','reels'].entries()){
        const scene=W3Renderer.scene(W3Campaigns[0],'story',{placement}),item=document.createElement('canvas');await W3Renderer.draw(scene,item);
        const x=48+i*596,y=198,scale=500/1080;ctx.drawImage(item,x,y,500,1920*scale);
        if(guided){const s=scene.safe;ctx.fillStyle='rgba(0,0,0,.17)';ctx.fillRect(x,y,500,s.y*scale);ctx.fillRect(x,y+(s.y+s.height)*scale,500,(1920-s.y-s.height)*scale);ctx.fillRect(x,y+s.y*scale,s.x*scale,s.height*scale);ctx.fillRect(x+(s.x+s.width)*scale,y+s.y*scale,(1080-s.x-s.width)*scale,s.height*scale);ctx.strokeStyle='#bc2344';ctx.lineWidth=1.5;ctx.setLineDash([6,5]);ctx.strokeRect(x+s.x*scale,y+s.y*scale,s.width*scale,s.height*scale);ctx.setLineDash([]);}
        ctx.fillStyle='#000';ctx.font='600 22px "W3 Body"';ctx.fillText(W3Placements[placement].label,x,1130);ctx.font='400 18px "W3 Body"';ctx.fillText(`${scene.safe.width} × ${scene.safe.height}px protected area`,x,1163);
      }
      return canvas.toDataURL('image/png').split(',')[1];
    },guided);
    const name=guided?'safe-zone-proof.png':'placement-preview.png',bytes=Buffer.from(data,'base64');await writeFile(resolve(out,name),bytes);zip.file(`exports/${name}`,bytes);
  }
  await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2));
  await writeFile(resolve(out,'qa-report.json'),JSON.stringify(qa,null,2));
  zip.file('exports/manifest.json',JSON.stringify(manifest,null,2));
  zip.file('exports/qa-report.json',JSON.stringify(qa,null,2));
  for(const name of ['ui-qa-report.json','badge-qa-report.json','studio-desktop.jpg','studio-mobile.jpg','game-badges-desktop.jpg','website-badges-desktop.jpg']){
    try{zip.file(`exports/${name}`,await readFile(resolve(out,name)));}catch{}
  }
  async function includeFixture(dir,relative='exports/badge-fixtures'){
    for(const entry of await readdir(dir,{withFileTypes:true})){
      const path=resolve(dir,entry.name),name=`${relative}/${entry.name}`;
      if(entry.isDirectory())await includeFixture(path,name);else zip.file(name,await readFile(path));
    }
  }
  try{await includeFixture(resolve(out,'badge-fixtures'));}catch{}
  for(const name of ['studio.html','studio.css','studio.js','renderer.js','campaigns.js','assets.js','playbook.html','README.md','AUDIT.html','collection-preview.png','format-preview.png'])zip.file(name,await readFile(resolve(here,name)));
  for(const name of ['PHOSPHOR.txt','BARLOW-CONDENSED.txt','ONEST.txt'])zip.file(`licenses/${name}`,await readFile(resolve(here,`licenses/${name}`)));
  await writeFile(resolve(out,'w3chess-campaign-kit.zip'),await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
  console.log(`Exported ${jobs.length} PNGs and ${jobs.length} SVGs. Checked all dimensions, three surfaces, both hooks, foreground safe zones, spacing and negative overflow checks.`);
}finally{await browser.close();}
