import React from 'react';
import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, suffix }) => {
  return (
    <div className="stat-card" tabIndex={0} aria-label={`${label}: ${value}${suffix || ''}`}>
      <div className="stat-number-wrap">
        <span className="stat-number">{value}</span>
        {suffix && <span className="stat-suffix">{suffix}</span>}
      </div>
      <span className="stat-label">{label}</span>
    </div>
  );
};

export default StatCard;
