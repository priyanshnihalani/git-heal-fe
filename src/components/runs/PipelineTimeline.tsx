import React from 'react';
import { X } from 'lucide-react';
import type { RunStep } from '../../types';
import { formatTokenCount } from '../../utils/tokenUtils';
import './PipelineTimeline.css';

interface PipelineTimelineProps {
  steps: RunStep[];
  totalDuration?: string;
}

export const PipelineTimeline: React.FC<PipelineTimelineProps> = ({
  steps,
  totalDuration = '42s',
}) => {
  // Sum AI tokens across all steps
  const totalTokens = steps.reduce((sum, s) => sum + (s.tokens || 0), 0);

  return (
    <div className="pipeline-timeline-card" aria-label="Pipeline healing stages">
      <h3 className="timeline-heading">Healing pipeline</h3>

      <div className="timeline-container">
        <div className="timeline-track-line" aria-hidden="true" />
        <ol className="timeline-steps-list">
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in_progress';
            const isFailed = step.status === 'failed';
            const isPending = step.status === 'pending';

            // Show tokens only for steps with AI usage
            const durationTokenLabel =
              step.duration && step.tokens
                ? `${step.duration} · ${formatTokenCount(step.tokens)} tokens`
                : step.duration || '';

            return (
              <li
                key={step.name}
                className={`timeline-step-item ${step.status}`}
                aria-current={isInProgress ? 'step' : undefined}
              >
                {/* Node Indicator */}
                <div className={`step-node ${step.status}`} aria-hidden="true">
                  {isCompleted && (
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                    </svg>
                  )}
                  {isInProgress && <span className="in-progress-dot" />}
                  {isFailed && <X size={12} strokeWidth={2.5} />}
                  {isPending && <span className="pending-num">{idx + 1}</span>}
                </div>

                {/* Step Content */}
                <div className="step-info-block">
                  <div className="step-header-row">
                    <strong className="step-name-text">{step.name}</strong>
                    {durationTokenLabel && (
                      <span className="step-duration-tag">{durationTokenLabel}</span>
                    )}
                  </div>
                  {step.summary && <p className="step-summary-text">{step.summary}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Subtle Total Row: Total 42s · 18.4K tokens */}
      <div className="timeline-total-row">
        <span className="total-label">Total</span>
        <span className="total-metrics">
          {totalDuration}
          {totalTokens > 0 && ` · ${formatTokenCount(totalTokens)} tokens`}
        </span>
      </div>
    </div>
  );
};

export default PipelineTimeline;
