const { test, expect } = require('@playwright/test');

const pages=[
  ['index.html',/decisión de negocio/i],
  ['about.html',/firma energética/i],
  ['contact.html',/contanos/i],
  ['energia-solar.html',/arquitectura correcta/i],
  ['sustentabilidad.html',/consumir mejor/i],
  ['consultoria-tecnica.html',/reducir incertidumbre/i],
  ['mantenimiento.html',/instalar es una etapa/i],
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

test('bitácora vacía no inventa artículos ni imágenes editoriales',async({page})=>{
  await page.goto('/bitacora.html');
  await expect(page.locator('[data-editorial-empty]')).toBeVisible();
  await expect(page.locator('[data-sanity-articles]')).toBeHidden();
  await expect(page.locator('main .ec-article-card')).toHaveCount(0);
  await expect(page.locator('main img')).toHaveCount(0);
});

test('bitácora renderiza únicamente artículos devueltos por Sanity',async({page})=>{
  await page.addInitScript(()=>{window.__ECORISE_SANITY_QUERY_URL__='/tests/fixtures/sanity-articles.json';});
  await page.goto('/bitacora.html');
  const feed=page.locator('[data-sanity-articles]');
  await expect(feed).toBeVisible();
  await expect(feed).toContainText('Cómo leer una oportunidad energética antes de invertir');
  await expect(page.locator('[data-editorial-empty]')).toBeHidden();
  await expect(feed.locator('a.ec-card-link')).toHaveAttribute('href',/articulo\.html\?slug=oportunidad-energetica/);
});

test('lector de artículo renderiza Portable Text básico desde Sanity',async({page})=>{
  await page.addInitScript(()=>{window.__ECORISE_SANITY_ARTICLE_URL__='/tests/fixtures/sanity-article.json';});
  await page.goto('/articulo.html?slug=oportunidad-energetica');
  await expect(page.locator('[data-article-title]')).toHaveText('Cómo leer una oportunidad energética antes de invertir');
  await expect(page.locator('[data-article-body]')).toContainText('La primera pregunta no es cuántos paneles instalar');
  await expect(page.locator('[data-article-body] h2')).toHaveText('Datos antes que tecnología');
  await expect(page.locator('[data-article-body] strong')).toContainText('Consumo, horario, infraestructura');
});

test('sitio rediseñado no genera overflow horizontal en viewport móvil',async({page,isMobile})=>{
  test.skip(!isMobile,'Este control aplica al proyecto mobile.');
  for(const [url] of [...pages,['calculadora-energetica.html']]){
    await page.goto(`/${url}`);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
    expect(overflow,`${url} tiene overflow horizontal`).toBe(false);
  }
});
