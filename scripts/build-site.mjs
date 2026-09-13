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
  'LICENSE.txt','READ-ME.txt','README.md','README'
]);

function escapeHtml(value=''){
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function safeJson(value){return JSON.stringify(value).replace(/</g,'\\u003c');}

function safeSlug(value){
  const slug=String(value||'').trim();
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Slug inválido para generación estática: ${slug||'(vacío)'}`);
  return slug;
}

function formatDate(value){
  if(!value)return 'Bitácora Ecorise';
  try{return new Intl.DateTimeFormat('es-AR',{year:'numeric',month:'long',day:'numeric',timeZone:'America/Argentina/Cordoba'}).format(new Date(value));}
  catch{return 'Bitácora Ecorise';}
}

function imageUrl(url,width,height){
  if(!url)return '';
  const params=new URLSearchParams({w:String(width),auto:'format'});
  if(height){params.set('h',String(height));params.set('fit','crop');}
  return `${url}?${params.toString()}`;
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
          const safe=/^(https?:\/\/|mailto:|\/|#)/i.test(href);
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

async function copyPublicTree(){
  await fs.rm(OUT,{recursive:true,force:true});
  await fs.mkdir(OUT,{recursive:true});
  const entries=await fs.readdir(ROOT,{withFileTypes:true});
  for(const entry of entries){
    if(EXCLUDED_TOP_LEVEL.has(entry.name))continue;
    if(entry.name.startsWith('.'))continue;
    const source=path.join(ROOT,entry.name);
    const target=path.join(OUT,entry.name);
    await fs.cp(source,target,{recursive:entry.isDirectory()});
  }
  await fs.writeFile(path.join(OUT,'.nojekyll'),'');
}

async function loadArticles(){
  if(FIXTURE){
    const raw=JSON.parse(await fs.readFile(path.resolve(ROOT,FIXTURE),'utf8'));
    return Array.isArray(raw)?raw:(raw.result||[]);
  }

  const query=`*[_type == "article" && defined(slug.current)] | order(publishedAt desc, _updatedAt desc){
    _id,_updatedAt,title,"slug":slug.current,excerpt,publishedAt,
    seo{title,description,noIndex},
    "heroImageUrl":heroImage.asset->url,"heroAlt":heroImage.alt,
    "categories":categories[]->{title},
    body[]{...,_type == "image" => {...,"url":asset->url}},
    faqs[]{_key,question,answer[]{...}},
    "relatedProducts":relatedProducts[]->{_id,title,name,"slug":slug.current},
    "relatedSolutions":relatedSolutions[]->{_id,title,name,"slug":slug.current}
  }`;
  const endpoint=new URL(`https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`);
  endpoint.searchParams.set('query',query);
  endpoint.searchParams.set('perspective','published');
  const response=await fetch(endpoint,{headers:{Accept:'application/json'},cache:'no-store'});
  if(!response.ok)throw new Error(`Sanity respondió ${response.status}: ${await response.text()}`);
  const payload=await response.json();
  if(!Array.isArray(payload.result))throw new Error('Sanity no devolvió una lista de artículos.');
  return payload.result;
}

function articleCard(article){
  const slug=safeSlug(article.slug);
  const category=article.categories?.[0]?.title||'Bitácora Ecorise';
  const meta=[category,formatDate(article.publishedAt)].filter(Boolean).join(' · ');
  const image=article.heroImageUrl?`<div class="ec-article-card__image"><img src="${escapeHtml(imageUrl(article.heroImageUrl,900,506))}" alt="${escapeHtml(article.heroAlt||article.title||'Artículo Ecorise')}" loading="lazy" width="900" height="506"></div>`:'';
  return `<article class="ec-article-card">${image}<div class="ec-article-card__body"><div class="meta">${escapeHtml(meta)}</div><h3>${escapeHtml(article.title||'Análisis Ecorise')}</h3>${article.excerpt?`<p>${escapeHtml(article.excerpt)}</p>`:''}<a class="ec-card-link" href="/bitacora/${slug}/" aria-label="Leer ${escapeHtml(article.title||'artículo')}">Leer análisis →</a></div></article>`;
}

function emptyState(){
  return `<div class="ec-card" data-editorial-empty><span class="ec-eyebrow">Próximamente</span><h3>Estamos preparando los primeros análisis de la Bitácora Ecorise.</h3><p class="mb-0">Cuando se publiquen, aparecerán acá directamente desde nuestro espacio editorial.</p></div>`;
}

function injectBetween(source,start,end,content){
  const pattern=new RegExp(`(${start.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')})[\\s\\S]*?(${end.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')})`);
  if(!pattern.test(source))throw new Error(`No se encontraron marcadores ${start} / ${end}`);
  return source.replace(pattern,`$1\n${content}\n$2`);
}

function articlePage(article){
  const slug=safeSlug(article.slug);
  const canonical=`${BASE_URL}/bitacora/${slug}/`;
  const title=article.seo?.title||`${article.title||'Análisis'} | Ecorise`;
  const description=article.seo?.description||article.excerpt||'Análisis técnico y estratégico de Ecorise sobre energía, ingeniería y decisiones empresariales.';
  const category=article.categories?.[0]?.title||'Bitácora Ecorise';
  const noIndex=article.seo?.noIndex===true;
  const body=portableText(article.body)||`<p class="ec-lead">${escapeHtml(article.excerpt||'Contenido en preparación.')}</p>`;
  const hero=article.heroImageUrl?`<figure class="ec-article-figure ec-article-figure--hero"><img src="${escapeHtml(imageUrl(article.heroImageUrl,1400,788))}" alt="${escapeHtml(article.heroAlt||article.title||'')}" width="1400" height="788"></figure>`:'';
  const faqs=(article.faqs||[]).filter(item=>item?.question);
  const faqHtml=faqs.length?`<section class="ec-section ec-section-soft"><div class="ec-shell ec-split"><div><span class="ec-eyebrow">Preguntas frecuentes</span><h2>Preguntas relacionadas con este análisis.</h2></div><div class="ec-faq">${faqs.map(f=>`<details><summary>${escapeHtml(f.question)}</summary>${portableText(f.answer)||'<p>Respuesta en preparación.</p>'}</details>`).join('')}</div></div></section>`:'';
  const articleLd={
    '@context':'https://schema.org','@type':'Article',headline:article.title||title,description,
    datePublished:article.publishedAt||undefined,dateModified:article._updatedAt||article.publishedAt||undefined,
    mainEntityOfPage:canonical,author:{'@type':'Organization',name:'Ecorise'},publisher:{'@type':'Organization',name:'Ecorise',url:BASE_URL},
    ...(article.heroImageUrl?{image:[article.heroImageUrl]}:{})
  };
  const faqLd=faqs.length?{
    '@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(f=>({
      '@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:(f.answer||[]).flatMap(b=>b.children||[]).map(s=>s.text||'').join(' ').trim()}
    }))
  }:null;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${noIndex?'<meta name="robots" content="noindex,follow">':''}
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  ${article.heroImageUrl?`<meta property="og:image" content="${escapeHtml(imageUrl(article.heroImageUrl,1200,630))}">`:''}
  <link rel="icon" type="image/png" sizes="32x32" href="/img/icons/favicon-32x32.png">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Cabin:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="/css/bootstrap.min.css" rel="stylesheet">
  <link href="/css/style.css" rel="stylesheet">
  <link href="/css/b2b.css" rel="stylesheet">
  <link href="/css/article.css" rel="stylesheet">
  <script src="/js/tracking.js" defer></script>
  <script type="application/ld+json">${safeJson(articleLd)}</script>
  ${faqLd?`<script type="application/ld+json">${safeJson(faqLd)}</script>`:''}
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-light sticky-top px-lg-5 ec-nav" aria-label="Navegación principal" data-site-nav="v1"><a href="/index.html" class="navbar-brand ms-4 ms-lg-0"><img src="/img/logo.png" alt="Ecorise"></a><button class="navbar-toggler me-4" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Abrir navegación"><span class="navbar-toggler-icon" aria-hidden="true"></span></button><div class="collapse navbar-collapse" id="mainNav"><div class="navbar-nav ms-auto p-4 p-lg-0"><a href="/index.html" class="nav-item nav-link">Inicio</a><a href="/empresas.html" class="nav-item nav-link">Empresas</a><a href="/energia-solar.html" class="nav-item nav-link">Energía solar</a><a href="/consultoria-tecnica.html" class="nav-item nav-link">Ingeniería</a><a href="/mantenimiento.html" class="nav-item nav-link">Operación</a><a href="/bitacora.html" class="nav-item nav-link active">Bitácora</a></div><a href="https://calendly.com/ecoriserenewable/30min" target="_blank" rel="noopener" class="btn btn-primary py-2 px-4 ec-nav-cta">Agendar diagnóstico</a></div></nav>
  <main>
    <header class="ec-page-hero"><div class="ec-shell"><span class="ec-eyebrow">${escapeHtml(category)}</span><h1>${escapeHtml(article.title||'Análisis Ecorise')}</h1>${article.excerpt?`<p>${escapeHtml(article.excerpt)}</p>`:''}<div class="ec-proof-strip"><span>${escapeHtml(formatDate(article.publishedAt))}</span></div></div></header>
    <section class="ec-section"><div class="ec-shell"><article class="ec-article-body">${hero}${body}</article><div class="mt-5"><a href="/bitacora.html" class="ec-link-arrow">Volver a la bitácora</a></div></div></section>
    ${faqHtml}
    <section class="ec-section ec-section-dark"><div class="ec-shell ec-split align-items-center"><div><span class="ec-eyebrow">Tu operación</span><h2>Cada decisión cambia cuando se le ponen datos reales.</h2><p class="ec-lead">Si este tema se parece a tu problema, podemos revisar el contexto de tu empresa.</p></div><div class="ec-cta"><h3>Revisá tu caso con Ecorise.</h3><p>Coordiná una primera conversación.</p><a href="https://calendly.com/ecoriserenewable/30min" target="_blank" rel="noopener" class="btn btn-light py-3 px-4">Agendar diagnóstico</a></div></div></section>
  </main>
  <footer class="ec-footer py-5" data-site-footer="v1"><div class="ec-shell"><div class="row g-4 align-items-end"><div class="col-lg-5"><img src="/img/logo.png" alt="Ecorise" class="ec-footer-logo"><p class="mt-3 mb-0">Córdoba, Argentina · info@ecorise.com.ar · +54 351 517-7298</p></div><div class="col-lg-7"><nav class="ec-footer-nav" aria-label="Navegación del pie"><a href="/index.html">Inicio</a><a href="/empresas.html">Empresas</a><a href="/energia-solar.html">Energía solar</a><a href="/consultoria-tecnica.html">Ingeniería</a><a href="/mantenimiento.html">Operación</a><a href="/bitacora.html">Bitácora</a><a href="/contact.html">Contacto</a></nav></div></div></div></footer>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

async function writeContent(articles){
  const normalized=articles.map(article=>({...article,slug:safeSlug(article.slug)}));
  const listed=normalized.filter(article=>INCLUDE_NOINDEX||article.seo?.noIndex!==true);

  const bitacoraPath=path.join(OUT,'bitacora.html');
  const bitacora=await fs.readFile(bitacoraPath,'utf8');
  const listing=listed.length?`<div class="ec-article-grid">${listed.map(articleCard).join('')}</div>`:emptyState();
  await fs.writeFile(bitacoraPath,injectBetween(bitacora,'<!-- GENERATED_ARTICLES_START -->','<!-- GENERATED_ARTICLES_END -->',listing));

  const articleDir=path.join(OUT,'bitacora');
  await fs.rm(articleDir,{recursive:true,force:true});
  for(const article of normalized){
    const dir=path.join(articleDir,article.slug);
    await fs.mkdir(dir,{recursive:true});
    await fs.writeFile(path.join(dir,'index.html'),articlePage(article));
  }

  const sitemapPath=path.join(OUT,'sitemap.xml');
  const sitemap=await fs.readFile(sitemapPath,'utf8');
  const sitemapEntries=normalized
    .filter(article=>article.seo?.noIndex!==true)
    .map(article=>`  <url><loc>${BASE_URL}/bitacora/${article.slug}/</loc>${article._updatedAt?`<lastmod>${escapeHtml(article._updatedAt)}</lastmod>`:''}<changefreq>monthly</changefreq><priority>0.7</priority></url>`)
    .join('\n');
  await fs.writeFile(sitemapPath,injectBetween(sitemap,'<!-- GENERATED_ARTICLES_START -->','<!-- GENERATED_ARTICLES_END -->',sitemapEntries));

  await fs.rm(BUILD,{recursive:true,force:true});
  await fs.mkdir(BUILD,{recursive:true});
  await fs.writeFile(path.join(BUILD,'content-manifest.json'),JSON.stringify({
    generatedAt:new Date().toISOString(),fixture:FIXTURE||null,includeNoIndex:INCLUDE_NOINDEX,
    articles:normalized.map(article=>({slug:article.slug,title:article.title||'',noIndex:article.seo?.noIndex===true,updatedAt:article._updatedAt||null}))
  },null,2));

  console.log(`Sitio generado: ${normalized.length} artículo(s), ${listed.length} visible(s) en Bitácora, ${normalized.filter(a=>a.seo?.noIndex!==true).length} indexable(s).`);
}

async function main(){
  await copyPublicTree();
  const articles=await loadArticles();
  await writeContent(articles);
}

main().catch(error=>{console.error(error);process.exit(1);});
