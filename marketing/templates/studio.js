(() => {
  const $ = id => document.getElementById(id);
  const key='w3chess-campaign-studio-v1';
  const textFields=['headline','body','tag','cta'];
  let stored={}; try{stored=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
  for(const d of Object.values(stored))if(d&&['mint','voltage'].includes(d.theme))d.theme='paper';
  let id='opening', format='portrait', placement='story', drafts=stored, currentScene, generation=0;
  const campaign=()=>window.W3Campaigns.find(c=>c.id===id);
  const editable=()=>({ ...campaign(),...(drafts[id]||{}) });
  const download=(name,blob)=>{
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const setStatus=t=>$('render-status').textContent=t;
  function syncGuides(){
    if(!currentScene)return;
    const wrap=$('preview-wrap'),well=wrap.parentElement,g=$('safe-overlay'),s=currentScene.safe;
    const style=getComputedStyle(well),padX=parseFloat(style.paddingLeft)+parseFloat(style.paddingRight),padY=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
    if(window.innerWidth<=850){
      const artWidth=Math.max(0,well.clientWidth-padX);
      well.style.height=`${Math.ceil(artWidth*currentScene.height/currentScene.width+padY)}px`;
    }else well.style.height='';
    const scale=Math.min((well.clientWidth-padX)/currentScene.width,(well.clientHeight-padY)/currentScene.height);
    Object.assign(wrap.style,{width:`${currentScene.width*scale}px`,height:`${currentScene.height*scale}px`});
    Object.assign(g.style,{left:`${s.x/currentScene.width*100}%`,top:`${s.y/currentScene.height*100}%`,width:`${s.width/currentScene.width*100}%`,height:`${s.height/currentScene.height*100}%`});
    g.hidden=!$('guides').checked;
    $('reserved-top').hidden=$('reserved-bottom').hidden=!$('guides').checked||format!=='story';
    $('reserved-top').style.top=`${s.y/currentScene.height*50}%`;
    $('reserved-bottom').style.top=`${(s.y+s.height+(currentScene.height-s.y-s.height)/2)/currentScene.height*100}%`;
  }
  async function render(){
    const n=++generation;
    $('png').disabled=$('svg').disabled=true;
    try{
      await window.W3Renderer.ready;
      const scene=window.W3Renderer.scene(campaign(),format,{...drafts[id],placement});
      const buffer=document.createElement('canvas');await window.W3Renderer.draw(scene,buffer);
      if(n!==generation)return;
      const canvas=$('preview');canvas.width=buffer.width;canvas.height=buffer.height;canvas.getContext('2d').drawImage(buffer,0,0);canvas.setAttribute('aria-label',scene.description);
      currentScene=scene;
      $('dimensions').textContent=`${scene.width} × ${scene.height} px · ${window.W3Formats[format].use}`;
      $('placement-control').hidden=format!=='story';
      $('safe-description').textContent=format==='story'?window.W3Placements[placement].help+' House guide: check the final platform preview with your caption and stickers.':`${scene.safe.x}px side margins. All text and artwork stay inside the guide.`;
      $('warnings').hidden=!scene.warnings.length;$('warnings').textContent=scene.warnings.join(' ');
      $('png').disabled=$('svg').disabled=!!scene.warnings.length;
      $('formats').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.format===format)));
      setStatus(scene.warnings.length?'Fix the layout warnings to export.':'Ready to export.');requestAnimationFrame(syncGuides);
    }catch(e){setStatus('The preview could not be loaded. Reload to try again.');console.error(e);}
  }
  function select(next){
    id=next;const d=editable();
    $('templates').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));
    $('campaign-name').textContent=d.name;$('campaign-purpose').textContent=d.purpose.toUpperCase();
    [...textFields,'theme'].forEach(f=>$(f).value=d[f]);
    $('reveal-control').hidden=id!=='puzzle';$('reveal').checked=!!d.reveal;
    $('caption').textContent=d.caption;$('destination').value=d.destination;$('metric').textContent=d.measure;
    render();
  }
  function saveDraft(){
    drafts[id]={...Object.fromEntries([...textFields,'theme'].map(f=>[f,$(f).value])),reveal:$('reveal').checked};
    try{localStorage.setItem(key,JSON.stringify(drafts));}catch{}
    render();
  }
  $('brand-symbol').src=window.W3Assets.logos.light;
  for(const c of window.W3Campaigns){
    const b=document.createElement('button');b.className='template';b.type='button';b.dataset.id=c.id;b.setAttribute('aria-pressed','false');
    const icon=document.createElement('span');icon.className='mini-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=window.W3Assets.icons[c.icon];
    const txt=document.createElement('span'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=c.name;meta.textContent=c.purpose;txt.append(name,meta);
    const num=document.createElement('span');num.className='template-number';num.textContent=c.number;b.append(icon,txt,num);b.onclick=()=>select(c.id);$('templates').append(b);
  }
  for(const [k,f] of Object.entries(window.W3Formats)){
    const b=document.createElement('button');b.type='button';b.dataset.format=k;b.textContent=f.label;b.setAttribute('aria-pressed','false');b.onclick=()=>{format=k;render();};$('formats').append(b);
  }
  [...textFields,'theme','reveal'].forEach(f=>$(f).addEventListener('input',saveDraft));
  $('guides').onchange=syncGuides;window.addEventListener('resize',syncGuides);
  new ResizeObserver(syncGuides).observe($('preview-wrap').parentElement);
  $('placement').onchange=()=>{placement=$('placement').value;render();};
  $('reset').onclick=()=>{delete drafts[id];try{localStorage.setItem(key,JSON.stringify(drafts));}catch{}select(id);};
  $('alternate').onclick=()=>{$('headline').value=campaign().alternate;saveDraft();};
  const exportName=()=>`${id}-${format}${format==='story'&&placement==='reels'?'-reels':''}${editable().reveal?'-answer':''}`;
  $('png').onclick=()=>{if(!currentScene||currentScene.warnings.length)return;$('preview').toBlob(b=>{if(b)download(`${exportName()}.png`,b);},'image/png');};
  $('svg').onclick=()=>{if(!currentScene||currentScene.warnings.length)return;download(`${exportName()}.svg`,new Blob([window.W3Renderer.svg(currentScene)],{type:'image/svg+xml'}));};
  $('save').onclick=()=>download('w3chess-campaign-settings.json',new Blob([JSON.stringify({version:1,drafts},null,2)],{type:'application/json'}));
  $('import').onchange=async()=>{
    try{
      const file=$('import').files[0];if(!file)return;if(file.size>100000)throw Error('too large');
      const value=JSON.parse(await file.text());if(value.version!==1||!value.drafts||typeof value.drafts!=='object')throw Error('invalid');
      const clean={};
      for(const c of window.W3Campaigns){const d=value.drafts[c.id];if(!d||typeof d!=='object')continue;clean[c.id]={};
        for(const f of textFields)if(typeof d[f]==='string'&&d[f].length<=(f==='body'?125:f==='headline'?75:32))clean[c.id][f]=d[f];
        if(['canvas','paper','ink'].includes(d.theme))clean[c.id].theme=d.theme;
        else if(['mint','voltage'].includes(d.theme))clean[c.id].theme='paper';
        if(c.id==='puzzle')clean[c.id].reveal=d.reveal===true;
      }
      drafts=clean;try{localStorage.setItem(key,JSON.stringify(drafts));}catch{}select(id);setStatus('Saved settings loaded.');
    }catch{setStatus('Choose a valid campaign settings file from this studio.');}finally{$('import').value='';}
  };
  $('copy-caption').onclick=async()=>{try{await navigator.clipboard.writeText(campaign().caption);setStatus('Caption copied.');}catch{setStatus('Select the caption text and copy it with your keyboard.');}};
  select(id);
})();
