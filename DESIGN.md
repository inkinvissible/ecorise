# Ecorise Design System

## Design intent

Ecorise debe sentirse como una firma de ingeniería y estrategia energética con una identidad fuerte, técnica y reconocible. La web debe compartir ADN con la comunicación de `@er.ecorise`, pero sin transformarse en una grilla de piezas de Instagram.

Evitar dos extremos: el template genérico de empresa solar y la estética SaaS/editorial genérica. La marca debe sentirse propia.

## Paleta institucional

La guía de marca vigente define cuatro colores principales:

- `--ec-blue: #1B4965` — **Azul profundo.** Color institucional principal. Fondos, títulos, barras, superficies sólidas y botón primario.
- `--ec-tech: #145C6E` — **Verde técnico.** Segundo color sólido para acciones, jerarquías, bordes y botón alternativo.
- `--ec-energy: #189790` — **Verde energía.** Acentos, iconografía, líneas, highlights e indicadores. No usar texto blanco pequeño sobre este color por contraste.
- `--ec-white: #FDFEFC` — **Blanco puro.** Fondo principal y color de contraste sobre azul/verde técnico.

Colores auxiliares del sistema web (`--ec-ink`, `--ec-muted`, `--ec-surface`, `--ec-line`) solo pueden utilizarse como neutrales funcionales. No deben competir con la identidad institucional.

## Restricciones de color

- No usar más de dos colores secundarios dentro del mismo componente.
- No usar degradados entre colores institucionales.
- No alterar tono, saturación o luminosidad de los colores institucionales para crear variantes arbitrarias.
- No usar verde sobre verde ni azul sobre azul cuando se necesite atención inmediata.
- Para acciones sólidas utilizar `#1B4965` o `#145C6E` con texto blanco.
- `#189790` se reserva principalmente para acentos, separadores, badges y señalización visual.

## Visual world

- Fotografía técnica real: instalaciones, paneles, industria, agroindustria, mantenimiento e infraestructura.
- Bloques tipográficos fuertes sobre superficies institucionales.
- Geometrías diagonales o angulares inspiradas en la comunicación de Ecorise.
- Blanco suficiente para lectura y percepción premium.
- Números, conceptos y frases breves pueden recibir protagonismo visual.
- Superficies cuadradas o con radio pequeño. Evitar exceso de pills, glassmorphism y tarjetas flotantes.

## Typography

- Display y headings: Montserrat, peso alto, tracking negativo controlado.
- Body: Cabin, idealmente entre 65 y 75 caracteres por línea.
- La jerarquía surge de tamaño, peso, espacio y color; no de convertir todos los labels a mayúsculas.
- Los textos largos deben conservar una lectura tranquila aunque los títulos sean más expresivos.

## Navigation

La navegación es un componente global, no una decisión de cada página. Todas las páginas públicas principales deben mantener el mismo orden:

1. Inicio
2. Empresas
3. Energía solar
4. Ingeniería
5. Operación
6. Bitácora
7. CTA: Agendar diagnóstico

Solo cambia el estado activo. El footer también debe ser consistente en todas las páginas.

## Components

- **Hero:** fotografía técnica con overlay azul sólido/transparente cuando existe una imagen realmente pertinente; una propuesta clara, un CTA primario y como máximo una acción secundaria.
- **Buttons:** azul profundo o verde técnico; texto blanco y radio pequeño.
- **Accent:** verde energía para líneas, indicadores, badges y geometrías.
- **Cards:** borde fino, radio pequeño, composición estable; no superponer tarjetas.
- **Sector cards:** pueden usar fotografía cuando la imagen representa de forma clara el sector enlazado.
- **CTA:** superficie sólida verde técnico o azul profundo con barra/acento verde energía.
- **Footer:** azul profundo, logo transparente convertido a blanco mediante CSS; nunca colocar el logo dentro de una caja blanca artificial.
- **Bitácora:** muestra únicamente artículos reales publicados desde Sanity. No inventar artículos, títulos o imágenes de relleno cuando el CMS está vacío.

## Imagery and SEO

Las imágenes deben aportar contexto verificable, no ocupar espacio. No agregar una galería o una imagen simplemente porque una sección se siente vacía. Si el texto y la jerarquía resuelven la sección, la página puede quedar sin imagen.

Reglas prácticas:

- Preferir una imagen fuerte y pertinente antes que tres imágenes genéricas.
- No repetir el mismo activo en una misma página salvo que exista una razón editorial clara.
- No reutilizar una foto técnica para representar un artículo, caso, servicio o proyecto que no corresponde a esa foto.
- En la Bitácora, las imágenes de tarjetas deben venir del `heroImage` del artículo en Sanity. Si el artículo no tiene imagen, la tarjeta se muestra sin imagen.
- Los estados vacíos del CMS nunca usan artículos o fotografías ficticias.
- Priorizar activos existentes de Ecorise únicamente cuando describen correctamente el contenido donde aparecen.

Agregar contenido para SEO solo cuando responde preguntas reales de búsqueda. Evitar keyword stuffing. Las secciones FAQ, metodología, escenarios de uso y criterios de decisión son preferibles a párrafos genéricos de relleno.

## Public copy hygiene

La web pública nunca debe explicar decisiones internas del proyecto. No mostrar textos como “SEO”, “CMS”, “Sanity”, “fallback”, “contenido para vender mejor”, notas de implementación, comentarios para el equipo o justificaciones del diseño. Esos conceptos pertenecen a documentación interna, no a la experiencia del visitante.

## Motion and narrative flow

El movimiento debe ayudar a contar la secuencia de decisión de Ecorise: problema, análisis, criterio, alternativa y acción. No usar animación como decoración independiente.

- Los reveals de scroll son cortos, con poco desplazamiento y stagger limitado.
- El hero puede introducir texto y acciones en secuencia para marcar el inicio del relato.
- Procesos y metodologías pueden mostrar avance visual a medida que el usuario recorre la sección.
- Cards, imágenes, links y CTAs responden al hover con desplazamientos mínimos; nunca deben “flotar” de forma exagerada.
- Un indicador de progreso de página puede acompañar el recorrido de forma casi imperceptible.
- El parallax, cuando existe, debe limitarse a pocos píxeles y sólo en elementos visuales de gran escala.
- Las páginas pueden tener patrones narrativos propios cuando ayudan a comprender una decisión: por ejemplo, comparar arquitecturas solares de forma interactiva o recorrer etapas de consultoría con foco progresivo.
- Los componentes interactivos deben conservar todo el contenido en HTML para que siga siendo indexable, accesible y visible si JavaScript falla.
- No bloquear ni ocultar contenido si JavaScript falla.
- No introducir dependencias pesadas de animación para efectos que CSS/IntersectionObserver o JavaScript nativo pueden resolver.
- Respetar siempre `prefers-reduced-motion`; en ese modo el contenido se presenta directamente y sin movimiento innecesario.

## Responsive behavior

Desktop puede usar composiciones asimétricas. En mobile, el contenido se vuelve un flujo único legible, los CTAs se expanden cuando ayuda y nunca debe aparecer overflow horizontal.

## Content rules

- No inventar ahorros, ROI, payback, clientes ni resultados.
- No posicionar Ecorise como mero instalador de paneles.
- Explicar decisiones técnicas en lenguaje de negocio sin perder rigor de ingeniería.
- La narrativa central actual es estrategia energética, solar, ingeniería, operación y performance.
- La sustentabilidad puede aparecer cuando aporta contexto, no como eje genérico de marca.
- El principio rector es: **Ecorise analiza primero y recomienda tecnología después.**
