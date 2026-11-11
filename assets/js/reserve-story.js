(() => {
  'use strict';
  const runway=document.querySelector('[data-breathing-runway]');
  if(!runway)return;
  const stage=runway.querySelector('[data-breathing-stage]');
  const art=stage.querySelector('.breathing-art');
  const canvas=art.querySelector('.breathing-canvas');
  const folio=stage.querySelector('[data-breathing-folio]');
  const expense=stage.querySelector('[data-breathing-expense]');
  const papers=[...stage.querySelectorAll('[data-scattered-paper]')];
  const rows=[...stage.querySelectorAll('[data-clarity-row]')];
  const panels=[...stage.querySelectorAll('[data-breathing-panel]')];
  const progress=[...stage.querySelectorAll('[data-breathing-progress]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const stacked=matchMedia('(max-width: 1000px) and (min-height: 651px), (max-width: 600px) and (min-height: 501px), (max-width: 479px)');
  const clamp=n=>Math.max(0,Math.min(1,n));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=t=>t*t*(3-2*t);
  // x, y, scale, angle. Records gather underneath the growing shared view.
  const paperFrom=[[15,70,1,-12],[360,30,1,10],[340,385,1,-7]];
  const paperTo=[[280,170,.45,0],[285,150,.45,0],[275,240,.5,0]];
  const paperSizes=[[260,250],[250,290],[250,180]];
  let frame=0,previous=-1;
  runway.classList.add('is-enhanced');
  function bounds(p,w,h){
    const angle=p[3]*Math.PI/180;
    const halfW=(Math.abs(w*Math.cos(angle))+Math.abs(h*Math.sin(angle)))*p[2]/2;
    const halfH=(Math.abs(w*Math.sin(angle))+Math.abs(h*Math.cos(angle)))*p[2]/2;
    return [p[0]+w/2-halfW,p[1]+h/2-halfH,p[0]+w/2+halfW,p[1]+h/2+halfH];
  }
  function paint(el,p){el.style.transform=`translate3d(${p[0]}px,${p[1]}px,0) rotate(${p[3]}deg) scale(${p[2]})`;}
  function measure(){
    if(stacked.matches && !reduced.matches)art.style.top=`${stage.querySelector('.breathing-copy').offsetTop+Math.max(...panels.map(p=>p.offsetHeight))+22}px`;
    else art.style.removeProperty('top');
    previous=-1;queue();
  }
  function render(){
    frame=0;
    const rect=runway.getBoundingClientRect();
    const top=parseFloat(getComputedStyle(stage).top)||0;
    const p=reduced.matches?0:clamp((top-rect.top)/Math.max(1,runway.offsetHeight-stage.offsetHeight));
    document.body.classList.toggle('breathing-in-focus',!reduced.matches && rect.top<innerHeight*.6 && rect.bottom>top+stage.offsetHeight*.4);
    if(p===previous)return;
    previous=p;
    const clarity=ease(clamp((p-.18)/.5));
    const settle=ease(clamp((p-.68)/.2));
    const current=p<.45?0:1;
    stage.style.setProperty('--reserve-clarity',clarity.toFixed(4));
    const folioPose=[mix(260,225,clarity),mix(105,40,clarity),mix(.55,1,clarity),mix(-9,4,clarity)];
    const expensePose=[mix(70,25,clarity),mix(330,235,clarity),1,mix(-10,-6,clarity)];
    paint(folio,folioPose);paint(expense,expensePose);
    folio.style.clipPath=`inset(0 0 ${(1-clarity)*100}% 0 round 21px)`;
    folio.style.visibility=clarity>0?'visible':'hidden';
    const artBounds=[bounds(expensePose,190,288)];
    // Use both endpoint bounds while the folio opens, avoiding a sudden scale jump.
    artBounds.push(bounds(folioPose,380,460));
    papers.forEach((paper,i)=>{
      const pose=paperFrom[i].map((n,j)=>mix(n,paperTo[i][j],clarity));
      paint(paper,pose);
      paper.style.visibility=clarity>.995?'hidden':'visible';
      if(clarity<1)artBounds.push(bounds(pose,...paperSizes[i]));
    });
    rows.forEach((row,i)=>{
      row.style.transform=`translateY(${(1-clarity)*(35+i*18)}px)`;
      if(i===1)row.style.boxShadow=`0 0 0 ${settle*2}px var(--teal)`;
    });
    const left=Math.min(...artBounds.map(b=>b[0])),right=Math.max(...artBounds.map(b=>b[2]));
    const upper=Math.min(...artBounds.map(b=>b[1])),lower=Math.max(...artBounds.map(b=>b[3]));
    const scale=Math.max(.1,Math.min(1.15,(art.clientWidth-26)/(right-left),(art.clientHeight-26)/(lower-upper)));
    canvas.style.transform=`translate(-50%,-50%) scale(${scale}) translate(${330-(left+right)/2}px,${325-(upper+lower)/2}px)`;
    panels.forEach((panel,i)=>{
      panel.style.opacity=i===current?'1':'0';
      panel.style.transform=`translateY(${stacked.matches?'0':'-50%'})`;
      progress[i].classList.toggle('is-current',i===current);
      progress[i].querySelector('b').style.transform=`scaleX(${clamp(p*2-i)})`;
    });
    stage.dataset.scene=String(current+1);
    stage.dataset.clarity=clarity.toFixed(3);
  }
  function queue(){if(!frame)frame=requestAnimationFrame(render);}
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',measure,{passive:true});reduced.addEventListener('change',measure);
  const sizeObserver=new ResizeObserver(measure);sizeObserver.observe(art);panels.forEach(panel=>sizeObserver.observe(panel));measure();
})();
