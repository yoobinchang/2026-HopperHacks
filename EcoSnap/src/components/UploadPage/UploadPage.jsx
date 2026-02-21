import { useState, useEffect, useCallback, useRef } from 'react'
import { analyzeTrashImage } from '../../utils/geminiAnalysis'
import { hashFile } from '../../utils/hashFile'
import {
  getUploadHashes,
  hasUploadHash,
  addUploadHash,
} from '../../utils/storage'
import './UploadPage.css'

export function UploadPage({ user, onBackHome, onGainPoint }) {
  const [items, setItems] = useState([]) // { id, file, previewUrl, analysis, hasRecycled, hasRewarded, hash, isDuplicate }
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hashing, setHashing] = useState(false)

  const username = user?.username ?? ''

  const handleFileChange = useCallback(
    async (e) => {
      const fileList = e.target.files
      if (!fileList?.length) return
      const files = Array.from(fileList)
      setError(null)
      setHashing(true)

      const storedHashes = getUploadHashes(username)
      const newItems = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const previewUrl = URL.createObjectURL(file)
        let hash = null
        try {
          hash = await hashFile(file)
        } catch {
          hash = `fallback-${Date.now()}-${i}`
        }
        const isDuplicate = storedHashes.includes(hash)
        newItems.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl,
          analysis: null,
          hasRecycled: false,
          hasRewarded: false,
          hash,
          isDuplicate,
        })
      }

      setItems((prev) => {
        prev.forEach((it) => {
          if (it.previewUrl) URL.revokeObjectURL(it.previewUrl)
        })
        return newItems
      })
      setCurrentIndex(0)
      setHashing(false)
      e.target.value = ''
    },
    [username],
  )

  const handleAnalyze = useCallback(async () => {
    const toAnalyze = items.filter((it) => !it.analysis && !it.isDuplicate)
    if (!toAnalyze.length) return
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(
        toAnalyze.map((item) => analyzeTrashImage(item.file)),
      )
      const byId = Object.fromEntries(
        toAnalyze.map((item, i) => [item.id, results[i]]),
      )
      setItems((prev) =>
        prev.map((it) =>
          byId[it.id] ? { ...it, analysis: byId[it.id] } : it,
        ),
      )
    } catch (err) {
      setError(err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [items])

  const handleConfirmRecycle = useCallback(
    (item) => {
      if (item.hasRewarded) return
      if (item.isDuplicate || hasUploadHash(username, item.hash)) {
        window.alert('This image was already used for points. Upload a different photo.')
        return
      }
      addUploadHash(username, item.hash)
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, hasRecycled: true, hasRewarded: true }
            : it,
        ),
      )
      onGainPoint()
      window.alert('You got 1 point for recycling!')
    },
    [username, onGainPoint],
  )

  const itemsRef = useRef([])
  itemsRef.current = items
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl)
      })
    }
  }, [])

  const currentItem = items[currentIndex]
  const canAnalyze =
    items.length > 0 &&
    items.some((it) => !it.analysis && !it.isDuplicate) &&
    !loading
  const duplicateCount = items.filter((it) => it.isDuplicate).length

  return (
    <div className="page">
      <header className="page-header with-back">
        <button type="button" className="ghost-button" onClick={onBackHome}>
          ← Back to Home
        </button>
        <div>
          <h2 className="page-title">Upload a trash photo</h2>
          <p className="page-subtitle">
            Upload one or more photos. You can earn 1 point per photo after recycling. Duplicate
            photos are not allowed.
          </p>
        </div>
      </header>

      <section className="card upload-card">
        <label className="upload-area">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          <span>
            {items.length
              ? 'Add more photos or choose different ones'
              : 'Select or take photos of your trash (multiple allowed)'}
          </span>
        </label>
        {hashing && <p className="helper-text">Checking for duplicates…</p>}
        {duplicateCount > 0 && (
          <p className="warning-text">
            {duplicateCount} photo{duplicateCount !== 1 ? 's' : ''} already used for points and
            won&apos;t earn more.
          </p>
        )}
        {items.length > 0 && (
          <button
            type="button"
            className="primary-button"
            onClick={handleAnalyze}
            disabled={!canAnalyze}
          >
            {loading ? 'Analyzing…' : 'Analyze selected photos'}
          </button>
        )}
        {error && <p className="error-text">{error}</p>}
      </section>

      {items.length > 0 && (
        <>
          <section className="card carousel-card">
            <div className="carousel-nav">
              <button
                type="button"
                className="ghost-button carousel-btn"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                ← Prev
              </button>
              <span className="carousel-counter">
                Photo {currentIndex + 1} of {items.length}
              </span>
              <button
                type="button"
                className="ghost-button carousel-btn"
                onClick={() => setCurrentIndex((i) => Math.min(items.length - 1, i + 1))}
                disabled={currentIndex === items.length - 1}
              >
                Next →
              </button>
            </div>
            <div className="carousel-dots">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  className={`carousel-dot ${i === currentIndex ? 'carousel-dot-active' : ''} ${it.isDuplicate ? 'carousel-dot-duplicate' : ''}`}
                  onClick={() => setCurrentIndex(i)}
                  title={it.isDuplicate ? 'Already used for points' : `Photo ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </section>

          <section className="card preview-card">
            <h3>Photo {currentIndex + 1}</h3>
            {currentItem?.isDuplicate && (
              <p className="duplicate-badge">Already used for points</p>
            )}
            <img
              src={currentItem?.previewUrl}
              alt={`Uploaded trash ${currentIndex + 1}`}
              className="preview-image"
            />
          </section>

          {currentItem?.analysis && (
            <section className="card result-card">
              <h3>Analysis result (photo {currentIndex + 1})</h3>
              <div className="result-row">
                <span className="result-label">Name</span>
                <span className="result-value">{currentItem.analysis.name}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Material(s)</span>
                <span className="result-value">
                  {Array.isArray(currentItem.analysis.materials)
                    ? currentItem.analysis.materials.join(', ')
                    : currentItem.analysis.materials}
                </span>
              </div>
              <div className="result-row">
                <span className="result-label">Recycling method</span>
                <span className="result-value">
                  {currentItem.analysis.recyclingMethod}
                </span>
              </div>
              <div className="result-row">
                <span className="result-label">Reuse ideas</span>
                <span className="result-value">
                  {currentItem.analysis.reuseMethod}
                </span>
              </div>

              <div className="confirm-box">
                <p>Did you actually recycle this trash?</p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleConfirmRecycle(currentItem)}
                  disabled={currentItem.hasRewarded}
                >
                  {currentItem.hasRewarded
                    ? 'Point already earned'
                    : 'Yes, I recycled it'}
                </button>
                {currentItem.hasRecycled && (
                  <p className="success-text">
                    Nice work! You earned +1 point and your tree grew a little.
                  </p>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
