const { chromium } = require('playwright');
const axeSource = require('axe-core').source;

(async ()=>{
  const url = process.argv[2] || 'http://localhost:4178/';
  console.log('Launching browser to audit', url)
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  // inject axe
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async ()=>{
    return await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2aa','wcag21aa'] } })
  })
  console.log('Axe violations:', results.violations.length)
  for(const v of results.violations){
    console.log('---')
    console.log(v.id, v.impact, v.help)
    for(const node of v.nodes){
      console.log('  Target:', node.target.join(' | '))
      console.log('  Failure summary:', node.failureSummary)
    }
  }
  await browser.close();
  if(results.violations.length>0) process.exitCode = 2
})().catch(e=>{ console.error(e); process.exit(1) })
