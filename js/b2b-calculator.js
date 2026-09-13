(function(){
  const form=document.querySelector('[data-energy-calculator]');
  if(!form)return;
  const result=document.querySelector('[data-energy-result]');
  const monthlyEl=document.querySelector('[data-result-monthly]');
  const annualEl=document.querySelector('[data-result-annual]');
  const coverageEl=document.querySelector('[data-result-coverage]');
  const profileEl=document.querySelector('[data-result-profile]');
  const formatter=new Intl.NumberFormat('es-AR',{maximumFractionDigits:0});
  form.addEventListener('submit',function(e){
    e.preventDefault();
    const consumption=Number(form.consumption.value||0);
    const bill=Number(form.bill.value||0);
    const daytime=Number(form.daytime.value||0);
    const sector=form.sector.value;
    if(consumption<=0||bill<=0){return;}
    const daytimeFactor=Math.max(.35,Math.min(.9,daytime/100));
    const practicalCoverage=Math.max(.25,Math.min(.65,daytimeFactor*.72));
    const monthlyPotential=bill*practicalCoverage;
    const annualPotential=monthlyPotential*12;
    monthlyEl.textContent='$ '+formatter.format(monthlyPotential);
    annualEl.textContent='$ '+formatter.format(annualPotential);
    coverageEl.textContent=Math.round(practicalCoverage*100)+'%';
    const labels={industria:'industrial',agroindustria:'agroindustrial',logistica:'logístico / parque industrial',comercio:'empresarial'};
    profileEl.textContent=labels[sector]||'empresarial';
    result.classList.add('is-visible');
    result.scrollIntoView({behavior:'smooth',block:'nearest'});
    if(window.dataLayer){window.dataLayer.push({event:'b2b_energy_assessment_completed',sector:sector,consumption_band:consumption<10000?'lt_10mwh':consumption<50000?'10_50mwh':consumption<150000?'50_150mwh':'gt_150mwh'});}
  });
})();