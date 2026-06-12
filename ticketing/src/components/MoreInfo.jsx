import React, {useState} from 'react'
import HelpPanel from './HelpPanel'

export default function MoreInfo(){
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button className="cta-outline" onClick={()=>setOpen(o=>!o)} aria-expanded={open} aria-controls="more-info-panel">
        {open ? 'Hide information' : 'More info'}
      </button>
      {open && (
        <div id="more-info-panel" style={{maxWidth:760,margin:'16px auto 0'}}>
          <HelpPanel />
        </div>
      )}
    </div>
  )
}
