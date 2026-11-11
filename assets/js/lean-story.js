(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const menu=document.querySelector('#primary-menu'),button=document.querySelector('.menu-toggle');
  function setMenu(open,restore=false){button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close navigation':'Open navigation');menu.classList.toggle('is-open',open);document.body.classList.toggle('menu-open',open&&innerWidth<=760);if(restore)button.focus();}
  button.addEventListener('click',()=>setMenu(button.getAttribute('aria-expanded')!=='true'));
  menu.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&button.getAttribute('aria-expanded')==='true')setMenu(false,true);});
  document.querySelectorAll('[data-current-year]').forEach(n=>n.textContent=new Date().getFullYear());
  const runway=document.querySelector('[data-compact-runway]'),stage=document.querySelector('[data-compact-stage]');
  const copy=stage.querySelector('.compact-copy'),art=stage.querySelector('.compact-art'),canvas=stage.querySelector('.compact-canvas');
  const phone=stage.querySelector('[data-compact-phone]'),papers=[...stage.querySelectorAll('[data-compact-paper]')];
  const cards=[...document.querySelectorAll('[data-lean-motion]')];
  const stacked=matchMedia('(max-width:1000px) and (min-height:651px), (max-width:600px) and (min-height:501px), (max-width:479px)');
  const flowingHero=matchMedia('(max-height:700px) and (max-width:600px) and (min-height:501px), (max-height:700px) and (max-width:479px)');
  const clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
  let frame=0;
  runway.classList.add('is-enhanced');
  function paint(el,x,y,angle,scale=1){el.style.transform=`translate3d(${x}px,${y}px,0) rotate(${angle}deg) scale(${scale})`;}
  function fit(frame,canvas,entries){
    const boxes=entries.map(([el,x,y,angle])=>{const w=el.offsetWidth,h=el.offsetHeight,a=angle*Math.PI/180,hw=(Math.abs(w*Math.cos(a))+Math.abs(h*Math.sin(a)))/2,hh=(Math.abs(w*Math.sin(a))+Math.abs(h*Math.cos(a)))/2,cx=el.offsetLeft+x+w/2,cy=el.offsetTop+y+h/2;return [cx-hw,cy-hh,cx+hw,cy+hh];});
    const l=Math.min(...boxes.map(b=>b[0])),r=Math.max(...boxes.map(b=>b[2])),t=Math.min(...boxes.map(b=>b[1])),b=Math.max(...boxes.map(b=>b[3]));
    const scale=Math.max(.1,Math.min(1.14,(frame.clientWidth-24)/(r-l),(frame.clientHeight-24)/(b-t)));
    canvas.style.transform=`translate(-50%,-50%) scale(${scale}) translate(${canvas.offsetWidth/2-(l+r)/2}px,${canvas.offsetHeight/2-(t+b)/2}px)`;
  }
  function measure(){if(stacked.matches&&!reduced.matches&&!flowingHero.matches)art.style.top=`${copy.offsetTop+copy.offsetHeight+18}px`;else art.style.removeProperty('top');queue();}
  function render(){
    frame=0;
    const top=parseFloat(getComputedStyle(stage).top)||0;
    const p=reduced.matches?1:flowingHero.matches?clamp((innerHeight*.9-art.getBoundingClientRect().top)/Math.max(1,art.clientHeight)):clamp((top-runway.getBoundingClientRect().top)/Math.max(1,runway.offsetHeight-stage.offsetHeight));
    const open=ease(p);
    const heroObjects=[[phone,mix(225,230,open),mix(35,25,open),mix(7,-3,open)],[papers[0],mix(120,10,open),mix(130,130,open),mix(-4,-12,open)],[papers[1],mix(365,455,open),mix(350,275,open),mix(4,11,open)]];
    heroObjects.forEach(([el,...pose])=>paint(el,...pose));fit(art,canvas,heroObjects);
    stage.querySelector('.compact-scroll b').style.transform=`scaleX(${p})`;
    stage.dataset.progress=p.toFixed(3);
    for(const card of cards){
      const picture=card.querySelector('.life-card-art,.household-mini');
      const r=picture.getBoundingClientRect();
      const t=reduced.matches?1:ease(clamp((innerHeight*.86-r.top)/Math.max(1,Math.min(innerHeight*.6,r.height))));
      card.dataset.progress=t.toFixed(3);
      const kind=card.dataset.leanMotion;
      let objects=[];
      if(kind==='work')objects=[...card.querySelectorAll('.event-note')].map((el,i)=>[el,mix(0,[-14,5,18][i],t),mix(95,[5,91,177][i],t),mix([-7,4,-2][i],[-5,2,-2][i],t)]);
      if(kind==='family')objects=[...card.querySelectorAll('.family-note')].map((el,i)=>[el,mix(i?-95:90,0,t),mix(i?6:25,0,t),mix(i?3:-3,i?8:-9,t)]);
      if(kind==='footing'){objects=[[card.querySelector('.habit-sheet'),0,mix(30,0,t),mix(9,-6,t)]];card.querySelector('.habit-sheet>div:nth-child(3)').style.transform=`translateX(${mix(0,8,t)}px)`;}
      if(kind==='together')objects=[...card.querySelectorAll('.couple-paper')].map((el,i)=>[el,mix(i?-70:55,0,t),mix(i?-12:20,0,t),mix(0,i?9:-10,t)]);
      if(kind==='decisions')objects=[...card.querySelectorAll('.decision-leaf')].map((el,i)=>[el,0,mix([60,0,-60][i],0,t),mix(0,[-5,3,-2][i],t)]);
      objects.forEach(([el,...pose])=>paint(el,...pose));fit(picture,picture.firstElementChild,objects);
    }
  }
  function queue(){if(!frame)frame=requestAnimationFrame(render);}
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',()=>{if(innerWidth>760)setMenu(false);measure();},{passive:true});reduced.addEventListener('change',measure);
  const observer=new ResizeObserver(measure);observer.observe(copy);observer.observe(art);measure();
})();
