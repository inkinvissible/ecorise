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

const failures=[];
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  for(const pattern of forbidden){
    if(pattern.test(html))failures.push(`${file}: copy interno expuesto (${pattern})`);
  }
}

const bitacora=fs.readFileSync('bitacora.html','utf8');
const main=bitacora.match(/<main>([\s\S]*?)<\/main>/i)?.[1]||'';
if(/<img\b/i.test(main)) failures.push('bitacora.html: no debe contener imágenes editoriales hardcodeadas; deben venir de artículos reales de Sanity');
if(!bitacora.includes('data-editorial-empty')) failures.push('bitacora.html: falta estado vacío editorial limpio');

if(failures.length){
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Copy público y estado editorial de Bitácora verificados.');
