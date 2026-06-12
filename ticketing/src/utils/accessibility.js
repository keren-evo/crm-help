// Small helper to run axe-core in the browser console.
// Usage: open the app preview, then in DevTools console run:
// import('/src/utils/accessibility.js').then(m=>m.runAxe())

export async function runAxe(){
  if(typeof window === 'undefined') return console.warn('runAxe should be run in the browser')
  if(!window.axe){
    // load axe-core from CDN
    await new Promise((res, rej)=>{
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
  }
  const results = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2aa','wcag21aa'] } })
  console.log('axe results', results)
  return results
}
