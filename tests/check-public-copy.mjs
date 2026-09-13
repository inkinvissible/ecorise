import fs from 'node:fs';

const pages=[
  'index.html','about.html','contact.html','energia-solar.html','sustentabilidad.html',
  'consultoria-tecnica.html','mantenimiento.html','empresas.html','industria.html',
  'agroindustria.html','logistica.html','calculadora-energetica.html','bitacora.html',
  'webinar.html','articulo.html'
];

const forbidden=[
  /\bSanity\b/i,
  /\bCMS\b/i,
  /\bfallback\b/i,
  /SEO\s*\+/i,
  /vender mejor/i,
  /contenido editorial actualizado/i,
  /consultando el contenido editorial/i
];

function visiblePublicCopy(html){
  const title=html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'';
  const description=html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1]
    ||html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i)?.[1]
    ||'';
  const body=html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]||'';
  const visibleBody=body
    .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi,' ')
    .replace(/<!--[\s\S]*?-->/g,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/\s+/g,' ');
  return `${title} ${description} ${visibleBody}`;
}

const failures=[];
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  const publicCopy=visiblePublicCopy(html);
  for(const pattern of forbidden){
    if(pattern.test(publicCopy))failures.push(`${file}: copy interno visible expuesto (${pattern})`);
  }
}

const bitacora=fs.readFileSync('bitacora.html','utf8');
const main=bitacora.match(/<main>([\s\S]*?)<\/main>/i)?.[1]||'';
if(/<img\b/i.test(main)) failures.push('bitacora.html: no debe contener imágenes editoriales hardcodeadas; deben venir de artículos reales');
if(!bitacora.includes('data-editorial-empty')) failures.push('bitacora.html: falta estado vacío editorial limpio');

if(failures.length){
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Copy público visible y estado editorial de Bitácora verificados.');
