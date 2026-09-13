(function(){
  const form=document.querySelector('[data-energy-calculator]');
  if(!form)return;
  const result=document.querySelector('[data-energy-result]');
  const consumptionEl=document.querySelector('[data-result-consumption]');
  const coverageEl=document.querySelector('[data-result-coverage]');
  const fitEl=document.querySelector('[data-result-fit]');
  const profileEl=document.querySelector('[data-result-profile]');
  const formatter=new Intl.NumberFormat('es-AR',{maximumFractionDigits:1});

  function assessEnergyOpportunity(consumption,bill,daytime,sector){
    const daytimeShare=Math.max(.2,Math.min(1,daytime/100));
    const center=Math.max(.2,Math.min(.65,daytimeShare*.72));
    const low=Math.max(.15,center-.1);
    const high=Math.min(.75,center+.1);
    const fit=daytimeShare>=.7?'Alta':daytimeShare>=.45?'Media':'A evaluar';
    const labels={industria:'industrial',agroindustria:'agroindustrial',logistica:'logístico / parque industrial',comercio:'empresarial'};
    return {
      profile:labels[sector]||'empresarial',
      consumptionMwh:consumption/1000,
      coverageLow:Math.round(low*100),
      coverageHigh:Math.round(high*100),
      fit:fit,
      billBand:bill<1000000?'lt_1m':bill<5000000?'1_5m':bill<15000000?'5_15m':'gt_15m'
    };
  }

  form.addEventListener('submit',function(e){
    e.preventDefault();
    const consumption=Number(form.consumption.value||0);
    const bill=Number(form.bill.value||0);
    const daytime=Number(form.daytime.value||0);
    const sector=form.sector.value;
    if(consumption<=0||bill<=0)return;
    const assessment=assessEnergyOpportunity(consumption,bill,daytime,sector);
    profileEl.textContent=assessment.profile;
    consumptionEl.textContent=formatter.format(assessment.consumptionMwh)+' MWh/mes';
    coverageEl.textContent=assessment.coverageLow+'–'+assessment.coverageHigh+'%';
    fitEl.textContent=assessment.fit;
    result.classList.add('is-visible');
    result.scrollIntoView({behavior:'smooth',block:'nearest'});
    if(window.dataLayer){
      window.dataLayer.push({
        event:'b2b_energy_assessment_completed',
        sector:sector,
        consumption_band:consumption<10000?'lt_10mwh':consumption<50000?'10_50mwh':consumption<150000?'50_150mwh':'gt_150mwh',
        bill_band:assessment.billBand,
        daytime_fit:assessment.fit.toLowerCase().replace(' ','_')
      });
    }
  });
})();