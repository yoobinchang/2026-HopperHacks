import { useState, useEffect } from "react";
import { getTreeStage } from "../../utils/tree";
import "./HomePage.css";
import treePattern from "../../assets/tree.pattern.jpg";

export function HomePage({ user, onGoTree, onGoUpload }) {
  const stage = getTreeStage(user.points ?? 0);
  const testPoints = 123456789; // TEMPORARY

  // Animated number state
  const [displayPoints, setDisplayPoints] = useState(0);

  // Animate from 0 → user.points
  useEffect(() => {
   // const target = user.points ?? 0;
    const target = testPoints;
    const duration = 2000; // 2 seconds
    const frameRate = 60;
    const totalFrames = Math.round((duration / 1000) * frameRate);

    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const current = Math.round(target * progress);

      setDisplayPoints(current);

      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, duration / totalFrames);

    return () => clearInterval(counter);
  }, [user.points]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Hi, {user.username}</h2>
          <p className="page-subtitle">One more step for the planet today!</p>
        </div>
      </header>

      <section
        className="card highlight-card"
        style={{ backgroundImage: `url(${treePattern})` }}
      >
        <div className="ellipse-box">
          <div className="points-row">

            {/* LEFT COLUMN — value + label */}
            <div className="points-col">
              <p className="points-value">
                {displayPoints}
                <span className="points-unit"> items</span>
              </p>

              <p className="points-label">
                Total pieces of trash recycled
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}