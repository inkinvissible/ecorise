import {defineBlueprint,defineDocumentFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources:[
    defineDocumentFunction({
      name:'rebuild-ecorise',
      displayName:'Rebuild Ecorise static site',
      src:'functions/rebuild-ecorise',
      runtime:'nodejs24.x',
      timeout:10,
      event:{
        on:['create','update','delete'],
        filter:'_type in ["article","articleCategory","caseStudy","solution","product","productCategory","brand"]',
        projection:'{_id,_type}',
        resource:{type:'dataset',id:'8nstak41.production'}
      }
    })
  ]
})
