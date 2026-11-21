import { useEffect, useRef, useState } from 'react'

const TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // the server enforces the same limit

// Cover image field. Controlled by the parent:
//   image = { file: File | null, url: string | null }
//   file = a newly picked image (uploaded when the form is submitted)
//   url  = the image already saved on the post
export default function ImagePicker({ image, onChange, disabled }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(image.url)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!image.file) {
      setPreview(image.url)
      return
    }
    const objectUrl = URL.createObjectURL(image.file)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [image.file, image.url])

  function handleChange(e) {
    const file = e.target.files[0]
    e.target.value = '' // lets the same file be picked again after removing it
    if (!file) return
    if (!TYPES.includes(file.type)) return setError('Image must be a JPEG, PNG, GIF or WebP')
    if (file.size > MAX_BYTES) return setError('Image must be 5 MB or smaller')
    setError(null)
    onChange({ file, url: null })
  }

  return (
    <div className="image-picker">
      {preview ? (
        <>
          <img className="image-preview" src={preview} alt="Cover preview" />
          <div className="image-actions">
            <button type="button" className="edit-btn" disabled={disabled} onClick={() => inputRef.current.click()}>
              Replace image
            </button>
            <button type="button" className="edit-btn" disabled={disabled} onClick={() => onChange({ file: null, url: null })}>
              Remove
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="image-add" disabled={disabled} onClick={() => inputRef.current.click()}>
          + Add a cover image
        </button>
      )}
      <input ref={inputRef} type="file" accept={TYPES.join(',')} onChange={handleChange} hidden />
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}
