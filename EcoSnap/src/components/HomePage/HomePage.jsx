import { useState, useEffect, useRef } from "react";
import { getTreeStage } from "../../utils/tree";
import "./HomePage.css";

// Inline SVG watering can (pink/mauve, matching screenshot)
function WateringCan() {
  return (
    <svg
      className="watering-can-svg"
      viewBox="0 0 110 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <rect x="20" y="28" width="52" height="36" rx="8" fill="#e8a0b0" />
      {/* Spout */}
      <path d="M72 38 L100 22 L104 30 L76 46 Z" fill="#e8a0b0" />
      {/* Spout tip */}
      <ellipse cx="103" cy="26" rx="5" ry="4" fill="#d4809a" />
      {/* Handle arc */}
      <path
        d="M36 28 C36 10, 72 10, 72 28"
        stroke="#d4809a"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Label patch */}
      <rect x="30" y="36" width="32" height="18" rx="4" fill="#f5c0cc" opacity="0.7" />
      <text x="46" y="49" textAnchor="middle" fontFamily="Alice, serif" fontSize="9" fill="#7a3050">DANA</text>
      {/* Water drops */}
      <ellipse cx="108" cy="18" rx="2" ry="3" fill="#a0c8e8" opacity="0.8" />
      <ellipse cx="102" cy="12" rx="2" ry="3" fill="#a0c8e8" opacity="0.6" />
      <ellipse cx="113" cy="12" rx="1.5" ry="2.5" fill="#a0c8e8" opacity="0.5" />
    </svg>
  );
}

export function HomePage({ user, onGoUpload }) {
  const stage = getTreeStage(user.points ?? 0);
  const testPoints = 123456789; // TEMPORARY

  // Animated number state
  const [displayPoints, setDisplayPoints] = useState(0);

  // Watering-can shake animation state
  const [isShaking, setIsShaking] = useState(false);
  const shakeIntervalRef = useRef(null);

  // Animate from 0 → user.points
  useEffect(() => {
    // const target = user.points ?? 0;
    const target = testPoints;
    const duration = 2000;
    const frameRate = 60;
    const totalFrames = Math.round((duration / 1000) * frameRate);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const current = Math.round(target * progress);
      setDisplayPoints(current);
      if (frame === totalFrames) clearInterval(counter);
    }, duration / totalFrames);

    return () => clearInterval(counter);
  }, [user.points]);

  // Periodic shake every few seconds (as noted in design)
  useEffect(() => {
    shakeIntervalRef.current = setInterval(() => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    }, 3000);
    return () => clearInterval(shakeIntervalRef.current);
  }, []);

  // Points until next stage (placeholder logic — replace with real thresholds)
  const nextStagePoints = stage?.nextThreshold ?? "--";
  const totalNeeded = stage?.totalNeeded ?? "--";

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Hi, {user.username}</h2>
          <p className="page-subtitle">One more step for the planet today!</p>
        </div>
      </header>

      {/* Points pill */}
      <div className="ellipse-box">
        <p className="points-value">
          {displayPoints.toLocaleString()}
        </p>
        <p className="points-label">Your Points</p>
      </div>

      {/* Note about watering can */}
      <p className="watering-note">
        Note: watering can shakes<br />
        every few seconds,<br />
        and when you hover over it →
      </p>

      {/* Tree section with overlaid watering can */}
      <div className="tree-section">

        {/* Watering can + Scan button — top-right overlay */}
        <div
          className={`watering-can-area${isShaking ? " shake" : ""}`}
          onMouseEnter={() => setIsShaking(true)}
          onMouseLeave={() => setIsShaking(false)}
        >
          <WateringCan />
          <button className="scan-btn" onClick={onGoUpload}>
            Click to Scan<br />Trash!
          </button>
        </div>

        {/* Tree placeholder container */}
        <div className="tree-container">
          {/* Replace the below with your 3D tree model */}
          <span className="tree-placeholder-text">[ 3D Tree Model ]</span>
        </div>

        {/* Tree info */}
        <div className="tree-info">
          <p className="tree-name">{stage?.name ?? "Sakura Tree"}</p>
          <p className="tree-progress">
            points until next stage: {nextStagePoints} / {totalNeeded}
          </p>
          <p className="tree-cta">Scan and recycle trash to earn more points!</p>
        </div>
      </div>
    </div>
  );
}
