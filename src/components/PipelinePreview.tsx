import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Wrench, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Step {
  num: string;
  title: string;
  desc: string;
  imgSrc: string;
  phase: 'error' | 'investigate' | 'patch' | 'retry' | 'success';
  badgeLabel: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    num: '1',
    title: 'Detect',
    desc: 'CI build fails',
    imgSrc: '/github_login_teddy_assets/bottom-agents/mini-robot-running.png',
    phase: 'error',
    badgeLabel: 'Error',
    icon: <AlertCircle size={11} strokeWidth={2.5} aria-hidden="true" />,
  },
  {
    num: '2',
    title: 'Investigate',
    desc: 'Diagnoses root cause',
    imgSrc: '/github_login_teddy_assets/bottom-agents/mini-bear-headphones-coding.png',
    phase: 'investigate',
    badgeLabel: 'Diagnosing',
    icon: <Search size={11} strokeWidth={2.5} aria-hidden="true" />,
  },
  {
    num: '3',
    title: 'Patch',
    desc: 'Generates minimal fix',
    imgSrc: '/github_login_teddy_assets/bottom-agents/mini-robot-coding.png',
    phase: 'patch',
    badgeLabel: 'Patching',
    icon: <Wrench size={11} strokeWidth={2.5} aria-hidden="true" />,
  },
  {
    num: '4',
    title: 'Verify',
    desc: 'Tests in Docker sandbox',
    imgSrc: '/github_login_teddy_assets/bottom-agents/mini-robot-star.png',
    phase: 'retry',
    badgeLabel: 'Retrying',
    icon: <RefreshCw size={11} strokeWidth={2.5} aria-hidden="true" />,
  },
  {
    num: '5',
    title: 'Open PR',
    desc: 'Submits for human review',
    imgSrc: '/github_login_teddy_assets/bottom-agents/mini-bear-branch-card.png',
    phase: 'success',
    badgeLabel: 'Success',
    icon: <CheckCircle2 size={11} strokeWidth={2.5} aria-hidden="true" />,
  },
];

export const PipelinePreview: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play through stages: Flow -> Error -> Retry -> Success -> Merge
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % STEPS.length);
    }, 2200);

    return () => clearInterval(timer);
  }, [isPaused]);

  const progressPercent = (activeStepIndex / (STEPS.length - 1)) * 100;

  return (
    <section
      className="how-it-works-section"
      aria-label="How GitHeal works"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="section-title-wrap">
        <h2 className="section-title">How it works</h2>
        <span className="live-flow-pill">
          <span className="live-dot" />
          Live Workflow: Error → Retry → Merge
        </span>
      </div>

      <div className="steps-container">
        {/* Neutral base connector line */}
        <div className="steps-connector-line" aria-hidden="true">
          {/* Active animated progress fill (bottom-to-top on vertical, left-to-right on desktop) */}
          <div
            className={`steps-connector-progress phase-${STEPS[activeStepIndex].phase}`}
            style={{
              width: `${progressPercent}%`,
              height: `${progressPercent}%`,
            }}
          />
        </div>

        <ol className="steps-row">
          {STEPS.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const isCompleted = idx < activeStepIndex;

            return (
              <li
                key={step.num}
                className={`step-item ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''} phase-${step.phase}`}
                onClick={() => setActiveStepIndex(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveStepIndex(idx);
                  }
                }}
                aria-label={`Step ${step.num}: ${step.title} - ${step.desc}`}
              >
                {/* Active mini badge with Lucide icon */}
                <div className={`step-badge-tag ${isActive ? 'visible' : ''}`}>
                  {step.icon}
                  <span>{step.badgeLabel}</span>
                </div>

                <div className="step-circle" aria-hidden="true">
                  <img
                    src={step.imgSrc}
                    alt=""
                    className="step-agent-img"
                    loading="lazy"
                  />
                  {isActive && <span className="step-circle-halo" />}
                </div>

                <div className="step-text-wrap">
                  <strong className="step-title">{step.title}</strong>
                  <span className="step-description">{step.desc}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default PipelinePreview;
