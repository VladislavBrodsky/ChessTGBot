/* Measured composition. Preview, PNG and SVG share glyph baselines and geometry. */
(() => {
  const A=window.W3Assets,C=A.colors;
  const badgeSpec={font:30,icon:30,padding:20,gap:10,minHeight:54,radius:12};
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const meter=document.createElement('canvas').getContext('2d');
  const face=(font,size,weight=400)=>`${weight} ${size}px "W3 ${font==='display'?'Display':'Body'}"`;
  const cache=new Map();
  const imageFor=src=>{
    if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('An image could not be loaded.'));img.src=src;}));
    return cache.get(src);
  };
  const ready=(async()=>{
    await Promise.all(Object.entries(A.fonts).map(async([name,url])=>{const f=new FontFace(name==='display'?'W3 Display':'W3 Body',`url(${url})`,{weight:name==='display'?'700':'100 900'});await f.load();document.fonts.add(f);}));
    await document.fonts.ready;
    await Promise.all([A.mark,...Object.values(A.logos),...Object.values(A.art)].map(imageFor));
  })();
  function wrap(value,width,size,font,weight){
    meter.font=face(font,size,weight);const lines=[];
    for(const paragraph of String(value).split('\n')){
      let line='';
      for(const word of paragraph.split(/\s+/).filter(Boolean)){
        if(meter.measureText(word).width>width)return null;
        const next=line?`${line} ${word}`:word;
        if(line&&meter.measureText(next).width>width){lines.push(line);line=word;}else line=next;
      }
      if(line)lines.push(line);
    }
    return lines;
  }
  const overlap=(a,b,gap=0)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
  function bounds(s){
    if(s.type==='line')return{x:Math.min(s.x,s.x2)-s.width/2,y:Math.min(s.y,s.y2)-s.width/2,w:Math.abs(s.x2-s.x)+s.width,h:Math.abs(s.y2-s.y)+s.width};
    if(s.type==='text')return{x:s.x-s.left,y:s.y,w:s.inkWidth,h:s.h};
    return{x:s.x,y:s.y,w:s.w,h:s.h};
  }
  function validate(scene){
    const warnings=[],safe=scene.safe;
    for(const shape of scene.shapes.filter(s=>s.layer!=='background')){
      const b=bounds(shape);
      if(!Object.values(b).every(Number.isFinite))warnings.push(`${shape.role}: invalid geometry.`);
      if(b.x<safe.x-.5||b.y<safe.y-.5||b.x+b.w>safe.x+safe.width+.5||b.y+b.h>safe.y+safe.height+.5)warnings.push(`${shape.role}: exceeds the ${scene.placementLabel} safe area.`);
    }
    const blocks=scene.blocks;
    for(let i=0;i<blocks.length;i++)for(let j=i+1;j<blocks.length;j++)if(overlap(blocks[i],blocks[j],16))warnings.push(`${blocks[i].role} / ${blocks[j].role}: need at least 16px separation.`);
    const texts=scene.shapes.filter(s=>s.type==='text');
    for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++)if(texts[i].group===texts[j].group&&overlap(bounds(texts[i]),bounds(texts[j]),4))warnings.push(`${texts[i].role} / ${texts[j].role}: text collision.`);
    return [...new Set(warnings)];
  }
  function scene(campaign,format,overrides={}){
    const d={...campaign,...overrides},f=window.W3Formats[format];if(!f)throw Error('Choose a supported format.');
    const vertical=format==='story',wide=format==='wide',portrait=format==='portrait';
    const placement=vertical?(d.placement||'story'):'feed';
    if(vertical&&!window.W3Placements[placement])throw Error('Choose Story or Reels placement.');
    const safe=vertical?window.W3Placements[placement].safe:f.safe;
    const reels=vertical&&placement==='reels';
    // Legacy saved surfaces migrate to the current small-accent palette.
    const theme=['canvas','paper','ink'].includes(d.theme)?d.theme:'paper';
    const bg=C[theme],fg=theme==='ink'?C.paper:C.ink,muted=theme==='ink'?C.line:C.muted;
    const shapes=[],blocks=[],warnings=[];let layer='background',group='background';
    const push=s=>{shapes.push({layer,group,...s});return shapes.at(-1);};
    const rect=(x,y,w,h,fill,radius=0,role='panel')=>push({type:'rect',x,y,w,h,fill,radius,role});
    const line=(x,y,x2,y2,color,width=1,role='divider')=>push({type:'line',x,y,x2,y2,color,width,role});
    const image=(src,x,y,w,h,role='artwork')=>push({type:'image',src,x,y,w,h,role});
    const path=(p,x,y,w,h,fill,stroke,sw)=>push({type:'path',p,x,y,w,h,fill,stroke,sw,role:'chess-piece'});
    const text=(value,x,y,w,size,{font='body',color=fg,weight=400,maxLines=2,min=size,leading=1.28,role='support'}={})=>{
      let lines,current=size;
      for(;current>=min;current-=2){lines=wrap(value,w,current,font,weight);if(lines?.length&&lines.length<=maxLines)break;}
      if(!lines?.length||lines.length>maxLines||current<min){warnings.push(`${role}: shorten the copy to fit this format.`);current=min;lines=wrap(value,w,current,font,weight)||[String(value)];if(!lines.length)lines=[' '];}
      meter.font=face(font,current,weight);
      const metrics=lines.map(l=>meter.measureText(l));
      const ascent=Math.max(...metrics.map(m=>m.actualBoundingBoxAscent),current*.45),descent=Math.max(0,...metrics.map(m=>m.actualBoundingBoxDescent));
      const left=Math.max(0,...metrics.map(m=>m.actualBoundingBoxLeft));
      const inkWidth=Math.max(...metrics.map(m=>m.actualBoundingBoxRight))+left;
      const step=Math.max(current*leading,ascent+descent+4),h=ascent+descent+(lines.length-1)*step;
      return push({type:'text',lines,x,y,w,h,size:current,font,color,weight,step,ascent,left,inkWidth,role});
    };
    const icon=(name,x,y,size,color=fg)=>image(`data:image/svg+xml;base64,${btoa(A.icons[name].replaceAll('currentColor',color))}`,x,y,size,size,'icon');
    const block=(role,x,y,w,h)=>blocks.push({role,x,y,w,h});
    const pill=(value,x,y,maxWidth)=>{
      meter.font=face('body',badgeSpec.font,500);const w=Math.min(maxWidth,Math.ceil(meter.measureText(value).width)+90);
      const t=text(value,x+60,y,w-80,badgeSpec.font,{color:C.ink,weight:500,maxLines:2,role:'tag'});
      const h=Math.max(badgeSpec.minHeight,t.h+24);t.y=y+(h-t.h)/2;
      const textShape=shapes.pop();rect(x,y,w,h,C.mint,badgeSpec.radius,'label-panel');icon(d.icon,x+20,y+(h-30)/2,30,C.ink);shapes.push(textShape);
      block('tag',x,y,w,h);return{x,y,w,h};
    };
    const action=(value,x,y,w,h,size)=>{
      layer='action';group='action';const fill=theme==='ink'?C.mint:C.ink,color=theme==='ink'?C.ink:C.paper;
      rect(x,y,w,h,fill,14,'action-panel');
      const pillW=Math.min(252,Math.round(w*0.32)),pillH=h-20,pillX=x+w-pillW-10,pillY=y+10;
      const t=text(value,x+28,y,w-pillW-44,size,{color,weight:600,min:Math.round(size*0.75),maxLines:1,role:'cta'});
      t.y=y+(h-t.h)/2;
      rect(pillX,pillY,pillW,pillH,theme==='ink'?C.paper:C.mint,10,'action-pill');
      const urlText=text('web3chess.online',pillX+18,pillY,pillW-46,Math.round(size*0.64),{color:C.ink,weight:600,min:16,maxLines:1,role:'cta-url'});
      urlText.y=pillY+(pillH-urlText.h)/2;
      icon('arrow-up-right',pillX+pillW-34,pillY+(pillH-22)/2,22,C.ink);
      block('action',x,y,w,h);
    };
    const noTrailingDot = s => typeof s === 'string' ? s.split('\n').map(l => l.trim().replace(/\.+$/, '')).join('\n') : s;
    const reveal=d.id==='puzzle'&&d.reveal;
    const title=noTrailingDot(reveal?'THE BACK RANK\nNO WAY OUT':d.headline);
    const deck=noTrailingDot(reveal?'Ra8# · The king’s own pawns block its escape':d.body);
    const tag=noTrailingDot(reveal?'The answer / 02':d.tag);
    const note=noTrailingDot(reveal?'Ra8# · More tactical puzzles in the Academy':d.note);
    const cta=noTrailingDot(reveal?'Try another puzzle':d.cta);
    rect(0,0,f.width,f.height,bg,0,'background');
    // Keep a deliberate second margin inside the platform-control envelope.
    const inset=24,x=safe.x+inset,w=safe.width-2*inset,top=safe.y+inset,bottom=safe.y+safe.height-inset;
    const spec=wide?{brand:88,head:136,headMin:106,body:34,headGap:36,bodyGap:24,visualGap:28,cta:88,note:24,ctaSize:34}
      :portrait?{brand:88,head:154,headMin:128,body:38,headGap:64,bodyGap:28,visualGap:36,cta:94,note:24,ctaSize:36}
      :vertical&&!reels?{brand:96,head:164,headMin:126,body:40,headGap:64,bodyGap:30,visualGap:36,cta:100,note:24,ctaSize:38}
      :reels?{brand:80,head:126,headMin:106,body:36,headGap:48,bodyGap:24,visualGap:28,cta:84,note:24,ctaSize:34}
      :{brand:72,head:124,headMin:106,body:34,headGap:44,bodyGap:24,visualGap:28,cta:80,note:24,ctaSize:34};
    layer='brand';group='brand';const logoW=spec.brand*A.logoAspect;
    image(theme==='ink'?A.logos.dark:A.logos.light,x,top,logoW,spec.brand,'brand-lockup');block('brand',x,top,logoW,spec.brand);
    const textW=wide?910:w;
    layer='hook';group='tag';
    let badge,hy;
    if(wide){
      meter.font=face('body',badgeSpec.font,500);const desired=Math.ceil(meter.measureText(tag).width)+90;
      badge=pill(tag,x+w-desired,top+(spec.brand-badgeSpec.minHeight)/2,desired);
      hy=top+spec.brand+spec.headGap;
    } else {
      const tagW=w-logoW-48;meter.font=face('body',badgeSpec.font,500);const desired=Math.ceil(meter.measureText(tag).width)+90;
      if(desired<=tagW){badge=pill(tag,x+w-desired,top+(spec.brand-badgeSpec.minHeight)/2,tagW);hy=top+spec.brand+spec.headGap;}
      else {badge=pill(tag,x,top+spec.brand+spec.brand/2,w);hy=badge.y+badge.h+32;}
    }
    group='headline';
    const headline=text(title,x,hy,textW,spec.head,{font:'display',weight:700,maxLines:2,min:spec.headMin,leading:.88,role:'headline'});block('headline',x,hy,textW,headline.h);
    group='body';const body=text(deck,x,hy+headline.h+spec.bodyGap,wide?830:w,spec.body,{color:muted,maxLines:2,role:'body'});block('body',x,body.y,body.w,body.h);
    layer='action';group='note';const noteW=wide?850:w;
    const term=text(note,x,0,noteW,spec.note,{color:muted,maxLines:1,min:20,role:'note'});term.y=bottom-term.h;
    block('note',x,term.y,noteW,term.h);
    const actionY=term.y-22-spec.cta;
    action(cta,x,actionY,wide?760:w,spec.cta,spec.ctaSize);
    const visualY=body.y+body.h+spec.visualGap,visualBottom=actionY-spec.visualGap;
    const visualH=visualBottom-visualY;
    const board=(bx,by,size)=>{
      group='board';const pad=size*.075,cell=(size-2*pad)/8;
      rect(bx,by,size,size,C.ink,24,'board-frame');block('board',bx,by,size,size);
      for(let r=0;r<8;r++)for(let c=0;c<8;c++)rect(bx+pad+c*cell,by+pad+r*cell,cell,cell,(r+c)%2?'#9A9A9A':C.paper,0,'board-square');
      if(reveal)for(const row of [0,7])rect(bx+pad,by+pad+row*cell,cell,cell,C.mint,0,'answer-square');
      const pieces={p:'M50 12a14 14 0 1 1 0 28a14 14 0 0 1 0-28Z M36 46h28l-7 9 12 25H31l12-25Z M25 84h50v8H25Z',r:'M22 15h14v12h9V15h12v12h9V15h13v27H22Z M32 45h36v34H32Z M24 83h52v9H24Z',k:'M45 5h10v12h12v10H55v10H45V27H33V17h12Z M25 40l8 16h34l8-16-13 4-12-7-12 7Z M36 60h28l7 20H29Z M23 84h54v8H23Z'};
      for(const[sq,type,white]of[['g8','k',0],['f7','p',0],['g7','p',0],['h7','p',0],['f2','p',1],['g2','p',1],['h2','p',1],['a1','r',1],['g1','k',1]]){const file=sq.charCodeAt(0)-97,rank=8-Number(sq[1]);path(pieces[type],bx+pad+file*cell+cell*.06,by+pad+rank*cell+cell*.04,cell*.88,cell*.88,white?C.paper:C.ink,white?C.ink:C.paper,2.5);}
      for(let i=0;i<8;i++){
        const sizeText=Math.max(18,size*.03);
        text('abcdefgh'[i],bx+pad+i*cell+cell*.4,by+size-pad*.65,cell,sizeText,{color:C.paper,maxLines:1,role:'board-coordinate'});
        text(String(8-i),bx+pad*.28,by+pad+i*cell+cell*.3,pad,sizeText,{color:C.paper,maxLines:1,role:'board-coordinate'});
      }
      if(reveal){const xx=bx+pad+cell*.5,y1=by+pad+cell*7.25,y2=by+pad+cell*.7;line(xx,y1,xx,y2,C.ink,5,'answer-arrow');line(xx,y2,xx-10,y2+16,C.ink,5,'answer-arrow');line(xx,y2,xx+10,y2+16,C.ink,5,'answer-arrow');}
    };
    function proofCard(px,py,pw,ph,compact=false){
      group='proof';
      if(theme!=='canvas'&&!d.transparentCard){
        rect(px,py,pw,ph,theme==='paper'?C.canvas:C.paper,24,'proof-panel');
      }
      block('proof',px,py,pw,ph);
      const padding=compact?24:28,ink=C.ink,sub=C.muted;
      if(compact){
        icon(d.icon,px+padding,py+(ph-44)/2,44,ink);
        const value=noTrailingDot(({opening:'Free A.I. practice · No download',rival:'You · Your friend · One board',academy:'Learn → Practise → Play',tempo:'1+0 · 3+2 · 10+0',stakes:'Equal stakes · Clear rules',culture:'“One more game” · Every chess group'})[d.id] || (Array.isArray(d.proof) ? d.proof.map(noTrailingDot).join(' · ') : ''));
        const t=text(value,px+88,py,pw-116,36,{weight:600,color:ink,maxLines:1,min:24,role:'proof'});t.y=py+(ph-t.h)/2;return;
      }
      if(d.id==='opening'||d.id==='rival'){
        const first=shapes.length;
        icon(d.id==='opening'?'telegram-logo':d.icon,px+padding,py+padding,40,ink);
        const value=noTrailingDot(d.id==='opening'?'CHESS\nIN YOUR CHAT':'YOU\nYOUR FRIEND');
        const t=text(value,px+padding,py+padding+64,pw-2*padding,reels?46:portrait||vertical?54:48,{font:'display',weight:700,min:reels?40:44,leading:1.02,color:ink,role:'proof-title'});
        const subtext=noTrailingDot(d.id==='opening'?'No download':'One board · Equal stakes');
        const subtitle=text(subtext,px+padding,t.y+t.h+24,pw-2*padding,reels?28:30,{color:sub,maxLines:2,role:'proof'});
        if(subtitle.y+subtitle.h>py+ph-padding)warnings.push('proof: shorten the copy or give the card more room.');
        else {const offset=(ph-(subtitle.y+subtitle.h-py-padding))/2-padding;for(const s of shapes.slice(first))s.y+=offset;}
      }else{
        const rowH=(ph-2*padding)/3;
        d.proof.forEach((rawVal,i)=>{
          const value=noTrailingDot(typeof rawVal==='object'?rawVal.text:rawVal);
          const ty=py+padding+i*rowH;
          const rowIcon = (Array.isArray(d.proofIcons)&&d.proofIcons[i])
            || (typeof rawVal==='object'&&rawVal.icon)
            || (()=>{
                const l=value.toLowerCase();
                if(l.includes('bullet')||l.includes('blitz')) return 'lightning';
                if(l.includes('usdt')||l.includes('stake')||l.includes('crypto')) return 'coins';
                if(l.includes('@')||l.includes('chat')||l.includes('community')||l.includes('telegram')) return 'telegram-logo';
                if(l.includes('rule')||l.includes('equal')) return 'scales';
                if(d.id==='tempo') return 'clock';
                if(d.id==='stakes') return 'check';
                return null;
              })();
          const hasIcon = Boolean(rowIcon);
          const iconSpace = hasIcon ? 42 : 0;
          const t=text(value,px+padding+iconSpace,ty,pw-2*padding-iconSpace,wide?24:reels?22:24,{weight:600,color:ink,maxLines:1,min:18,leading:1.1,role:'proof'});
          t.y=ty+(rowH-t.h)/2;
          if(hasIcon)icon(rowIcon,px+padding,ty+(rowH-28)/2,28,ink);
          if(t.h>rowH-10)warnings.push('proof: rows need more room.');
          if(i<2)line(px+padding,ty+rowH,px+pw-padding,ty+rowH,C.line,1);
        });
      }
    }
    function storyStack(px,py,pw,ph){
      const gap=20,cardH=Math.min(106,(ph-2*gap)/3),total=3*cardH+2*gap;
      if(cardH<76)warnings.push('proof: the stacked cards need more room.');
      const firstY=py+(ph-total)/2;
      d.proof.forEach((rawVal,i)=>{
        const value=noTrailingDot(rawVal);
        const offset=i===1?18:0,xx=px+offset,yy=firstY+i*(cardH+gap),ww=pw-offset;
        group=`proof-${i}`;
        rect(xx,yy,ww,cardH,d.id==='culture'?C.canvas:C.paper,20,'proof-panel');
        rect(xx,yy,7,cardH,i===1?C.mint:C.ink,3,'proof-accent');
        block(i===0?'proof-title':`proof-${i}`,xx,yy,ww,cardH);
        const valueSize=d.id==='culture'?34:reels?34:38;
        const t=text(value,xx+23,yy,ww-38,valueSize,{font:'display',weight:700,min:valueSize,maxLines:2,leading:1.03,color:C.ink,role:i===0?'proof-title':'proof'});
        t.y=yy+(cardH-t.h)/2;
      });
    }
    layer='proof';
    if(wide){
      const rx=1048,rw=736;
      if(d.id==='puzzle'){
        const size=708;board(rx+(rw-size)/2,top+8,size);
        group='puzzle-proof';const t=text(reveal?'Ra8# · BACK-RANK MATE':'WHITE TO MOVE · MATE IN ONE',rx,top+8+size+40,rw,40,{font:'display',weight:700,color:fg,maxLines:1,role:'proof-title'});block('puzzle-proof',t.x,t.y,t.w,t.h);
      }else{
        const artSize=680;
        const artY=top+(bottom-top-artSize)/2;
        group='art';image(A.art[d.art],rx+(rw-artSize)/2,artY,artSize,artSize);block('art',rx+(rw-artSize)/2,artY,artSize,artSize);
        const ph=Math.min(visualH, 250);
        proofCard(x, visualY+(visualH-ph)/2, textW, ph);
      }
    }else{
      if(visualH<(reels?245:format==='square'?300:400))warnings.push('visual: copy leaves too little room for the main visual.');
      if(d.id==='puzzle'){
        const size=Math.min(visualH,w*(vertical&&!reels?.57:portrait?.55:.46));
        board(x,visualY+(visualH-size)/2,size);
        group='puzzle-proof';const px=x+size+40,pw=w-size-40;
        const p=text(reveal?'Ra8#':'YOUR\nMOVE',px,visualY+Math.max(12,(visualH-210)/2),pw,reels?74:96,{font:'display',weight:700,leading:1.02,maxLines:2,role:'proof-title'});
        const t=text(reveal?'The pawns block the king’s escape':'Find the finish · Then test a friend',px,p.y+p.h+26,pw,reels?30:34,{color:muted,maxLines:3,role:'proof'});
        block('puzzle-proof',px,p.y,pw,t.y+t.h-p.y);
        if(t.y+t.h>visualBottom)warnings.push('puzzle proof: needs more room.');
      }else{
        const stacked=['opening','rival','culture'].includes(d.id);
        const pw=stacked?(reels?296:portrait||vertical?316:336):portrait||vertical&&!reels?390:reels?304:390,artW=w-pw-30;
        const size=Math.min(visualH,artW),artY=visualY+(visualH-size)/2;
        group='art';image(A.art[d.art],x+w-size,artY,size,size);block('art',x+w-size,artY,size,size);
        if(stacked)storyStack(x,visualY,pw,visualH);
        else {const ph=Math.min(visualH,portrait||vertical&&!reels?350:300);proofCard(x,visualY+(visualH-ph)/2,pw,ph);}
      }
    }
    const result={width:f.width,height:f.height,shapes,blocks,warnings:[],campaign:d.id,format,placement,placementLabel:vertical?window.W3Placements[placement].label:f.label,title:d.name,description:`${title.replaceAll('\n',' ')} ${deck}`,safe,typography:spec};
    result.warnings=[...new Set([...warnings,...validate(result)])];return result;
  }
  async function draw(scene,canvas){
    await ready;canvas.width=scene.width;canvas.height=scene.height;const ctx=canvas.getContext('2d');
    for(const s of scene.shapes){ctx.save();
      if(s.type==='rect'){ctx.beginPath();ctx.roundRect(s.x,s.y,s.w,s.h,s.radius);ctx.fillStyle=s.fill;ctx.fill();}
      else if(s.type==='line'){ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x2,s.y2);ctx.strokeStyle=s.color;ctx.lineWidth=s.width;ctx.stroke();}
      else if(s.type==='image')ctx.drawImage(await imageFor(s.src),s.x,s.y,s.w,s.h);
      else if(s.type==='path'){ctx.translate(s.x,s.y);ctx.scale(s.w/100,s.h/100);const p=new Path2D(s.p);ctx.fillStyle=s.fill;ctx.fill(p);if(s.stroke){ctx.strokeStyle=s.stroke;ctx.lineWidth=s.sw;ctx.stroke(p);}}
      else if(s.type==='text'){ctx.font=face(s.font,s.size,s.weight);ctx.fillStyle=s.color;ctx.textBaseline='alphabetic';s.lines.forEach((l,i)=>ctx.fillText(l,s.x,s.y+s.ascent+i*s.step));}
      ctx.restore();
    }return canvas;
  }
  function svg(scene){
    let result=`<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" role="img"><title>${escape(scene.title)}</title><desc>${escape(scene.description)}</desc><defs><style>@font-face{font-family:'W3 Display';src:url('${A.fonts.display}');font-weight:700}@font-face{font-family:'W3 Body';src:url('${A.fonts.body}');font-weight:100 900}</style></defs>`;let current=null;
    for(const s of scene.shapes){
      if(s.layer!==current){if(current)result+='</g>';current=s.layer;result+=`<g id="${s.layer}">`;}
      if(s.type==='rect')result+=`<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.radius}" fill="${s.fill}"/>`;
      else if(s.type==='line')result+=`<path d="M${s.x} ${s.y}L${s.x2} ${s.y2}" stroke="${s.color}" stroke-width="${s.width}"/>`;
      else if(s.type==='image')result+=`<image data-role="${s.role}" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" href="${s.src}"/>`;
      else if(s.type==='path')result+=`<path d="${s.p}" transform="translate(${s.x} ${s.y}) scale(${s.w/100} ${s.h/100})" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.sw}"/>`;
      else if(s.type==='text')result+=`<text data-role="${s.role}" fill="${s.color}" font-family="W3 ${s.font==='display'?'Display':'Body'}" font-weight="${s.weight}" font-size="${s.size}">${s.lines.map((l,i)=>`<tspan x="${s.x}" y="${s.y+s.ascent+i*s.step}">${escape(l)}</tspan>`).join('')}</text>`;
    }return result+'</g></svg>';
  }
  window.W3Renderer={ready,scene,draw,svg,validate,badgeSpec};
})();
