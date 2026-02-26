import React, { useEffect, useState } from "react";
import { Cloud, Droplets } from "lucide-react";
import "./RainModule.css";

interface RainModuleProps {
  poolAmount: number;
  participantCount: number;
  maxPoolAmount?: number;
  osrsGpRate?: number; // Exchange rate: 1 USD = X OSRS GP
}

export const RainModule: React.FC<RainModuleProps> = ({
  poolAmount = 0,
  participantCount = 0,
  maxPoolAmount = 10000,
  osrsGpRate = 1000,
}) => {
  const [fillPercentage, setFillPercentage] = useState(0);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [osrsGpAmount, setOsrsGpAmount] = useState(0);

  // Animate fill percentage
  useEffect(() => {
    const targetPercentage = Math.min((poolAmount / maxPoolAmount) * 100, 100);
    const interval = setInterval(() => {
      setFillPercentage((prev) => {
        if (Math.abs(prev - targetPercentage) < 1) {
          return targetPercentage;
        }
        return prev + (targetPercentage - prev) * 0.1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [poolAmount, maxPoolAmount]);

  // Update display amounts
  useEffect(() => {
    setDisplayAmount(Math.round(poolAmount * 100) / 100);
    setOsrsGpAmount(Math.round(poolAmount * osrsGpRate * 100) / 100);
  }, [poolAmount, osrsGpRate]);

  // Calculate cloud positions based on fill
  const cloudPositions = [
    { bottom: 20 + fillPercentage * 0.3, opacity: Math.min(fillPercentage / 30, 1) },
    { bottom: 35 + fillPercentage * 0.25, opacity: Math.min(fillPercentage / 40, 1) },
    { bottom: 50 + fillPercentage * 0.2, opacity: Math.min(fillPercentage / 50, 1) },
  ];

  return (
    <div className="rain-module">
      {/* Header */}
      <div className="rain-header">
        <div className="rain-title-section">
          <Droplets size={18} className="rain-icon" />
          <h3 className="rain-title">Live Rain Pool</h3>
        </div>
        <div className="rain-participants">
          <span className="participants-count">{participantCount}</span>
          <span className="participants-label">Participants</span>
        </div>
      </div>

      {/* Visualizer Container */}
      <div className="rain-visualizer">
        {/* Cloud Layer */}
        <div className="clouds-container">
          {cloudPositions.map((cloud, idx) => (
            <div
              key={idx}
              className="cloud"
              style={{
                bottom: `${cloud.bottom}%`,
                opacity: cloud.opacity,
              }}
            >
              <Cloud size={32} />
            </div>
          ))}
        </div>

        {/* Water Fill */}
        <div className="water-container">
          <div
            className="water-fill"
            style={{
              height: `${fillPercentage}%`,
            }}
          >
            {/* Wave animation */}
            <div className="wave wave-1"></div>
            <div className="wave wave-2"></div>
          </div>
        </div>

        {/* Raindrops Animation */}
        <div className="raindrops-container">
          {fillPercentage > 20 && (
            <>
              <div className="raindrop raindrop-1"></div>
              <div className="raindrop raindrop-2"></div>
              <div className="raindrop raindrop-3"></div>
              <div className="raindrop raindrop-4"></div>
              <div className="raindrop raindrop-5"></div>
            </>
          )}
        </div>

        {/* Fill Percentage Text */}
        <div className="fill-percentage">{Math.round(fillPercentage)}%</div>
      </div>

      {/* Amount Display */}
      <div className="rain-amounts">
        <div className="amount-item">
          <span className="amount-label">USD Value</span>
          <span className="amount-value">${displayAmount.toFixed(2)}</span>
        </div>
        <div className="amount-divider"></div>
        <div className="amount-item">
          <span className="amount-label">OSRS GP</span>
          <span className="amount-value-gp">
            {osrsGpAmount.toLocaleString()} GP
          </span>
        </div>
      </div>

      {/* Status Message */}
      <div className="rain-status">
        {fillPercentage === 100 ? (
          <span className="status-full">🌧️ Pool is full! Rain incoming!</span>
        ) : fillPercentage > 50 ? (
          <span className="status-high">Clouds gathering...</span>
        ) : fillPercentage > 0 ? (
          <span className="status-low">Building up...</span>
        ) : (
          <span className="status-empty">Waiting for contributions...</span>
        )}
      </div>
    </div>
  );
};

export default RainModule;
