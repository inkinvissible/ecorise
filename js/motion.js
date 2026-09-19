(function(){
  if(window.__ecoriseMotionLoaded)return;
  window.__ecoriseMotionLoaded=true;

  var root=document.documentElement;
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('ec-motion');

  var progress=document.createElement('div');
  progress.className='ec-story-progress';
  progress.setAttribute('aria-hidden','true');
  document.body.appendChild(progress);

  if(reduced){
    root.classList.add('ec-reduced-motion');
    progress.style.setProperty('--ec-story-progress','0');
    return;
  }

  var revealSelectors=[
    '.ec-section h2',
    '.ec-section .ec-lead',
    '.ec-card',
    '.ec-sector-card',
    '.ec-rule-item',
    '.ec-process-item',
    '.ec-media',
    '.ec-media-grid figure',
    '.ec-cta',
    '.ec-article-card',
    '.ec-faq details',
    '.ec-metric',
    '.ec-quote'
  ];

  var revealTargets=Array.from(document.querySelectorAll(revealSelectors.join(',')));
  var staggerParents=new Map();

  revealTargets.forEach(function(element){
    element.classList.add('ec-reveal');
    if(element.matches('.ec-media,.ec-media-grid figure,.ec-sector-card')) element.classList.add('ec-reveal--media');

    var parent=element.closest('.ec-card-grid,.ec-sector-grid,.ec-article-grid,.ec-rule-list,.ec-process,.ec-media-grid,.ec-faq');
    if(parent){
      var current=staggerParents.get(parent)||0;
      element.style.setProperty('--ec-delay',Math.min(current*65,260)+'ms');
      staggerParents.set(parent,current+1);
    }
  });

  var hero=document.querySelector('.ec-hero,.ec-page-hero');
  if(hero){
    var heroItems=hero.querySelectorAll('.ec-eyebrow,h1,p,.ec-hero-actions,.ec-proof-strip');
    heroItems.forEach(function(element,index){
      element.classList.add('ec-reveal','ec-reveal--hero');
      element.style.setProperty('--ec-delay',(90+index*85)+'ms');
    });
  }

  function reveal(element){
    element.classList.add('is-revealed');
  }

  if('IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    },{threshold:0.12,rootMargin:'0px 0px -7% 0px'});

    revealTargets.forEach(function(element){observer.observe(element);});
    if(hero) hero.querySelectorAll('.ec-reveal--hero').forEach(function(element){observer.observe(element);});
  }else{
    revealTargets.forEach(reveal);
    if(hero) hero.querySelectorAll('.ec-reveal--hero').forEach(reveal);
  }

  var nav=document.querySelector('.ec-nav');
  var processes=Array.from(document.querySelectorAll('.ec-process'));
  var ticking=false;

  function clamp(value,min,max){return Math.min(Math.max(value,min),max);}

  function updateMotion(){
    var scrollTop=window.scrollY||document.documentElement.scrollTop||0;
    var scrollable=Math.max(document.documentElement.scrollHeight-window.innerHeight,1);
    var scrollProgress=clamp(scrollTop/scrollable,0,1);
    progress.style.setProperty('--ec-story-progress',String(scrollProgress));

    if(nav) nav.classList.toggle('is-scrolled',scrollTop>18);

    if(hero){
      var heroRect=hero.getBoundingClientRect();
      var heroProgress=clamp(-heroRect.top/Math.max(heroRect.height,1),0,1);
      if(hero.classList.contains('ec-hero')) hero.style.setProperty('--ec-hero-shift',(heroProgress*26).toFixed(1)+'px');
      if(hero.classList.contains('ec-page-hero')) hero.style.setProperty('--ec-page-shift',(heroProgress*20).toFixed(1)+'px');
    }

    processes.forEach(function(process){
      var rect=process.getBoundingClientRect();
      var start=window.innerHeight*0.78;
      var end=window.innerHeight*0.28;
      var processProgress=clamp((start-rect.top)/Math.max(rect.height+(start-end),1),0,1);
      process.style.setProperty('--ec-process-progress',String(processProgress));
    });

    ticking=false;
  }

  function requestUpdate(){
    if(ticking)return;
    ticking=true;
    window.requestAnimationFrame(updateMotion);
  }

  window.addEventListener('scroll',requestUpdate,{passive:true});
  window.addEventListener('resize',requestUpdate,{passive:true});
  requestUpdate();
})();
