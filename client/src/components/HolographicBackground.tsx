import React from "react";
import "./HolographicBackground.css";

interface HolographicBackgroundProps {
  children?: React.ReactNode;
  intensity?: "low" | "medium" | "high";
}

/**
 * Holographic Background Component
 * Renders a neon-glowing, semi-transparent holographic background
 * with the CloutScape imagery visible through an obsidian overlay
 */
export const HolographicBackground: React.FC<HolographicBackgroundProps> = ({
  children,
  intensity = "medium",
}) => {
  return (
    <div className={`holographic-background intensity-${intensity}`}>
      {/* Base holographic image layer */}
      <div className="holographic-image-layer">
        <img
          src="/images/cloutscape-holographic-bg.jpg"
          alt="CloutScape Holographic Background"
          className="holographic-image"
        />
      </div>

      {/* Neon glow overlay */}
      <div className="holographic-glow-layer">
        <div className="glow-effect glow-pink"></div>
        <div className="glow-effect glow-cyan"></div>
        <div className="glow-effect glow-purple"></div>
      </div>

      {/* Obsidian semi-transparent overlay */}
      <div className="holographic-obsidian-overlay"></div>

      {/* Animated neon lines */}
      <div className="holographic-neon-grid">
        <div className="neon-line neon-horizontal"></div>
        <div className="neon-line neon-vertical"></div>
      </div>

      {/* Holographic particles */}
      <div className="holographic-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Content layer */}
      {children && <div className="holographic-content">{children}</div>}
    </div>
  );
};

export default HolographicBackground;
