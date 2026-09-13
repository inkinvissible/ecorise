import fs from 'node:fs';

const css=fs.readFileSync('css/b2b.css','utf8');
const failures=[];
const required=[
  ['--ec-blue','#1B4965'],
  ['--ec-tech','#145C6E'],
  ['--ec-energy','#189790'],
  ['--ec-white','#FDFEFC']
];

for(const [token,value] of required){
  const compact=css.replace(/\s+/g,'');
  if(!compact.toLowerCase().includes(`${token}:${value}`.toLowerCase())) failures.push(`Falta token oficial ${token}: ${value}`);
}

if(/(?:linear|radial|conic)-gradient\s*\(/i.test(css)) failures.push('La guía Ecorise prohíbe degradados en el sistema visual institucional.');
if(!/\.btn\.btn-primary\{[^}]*background:var\(--ec-blue\)/s.test(css)) failures.push('El botón primario debe usar --ec-blue.');
if(!/\.ec-footer\{[^}]*background:var\(--ec-blue\)/s.test(css)) failures.push('El footer debe usar --ec-blue.');
if(!/\.ec-footer-logo\{[^}]*filter:brightness\(0\) invert\(1\)/s.test(css)) failures.push('El logo del footer debe usar el recurso transparente sin caja de fondo.');

if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('Paleta y reglas visuales Ecorise verificadas.');
