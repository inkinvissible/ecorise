(function(){
  if(window.__ecoriseStoryLoaded)return;
  window.__ecoriseStoryLoaded=true;

  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initSwitchers(){
    document.querySelectorAll('[data-story-switcher]').forEach(function(switcher){
      var tabs=Array.from(switcher.querySelectorAll('[data-story-option]'));
      var panels=Array.from(switcher.querySelectorAll('[data-story-panel]'));
      if(!tabs.length||!panels.length)return;

      switcher.classList.add('ec-story-enhanced');

      function activate(id,focus){
        tabs.forEach(function(tab){
          var active=tab.getAttribute('data-story-option')===id;
          tab.setAttribute('aria-selected',active?'true':'false');
          tab.setAttribute('tabindex',active?'0':'-1');
          tab.classList.toggle('is-active',active);
          if(active&&focus)tab.focus();
        });
        panels.forEach(function(panel){
          var active=panel.getAttribute('data-story-panel')===id;
          panel.hidden=!active;
          panel.classList.toggle('is-active',active);
        });
      }

      tabs.forEach(function(tab,index){
        tab.addEventListener('click',function(){activate(tab.getAttribute('data-story-option'),false);});
        tab.addEventListener('keydown',function(event){
          var next=index;
          if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%tabs.length;
          else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index-1+tabs.length)%tabs.length;
          else if(event.key==='Home')next=0;
          else if(event.key==='End')next=tabs.length-1;
          else return;
          event.preventDefault();
          activate(tabs[next].getAttribute('data-story-option'),true);
        });
      });

      var selected=tabs.find(function(tab){return tab.getAttribute('aria-selected')==='true';})||tabs[0];
      activate(selected.getAttribute('data-story-option'),false);
    });
  }

  function initConsultStories(){
    document.querySelectorAll('[data-consult-story]').forEach(function(story){
      var steps=Array.from(story.querySelectorAll('[data-consult-step]'));
      var markers=Array.from(story.querySelectorAll('[data-consult-marker]'));
      if(!steps.length||!markers.length)return;

      story.classList.add('ec-story-enhanced');
      var current='';

      function activate(id){
        if(!id||id===current)return;
        current=id;
        steps.forEach(function(step){step.classList.toggle('is-active',step.getAttribute('data-consult-step')===id);});
        markers.forEach(function(marker){
          var active=marker.getAttribute('data-consult-marker')===id;
          marker.classList.toggle('is-active',active);
          marker.setAttribute('aria-current',active?'step':'false');
        });
      }

      markers.forEach(function(marker){
        marker.addEventListener('click',function(){
          var id=marker.getAttribute('data-consult-marker');
          var target=steps.find(function(step){return step.getAttribute('data-consult-step')===id;});
          if(!target)return;
          activate(id);
          target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
        });
      });

      var ticking=false;
      function update(){
        var targetY=window.innerHeight*.46;
        var best=steps[0];
        var bestDistance=Infinity;
        steps.forEach(function(step){
          var rect=step.getBoundingClientRect();
          var center=rect.top+Math.min(rect.height,window.innerHeight*.55)/2;
          var distance=Math.abs(center-targetY);
          if(distance<bestDistance){bestDistance=distance;best=step;}
        });
        activate(best.getAttribute('data-consult-step'));
        ticking=false;
      }
      function requestUpdate(){
        if(ticking)return;
        ticking=true;
        window.requestAnimationFrame(update);
      }

      window.addEventListener('scroll',requestUpdate,{passive:true});
      window.addEventListener('resize',requestUpdate,{passive:true});
      activate(steps[0].getAttribute('data-consult-step'));
      requestUpdate();
    });
  }

  initSwitchers();
  initConsultStories();
})();
