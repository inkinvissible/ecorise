(function(){
  if(window.__ecoriseTrackingLoaded)return;
  window.__ecoriseTrackingLoaded=true;

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
    window.gtag('event','lead_intent_click',{
      lead_action:action,
      link_url:link.href,
      link_text:(link.textContent||'').trim().slice(0,120),
      page_path:window.location.pathname
    });
    if(action==='whatsapp'){
      window.gtag('event','conversion',{
        send_to:'AW-17629078632/kC_VCIqAhagbEOjImdZB',
        value:1.0,
        currency:'ARS'
      });
    }
  },{capture:true});
})();
