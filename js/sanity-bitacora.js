(function(){
  const container=document.querySelector('[data-sanity-articles]');
  const fallback=document.querySelector('[data-editorial-fallback]');
  const status=document.querySelector('[data-sanity-status]');
  if(!container)return;

  const projectId='8nstak41';
  const dataset='production';
  const apiVersion='2026-09-13';
  const query=`*[_type == "article" && defined(slug.current) && seo.noIndex != true] | order(publishedAt desc)[0...12]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    "category": categories[0]->title,
    "heroImageUrl": heroImage.asset->url,
    "heroAlt": heroImage.alt
  }`;

  const liveUrl=`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const url=window.__ECORISE_SANITY_QUERY_URL__||liveUrl;

  function el(tag,className,text){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text)node.textContent=text;
    return node;
  }

  function formatDate(value){
    if(!value)return '';
    try{return new Intl.DateTimeFormat('es-AR',{year:'numeric',month:'short',day:'numeric'}).format(new Date(value));}
    catch{return '';}
  }

  function createCard(article){
    const card=el('article','ec-article-card');
    if(article.heroImageUrl){
      const imageWrap=el('div','ec-article-card__image');
      const image=document.createElement('img');
      image.src=`${article.heroImageUrl}?w=900&h=506&fit=crop&auto=format`;
      image.alt=article.heroAlt||article.title||'Artículo de Ecorise';
      image.loading='lazy';
      image.width=900;
      image.height=506;
      imageWrap.appendChild(image);
      card.appendChild(imageWrap);
    }

    const body=el('div','ec-article-card__body');
    const meta=[article.category,formatDate(article.publishedAt)].filter(Boolean).join(' · ');
    body.appendChild(el('div','meta',meta||'Bitácora Ecorise'));
    body.appendChild(el('h3','',article.title||'Artículo Ecorise'));
    if(article.excerpt)body.appendChild(el('p','',article.excerpt));

    if(article.slug){
      const link=el('a','ec-card-link','Leer análisis →');
      link.href=`articulo.html?slug=${encodeURIComponent(article.slug)}`;
      link.setAttribute('aria-label',`Leer ${article.title||'artículo'}`);
      body.appendChild(link);
    }

    card.appendChild(body);
    return card;
  }

  fetch(url,{headers:{Accept:'application/json'}})
    .then(response=>{
      if(!response.ok)throw new Error(`Sanity respondió ${response.status}`);
      return response.json();
    })
    .then(payload=>{
      const articles=payload.result||[];
      if(!Array.isArray(articles)||articles.length===0)return;
      container.replaceChildren(...articles.map(createCard));
      container.hidden=false;
      if(fallback)fallback.hidden=true;
      if(status){
        status.textContent='Contenido editorial actualizado desde Ecorise Solar CMS.';
        status.hidden=false;
      }
    })
    .catch(error=>{
      console.warn('No se pudo actualizar la bitácora desde Sanity; se mantiene el contenido editorial local.',error);
    });
})();
