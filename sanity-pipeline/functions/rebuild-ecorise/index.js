import {documentEventHandler} from '@sanity/functions'

export const handler=documentEventHandler(async({event})=>{
  const token=process.env.GITHUB_DISPATCH_TOKEN
  if(!token)throw new Error('GITHUB_DISPATCH_TOKEN is not configured')

  const response=await fetch('https://api.github.com/repos/inkinvissible/ecorise/dispatches',{
    method:'POST',
    headers:{
      Accept:'application/vnd.github+json',
      Authorization:`Bearer ${token}`,
      'Content-Type':'application/json',
      'X-GitHub-Api-Version':'2022-11-28'
    },
    body:JSON.stringify({
      event_type:'sanity-content-changed',
      client_payload:{
        documentId:event.data?._id||null,
        documentType:event.data?._type||null
      }
    })
  })

  if(!response.ok){
    const body=await response.text()
    throw new Error(`GitHub repository_dispatch failed with ${response.status}: ${body}`)
  }

  console.log(`Triggered Ecorise rebuild for ${event.data?._type||'content'} ${event.data?._id||''}`)
})
