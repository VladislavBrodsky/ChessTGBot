import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const here=dirname(fileURLToPath(import.meta.url));
const require=createRequire(resolve(process.env.W3_NODE_MODULES||resolve(dirname(process.execPath),'../node_modules'),'package.json'));
const {chromium}=require('playwright');
const folder=resolve(process.argv[2]||resolve(here,'drafts/2026-10-08'));
const creative=JSON.parse(await readFile(resolve(folder,'creative.json'),'utf8'));
const out=resolve(folder,'creative');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1400,height:1000}});
  await page.route('**/*',route=>/^(file|data|blob):/.test(route.request().url())?route.continue():route.abort());
  await page.goto(pathToFileURL(resolve(here,'../templates/studio.html')).href);
  await page.waitForFunction(()=>window.W3Renderer&&document.getElementById('render-status').textContent==='Ready to export.');
  const manifest={generatedAt:new Date().toISOString(),status:'draft-for-review',creative,outputs:[]};
  for(const format of ['square','portrait','story','wide']){
    const result=await page.evaluate(async({creative,format})=>{
      await W3Renderer.ready;const scene=W3Renderer.scene(creative,format);if(scene.warnings.length)throw Error(scene.warnings.join(' '));
      const canvas=document.createElement('canvas');await W3Renderer.draw(scene,canvas);
      return {width:scene.width,height:scene.height,png:canvas.toDataURL('image/png').split(',')[1],svg:W3Renderer.svg(scene)};
    },{creative,format});
    await writeFile(resolve(out,format+'.png'),Buffer.from(result.png,'base64'));await writeFile(resolve(out,format+'.svg'),result.svg);
    manifest.outputs.push({format,width:result.width,height:result.height,png:format+'.png',svg:format+'.svg',layoutWarnings:[]});
  }
  const preview=await page.evaluate(async creative=>{
    const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1580;const ctx=canvas.getContext('2d');ctx.fillStyle=W3Assets.colors.canvas;ctx.fillRect(0,0,1400,1580);ctx.fillStyle='#000';ctx.font='700 64px "W3 Display"';ctx.fillText(creative.headline.replaceAll('\n',' '),44,88);ctx.font='400 20px "W3 Body"';ctx.fillText(`CHESS / DAILY EDIT ${creative.number} / FOUR ORIGINAL LAYOUTS`,44,125);
    const boxes=[['square',44,178,620,620],['portrait',730,178,496,620],['story',175,866,349,620],['wide',730,970,620,349]];
    for(const [format,x,y,w,h] of boxes){const item=document.createElement('canvas');await W3Renderer.draw(W3Renderer.scene(creative,format),item);ctx.drawImage(item,x,y,w,h);ctx.fillStyle='#000';ctx.font='400 19px "W3 Body"';ctx.fillText(`${W3Formats[format].label} / ${W3Formats[format].width} × ${W3Formats[format].height}`,x,y+h+30);}
    return canvas.toDataURL('image/png').split(',')[1];
  },creative);
  await writeFile(resolve(out,'preview.png'),Buffer.from(preview,'base64'));await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Verified and exported four PNG/SVG layouts to ${out}`);
}finally{await browser.close();}
