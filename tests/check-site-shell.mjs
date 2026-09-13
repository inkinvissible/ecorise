import fs from 'node:fs';

const pages = [
  'index.html',
  'about.html',
  'contact.html',
  'energia-solar.html',
  'sustentabilidad.html',
  'consultoria-tecnica.html',
  'mantenimiento.html',
  'empresas.html',
  'industria.html',
  'agroindustria.html',
  'logistica.html',
  'calculadora-energetica.html',
  'bitacora.html',
  'webinar.html',
  'articulo.html'
];

const navItems = [
  ['index.html', 'Inicio'],
  ['empresas.html', 'Empresas'],
  ['energia-solar.html', 'Energía solar'],
  ['consultoria-tecnica.html', 'Ingeniería'],
  ['mantenimiento.html', 'Operación'],
  ['bitacora.html', 'Bitácora']
];

const failures = [];

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');

  if (!html.includes('data-site-nav="v1"')) failures.push(`${file}: falta data-site-nav="v1"`);
  if (!html.includes('data-site-footer="v1"')) failures.push(`${file}: falta data-site-footer="v1"`);
  if (!html.includes('href="https://calendly.com/ecoriserenewable/30min"')) failures.push(`${file}: falta CTA global de diagnóstico`);
  if (!html.includes('class="ec-footer-logo"')) failures.push(`${file}: footer no usa el logo transparente compartido`);
  if (/ec-footer-logo[^>]*(bg-white|background)/.test(html)) failures.push(`${file}: el logo del footer no debe tener fondo artificial`);

  for (const [href, label] of navItems) {
    if (!html.includes(`href="${href}"`) || !html.includes(`>${label}</a>`)) failures.push(`${file}: navegación inconsistente, falta ${label} (${href})`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Site shell consistente en ${pages.length} páginas.`);
