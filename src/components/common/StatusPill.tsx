import React from 'react';
import type { RunStatus } from '../../types';
import './StatusPill.css';

export interface StatusPillProps {
  status: RunStatus;
  size?: 'sm' | 'md';
}

export function getStatusConfig(status: RunStatus) {
  switch (status) {
    case 'Detected':
      return {
        label: 'Detected',
        colorClass: 'status-detected',
        isAnimated: false,
      };
    case 'Investigating':
      return {
        label: 'Investigating',
        colorClass: 'status-investigating',
        isAnimated: true,
      };
    case 'Patching':
      return {
        label: 'Patching',
        colorClass: 'status-patching',
        isAnimated: true,
      };
    case 'Verifying':
      return {
        label: 'Verifying',
        colorClass: 'status-verifying',
        isAnimated: true,
      };
    case 'PR opened':
      return {
        label: 'PR opened',
        colorClass: 'status-pr-opened',
        isAnimated: false,
      };
    case 'Merged':
      return {
        label: 'Merged',
        colorClass: 'status-merged',
        isAnimated: false,
      };
    case 'Failed to fix':
      return {
        label: 'Failed to fix',
        colorClass: 'status-failed',
        isAnimated: false,
      };
    case 'Queued (token limit)':
      return {
        label: 'Queued (token limit)',
        colorClass: 'status-queued',
        isAnimated: false,
      };
    default:
      return {
        label: status,
        colorClass: 'status-default',
        isAnimated: false,
      };
  }
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'md' }) => {
  const config = getStatusConfig(status);

  return (
    <span
      className={`status-pill ${config.colorClass} size-${size} ${config.isAnimated ? 'is-animated' : ''}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span className="status-pill-dot" aria-hidden="true" />
      <span className="status-pill-text">{config.label}</span>
    </span>
  );
};

export default StatusPill;
