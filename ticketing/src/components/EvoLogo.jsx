import React from 'react'

export default function EvoLogo({ className, height = 36 }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}evo-logo.svg`}
      alt="Evo"
      className={className}
      height={height}
      style={{ width: 'auto', display: 'block' }}
    />
  )
}
