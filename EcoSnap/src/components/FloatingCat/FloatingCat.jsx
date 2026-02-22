import { useState } from 'react'
import raccoonImg from '../../assets/raccoon.png'
import raccoonyImg from '../../assets/raccoony.png'
import './FloatingCat.css'

const FUN_FACTS = [
  'Recycling one aluminum can saves enough energy to run a TV for about 3 hours!',
  'A glass bottle can take over 1 million years to decompose in the environment.',
  'Paper can be recycled up to 5–7 times before the fibers become too short to reuse.',
  'Plastic bags can take 500+ years to break down in nature.',
  'Composting food scraps reduces methane gas from landfills and creates nutrient-rich soil.',
  'The average person generates about 4.5 pounds of trash per day in the U.S.',
  'Recycling one ton of paper saves around 17 trees and 7,000 gallons of water.',
  'Up to 60% of household waste can be recycled or composted.',
  'A single plastic bottle can be recycled into a t-shirt or a fleece jacket.',
  'Bamboo can grow up to 3 feet in 24 hours and is a super sustainable material!',
  'Turning off the tap while brushing your teeth can save up to 8 gallons of water per day.',
  'Reusable bags need to be used only 11 times to have a lower environmental impact than single-use bags.',
  'Earth has a "plastic island" in the Pacific Ocean—reducing plastic helps shrink it.',
  'One recycled plastic bottle saves enough energy to power a laptop for 10+ hours.',
  'Food waste in landfills produces methane, a greenhouse gas 25x more potent than CO₂.',
]

/* Raccoon assets: raccoon = sleeping, raccoony = awake */
function RaccoonIcon({ asleep }) {
  const src = asleep ? raccoonImg : raccoonyImg
  return (
    <img
      src={src}
      alt=""
      className={`floating-raccoon-icon ${asleep ? 'floating-raccoon-asleep' : ''}`}
      aria-hidden
    />
  )
}

/* Small sleeping raccoon when hidden */
function RaccoonSleepingIcon() {
  return <RaccoonIcon asleep />
}

export function FloatingCat() {
  const [showFacts, setShowFacts] = useState(false)
  const [factIndex, setFactIndex] = useState(0)
  const [isAsleep, setIsAsleep] = useState(false)

  const currentFact = FUN_FACTS[factIndex]

  function handleRaccoonClick() {
    if (isAsleep) {
      setIsAsleep(false)
      return
    }
    setShowFacts(true)
    setFactIndex((i) => (i + 1) % FUN_FACTS.length)
  }

  function handleHide() {
    setIsAsleep(true)
  }

  function handleNextFact() {
    setFactIndex((i) => (i + 1) % FUN_FACTS.length)
  }

  function handleCloseFacts() {
    setShowFacts(false)
  }

  return (
    <>
      <div className={`floating-cat-wrap ${isAsleep ? 'floating-cat-asleep' : ''}`} aria-label="Recycling tips raccoon">
        {!isAsleep && (
          <>
            <div
              className="floating-cat-bubble"
              onClick={handleRaccoonClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleRaccoonClick()}
            >
              <button
                type="button"
                className="floating-cat-bubble-close"
                onClick={(e) => { e.stopPropagation(); handleHide(); }}
                aria-label="Hide raccoon (put to sleep)"
              >
                ×
              </button>
              <span className="floating-cat-bubble-text">want to know more about recycling?</span>
            </div>
          </>
        )}
        <button
          type="button"
          className="floating-cat-button"
          onClick={handleRaccoonClick}
          aria-label={isAsleep ? 'Wake up raccoon' : 'Click for recycling and sustainability facts'}
        >
          {isAsleep ? (
            <span className="floating-raccoon-sleeping-wrap">
              <RaccoonSleepingIcon />
              <span className="zzz-particles" aria-hidden="true">
                <span className="zzz zzz-1">z</span>
                <span className="zzz zzz-2">z</span>
                <span className="zzz zzz-3">z</span>
                <span className="zzz zzz-4">Z</span>
                <span className="zzz zzz-5">z</span>
              </span>
            </span>
          ) : (
            <RaccoonIcon asleep={false} />
          )}
        </button>
      </div>

      {showFacts && (
        <div className="floating-cat-modal-overlay" onClick={handleCloseFacts} aria-hidden="true">
          <div
            className="floating-cat-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="floating-cat-fact-title"
          >
            <h3 id="floating-cat-fact-title" className="floating-cat-modal-title">Did you know?</h3>
            <p className="floating-cat-modal-fact">{currentFact}</p>
            <div className="floating-cat-modal-actions">
              <button type="button" className="floating-cat-modal-next" onClick={handleNextFact}>
                Next fact
              </button>
              <button type="button" className="floating-cat-modal-close" onClick={handleCloseFacts}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
