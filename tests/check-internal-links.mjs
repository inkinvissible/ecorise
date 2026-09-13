import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const pages=[
  'index.html','about.html','contact.html','energia-solar.html','sustentabilidad.html',
  'consultoria-tecnica.html','mantenimiento.html','empresas.html','industria.html',
  'agroindustria.html','logistica.html','calculadora-energetica.html','bitacora.html','webinar.html'
];
const failures=[];
const ignored=/^(https?:|mailto:|tel:|#|javascript:|data:)/i;

for(const page of pages){
  const html=await readFile(page,'utf8');
  const refs=[...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map(m=>m[1]);
  for(const ref of refs){
    if(!ref || ignored.test(ref)) continue;
    const clean=decodeURIComponent(ref.split('#')[0].split('?')[0]);
    if(!clean) continue;
    const target=path.resolve(path.dirname(page),clean);
    try{await access(target,constants.F_OK);}catch{failures.push(`${page}: referencia inexistente -> ${ref}`);}
  }
}

if(failures.length){
  console.error('Se encontraron enlaces o assets internos rotos:\n'+failures.join('\n'));
  process.exit(1);
}
console.log(`OK: enlaces y assets internos verificados en ${pages.length} páginas.`);
