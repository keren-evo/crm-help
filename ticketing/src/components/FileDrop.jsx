import React, {useRef} from 'react'

export default function FileDrop({file, setFile}){
  const ref = useRef()
  const onDrop = (e)=>{
    e.preventDefault()
    const f = e.dataTransfer.files && e.dataTransfer.files[0]
    if(f) setFile(f)
  }
  return (
    <div className={`file-drop ${file? 'has-file':''}`} onDragOver={e=>e.preventDefault()} onDrop={onDrop} onClick={()=>ref.current?.click()}>
      {file ? <div className="file-summary">{file.name}</div> : <div className="file-prompt">Drag & drop a screenshot here, or click to choose a file</div>}
      <input ref={ref} type="file" accept="image/*" style={{display:'none'}} onChange={e=>setFile(e.target.files[0])} />
    </div>
  )
}
