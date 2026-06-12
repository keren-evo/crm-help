import React from 'react'

export default function Tooltip({tip}){
  return (
    <span className="info-wrap" tabIndex={0} aria-label={tip}>
      <span className="info-dot">i</span>
      <span className="info-tip" role="tooltip">{tip}</span>
    </span>
  )
}
