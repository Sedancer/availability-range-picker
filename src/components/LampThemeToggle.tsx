import React, { useState } from 'react';
import './LampThemeToggle.css';

interface LampThemeToggleProps {
  colorMode: 'dark' | 'light';
  onToggle: () => void;
}

export const LampThemeToggle: React.FC<LampThemeToggleProps> = ({
  colorMode,
  onToggle,
}) => {
  const [pullCount, setPullCount] = useState(0);
  const isOn = colorMode === 'light';

  const handlePull = () => {
    setPullCount((count) => count + 1);
    onToggle();
  };

  return (
    <button
      type="button"
      className={`lamp-toggle ${isOn ? 'lamp-on' : 'lamp-off'}`}
      onClick={handlePull}
      aria-pressed={isOn}
      aria-label={`Pull lamp cord to switch to ${isOn ? 'dark' : 'light'} mode`}
      title={`Switch to ${isOn ? 'dark' : 'light'} mode`}
    >
      <span className="lamp-art" aria-hidden="true">
        <span className="lamp-light-cone" />
        <span className="lamp-shade">
          <span className="lamp-pleats" />
          <span className="lamp-inner-shade" />
          <span className="lamp-shade-rim" />
        </span>
        <span className="lamp-stem" />
        <span className="lamp-base" />
        <span
          className={`lamp-cord ${pullCount > 0 ? 'lamp-cord-pulled' : ''}`}
          key={pullCount}
        >
          <span className="lamp-chain" />
          <span className="lamp-pull" />
        </span>
      </span>
      <span className="lamp-mode-label">{isOn ? 'Light on' : 'Light off'}</span>
    </button>
  );
};
