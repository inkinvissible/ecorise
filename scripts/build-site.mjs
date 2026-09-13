import fs from 'node:fs/promises';
import path from 'node:path';
import {toHTML} from '@portabletext/to-html';

const ROOT=process.cwd();
const OUT=path.join(ROOT,'_site');
const BUILD=path.join(ROOT,'.build');
const BASE_URL='https://ecorise.com.ar';
const PROJECT_ID='8nstak41';
const DATASET='production';
const API_VERSION='2026-09-13';
const INCLUDE_NOINDEX=process.argv.includes('--include-noindex');
const fixtureIndex=process.argv.indexOf('--fixture');
const FIXTURE=fixtureIndex>=0?process.argv[fixtureIndex+1]:null;

const EXCLUDED_TOP_LEVEL=new Set([
  '.git','.github','.idea','.impeccable','.agents','.sanity','.build','_site','node_modules',
  'tests','scripts','sanity-pipeline','templates','.gitmodules','.htmlvalidate.json',
  'package.json','package-lock.json','playwright.config.js','DESIGN.md','PRODUCT.md','SEO_BASELINE.md',
  'CONTENT_PIPELINE.md','LICENSE.txt','READ-ME.txt','README.md','README'
]);

const AVAILABILITY_LABELS={
  in_stock:'Disponible',on_request:'A pedido',out_of_stock:'Sin stock',discontinued:'Discontinuado'
};
const AVAILABILITY_SCHEMA={
  in_stock:'https://schema.org/InStock',on_request:'https://schema.org/PreOrder',out_of_stock:'https://schema.org/OutOfStock',discontinued:'https://schema.org/Discontinued'
};

function escapeHtml(value=''){
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function safeJson(value){return JSON.stringify(value).replace(/</g,'\\u003c');}
function compact(values){return values.filter(value=>value!==undefined&&value!==null&&value!==''&&value!==false);}
function refTitle(ref){return ref?.title||ref?.name||'';}

function safeSlug(value){
  const slug=String(value||'').trim();
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Slug inválido para generación estática: ${slug||'(vacío)'}`);
  return slug;
}

function formatDate(value){
  if(!value)return '';
  try{return new Intl.DateTimeFormat('es-AR',{year:'numeric',month:'long',day:'numeric',timeZone:'America/Argentina/Cordoba'}).format(new Date(value));}
  catch{return '';}
}

function imageUrl(url,width,height){
  if(!url)return '';
  const endpoint=new URL(url);
  endpoint.searchParams.set('w',String(width));
  endpoint.searchParams.set('auto','format');
  if(height){endpoint.searchParams.set('h',String(height));endpoint.searchParams.set('fit','crop');}
  return endpoint.toString();
}

function portableText(value){
  if(!Array.isArray(value)||value.length===0)return '';
  return toHTML(value,{
    components:{
      block:{
        h2:({children})=>`<h2>${children}</h2>`,
        h3:({children})=>`<h3>${children}</h3>`,
        h4:({children})=>`<h4>${children}</h4>`,
        blockquote:({children})=>`<blockquote>${children}</blockquote>`,
        normal:({children})=>`<p>${children}</p>`
      },
      marks:{
        link:({children,value})=>{
          const href=String(value?.href||'');
          const safe=/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href);
          if(!safe)return children;
          const external=/^https?:\/\//i.test(href);
          return `<a href="${escapeHtml(href)}"${external?' target="_blank" rel="noopener noreferrer"':''}>${children}</a>`;
        }
      },
      types:{
        image:({value})=>{
          if(!value?.url)return '';
          const alt=escapeHtml(value.alt||'');
          const caption=value.caption?`<figcaption>${escapeHtml(value.caption)}</figcaption>`:'';
          return `<figure class="ec-article-figure"><img src="${escapeHtml(imageUrl(value.url,1400))}" alt="${alt}" loading="lazy">${caption}</figure>`;
        }
      }
    },
    onMissingComponent:false
  });
}

function plainPortableText(value){
  if(!Array.isArray(value))return '';
  return value.flatMap(block=>block?.children||[]).map(span=>span?.text||'').join(' ').replace(/\s+/g,' ').trim();
}

function imageFigure(url,alt,{hero=false}={}){
  if(!url)return '';
  const width=hero?1400:900;
  const height=hero?788:506;
  return `<figure class="ec-article-figure${hero?' ec-article-figure--hero':''}"><img src="${escapeHtml(imageUrl(url,width,height))}" alt="${escapeHtml(alt||'')}" loading="lazy" width="${width}" height="${height}"></figure>`;
}

function nav(active=''){
  const item=(href,label,key)=>`<a href="${href}" class="nav-item nav-link${active===key?' active':''}">${label}</a>`;
  return `<nav class="navbar navbar-expand-lg navbar-light sticky-top px-lg-5 ec-nav" aria-label="Navegación principal" data-site-nav="v1"><a href="/index.html" class="navbar-brand ms-4 ms-lg-0"><img src="/img/logo.png" alt="Ecorise"></a><button class="navbar-toggler me-4" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Abrir navegación"><span class="navbar-toggler-icon" aria-hidden="true"></span></button><div class="collapse navbar-collapse" id="mainNav"><div class="navbar-nav ms-auto p-4 p-lg-0">${item('/index.html','Inicio','inicio')}${item('/empresas.html','Empresas','empresas')}${item('/energia-solar.html','Energía solar','solar')}${item('/consultoria-tecnica.html','Ingeniería','ingenieria')}${item('/mantenimiento.html','Operación','operacion')}${item('/bitacora.html','Bitácora','bitacora')}</div><a href="https://calendly.com/ecoriserenewable/30min" target="_blank" rel="noopener" class="btn btn-primary py-2 px-4 ec-nav-cta">Agendar diagnóstico</a></div></nav>`;
}

function footer(){
  return `<footer class="ec-footer py-5" data-site-footer="v1"><div class="ec-shell"><div class="row g-4 align-items-end"><div class="col-lg-5"><img src="/img/logo.png" alt="Ecorise" class="ec-footer-logo"><p class="mt-3 mb-0">Córdoba, Argentina · info@ecorise.com.ar · +54 351 517-7298</p></div><div class="col-lg-7"><nav class="ec-footer-nav" aria-label="Navegación del pie"><a href="/index.html">Inicio</a><a href="/empresas.html">Empresas</a><a href="/energia-solar.html">Energía solar</a><a href="/consultoria-tecnica.html">Ingeniería</a><a href="/mantenimiento.html">Operación</a><a href="/bitacora.html">Bitácora</a><a href="/productos/">Productos</a><a href="/soluciones/">Soluciones</a><a href="/casos/">Casos</a><a href="/contact.html">Contacto</a></nav></div></div></div></footer>`;
}

function documentHead({title,description,canonical,noIndex=false,ogType='website',image='',jsonLd=[]}){
  const structured=(Array.isArray(jsonLd)?jsonLd:[jsonLd]).filter(Boolean).map(item=>`<script type="application/ld+json">${safeJson(item)}</script>`).join('\n  ');
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${noIndex?'<meta name="robots" content="noindex,follow">':''}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  ${image?`<meta property="og:image" content="${escapeHtml(imageUrl(image,1200,630))}">`:''}
  <link rel="icon" type="image/png" sizes="32x32" href="/img/icons/favicon-32x32.png">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Cabin:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="/css/bootstrap.min.css" rel="stylesheet">
  <link href="/css/style.css" rel="stylesheet">
  <link href="/css/b2b.css" rel="stylesheet">
  <link href="/css/article.css" rel="stylesheet">
  <script src="/js/tracking.js" defer></script>
  ${structured}`;
}

function page({title,description,canonical,noIndex=false,ogType='website',image='',jsonLd=[],active='',body=''}){
  return `<!doctype html>
<html lang="es">
<head>
  ${documentHead({title,description,canonical,noIndex,ogType,image,jsonLd})}
</head>
<body>
  ${nav(active)}
  ${body}
  ${footer()}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

function faqsSection(faqs,heading='Preguntas frecuentes'){
  const items=(faqs||[]).filter(item=>item?.question);
  if(!items.length)return '';
  return `<section class="ec-section ec-section-soft"><div class="ec-shell ec-split"><div><span class="ec-eyebrow">Preguntas frecuentes</span><h2>${escapeHtml(heading)}</h2></div><div class="ec-faq">${items.map(item=>`<details><summary>${escapeHtml(item.question)}</summary>${portableText(item.answer)||'<p>Respuesta en preparación.</p>'}</details>`).join('')}</div></div></section>`;
}

function faqJsonLd(faqs){
  const items=(faqs||[]).filter(item=>item?.question);
  if(!items.length)return null;
  return {'@context':'https://schema.org','@type':'FAQPage',mainEntity:items.map(item=>({
    '@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:plainPortableText(item.answer)}
  }))};
}

function collectionCard({title,summary,url,image='',meta=''}){
  const media=image?`<div class="ec-article-card__image"><img src="${escapeHtml(imageUrl(image,900,506))}" alt="${escapeHtml(title)}" loading="lazy" width="900" height="506"></div>`:'';
  return `<article class="ec-card">${media}${meta?`<span class="ec-pill">${escapeHtml(meta)}</span>`:''}<h3>${escapeHtml(title)}</h3>${summary?`<p>${escapeHtml(summary)}</p>`:''}<a class="ec-card-link" href="${escapeHtml(url)}">Ver detalle →</a></article>`;
}

function productCard(product){
  return collectionCard({
    title:product.title||'Producto Ecorise',summary:product.summary||'',url:`/productos/${product.slug}/`,
    image:product.images?.[0]?.url||'',meta:compact([refTitle(product.brand),refTitle(product.category)]).join(' · ')
  });
}

function solutionCard(solution){
  return collectionCard({title:solution.title||'Solución Ecorise',summary:solution.summary||'',url:`/soluciones/${solution.slug}/`,image:solution.heroImageUrl||'',meta:solution.audience||'Solución energética'});
}

function caseCard(caseStudy){
  return collectionCard({title:caseStudy.title||'Caso Ecorise',summary:caseStudy.seo?.description||'',url:`/casos/${caseStudy.slug}/`,image:caseStudy.heroImageUrl||'',meta:compact([caseStudy.segment,caseStudy.location]).join(' · ')||'Caso de estudio'});
}

function articleCard(article){
  const category=article.categories?.[0]?.title||'Bitácora Ecorise';
  const meta=compact([category,formatDate(article.publishedAt)]).join(' · ');
  const image=article.heroImageUrl?`<div class="ec-article-card__image"><img src="${escapeHtml(imageUrl(article.heroImageUrl,900,506))}" alt="${escapeHtml(article.heroAlt||article.title||'Artículo Ecorise')}" loading="lazy" width="900" height="506"></div>`:'';
  return `<article class="ec-article-card">${image}<div class="ec-article-card__body"><div class="meta">${escapeHtml(meta)}</div><h3>${escapeHtml(article.title||'Análisis Ecorise')}</h3>${article.excerpt?`<p>${escapeHtml(article.excerpt)}</p>`:''}<a class="ec-card-link" href="/bitacora/${article.slug}/" aria-label="Leer ${escapeHtml(article.title||'artículo')}">Leer análisis →</a></div></article>`;
}

function relatedCards(items,route,heading){
  if(!Array.isArray(items)||!items.length)return '';
  return `<section class="ec-section ec-section-soft"><div class="ec-shell"><div class="ec-split mb-5"><div><span class="ec-eyebrow">Relacionado</span><h2>${escapeHtml(heading)}</h2></div></div><div class="ec-card-grid">${items.filter(item=>item?.slug).map(item=>collectionCard({title:item.title||item.name||'Contenido Ecorise',summary:item.summary||'',url:`/${route}/${safeSlug(item.slug)}/`,image:item.imageUrl||item.heroImageUrl||'',meta:refTitle(item.brand)})).join('')}</div></div></section>`;
}

function emptyState(label,copy){return `<div class="ec-card"><span class="ec-eyebrow">Próximamente</span><h3>${escapeHtml(label)}</h3><p class="mb-0">${escapeHtml(copy)}</p></div>`;}

async function copyPublicTree(){
  await fs.rm(OUT,{recursive:true,force:true});
  await fs.mkdir(OUT,{recursive:true});
  const entries=await fs.readdir(ROOT,{withFileTypes:true});
  for(const entry of entries){
    if(EXCLUDED_TOP_LEVEL.has(entry.name)||entry.name.startsWith('.'))continue;
    await fs.cp(path.join(ROOT,entry.name),path.join(OUT,entry.name),{recursive:entry.isDirectory()});
  }
  await fs.writeFile(path.join(OUT,'.nojekyll'),'');
}

async function loadContent(){
  if(FIXTURE){
    const raw=JSON.parse(await fs.readFile(path.resolve(ROOT,FIXTURE),'utf8'));
    const result=raw.result??raw;
    if(Array.isArray(result))return {articles:result,products:[],solutions:[],cases:[]};
    return {articles:result.articles||[],products:result.products||[],solutions:result.solutions||[],cases:result.cases||result.caseStudies||[]};
  }

  const query=`{
    "articles": *[_type == "article" && defined(slug.current)] | order(publishedAt desc, _updatedAt desc){
      _id,_updatedAt,title,"slug":slug.current,excerpt,publishedAt,
      seo{title,description,noIndex,"imageUrl":image.asset->url},
      "heroImageUrl":heroImage.asset->url,"heroAlt":heroImage.alt,
      "categories":categories[]->{_id,title,"slug":slug.current},
      body[]{...,_type == "image" => {...,"url":asset->url}},
      faqs[]{_key,question,answer[]{...}},
      "relatedProducts":relatedProducts[]->{_id,title,summary,"slug":slug.current,"imageUrl":images[0].asset->url,"brand":brand->{title,name}},
      "relatedSolutions":relatedSolutions[]->{_id,title,summary,"slug":slug.current,"heroImageUrl":heroImage.asset->url,audience}
    },
    "products": *[_type == "product" && defined(slug.current)] | order(title asc){
      _id,_updatedAt,title,"slug":slug.current,sku,summary,availability,price,currency,datasheetUrl,recommendedFor,
      seo{title,description,noIndex,"imageUrl":image.asset->url},
      "brand":brand->{_id,title,name,"slug":slug.current},
      "category":category->{_id,title,name,"slug":slug.current},
      "images":images[]{alt,"url":asset->url},
      technicalSpecifications[]{_key,label,value,unit},
      description[]{...,_type == "image" => {...,"url":asset->url}},
      faqs[]{_key,question,answer[]{...}}
    },
    "solutions": *[_type == "solution" && defined(slug.current)] | order(title asc){
      _id,_updatedAt,title,"slug":slug.current,audience,summary,
      seo{title,description,noIndex,"imageUrl":image.asset->url},
      "heroImageUrl":heroImage.asset->url,"heroAlt":heroImage.alt,
      body[]{...,_type == "image" => {...,"url":asset->url}},
      "recommendedProducts":recommendedProducts[]->{_id,title,summary,"slug":slug.current,"imageUrl":images[0].asset->url,"brand":brand->{title,name},seo{noIndex}}
    },
    "cases": *[_type == "caseStudy" && defined(slug.current)] | order(_updatedAt desc){
      _id,_updatedAt,title,"slug":slug.current,clientName,location,segment,installedPowerKwp,estimatedAnnualGenerationKwh,estimatedSavingsPercent,paybackYears,
      seo{title,description,noIndex,"imageUrl":image.asset->url},
      "heroImageUrl":heroImage.asset->url,"heroAlt":heroImage.alt,
      body[]{...,_type == "image" => {...,"url":asset->url}},
      "products":products[]->{_id,title,summary,"slug":slug.current,"imageUrl":images[0].asset->url,"brand":brand->{title,name},seo{noIndex}}
    }
  }`;
  const endpoint=new URL(`https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`);
  endpoint.searchParams.set('query',query);
  endpoint.searchParams.set('perspective','published');
  const response=await fetch(endpoint,{headers:{Accept:'application/json'},cache:'no-store'});
  if(!response.ok)throw new Error(`Sanity respondió ${response.status}: ${await response.text()}`);
  const payload=await response.json();
  if(!payload.result||Array.isArray(payload.result))throw new Error('Sanity no devolvió el objeto de contenido esperado.');
  return payload.result;
}

function normalizeContent(content){
  const normalize=list=>(list||[]).map(item=>({...item,slug:safeSlug(item.slug)}));
  return {articles:normalize(content.articles),products:normalize(content.products),solutions:normalize(content.solutions),cases:normalize(content.cases)};
}

function isPromotable(item){return INCLUDE_NOINDEX||item.seo?.noIndex!==true;}
function isIndexable(item){return item.seo?.noIndex!==true;}

function collectionPage({kind,title,description,eyebrow,heading,intro,items,card,active}){
  // Published content is visible. noIndex only controls search indexing, not publication visibility.
  const listed=items;
  const indexable=items.filter(isIndexable);
  const canonical=`${BASE_URL}/${kind}/`;
  const itemList={'@context':'https://schema.org','@type':'CollectionPage',name:title,url:canonical,mainEntity:{'@type':'ItemList',itemListElement:indexable.map((item,index)=>({'@type':'ListItem',position:index+1,url:`${BASE_URL}/${kind}/${item.slug}/`,name:item.title}))}};
  const body=`<main><header class="ec-page-hero"><div class="ec-shell"><span class="ec-eyebrow">${escapeHtml(eyebrow)}</span><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(intro)}</p></div></header><section class="ec-section"><div class="ec-shell">${listed.length?`<div class="ec-card-grid">${listed.map(card).join('')}</div>`:emptyState('Todavía no hay contenido público en esta colección.','Cuando se publique contenido validado en Sanity, aparecerá acá automáticamente.')}</div></section><section class="ec-section ec-section-dark"><div class="ec-shell ec-split align-items-center"><div><span class="ec-eyebrow">¿Necesitás orientación?</span><h2>El catálogo es un punto de partida, no un dimensionamiento.</h2><p class="ec-lead">Podemos revisar consumo, infraestructura y restricciones antes de definir una solución o equipo.</p></div><div class="ec-cta"><h3>Revisá tu caso con Ecorise.</h3><a href="https://calendly.com/ecoriserenewable/30min" target="_blank" rel="noopener" class="btn btn-light py-3 px-4">Agendar diagnóstico</a></div></div></section></main>`;
  return page({title,description,canonical,noIndex:indexable.length===0,jsonLd:itemList,active,body});
}

function articlePage(article){
  const canonical=`${BASE_URL}/bitacora/${article.slug}/`;
  const title=article.seo?.title||`${article.title||'Análisis'} | Ecorise`;
  const description=article.seo?.description||article.excerpt||'Análisis técnico y estratégico de Ecorise sobre energía, ingeniería y decisiones empresariales.';
  const category=article.categories?.[0]?.title||'Bitácora Ecorise';
  const bodyHtml=portableText(article.body)||`<p class="ec-lead">${escapeHtml(article.excerpt||'Contenido en preparación.')}</p>`;
  const articleLd={'@context':'https://schema.org','@type':'Article',headline:article.title||title,description,datePublished:article.publishedAt||undefined,dateModified:article._updatedAt||article.publishedAt||undefined,mainEntityOfPage:canonical,author:{'@type':'Organization',name:'Ecorise'},publisher:{'@type':'Organization',name:'Ecorise',url:BASE_URL},...(article.heroImageUrl?{image:[article.heroImageUrl]}:{})};
  const body=`<main><header class="ec-page-hero"><div class="ec-shell"><span class="ec-eyebrow">${escapeHtml(category)}</span><h1>${escapeHtml(article.title||'Análisis Ecorise')}</h1>${article.excerpt?`<p>${escapeHtml(article.excerpt)}</p>`:''}${article.publishedAt?`<div class="ec-proof-strip"><span>${escapeHtml(formatDate(article.publishedAt))}</span></div>`:''}</div></header><section class="ec-section"><div class="ec-shell"><article class="ec-article-body">${imageFigure(article.heroImageUrl,article.heroAlt||article.title,{hero:true})}${bodyHtml}</article><div class="mt-5"><a href="/bitacora.html" class="ec-link-arrow">Volver a la bitácora</a></div></div></section>${relatedCards(article.relatedSolutions,'soluciones','Soluciones relacionadas')}${relatedCards(article.relatedProducts,'productos','Productos relacionados')}${faqsSection(article.faqs,'Preguntas relacionadas con este análisis.')}<section class="ec-section ec-section-dark"><div class="ec-shell ec-split align-items-center"><div><span class="ec-eyebrow">Tu operación</span><h2>Cada decisión cambia cuando se le ponen datos reales.</h2><p class="ec-lead">Si este tema se parece a tu problema, podemos revisar el contexto de tu empresa.</p></div><div class="ec-cta"><h3>Revisá tu caso con Ecorise.</h3><a href="https://calendly.com/ecoriserenewable/30min" target="_blank" rel="noopener" class="btn btn-light py-3 px-4">Agendar diagnóstico</a></div></div></section></main>`;
  return page({title,description,canonical,noIndex:article.seo?.noIndex===true,ogType:'article',image:article.seo?.imageUrl||article.heroImageUrl,jsonLd:[articleLd,faqJsonLd(article.faqs)],active:'bitacora',body});
}

function productPage(product){
  const canonical=`${BASE_URL}/productos/${product.slug}/`;
  const title=product.seo?.title||`${product.title||'Producto'} | Ecorise`;
  const description=product.seo?.description||product.summary||'Ficha técnica de producto disponible a través de Ecorise.';
  const brand=refTitle(product.brand);
  const category=refTitle(product.category);
  const specs=(product.technicalSpecifications||[]).filter(item=>item?.label&&item?.value);
  const specsHtml=specs.length?`<section class="ec-section ec-section-soft"><div class="ec-shell ec-split"><div><span class="ec-eyebrow">Especificaciones</span><h2>Datos técnicos declarados.</h2></div><div class="ec-rule-list">${specs.map(item=>`<div class="ec-rule-item"><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(`${item.value}${item.unit?` ${item.unit}`:''}`)}</p></div>`).join('')}</div></div></section>`:'';
  const availability=AVAILABILITY_LABELS[product.availability]||'';
  const meta=compact([brand,category,product.sku?`Modelo ${product.sku}`:'',availability]);
  const offer=Number.isFinite(product.price)&&product.currency?{'@type':'Offer',price:String(product.price),priceCurrency:product.currency,url:canonical,...(AVAILABILITY_SCHEMA[product.availability]?{availability:AVAILABILITY_SCHEMA[product.availability]}:{})}:undefined;
  const productLd={'@context':'https://schema.org','@type':'Product',name:product.title,description,image:(product.images||[]).map(item=>item.url).filter(Boolean),sku:product.sku||undefined,brand:brand?{'@type':'Brand',name:brand}:undefined,category:category||undefined,offers:offer};
  const body=`<main><header class="ec-page-hero"><div class="ec-shell"><span class="ec-eyebrow">Producto${category?` · ${escapeHtml(category)}`:''}</span><h1>${escapeHtml(product.title||'Producto Ecorise')}</h1>${product.summary?`<p>${escapeHtml(product.summary)}</p>`:''}${meta.length?`<div class="ec-proof-strip">${meta.map(item=>`<span>${escapeHtml(item)}</span>`).join('')}</div>`:''}</div></header><section class="ec-section"><div class="ec-shell ec-split"><div>${imageFigure(product.images?.[0]?.url,product.images?.[0]?.alt||product.title,{hero:true})}</div><article class="ec-article-body">${portableText(product.description)||`<p>${escapeHtml(product.summary||'Consultá disponibilidad y aplicación con Ecorise.')}</p>`}${product.datasheetUrl?`<p><a class="ec-link-arrow" href="${escapeHtml(product.datasheetUrl)}" target="_blank" rel="noopener">Ver ficha técnica oficial</a></p>`:''}</article></div></section>${specsHtml}${faqsSection(product.faqs,'Preguntas frecuentes sobre este equipo.')}<section class="ec-section ec-section-dark"><div class="ec-shell ec-split align-items-center"><div><span class="ec-eyebrow">Aplicación</span><h2>Un equipo correcto depende del sistema completo.</h2><p class="ec-lead">Validamos compatibilidad, arquitectura y condiciones de operación antes de recomendar componentes.</p></div><div class="ec-cta"><h3>Consultar este producto</h3><a href="https://wa.me/5493515177298" target="_blank" rel="noopener" class="btn btn-light py-3 px-4">Hablar por WhatsApp</a></div></div></section></main>`;
  return page({title,description,canonical,noIndex:product.seo?.noIndex===true,image:product.seo?.imageUrl||product.images?.[0]?.url,jsonLd:[productLd,faqJsonLd(product.faqs)],active:'solar',body});
}

function solutionPage(solution){
  const canonical=`${BASE_URL}/soluciones/${solution.slug}/`;
  const title=solution.seo?.title||`${solution.title||'Solución energética'} | Ecorise`;
  const description=solution.seo?.description||solution.summary||'Solución energética diseñada y evaluada por Ecorise.';
  const serviceLd={'@context':'https://schema.org','@type':'Service',name:solution.title,description,provider:{'@type':'Organization',name:'Ecorise',url:BASE_URL},areaServed:{'@type':'Country',name:'Argentina'},audience:solution.audience?{'@type':'Audience',audienceType:solution.audience}:undefined};
  const body=`<main><header class="ec-page-hero"><div class="ec-shell"><span class="ec-eyebrow">Solución${solution.audience?` · ${escapeHtml(solution.audience)}`:''}</span><h1>${escapeHtml(solution.title||'Solución energética')}</h1>${solution.summary?`<p>${escapeHtml(solution.summary)}</p>`:''}</div></header><section class="ec-section"><div class="ec-shell"><article class="ec-article-body">${imageFigure(solution.heroImageUrl,solution.heroAlt||solution.title,{hero:true})}${portableText(solution.body)||`<p>${escapeHtml(solution.summary||'Contenido en preparación.')}</p>`}</article></div></section>${relatedCards(solution.recommendedProducts,'productos','Equipos relacionados con esta solución')}<section class="ec-section ec-section-dark"><div class="ec-shell ec-split align-items-center"><div><span class="ec-eyebrow">Antes de definir tecnología</span><h2>Validemos si esta arquitectura encaja con tu operación.</h2></div><div class="ec-cta"><h3>Evaluar solución</h3><a href="https://calendly.com/ecoriserenewable/30min" target="_blank" rel="noopener" class="btn btn-light py-3 px-4">Agendar diagnóstico</a></div></div></section></main>`;
  return page({title,description,canonical,noIndex:solution.seo?.noIndex===true,image:solution.seo?.imageUrl||solution.heroImageUrl,jsonLd:serviceLd,active:'solar',body});
}

function casePage(caseStudy){
  const canonical=`${BASE_URL}/casos/${caseStudy.slug}/`;
  const title=caseStudy.seo?.title||`${caseStudy.title||'Caso de estudio'} | Ecorise`;
  const description=caseStudy.seo?.description||'Caso de estudio de Ecorise sobre una decisión o implementación energética.';
  const facts=compact([
    caseStudy.clientName&&['Cliente',caseStudy.clientName],caseStudy.location&&['Ubicación',caseStudy.location],caseStudy.segment&&['Segmento',caseStudy.segment],
    Number.isFinite(caseStudy.installedPowerKwp)&&['Potencia instalada',`${caseStudy.installedPowerKwp} kWp`],
    Number.isFinite(caseStudy.estimatedAnnualGenerationKwh)&&['Generación anual estimada',`${caseStudy.estimatedAnnualGenerationKwh.toLocaleString('es-AR')} kWh`],
    Number.isFinite(caseStudy.estimatedSavingsPercent)&&['Ahorro estimado',`${caseStudy.estimatedSavingsPercent}%`],
    Number.isFinite(caseStudy.paybackYears)&&['Payback estimado',`${caseStudy.paybackYears} años`]
  ]);
  const factsHtml=facts.length?`<section class="ec-section ec-section-soft"><div class="ec-shell"><div class="ec-card-grid">${facts.map(([label,value])=>`<div class="ec-card"><span class="ec-eyebrow">${escapeHtml(label)}</span><h3>${escapeHtml(value)}</h3></div>`).join('')}</div></div></section>`:'';
  const caseLd={'@context':'https://schema.org','@type':'Article',headline:caseStudy.title,description,mainEntityOfPage:canonical,dateModified:caseStudy._updatedAt||undefined,author:{'@type':'Organization',name:'Ecorise'},publisher:{'@type':'Organization',name:'Ecorise',url:BASE_URL},...(caseStudy.heroImageUrl?{image:[caseStudy.heroImageUrl]}:{})};
  const body=`<main><header class="ec-page-hero"><div class="ec-shell"><span class="ec-eyebrow">Caso de estudio${caseStudy.segment?` · ${escapeHtml(caseStudy.segment)}`:''}</span><h1>${escapeHtml(caseStudy.title||'Caso de estudio')}</h1><p>${escapeHtml(description)}</p></div></header>${factsHtml}<section class="ec-section"><div class="ec-shell"><article class="ec-article-body">${imageFigure(caseStudy.heroImageUrl,caseStudy.heroAlt||caseStudy.title,{hero:true})}${portableText(caseStudy.body)||'<p>Detalle del caso en preparación.</p>'}</article></div></section>${relatedCards(caseStudy.products,'productos','Equipos utilizados en este caso')}<section class="ec-section ec-section-dark"><div class="ec-shell ec-split align-items-center"><div><span class="ec-eyebrow">Tu proyecto</span><h2>Un caso sirve como referencia, no como promesa de resultado.</h2><p class="ec-lead">Consumo, tarifa, infraestructura y operación cambian de una empresa a otra.</p></div><div class="ec-cta"><h3>Evaluar un proyecto</h3><a href="https://calendly.com/ecoriserenewable/30min" target="_blank" rel="noopener" class="btn btn-light py-3 px-4">Agendar diagnóstico</a></div></div></section></main>`;
  return page({title,description,canonical,noIndex:caseStudy.seo?.noIndex===true,ogType:'article',image:caseStudy.seo?.imageUrl||caseStudy.heroImageUrl,jsonLd:caseLd,active:'empresas',body});
}

function injectBetween(source,start,end,content){
  const escapedStart=start.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const escapedEnd=end.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp(`(${escapedStart})[\\s\\S]*?(${escapedEnd})`);
  if(!pattern.test(source))throw new Error(`No se encontraron marcadores ${start} / ${end}`);
  return source.replace(pattern,`$1\n${content}\n$2`);
}

function injectBeforeFinalCta(source,content){
  const marker='<section class="ec-section ec-section-dark">';
  const index=source.lastIndexOf(marker);
  if(index>=0)return `${source.slice(0,index)}${content}\n${source.slice(index)}`;
  return source.replace('</main>',`${content}\n</main>`);
}

async function writeDetailPages(dirName,items,renderer){
  const base=path.join(OUT,dirName);
  await fs.rm(base,{recursive:true,force:true});
  await fs.mkdir(base,{recursive:true});
  for(const item of items){
    const dir=path.join(base,item.slug);
    await fs.mkdir(dir,{recursive:true});
    await fs.writeFile(path.join(dir,'index.html'),renderer(item));
  }
}

async function writeCollections(content){
  await fs.writeFile(path.join(OUT,'productos','index.html'),collectionPage({kind:'productos',title:'Productos de energía solar y almacenamiento | Ecorise',description:'Equipos fotovoltaicos, inversores, baterías y componentes disponibles a través de Ecorise, organizados por marca y categoría.',eyebrow:'Catálogo técnico',heading:'Productos para sistemas de energía solar y almacenamiento.',intro:'Fichas técnicas y equipos para evaluar dentro de una arquitectura energética completa.',items:content.products,card:productCard,active:'solar'}));
  await fs.writeFile(path.join(OUT,'soluciones','index.html'),collectionPage({kind:'soluciones',title:'Soluciones energéticas para empresas | Ecorise',description:'Soluciones de energía solar y gestión energética para empresas, industria, agro, comercio y residencias evaluadas por Ecorise.',eyebrow:'Soluciones',heading:'Arquitecturas energéticas según la operación.',intro:'Cada solución parte del consumo, la red, la continuidad requerida y el objetivo de inversión.',items:content.solutions,card:solutionCard,active:'solar'}));
  await fs.writeFile(path.join(OUT,'casos','index.html'),collectionPage({kind:'casos',title:'Casos de estudio de energía | Ecorise',description:'Casos de estudio de proyectos y decisiones energéticas desarrollados por Ecorise en Córdoba y Argentina.',eyebrow:'Casos de estudio',heading:'Proyectos analizados desde el contexto real.',intro:'Referencias de problemas, restricciones y decisiones técnicas. Los resultados dependen de cada operación.',items:content.cases,card:caseCard,active:'empresas'}));
}

async function enrichCorePages(content){
  // Strong SEO landing pages only promote indexable content. Preview may opt in to noIndex demos.
  const products=content.products.filter(isPromotable).slice(0,3);
  const solutions=content.solutions.filter(isPromotable).slice(0,3);
  const cases=content.cases.filter(isPromotable).slice(0,3);

  const solarPath=path.join(OUT,'energia-solar.html');
  let solar=await fs.readFile(solarPath,'utf8');
  const solarContent=`<section class="ec-section ec-section-soft"><div class="ec-shell"><div class="ec-split mb-5"><div><span class="ec-eyebrow">Contenido técnico</span><h2>De la arquitectura a los equipos concretos.</h2></div><p class="ec-lead">Explorá soluciones y fichas de producto administradas desde el CMS de Ecorise.</p></div>${solutions.length?`<h3 class="mb-4">Soluciones</h3><div class="ec-card-grid mb-5">${solutions.map(solutionCard).join('')}</div>`:''}${products.length?`<h3 class="mb-4">Productos</h3><div class="ec-card-grid mb-4">${products.map(productCard).join('')}</div>`:''}<div class="ec-hero-actions"><a class="ec-btn-secondary" href="/soluciones/">Ver todas las soluciones</a><a class="ec-btn-secondary" href="/productos/">Ver todos los productos</a></div></div></section>`;
  solar=injectBeforeFinalCta(solar,solarContent);
  await fs.writeFile(solarPath,solar);

  const empresasPath=path.join(OUT,'empresas.html');
  let empresas=await fs.readFile(empresasPath,'utf8');
  const casesContent=`<section class="ec-section"><div class="ec-shell"><div class="ec-split mb-5"><div><span class="ec-eyebrow">Casos de estudio</span><h2>Decisiones energéticas llevadas a contextos concretos.</h2></div><p class="ec-lead">Los casos ayudan a entender el proceso y las variables consideradas, sin extrapolar resultados entre empresas.</p></div>${cases.length?`<div class="ec-card-grid mb-4">${cases.map(caseCard).join('')}</div>`:''}<a class="ec-link-arrow" href="/casos/">Ver todos los casos</a></div></section>`;
  empresas=injectBeforeFinalCta(empresas,casesContent);
  await fs.writeFile(empresasPath,empresas);
}

function sitemapEntry(url,item,priority='0.7'){
  return `  <url><loc>${url}</loc>${item?._updatedAt?`<lastmod>${escapeHtml(item._updatedAt)}</lastmod>`:''}<changefreq>monthly</changefreq><priority>${priority}</priority></url>`;
}

async function writeSitemap(content){
  const entries=[];
  const configs=[
    ['bitacora',content.articles,'0.7'],['productos',content.products,'0.7'],['soluciones',content.solutions,'0.8'],['casos',content.cases,'0.7']
  ];
  for(const [route,items,priority] of configs){
    const indexable=items.filter(isIndexable);
    if(route!=='bitacora'&&indexable.length)entries.push(sitemapEntry(`${BASE_URL}/${route}/`,null,priority));
    for(const item of indexable)entries.push(sitemapEntry(`${BASE_URL}/${route}/${item.slug}/`,item,priority));
  }
  const sitemapPath=path.join(OUT,'sitemap.xml');
  const sitemap=await fs.readFile(sitemapPath,'utf8');
  await fs.writeFile(sitemapPath,injectBetween(sitemap,'<!-- GENERATED_CONTENT_START -->','<!-- GENERATED_CONTENT_END -->',entries.join('\n')));
}

async function writeManifest(content){
  await fs.rm(BUILD,{recursive:true,force:true});
  await fs.mkdir(BUILD,{recursive:true});
  const map=list=>list.map(item=>({slug:item.slug,title:item.title||'',noIndex:item.seo?.noIndex===true,updatedAt:item._updatedAt||null}));
  await fs.writeFile(path.join(BUILD,'content-manifest.json'),JSON.stringify({generatedAt:new Date().toISOString(),fixture:FIXTURE||null,includeNoIndex:INCLUDE_NOINDEX,articles:map(content.articles),products:map(content.products),solutions:map(content.solutions),cases:map(content.cases)},null,2));
}

async function writeBitacora(content){
  // As with other collections, every published article is visible; noIndex only affects robots/sitemap.
  const listed=content.articles;
  const bitacoraPath=path.join(OUT,'bitacora.html');
  const bitacora=await fs.readFile(bitacoraPath,'utf8');
  const listing=listed.length?`<div class="ec-article-grid">${listed.map(articleCard).join('')}</div>`:emptyState('Estamos preparando los primeros análisis de la Bitácora Ecorise.','Cuando se publiquen, aparecerán acá directamente desde nuestro espacio editorial.');
  await fs.writeFile(bitacoraPath,injectBetween(bitacora,'<!-- GENERATED_ARTICLES_START -->','<!-- GENERATED_ARTICLES_END -->',listing));
}

async function writeContent(rawContent){
  const content=normalizeContent(rawContent);
  await writeBitacora(content);
  await writeDetailPages('bitacora',content.articles,articlePage);
  await writeDetailPages('productos',content.products,productPage);
  await writeDetailPages('soluciones',content.solutions,solutionPage);
  await writeDetailPages('casos',content.cases,casePage);
  await writeCollections(content);
  await enrichCorePages(content);
  await writeSitemap(content);
  await writeManifest(content);
  const summary=['articles','products','solutions','cases'].map(key=>`${content[key].length} ${key}`).join(', ');
  console.log(`Sitio generado desde Sanity: ${summary}. Todo lo publicado es visible en su colección; noIndex excluye el documento del sitemap y de promoción SEO.`);
}

async function main(){
  await copyPublicTree();
  const content=await loadContent();
  await writeContent(content);
}

main().catch(error=>{console.error(error);process.exit(1);});
