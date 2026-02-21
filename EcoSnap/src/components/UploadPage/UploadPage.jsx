import { useState } from 'react'
import { mockAnalyzeTrashImage } from '../../utils/mockAnalysis'
import './UploadPage.css'

export function UploadPage({ user, onBackHome, onGainPoint }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [hasRecycled, setHasRecycled] = useState(false)
  const [hasRewarded, setHasRewarded] = useState(false)

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setAnalysis(null)
    setHasRecycled(false)
    setHasRewarded(false)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }

  function handleAnalyze() {
    if (!file) return
    const result = mockAnalyzeTrashImage(file)
    setAnalysis(result)
  }

  function handleConfirmRecycle() {
    if (!analysis || hasRewarded) return
    setHasRecycled(true)
    setHasRewarded(true)
    onGainPoint()
    window.alert('You got 1 point for recycling')
  }

  return (
    <div className="page">
      <header className="page-header with-back">
        <button type="button" className="ghost-button" onClick={onBackHome}>
          ← Back to Home
        </button>
        <div>
          <h2 className="page-title">Upload a trash photo</h2>
          <p className="page-subtitle">
            Gemini will analyze the trash in your photo and suggest recycling and reuse ideas.
          </p>
        </div>
      </header>

      <section className="card upload-card">
        <label className="upload-area">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <span>
            {file ? 'Choose a different photo' : 'Select or take a photo of your trash to upload'}
          </span>
        </label>
        {file && (
          <button
            type="button"
            className="primary-button"
            onClick={handleAnalyze}
          >
            Analyze with Gemini (demo)
          </button>
        )}
      </section>

      {previewUrl && (
        <section className="card preview-card">
          <h3>Uploaded photo</h3>
          <img src={previewUrl} alt="Uploaded trash" className="preview-image" />
        </section>
      )}

      {analysis && (
        <section className="card result-card">
          <h3>Analysis result</h3>
          <div className="result-row">
            <span className="result-label">Name</span>
            <span className="result-value">{analysis.name}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Material(s)</span>
            <span className="result-value">
              {Array.isArray(analysis.materials)
                ? analysis.materials.join(', ')
                : analysis.materials}
            </span>
          </div>
          <div className="result-row">
            <span className="result-label">Recycling method</span>
            <span className="result-value">{analysis.recyclingMethod}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Reuse ideas</span>
            <span className="result-value">{analysis.reuseMethod}</span>
          </div>

          <div className="confirm-box">
            <p>Did you actually recycle this trash?</p>
            <button
              type="button"
              className="primary-button"
              onClick={handleConfirmRecycle}
              disabled={hasRewarded}
            >
              Yes, I recycled it
            </button>
            {hasRecycled && (
              <p className="success-text">
                Nice work! You earned +1 point and your tree grew a little.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="card small-text">
        <p>
          In a real service, this screen would send the image to Gemini and receive results in the JSON schema below.
        </p>
        <pre className="code-block">
          {`{
  "name": "string",
  "materials": ["string"],
  "recyclingMethod": "string",
  "reuseMethod": "string"
}`}
        </pre>
      </section>
    </div>
  )
}
