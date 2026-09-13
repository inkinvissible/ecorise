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
const bitacora=fs.readFileSync(path.join(out,'bitacora.html'),'utf8');
const sitemap=fs.readFileSync(path.join(out,'sitemap.xml'),'utf8');

if(/sanity-bitacora\.js/i.test(bitacora))failures.push('_site/bitacora.html todavía depende del fetch cliente de Sanity.');
if(/articulo\.html\?slug=/i.test(bitacora))failures.push('_site/bitacora.html todavía genera URLs dinámicas articulo.html?slug=.');

for(const article of manifest.articles||[]){
  const articlePath=path.join(out,'bitacora',article.slug,'index.html');
  const canonical=`https://ecorise.com.ar/bitacora/${article.slug}/`;
  if(!fs.existsSync(articlePath)){
    failures.push(`Falta página estática para ${article.slug}`);
    continue;
  }
  const html=fs.readFileSync(articlePath,'utf8');
  const h1Count=(html.match(/<h1\b/gi)||[]).length;
  if(h1Count!==1)failures.push(`${article.slug}: debe tener exactamente un H1, tiene ${h1Count}`);
  if(!html.includes(`<link rel="canonical" href="${canonical}">`))failures.push(`${article.slug}: canonical incorrecto o ausente.`);
  if(/sanity-articulo\.js/i.test(html))failures.push(`${article.slug}: todavía depende del fetch cliente de Sanity.`);
  if(/articulo\.html\?slug=/i.test(html))failures.push(`${article.slug}: conserva URL dinámica legacy.`);

  if(article.noIndex){
    if(!/<meta\s+name="robots"\s+content="noindex,follow">/i.test(html))failures.push(`${article.slug}: noIndex=true pero falta meta robots noindex.`);
    if(sitemap.includes(`<loc>${canonical}</loc>`))failures.push(`${article.slug}: noIndex=true pero aparece en sitemap.`);
  }else{
    if(!sitemap.includes(`<loc>${canonical}</loc>`))failures.push(`${article.slug}: artículo indexable ausente del sitemap.`);
    if(!bitacora.includes(`href="/bitacora/${article.slug}/"`))failures.push(`${article.slug}: artículo indexable ausente de la Bitácora.`);
  }
}

if(manifest.includeNoIndex){
  for(const article of manifest.articles||[]){
    if(article.noIndex&&!bitacora.includes(`href="/bitacora/${article.slug}/"`))failures.push(`${article.slug}: preview pidió incluir noIndex pero no aparece en Bitácora.`);
  }
}

if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Contenido estático verificado: ${(manifest.articles||[]).length} artículo(s) generado(s).`);
