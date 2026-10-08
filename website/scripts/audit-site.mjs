import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.W3_BROWSER_MODULES ? `${process.env.W3_BROWSER_MODULES}/playwright` : 'playwright');
const args=process.argv.slice(2),arg=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const base=arg('--base','https://web3chess.online').replace(/\/$/,'');
const output=resolve(arg('--out','../marketing/content-ops/reports/live-audit.json'));
const runs=Number(arg('--runs','3'));
if(!Number.isInteger(runs)||runs<1||runs>5)throw new Error('Use 1–5 runs');
await mkdir(resolve(output,'..'),{recursive:true});
const browser=await chromium.launch({headless:true});
const report={checkedAt:new Date().toISOString(),base,method:{browser:'Chromium',viewport:'390×844',cpuSlowdown:4,network:'1.6 Mbps down / 0.75 Mbps up / 150 ms latency',cache:'disabled; fresh context per sample',runs,scope:'Synthetic navigation lab, not Lighthouse or field Core Web Vitals. INP needs real interactions and is not reported.'},discovery:{},pages:[]};
try{
  const api=await browser.newContext();
  for(const file of ['/robots.txt','/sitemap.xml']){
    try{const response=await api.request.get(base+file,{timeout:20000});const text=await response.text();report.discovery[file]={status:response.status(),body:text.slice(0,14000)};}catch(error){report.discovery[file]={error:error.message};}
  }
  const sitemap=report.discovery['/sitemap.xml']?.body??'';
  const article=[...sitemap.matchAll(/<loc>([^<]+\/blog\/[^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname)[0];
  await api.close();
  for(const path of ['/', '/blog', ...(article?[article]:[])]){
    const samples=[];let seo;
    for(let run=0;run<runs;run++){
      const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      const page=await context.newPage();const cdp=await context.newCDPSession(page);
      await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
      await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1_600_000/8,uploadThroughput:750_000/8});
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
      let bytes=0;cdp.on('Network.loadingFinished',event=>{bytes+=event.encodedDataLength;});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(()=>{
        window.__audit={lcp:0,cls:0,longTasks:0};let session=0,start=0,last=0;
        new PerformanceObserver(list=>{for(const e of list.getEntries())window.__audit.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
        new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput){if(e.startTime-last>1000||e.startTime-start>5000){session=0;start=e.startTime;}session+=e.value;last=e.startTime;window.__audit.cls=Math.max(window.__audit.cls,session);}}).observe({type:'layout-shift',buffered:true});
        new PerformanceObserver(list=>{for(const e of list.getEntries())window.__audit.longTasks+=Math.max(0,e.duration-50);}).observe({type:'longtask',buffered:true});
      });
      try{
        const response=await page.goto(base+path,{waitUntil:'load',timeout:45000});
        await page.waitForTimeout(3500);
        const data=await page.evaluate(()=>{
          const nav=performance.getEntriesByType('navigation')[0];
          return {lcpMs:window.__audit.lcp,cls:window.__audit.cls,mainThreadBlockingMs:window.__audit.longTasks,ttfbMs:nav.responseStart-nav.requestStart,domContentLoadedMs:nav.domContentLoadedEventEnd,fcpMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime??null};
        });
        samples.push({run:run+1,status:response?.status(),...data,transferBytes:bytes,errors});
        if(run===0){
          seo=await page.evaluate(()=>({url:location.href,title:document.title,description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,robots:document.querySelector('meta[name="robots"]')?.content??'index default',h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),ogImage:document.querySelector('meta[property="og:image"]')?.content,jsonLd:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>{try{return JSON.parse(e.textContent);}catch{return {parseError:true};}}),horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,images:[...document.images].map(e=>({src:e.currentSrc,alt:e.getAttribute('alt'),width:e.getAttribute('width'),height:e.getAttribute('height'),loaded:e.complete&&e.naturalWidth>0})),resources:performance.getEntriesByType('resource').map(e=>({url:e.name,type:e.initiatorType,bytes:e.encodedBodySize,durationMs:Math.round(e.duration)})).sort((a,b)=>b.bytes-a.bytes).slice(0,12)}));
          await page.screenshot({path:output.replace(/\.json$/,'')+path.replaceAll('/','-')+'-mobile.png',fullPage:true});
        }
      }catch(error){samples.push({run:run+1,error:error.message});}
      finally{await context.close();}
    }
    const median=key=>{const values=samples.filter(s=>s.status>=200&&s.status<300).map(s=>s[key]).filter(v=>typeof v==='number').sort((a,b)=>a-b);return values.length?Number(values[Math.floor(values.length/2)].toFixed(3)):null;};
    report.pages.push({path,seo,samples,median:Object.fromEntries(['lcpMs','cls','ttfbMs','fcpMs','transferBytes','mainThreadBlockingMs'].map(key=>[key,median(key)]))});
    console.log(JSON.stringify({path,samples:samples.length,median:report.pages.at(-1).median}));
  }
}finally{await browser.close();}
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(`Saved ${output}`);
if(report.pages.some(page=>page.samples.some(sample=>sample.error||sample.status<200||sample.status>=300)))process.exitCode=1;
