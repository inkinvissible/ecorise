const { test, expect } = require('@playwright/test');

const pages=[
  ['index.html',/energía/i],
  ['about.html',/firma energética/i],
  ['contact.html',/contanos/i],
  ['energia-solar.html',/energía solar/i],
  ['sustentabilidad.html',/eficiencia energética/i],
  ['consultoria-tecnica.html',/ingeniería/i],
  ['mantenimiento.html',/sistema energético/i],
  ['empresas.html',/energía/i],
  ['industria.html',/industria/i],
  ['agroindustria.html',/agroindustria/i],
  ['logistica.html',/logística/i],
  ['bitacora.html',/bitácora/i],
  ['webinar.html',/energía/i]
];

test.beforeEach(async({page})=>{
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='127.0.0.1') return route.continue();
    return route.abort();
  });
});

async function openMobileMenu(page,isMobile){
  if(!isMobile)return;
  await page.locator('.navbar-toggler').click();
}

for(const [url,heading] of pages){
  test(`${url} carga sin errores de página`,async({page})=>{
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const response=await page.goto(`/${url}`);
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(heading);
    expect(errors).toEqual([]);
  });
}

test('la navegación institucional conecta home, solar e ingeniería',async({page,isMobile})=>{
  await page.goto('/index.html');
  await openMobileMenu(page,isMobile);
  await page.getByRole('link',{name:'Energía solar',exact:true}).first().click();
  await expect(page).toHaveURL(/energia-solar\.html$/);
  await openMobileMenu(page,isMobile);
  await page.getByRole('link',{name:'Ingeniería',exact:true}).first().click();
  await expect(page).toHaveURL(/consultoria-tecnica\.html$/);
});

test('navegación B2B principal conecta páginas clave',async({page,isMobile})=>{
  await page.goto('/empresas.html');
  await openMobileMenu(page,isMobile);
  await page.getByRole('link',{name:'Industria',exact:true}).click();
  await expect(page).toHaveURL(/industria\.html$/);
  await openMobileMenu(page,isMobile);
  await page.getByRole('link',{name:'Bitácora',exact:true}).click();
  await expect(page).toHaveURL(/bitacora\.html$/);
});

test('calculadora genera evaluación y evento de analytics sin exponer montos estimados',async({page})=>{
  await page.addInitScript(()=>{window.dataLayer=[];});
  await page.goto('/calculadora-energetica.html');
  await page.selectOption('#sector','industria');
  await page.fill('#consumption','50000');
  await page.fill('#bill','3500000');
  await page.locator('#daytime').evaluate(el=>{el.value='70';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.getByRole('button',{name:/calcular escenario preliminar/i}).click();
  await expect(page.locator('[data-energy-result]')).toHaveClass(/is-visible/);
  await expect(page.locator('[data-result-consumption]')).toContainText('50');
  await expect(page.locator('[data-result-coverage]')).toContainText('–');
  const event=await page.evaluate(()=>window.dataLayer.find(item=>item.event==='b2b_energy_assessment_completed'));
  expect(event).toBeTruthy();
  expect(event.sector).toBe('industria');
  await expect(page.locator('[data-energy-result]')).not.toContainText('$');
});

test('sitio rediseñado no genera overflow horizontal en viewport móvil',async({page,isMobile})=>{
  test.skip(!isMobile,'Este control aplica al proyecto mobile.');
  for(const [url] of [...pages,['calculadora-energetica.html']]){
    await page.goto(`/${url}`);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
    expect(overflow,`${url} tiene overflow horizontal`).toBe(false);
  }
});
