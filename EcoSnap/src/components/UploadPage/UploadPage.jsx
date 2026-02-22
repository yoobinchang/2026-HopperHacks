import { useState, useEffect, useCallback, useRef } from 'react'
import { analyzeTrashImage } from '../../utils/geminiAnalysis'
import { hashFile } from '../../utils/hashFile'
import {
  getUploadHashes,
  hasUploadHash,
  addUploadHash,
} from '../../utils/storage'
import './UploadPage.css'

const MAX_IMAGES = 10

export function UploadPage({ user, onGainPoint }) {
  const [items, setItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hashing, setHashing] = useState(false)
  const fileInputRef = useRef(null)

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
        const combined = [...prev, ...newItems].slice(0, MAX_IMAGES)
        setCurrentIndex(prev.length)
        return combined
      })
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
        toAnalyze.map((item) =>
          analyzeTrashImage(item.file).catch((err) => ({
            isValidTrashImage: false,
            error: err.message || 'Analysis failed. Please upload a valid picture of trash.',
          })),
        ),
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

  const handleClearAll = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => {
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl)
      })
      return []
    })
    setCurrentIndex(0)
  }, [])

  const handleRemoveCurrent = useCallback(() => {
    setItems((prev) => {
      if (prev.length === 0) return prev
      const idx = Math.min(currentIndex, prev.length - 1)
      const removed = prev[idx]
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
      const next = prev.filter((_, i) => i !== idx)
      const newIndex = next.length === 0 ? 0 : Math.min(idx, next.length - 1)
      setCurrentIndex(newIndex)
      return next
    })
  }, [currentIndex])

  const handleConfirmRecycle = useCallback(
    (item) => {
      if (item.hasRewarded) return
      if (item.isDuplicate || hasUploadHash(username, item.hash)) {
        window.alert('This image was already used for points. Upload a different photo.')
        return
      }
      const category = item.analysis?.category
      const isWaste = category === 'waste'
      addUploadHash(username, item.hash)
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, hasRecycled: true, hasRewarded: true }
            : it,
        ),
      )
      if (isWaste) {
        onGainPoint(0, category)
        window.alert('Waste does not earn points. Thanks for recycling anyway!')
      } else {
        onGainPoint(5, category)
        window.alert('You got 5 points for recycling!')
      }
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
  const canAddMore = items.length < MAX_IMAGES

  return (
    <div className="page upload-page">
      <section className="points-capsule">
        <p className="points-capsule-value">{(user.points ?? 0).toLocaleString()}</p>
        <p className="points-capsule-label">Your Points</p>
      </section>

      <section className="card upload-card theme-upload">
        <h2 className="upload-heading">Upload photos of your trash</h2>
        <p className="upload-description">
          Add one photo at a time or select multiple at once (up to {MAX_IMAGES}). Each is saved and
          can be analyzed. You can earn 1 point per photo after recycling. Duplicate photos are not allowed.
        </p>
        <label className="upload-area theme-upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={!canAddMore}
          />
          <span>Click here to select pictures of your trash!</span>
        </label>
        {hashing && <p className="helper-text">Checking for duplicates…</p>}
        {duplicateCount > 0 && (
          <p className="warning-text">
            {duplicateCount} photo{duplicateCount !== 1 ? 's' : ''} already used for points and
            won&apos;t earn more.
          </p>
        )}

        {items.length > 0 && (
          <>
            <div className="thumbnail-strip-wrap">
              <div className="thumbnail-strip">
                {items.map((it, i) => (
                  <button
                    key={it.id}
                    type="button"
                    className={`thumbnail-slot ${i === currentIndex ? 'thumbnail-slot-selected' : ''} ${it.isDuplicate ? 'thumbnail-slot-duplicate' : ''}`}
                    onClick={() => setCurrentIndex(i)}
                  >
                    <img src={it.previewUrl} alt="" />
                  </button>
                ))}
                {canAddMore && (
                  <button
                    type="button"
                    className="thumbnail-slot thumbnail-slot-add"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
            <div className="upload-actions-row">
              <button
                type="button"
                className="primary-button theme-button"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
              >
                {loading ? 'Analyzing…' : 'Analyze'}
              </button>
              <div className="photo-nav-buttons">
                <button
                  type="button"
                  className="ghost-button nav-arrow"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="ghost-button nav-arrow"
                  onClick={() => setCurrentIndex((i) => Math.min(items.length - 1, i + 1))}
                  disabled={currentIndex === items.length - 1}
                  aria-label="Next photo"
                >
                  ›
                </button>
                <button
                  type="button"
                  className="ghost-button nav-action-btn"
                  onClick={handleRemoveCurrent}
                  disabled={items.length === 0}
                  aria-label="Remove this photo"
                >
                  Remove
                </button>
                <button
                  type="button"
                  className="ghost-button nav-action-btn"
                  onClick={handleClearAll}
                  disabled={items.length === 0}
                >
                  Clear images
                </button>
              </div>
            </div>
          </>
        )}
        {error && <p className="error-text">{error}</p>}
      </section>

      {items.length > 0 && currentItem && (
        <section className="card preview-card theme-preview">
          <h3 className="preview-heading">Photo {currentIndex + 1}</h3>
          <div className="preview-frame">
            <img
              src={currentItem.previewUrl}
              alt={`Uploaded trash ${currentIndex + 1}`}
              className="preview-image"
            />
          </div>
          {currentItem?.isDuplicate && (
            <p className="duplicate-badge">Already used for points</p>
          )}
        </section>
      )}

      {currentItem?.analysis && (
        <section className="card result-card theme-result">
          <h3>Analysis result (photo {currentIndex + 1})</h3>
          {currentItem.analysis.isValidTrashImage === false ? (
            <div className="analysis-error-box">
              <p className="analysis-error-text">
                {currentItem.analysis.error || 'Please upload a valid picture of trash.'}
              </p>
              <p className="analysis-error-hint">
                Other photos in your list can still be analyzed and earn points.
              </p>
            </div>
          ) : (
            <>
              <div className="result-row">
                <span className="result-label">Type</span>
                <span className="result-value result-category">
                  {currentItem.analysis.category || '—'}
                </span>
              </div>
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
              {currentItem.analysis.category === 'waste' && (
                <p className="waste-no-points-note">Waste does not earn points.</p>
              )}
              <div className="confirm-box theme-confirm">
                <p>Did you actually recycle this trash?</p>
                <button
                  type="button"
                  className="primary-button theme-button"
                  onClick={() => handleConfirmRecycle(currentItem)}
                  disabled={currentItem.hasRewarded}
                >
                  {currentItem.hasRewarded
                    ? 'Point already earned'
                    : 'Yes, I recycled it'}
                </button>
                {currentItem.hasRecycled && (
                  <p className="success-text">
                    {currentItem.analysis.category === 'waste'
                      ? 'Thanks for recycling! (Waste does not earn points.)'
                      : 'Nice work! You earned +1 point and your tree grew a little.'}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
