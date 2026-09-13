import fs from 'node:fs';

const pages=[
  'index.html','about.html','contact.html','energia-solar.html','sustentabilidad.html',
  'consultoria-tecnica.html','mantenimiento.html','empresas.html','industria.html',
  'agroindustria.html','logistica.html','calculadora-energetica.html','bitacora.html',
  'webinar.html','articulo.html'
];

const failures=[];
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('js/tracking.js')) failures.push(`${file}: falta js/tracking.js`);
}

const tracking=fs.readFileSync('js/tracking.js','utf8');
for(const required of ['GTM-5Q7XKBN5','G-G4TLBRV3SH','AW-17629078632','2521676828246674','lead_intent_click','/js/motion.js','/css/motion.css']){
  if(!tracking.includes(required)) failures.push(`js/tracking.js: falta ${required}`);
}
if(/(?:href|src)=['"]?(?:css\/motion\.css|js\/motion\.js)/i.test(tracking)) failures.push('js/tracking.js: motion debe cargarse con rutas raíz para funcionar en URLs anidadas.');

if(!fs.existsSync('js/motion.js')) failures.push('falta js/motion.js');
if(!fs.existsSync('css/motion.css')) failures.push('falta css/motion.css');

if(failures.length){
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Tracking global y capa de interacción verificados en todas las páginas públicas.');
