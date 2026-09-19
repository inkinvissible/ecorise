import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const out=path.join(root,'_site');
const manifestPath=path.join(root,'.build','content-manifest.json');
const failures=[];

if(!fs.existsSync(manifestPath))failures.push('Falta .build/content-manifest.json. Ejecutá el build antes de este test.');
if(!fs.existsSync(out))failures.push('Falta _site. Ejecutá el build antes de este test.');
if(failures.length){console.error(failures.join('\n'));process.exit(1);}

const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const sitemap=fs.readFileSync(path.join(out,'sitemap.xml'),'utf8');
const bitacora=fs.readFileSync(path.join(out,'bitacora.html'),'utf8');
const solar=fs.readFileSync(path.join(out,'energia-solar.html'),'utf8');
const empresas=fs.readFileSync(path.join(out,'empresas.html'),'utf8');

if(/sanity-bitacora\.js/i.test(bitacora))failures.push('_site/bitacora.html todavía depende del fetch cliente de Sanity.');
if(/articulo\.html\?slug=/i.test(bitacora))failures.push('_site/bitacora.html todavía genera URLs dinámicas articulo.html?slug=.');

const configs=[
  {key:'articles',route:'bitacora',collectionFile:'bitacora.html'},
  {key:'products',route:'productos',collectionFile:'productos/index.html'},
  {key:'solutions',route:'soluciones',collectionFile:'soluciones/index.html'},
  {key:'cases',route:'casos',collectionFile:'casos/index.html'}
];

for(const config of configs){
  const collectionPath=path.join(out,config.collectionFile);
  if(!fs.existsSync(collectionPath)){
    failures.push(`Falta colección ${config.collectionFile}`);
    continue;
  }
  const collection=fs.readFileSync(collectionPath,'utf8');
  for(const item of manifest[config.key]||[]){
    const detailPath=path.join(out,config.route,item.slug,'index.html');
    const canonical=`https://ecorise.com.ar/${config.route}/${item.slug}/`;
    if(!fs.existsSync(detailPath)){
      failures.push(`Falta página estática para ${config.route}/${item.slug}`);
      continue;
    }
    const html=fs.readFileSync(detailPath,'utf8');
    const h1Count=(html.match(/<h1\b/gi)||[]).length;
    if(h1Count!==1)failures.push(`${config.route}/${item.slug}: debe tener exactamente un H1, tiene ${h1Count}`);
    if(!html.includes(`<link rel="canonical" href="${canonical}">`))failures.push(`${config.route}/${item.slug}: canonical incorrecto o ausente.`);
    if(/api\.sanity\.io|apicdn\.sanity\.io/i.test(html))failures.push(`${config.route}/${item.slug}: la página generada no debe hacer fetch cliente a Sanity.`);

    // Publication and indexing are separate concerns: every published document
    // must be visible in its collection even when the detail page is noindex.
    if(!collection.includes(`href="/${config.route}/${item.slug}/"`)){
      failures.push(`${config.route}/${item.slug}: documento publicado ausente de su colección.`);
    }

    if(item.noIndex){
      if(!/<meta\s+name="robots"\s+content="noindex,follow">/i.test(html))failures.push(`${config.route}/${item.slug}: noIndex=true pero falta meta robots noindex.`);
      if(sitemap.includes(`<loc>${canonical}</loc>`))failures.push(`${config.route}/${item.slug}: noIndex=true pero aparece en sitemap.`);
    }else{
      if(!sitemap.includes(`<loc>${canonical}</loc>`))failures.push(`${config.route}/${item.slug}: contenido indexable ausente del sitemap.`);
    }
  }
}

if(!solar.includes('href="/productos/"'))failures.push('energia-solar.html: falta acceso al catálogo de productos generado.');
if(!solar.includes('href="/soluciones/"'))failures.push('energia-solar.html: falta acceso a soluciones generadas.');
if(!empresas.includes('href="/casos/"'))failures.push('empresas.html: falta acceso a casos de estudio generados.');

// noIndex demos may be promoted into strong landing pages only in explicit preview builds.
if(manifest.includeNoIndex){
  if((manifest.products||[]).length&&!solar.includes('/productos/'))failures.push('Preview: Energía solar no enlaza productos.');
  if((manifest.solutions||[]).length&&!solar.includes('/soluciones/'))failures.push('Preview: Energía solar no enlaza soluciones.');
}

if(failures.length){console.error(failures.join('\n'));process.exit(1);}
const total=configs.reduce((sum,config)=>sum+(manifest[config.key]||[]).length,0);
console.log(`Contenido estático verificado: ${total} documento(s) generado(s) entre artículos, productos, soluciones y casos.`);
