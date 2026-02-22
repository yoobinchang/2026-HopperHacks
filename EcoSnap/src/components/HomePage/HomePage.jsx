import { useState, useEffect, useRef } from "react";
import { getTreeStage } from "../../utils/tree";
import TreeScene from "../TreeScene/TreeScene";
import "./HomePage.css";

function WateringCan() {
  return (
    <svg
      className="watering-can-svg"
      viewBox="0 0 110 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <rect x="38" y="28" width="52" height="36" rx="8" fill="#e8a0b0" />
      {/* Spout — connects to left edge of body (x=38), faces LEFT */}
      <path d="M38 36 L16 24 L12 32 L38 44 Z" fill="#e8a0b0" />
      {/* Spout tip */}
      <ellipse cx="13" cy="28" rx="5" ry="4" fill="#d4809a" />
      {/* Handle arc — centered over body (x=38 to x=90, midpoint=64) */}
      <path
        d="M52 28 C52 10, 78 10, 78 28"
        stroke="#d4809a"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Label patch */}
      <rect x="48" y="36" width="32" height="18" rx="4" fill="#f5c0cc" opacity="0.7" />
      <text x="64" y="49" textAnchor="middle" fontFamily="Alice, serif" fontSize="9" fill="#7a3050">SCAN</text>
      {/* Water drops — on the left */}
      <ellipse cx="8" cy="18" rx="2" ry="3" fill="#a0c8e8" opacity="0.8" />
      <ellipse cx="4" cy="11" rx="2" ry="3" fill="#a0c8e8" opacity="0.6" />
      <ellipse cx="12" cy="8" rx="1.5" ry="2.5" fill="#a0c8e8" opacity="0.5" />
    </svg>
  );
}

export function HomePage({ user, onGoUpload, onTreeStateChange }) {
  const stage = getTreeStage(user.points ?? 0);

  const [displayPoints, setDisplayPoints] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const shakeIntervalRef = useRef(null);

  // Animate points counter 0 → target
  useEffect(() => {
    const target = user.points ?? 0;
    const duration = 2000;
    const frameRate = 60;
    const totalFrames = Math.round((duration / 1000) * frameRate);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      setDisplayPoints(Math.round(target * progress));
      if (frame === totalFrames) clearInterval(counter);
    }, duration / totalFrames);

    return () => clearInterval(counter);
  }, [user.points]);

  // Periodic shake every 3s
  useEffect(() => {
    shakeIntervalRef.current = setInterval(() => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    }, 3000);
    return () => clearInterval(shakeIntervalRef.current);
  }, []);

  function handleCanClick() {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
    onGoUpload();
  }

  return (
    <div className="page">
      {/* Points pill */}
      <div className="ellipse-box">
        <p className="points-value">{displayPoints.toLocaleString()}</p>
        <p className="points-label">All Time Points</p>
      </div>

      {/* Tree section */}
      <div className="tree-section">

        {/* Watering can — clickable button that navigates to scanner */}
        <button
          className={`watering-can-area${isShaking ? " shake" : ""}`}
          onClick={handleCanClick}
          onMouseEnter={() => setIsShaking(true)}
          onMouseLeave={() => setIsShaking(false)}
          aria-label="Scan Trash"
        >
          <WateringCan />
          <span className="scan-label">Click to Scan Trash!</span>
        </button>

        {/* 3D tree scene — double-click for full screen */}
        <div
          className="tree-container tree-container-3d"
          onDoubleClick={() => setIsFullScreen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && e.detail >= 2 && setIsFullScreen(true)}
          aria-label="Double-click for full screen"
        >
          <div className="tree-fullscreen-hint" aria-hidden="true">
            Double-click for full screen
          </div>
          {!isFullScreen && (
            <TreeScene
              embedded
              userPoints={user.points ?? 0}
              userBank={user.treeBank ?? user.points ?? 0}
              userTrees={user.trees}
              onBankChange={(bank) => onTreeStateChange?.(bank, user.trees)}
              onTreesChange={(trees) => onTreeStateChange?.(user.treeBank ?? user.points ?? 0, trees)}
            />
          )}
        </div>

        {/* Full-screen overlay — double-click to exit */}
        {isFullScreen && (
          <div
            className="tree-fullscreen-overlay"
            onDoubleClick={() => setIsFullScreen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Tree view — double-click to exit"
          >
            <div className="tree-fullscreen-hint">Double-click to exit</div>
            <button
              type="button"
              className="tree-fullscreen-exit-btn"
              onClick={() => setIsFullScreen(false)}
              aria-label="Exit full screen"
            >
              Exit
            </button>
            <TreeScene
              embedded
              userPoints={user.points ?? 0}
              userBank={user.treeBank ?? user.points ?? 0}
              userTrees={user.trees}
              onBankChange={(bank) => onTreeStateChange?.(bank, user.trees)}
              onTreesChange={(trees) => onTreeStateChange?.(user.treeBank ?? user.points ?? 0, trees)}
            />
          </div>
        )}

        {/* Tree info */}
        <div className="tree-info">
          <p className="tree-name">{stage?.name ?? "Your Forest"}</p>
          <p className="tree-cta">Scan and recycle trash to earn more points!
            Click into your forest to add and customize trees.
          </p>
        </div>
      </div>
    </div>
  );
}