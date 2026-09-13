(function(){
  const root=document.querySelector('[data-article-root]');
  if(!root)return;

  const titleEl=document.querySelector('[data-article-title]');
  const excerptEl=document.querySelector('[data-article-excerpt]');
  const categoryEl=document.querySelector('[data-article-category]');
  const dateEl=document.querySelector('[data-article-date]');
  const bodyEl=document.querySelector('[data-article-body]');
  const params=new URLSearchParams(window.location.search);
  const slug=params.get('slug');

  const projectId='8nstak41';
  const dataset='production';
  const apiVersion='2026-09-13';

  function setError(message){
    titleEl.textContent='No encontramos este análisis';
    excerptEl.textContent=message;
    bodyEl.replaceChildren();
    const p=document.createElement('p');p.className='ec-lead';p.textContent='Volvé a la bitácora para explorar el contenido disponible.';bodyEl.appendChild(p);
  }

  if(!slug){setError('Falta identificar el artículo solicitado.');return;}

  const query=`*[_type == "article" && slug.current == $slug && seo.noIndex != true][0]{
    _id,title,excerpt,publishedAt,
    "category": categories[0]->title,
    "heroImageUrl": heroImage.asset->url,
    "heroAlt": heroImage.alt,
    body[]{...,_type == "image" => {"url": asset->url,alt}}
  }`;
  const liveUrl=`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}&$slug=${encodeURIComponent(JSON.stringify(slug))}`;
  const url=window.__ECORISE_SANITY_ARTICLE_URL__||liveUrl;

  function formatDate(value){
    if(!value)return 'Bitácora Ecorise';
    try{return new Intl.DateTimeFormat('es-AR',{year:'numeric',month:'long',day:'numeric'}).format(new Date(value));}catch{return 'Bitácora Ecorise';}
  }

  function textFromSpan(span){return typeof span?.text==='string'?span.text:'';}

  function renderBlock(block){
    if(block._type==='image'&&block.url){
      const figure=document.createElement('figure');figure.className='ec-article-figure';
      const img=document.createElement('img');img.src=`${block.url}?w=1400&auto=format`;img.alt=block.alt||'';img.loading='lazy';figure.appendChild(img);return figure;
    }
    if(block._type!=='block')return null;
    const style=block.style||'normal';
    const allowedHeadings={h2:'h2',h3:'h3',h4:'h4'};
    const tag=allowedHeadings[style]||'p';
    const node=document.createElement(tag);
    const spans=Array.isArray(block.children)?block.children:[];
    for(const span of spans){
      const text=textFromSpan(span);if(!text)continue;
      let child=document.createTextNode(text);
      const marks=Array.isArray(span.marks)?span.marks:[];
      if(marks.includes('strong')){const strong=document.createElement('strong');strong.appendChild(child);child=strong;}
      if(marks.includes('em')){const em=document.createElement('em');em.appendChild(child);child=em;}
      node.appendChild(child);
    }
    return node;
  }

  fetch(url,{headers:{Accept:'application/json'}})
    .then(response=>{if(!response.ok)throw new Error(`Sanity respondió ${response.status}`);return response.json();})
    .then(payload=>{
      const article=payload.result;
      if(!article){setError('El contenido no existe, está en borrador o dejó de estar publicado.');return;}
      titleEl.textContent=article.title||'Análisis Ecorise';
      excerptEl.textContent=article.excerpt||'Análisis técnico y estratégico de Ecorise.';
      categoryEl.textContent=article.category||'Bitácora Ecorise';
      dateEl.textContent=formatDate(article.publishedAt);
      document.title=`${article.title||'Artículo'} | Ecorise`;
      bodyEl.replaceChildren();
      if(article.heroImageUrl){
        const hero=document.createElement('figure');hero.className='ec-article-figure ec-article-figure--hero';
        const img=document.createElement('img');img.src=`${article.heroImageUrl}?w=1400&h=788&fit=crop&auto=format`;img.alt=article.heroAlt||article.title||'';img.width=1400;img.height=788;hero.appendChild(img);bodyEl.appendChild(hero);
      }
      const blocks=Array.isArray(article.body)?article.body:[];
      for(const block of blocks){const node=renderBlock(block);if(node)bodyEl.appendChild(node);}
      if(blocks.length===0){const p=document.createElement('p');p.className='ec-lead';p.textContent=article.excerpt||'Contenido en preparación.';bodyEl.appendChild(p);}
    })
    .catch(error=>{console.warn('No se pudo cargar el artículo desde Sanity.',error);setError('No pudimos cargar el contenido en este momento.');});
})();
