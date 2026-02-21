import { useState } from 'react'
import { analyzeTrashImage } from '../../utils/geminiAnalysis'
import './UploadPage.css'

export function UploadPage({ user, onBackHome, onGainPoint }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [hasRecycled, setHasRecycled] = useState(false)
  const [hasRewarded, setHasRewarded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setAnalysis(null)
    setError(null)
    setHasRecycled(false)
    setHasRewarded(false)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }

  async function handleAnalyze() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeTrashImage(file)
      setAnalysis(result)
    } catch (err) {
      setError(err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
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
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        )}
        {error && <p className="error-text">{error}</p>}
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

    </div>
  )
}
