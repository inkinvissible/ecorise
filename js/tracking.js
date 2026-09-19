(function(){
  if(window.__ecoriseTrackingLoaded)return;
  window.__ecoriseTrackingLoaded=true;

  // Load the visual interaction layer as a separate first-party asset.
  // Root-relative paths keep working on generated routes such as /bitacora/<slug>/.
  if(!document.querySelector('link[data-ec-motion]')){
    var motionStyle=document.createElement('link');
    motionStyle.rel='stylesheet';
    motionStyle.href='/css/motion.css';
    motionStyle.setAttribute('data-ec-motion','');
    document.head.appendChild(motionStyle);
  }
  if(!document.querySelector('script[data-ec-motion]')){
    var motionScript=document.createElement('script');
    motionScript.src='/js/motion.js';
    motionScript.async=true;
    motionScript.setAttribute('data-ec-motion','');
    document.head.appendChild(motionScript);
  }

  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};

  // Preserve the production measurement stack used before the redesign.
  window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
  var gtm=document.createElement('script');
  gtm.async=true;
  gtm.src='https://www.googletagmanager.com/gtm.js?id=GTM-5Q7XKBN5';
  document.head.appendChild(gtm);

  var ga=document.createElement('script');
  ga.async=true;
  ga.src='https://www.googletagmanager.com/gtag/js?id=G-G4TLBRV3SH';
  ga.onload=function(){
    window.gtag('js',new Date());
    window.gtag('config','G-G4TLBRV3SH');
    window.gtag('config','AW-17629078632');
  };
  document.head.appendChild(ga);

  // Meta Pixel ID already used by the production site.
  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;
    n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=true;n.version='2.0';n.queue=[];
    t=b.createElement(e);t.async=true;t.src=v;
    s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
  }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init','2521676828246674');
  window.fbq('track','PageView');

  // Replaced at build time from the POSTHOG_PROJECT_TOKEN GitHub secret.
  // Leaving the placeholder in source keeps local/test traffic out of production analytics.
  var posthogToken='__ECORISE_POSTHOG_TOKEN__';

  function isLocalHost(){
    return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname);
  }

  function loadPosthog(token){
    if(!token||token.indexOf('__ECORISE_POSTHOG_TOKEN__')!==-1||isLocalHost())return;

    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement('script')).type='text/javascript',p.crossOrigin='anonymous',p.async=!0,p.src=s.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js',(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],Object.defineProperty(u,'toString',{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e='posthog';return'posthog'!==a&&(e+='.'+a),t||(e+=' (stub)'),e}}),Object.defineProperty(u.people,'toString',{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+'.people (stub)'}}),o='init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

    window.posthog.init(token,{
      api_host:'https://us.i.posthog.com',
      defaults:'2026-05-30',
      person_profiles:'identified_only',
      respect_dnt:true,
      session_recording:{
        maskAllInputs:true,
        maskTextSelector:'[data-energy-result]'
      }
    });
  }

  loadPosthog(posthogToken);

  window.ecoriseTrack=function(eventName,properties){
    var props=properties||{};
    window.dataLayer.push(Object.assign({event:eventName},props));
    if(window.posthog&&typeof window.posthog.capture==='function'){
      window.posthog.capture(eventName,props);
    }
  };

  function contentContext(){
    var match=window.location.pathname.match(/^\/(productos|soluciones|casos|bitacora)\/([^/]+)\/?$/);
    if(!match)return null;
    var eventByCollection={
      productos:'product_viewed',
      soluciones:'solution_viewed',
      casos:'case_study_viewed',
      bitacora:'article_viewed'
    };
    return {
      event:eventByCollection[match[1]],
      properties:{
        content_type:match[1],
        content_slug:decodeURIComponent(match[2]),
        page_path:window.location.pathname,
        page_title:document.title
      }
    };
  }

  var viewedContent=contentContext();
  if(viewedContent)window.ecoriseTrack(viewedContent.event,viewedContent.properties);

  function classifyLink(link){
    var href=link.href||'';
    if(href.includes('calendly.com/ecoriserenewable'))return 'diagnosis_booking';
    if(href.includes('wa.me/5493515177298'))return 'whatsapp';
    if(href.startsWith('mailto:info@ecorise.com.ar'))return 'email';
    if(href.includes('calculadora-energetica.html'))return 'energy_assessment';
    return null;
  }

  document.addEventListener('click',function(event){
    var link=event.target.closest&&event.target.closest('a');
    if(!link)return;
    var action=classifyLink(link);
    if(!action)return;

    var properties={
      lead_action:action,
      link_url:link.href,
      link_text:(link.textContent||'').trim().slice(0,120),
      page_path:window.location.pathname
    };

    window.ecoriseTrack('lead_intent_click',properties);

    var semanticEvent={
      diagnosis_booking:'diagnosis_booking_clicked',
      whatsapp:'whatsapp_clicked',
      email:'email_clicked',
      energy_assessment:'energy_assessment_cta_clicked'
    }[action];
    if(semanticEvent)window.ecoriseTrack(semanticEvent,properties);

    if(action==='diagnosis_booking'&&link.closest('[data-energy-result]')){
      window.ecoriseTrack('calculator_result_cta_clicked',properties);
    }

    if(action==='whatsapp'){
      window.gtag('event','conversion',{
        send_to:'AW-17629078632/kC_VCIqAhagbEOjImdZB',
        value:1.0,
        currency:'ARS'
      });
    }
  },{capture:true});
})();