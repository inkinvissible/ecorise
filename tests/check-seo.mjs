import fs from 'node:fs';

const pages=[
  'index.html','about.html','contact.html','energia-solar.html','sustentabilidad.html',
  'consultoria-tecnica.html','mantenimiento.html','empresas.html','industria.html',
  'agroindustria.html','logistica.html','calculadora-energetica.html','bitacora.html','webinar.html'
];
const failures=[];
const titles=new Map();
const canonicals=new Map();

function firstMatch(html,re){const m=html.match(re);return m?m[1].trim():'';}

for(const page of pages){
  const html=fs.readFileSync(page,'utf8');
  const title=firstMatch(html,/<title>([^<]+)<\/title>/i);
  const description=firstMatch(html,/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) || firstMatch(html,/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  const canonical=firstMatch(html,/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) || firstMatch(html,/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
  const h1Count=(html.match(/<h1\b/gi)||[]).length;

  if(!title || title.length<20 || title.length>70) failures.push(`${page}: title ausente o fuera de 20–70 caracteres (${title.length})`);
  if(!description || description.length<80 || description.length>180) failures.push(`${page}: meta description ausente o fuera de 80–180 caracteres (${description.length})`);
  if(!canonical.startsWith('https://ecorise.com.ar/')) failures.push(`${page}: canonical inválido -> ${canonical||'ausente'}`);
  if(h1Count!==1) failures.push(`${page}: debe tener exactamente un H1, tiene ${h1Count}`);

  if(title){if(titles.has(title)) failures.push(`${page}: title duplicado con ${titles.get(title)}`);else titles.set(title,page);}
  if(canonical){if(canonicals.has(canonical)) failures.push(`${page}: canonical duplicado con ${canonicals.get(canonical)}`);else canonicals.set(canonical,page);}
}

const sitemap=fs.readFileSync('sitemap.xml','utf8');
const expectedSitemap=pages.filter(page=>!['webinar.html'].includes(page)).map(page=>page==='index.html'?'https://ecorise.com.ar/':`https://ecorise.com.ar/${page}`);
for(const url of expectedSitemap){if(!sitemap.includes(`<loc>${url}</loc>`)) failures.push(`sitemap.xml: falta ${url}`);}

const robots=fs.readFileSync('robots.txt','utf8');
if(!robots.includes('Sitemap: https://ecorise.com.ar/sitemap.xml')) failures.push('robots.txt: falta referencia al sitemap canónico.');

if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`SEO básico verificado en ${pages.length} páginas.`);
