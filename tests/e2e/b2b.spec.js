const { test, expect } = require('@playwright/test');

const pages=[
  ['index.html',/consultoría energética/i],
  ['about.html',/firma energética/i],
  ['contact.html',/contanos/i],
  ['energia-solar.html',/energía solar para empresas/i],
  ['sustentabilidad.html',/sustentabilidad y eficiencia energética/i],
  ['consultoria-tecnica.html',/consultoría energética e ingeniería/i],
  ['mantenimiento.html',/mantenimiento e inspección/i],
  ['empresas.html',/energía deja de ser/i],
  ['industria.html',/energía impacta/i],
  ['agroindustria.html',/estacionalidad/i],
  ['logistica.html',/infraestructura operativa/i],
  ['bitacora.html',/energía explicada/i],
  ['webinar.html',/inversión energética/i]
];

test.beforeEach(async({page})=>{
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='127.0.0.1') return route.continue();
    return route.abort();
  });
});

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

test('la capa de motion carga y acompaña el recorrido sin bloquear contenido',async({page})=>{
  await page.goto('/index.html');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.classList.contains('ec-motion'))).toBe(true);
  await expect(page.locator('.ec-story-progress')).toHaveCount(1);
  await expect(page.locator('.ec-hero h1')).toHaveClass(/is-revealed/);
  await page.evaluate(()=>window.scrollTo(0,Math.min(document.body.scrollHeight*0.45,1400)));
  await expect.poll(()=>page.locator('.ec-nav').evaluate(el=>el.classList.contains('is-scrolled'))).toBe(true);
});

test('solar guía la comparación entre on-grid, híbrido y off-grid',async({page})=>{
  await page.goto('/energia-solar.html');
  const onGrid=page.locator('[data-story-option="on-grid"]');
  const hybrid=page.locator('[data-story-option="hibrido"]');
  const offGrid=page.locator('[data-story-option="off-grid"]');
  await expect(onGrid).toHaveAttribute('aria-selected','true');
  await expect(page.locator('[data-story-panel="on-grid"]')).toBeVisible();
  await expect(page.locator('[data-story-panel="hibrido"]')).toBeHidden();
  await hybrid.click();
  await expect(hybrid).toHaveAttribute('aria-selected','true');
  await expect(page.locator('[data-story-panel="hibrido"]')).toBeVisible();
  await expect(page.locator('[data-story-panel="on-grid"]')).toBeHidden();
  await hybrid.press('ArrowRight');
  await expect(offGrid).toHaveAttribute('aria-selected','true');
  await expect(page.locator('[data-story-panel="off-grid"]')).toBeVisible();
});

test('consultoría cambia el foco narrativo a medida que avanza el recorrido',async({page})=>{
  await page.goto('/consultoria-tecnica.html');
  await expect(page.locator('[data-consult-story]')).toHaveClass(/ec-story-enhanced/);
  const thirdStep=page.locator('[data-consult-step="escenarios"]');
  await thirdStep.scrollIntoViewIfNeeded();
  await expect.poll(()=>page.locator('[data-consult-marker="escenarios"]').evaluate(el=>el.classList.contains('is-active'))).toBe(true);
  await expect(thirdStep).toHaveClass(/is-active/);
});

test('la navegación institucional conecta home, solar e ingeniería',async({page,isMobile})=>{
  test.skip(isMobile,'La interacción del collapse depende del Bootstrap JS externo; mobile se valida con HTML y overflow.');
  await page.goto('/index.html');
  await page.getByRole('link',{name:'Energía solar',exact:true}).first().click();
  await expect(page).toHaveURL(/energia-solar\.html$/);
  await page.getByRole('link',{name:'Ingeniería',exact:true}).first().click();
  await expect(page).toHaveURL(/consultoria-tecnica\.html$/);
});

test('la capa B2B conecta Empresas con la vertical industrial y la bitácora',async({page,isMobile})=>{
  test.skip(isMobile,'La interacción del collapse depende del Bootstrap JS externo; mobile se valida con HTML y overflow.');
  await page.goto('/empresas.html');
  await page.locator('a[href="industria.html"]').first().click();
  await expect(page).toHaveURL(/industria\.html$/);
  await page.getByRole('link',{name:'Bitácora',exact:true}).first().click();
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

test('bitácora llega renderizada desde el build, sin pedir contenido a Sanity en el navegador',async({page})=>{
  const sanityRequests=[];
  page.on('request',request=>{if(request.url().includes('sanity.io'))sanityRequests.push(request.url());});
  await page.goto('/bitacora.html');
  await expect(page.locator('.ec-article-card')).toHaveCount(2);
  await expect(page.locator('main')).toContainText('Cómo evaluar energía solar para una industria');
  await expect(page.locator('main')).toContainText('Artículo de prueba no indexable');
  expect(sanityRequests).toEqual([]);
});

test('artículo generado tiene URL limpia, contenido y metadata ya presentes en el HTML',async({page})=>{
  const response=await page.goto('/bitacora/energia-solar-industria/');
  expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('Cómo evaluar energía solar para una industria');
  await expect(page.locator('.ec-article-body')).toContainText('La primera pregunta no es cuántos paneles instalar');
  await expect(page.locator('.ec-article-body h2')).toHaveText('Datos antes que tecnología');
  await expect(page.locator('.ec-article-body strong')).toContainText('Consumo, horario, infraestructura');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://ecorise.com.ar/bitacora/energia-solar-industria/');
});

test('preview noIndex se genera pero conserva la directiva de exclusión',async({page})=>{
  await page.goto('/bitacora/articulo-prueba-noindex/');
  await expect(page.locator('h1')).toHaveText('Artículo de prueba no indexable');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
});

test('sitio rediseñado no genera overflow horizontal en viewport móvil',async({page,isMobile})=>{
  test.skip(!isMobile,'Este control aplica al proyecto mobile.');
  for(const [url] of [...pages,['calculadora-energetica.html'],['bitacora/energia-solar-industria/']]){
    await page.goto(`/${url}`);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
    expect(overflow,`${url} tiene overflow horizontal`).toBe(false);
  }
});
