import React from 'react';
import './GitFlowGraph.css';

interface GitFlowGraphProps {
  side: 'left' | 'right';
}

export const GitFlowGraph: React.FC<GitFlowGraphProps> = ({ side }) => {
  if (side === 'left') {
    return (
      <svg
        className="bg-git-graph bg-git-graph-left"
        viewBox="0 0 200 900"
        fill="none"
        aria-hidden="true"
      >
        {/* Main trunk line flowing bottom to top */}
        <path d="M 40 900 V 0" className="git-trunk-line" />

        {/* Feature/heal branch curved path flowing bottom to top */}
        <path
          d="M 40 900 V 680 C 40 620, 100 600, 100 540 V 360 C 100 300, 40 280, 40 220 V 0"
          className="git-branch-line"
        />

        {/* Animated Ripple Rings */}
        <circle cx="100" cy="500" r="4" className="pulse-ring ring-error" />
        <circle cx="40" cy="160" r="4" className="pulse-ring ring-merge" />

        {/* Commit Nodes: Bottom-to-Top (Flow -> Error -> Retry -> Merge) */}
        {/* 1. Main flow commit (bottom) */}
        <circle
          cx="40"
          cy="760"
          r="4.5"
          className="commit-node node-flow"
          stroke="#0969DA"
          strokeWidth="1.5"
        />

        {/* 2. CI error node (lower branch) */}
        <circle
          cx="100"
          cy="500"
          r="4.5"
          className="commit-node node-error"
          stroke="#0969DA"
          strokeWidth="1.5"
        />

        {/* 3. AI patch & retry node (upper branch) */}
        <circle
          cx="100"
          cy="400"
          r="4.5"
          className="commit-node node-retry"
          stroke="#0969DA"
          strokeWidth="1.5"
        />

        {/* 4. Merge commit (top on main) */}
        <circle
          cx="40"
          cy="160"
          r="4.5"
          className="commit-node node-merge"
          stroke="#0969DA"
          strokeWidth="1.5"
        />

        {/* Continuous Animated traveling packet: flowing bottom to top */}
        <circle r="4.5" className="flow-packet">
          <animateMotion
            path="M 40 900 V 680 C 40 620, 100 600, 100 540 V 360 C 100 300, 40 280, 40 220 V 0"
            dur="6s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Developer Micro Status Tags */}
        {/* Flow Tag (bottom) */}
        <g className="git-status-tag tag-flow">
          <rect x="52" y="749" width="46" height="20" rx="4" fill="#F6F8FA" stroke="#D0D7DE" strokeWidth="1" />
          <text x="75" y="763" textAnchor="middle" fill="#0969DA" fontSize="10" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="600">
            flow
          </text>
        </g>

        {/* Error Tag (branch) */}
        <g className="git-status-tag tag-error">
          <rect x="112" y="489" width="46" height="20" rx="4" fill="#FFEBE9" stroke="#FF8182" strokeWidth="1" />
          <text x="135" y="503" textAnchor="middle" fill="#CF222E" fontSize="10" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="600">
            error
          </text>
        </g>

        {/* Retry Tag (branch) */}
        <g className="git-status-tag tag-retry">
          <rect x="112" y="389" width="46" height="20" rx="4" fill="#DDF4FF" stroke="#54AEFF" strokeWidth="1" />
          <text x="135" y="403" textAnchor="middle" fill="#0969DA" fontSize="10" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="600">
            retry
          </text>
        </g>

        {/* Merge / Success Tag (top) */}
        <g className="git-status-tag tag-merge">
          <rect x="52" y="149" width="50" height="20" rx="4" fill="#FBEFFF" stroke="#D8B9FF" strokeWidth="1" />
          <text x="77" y="163" textAnchor="middle" fill="#8250DF" fontSize="10" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="600">
            merge
          </text>
        </g>
      </svg>
    );
  }

  // Right Side Graph (Mirrored flow bottom-to-top with staggered offset)
  return (
    <svg
      className="bg-git-graph bg-git-graph-right"
      viewBox="0 0 200 900"
      fill="none"
      aria-hidden="true"
    >
      {/* Main trunk line flowing bottom to top */}
      <path d="M 150 900 V 0" className="git-trunk-line" />

      {/* Feature/heal branch curved path flowing bottom to top */}
      <path
        d="M 150 900 V 660 C 150 600, 90 580, 90 520 V 340 C 90 280, 150 260, 150 200 V 0"
        className="git-branch-line"
      />

      {/* Animated Ripple Rings */}
      <circle cx="90" cy="480" r="4" className="pulse-ring ring-error" />
      <circle cx="150" cy="140" r="4" className="pulse-ring ring-merge" />

      {/* Commit Nodes: Bottom to Top */}
      <circle
        cx="150"
        cy="740"
        r="4.5"
        className="commit-node node-flow"
        stroke="#0969DA"
        strokeWidth="1.5"
      />

      <circle
        cx="90"
        cy="480"
        r="4.5"
        className="commit-node node-error"
        stroke="#0969DA"
        strokeWidth="1.5"
      />

      <circle
        cx="90"
        cy="380"
        r="4.5"
        className="commit-node node-retry"
        stroke="#0969DA"
        strokeWidth="1.5"
      />

      <circle
        cx="150"
        cy="140"
        r="4.5"
        className="commit-node node-merge"
        stroke="#0969DA"
        strokeWidth="1.5"
      />

      {/* Traveling packet flowing bottom to top */}
      <circle r="4.5" className="flow-packet">
        <animateMotion
          path="M 150 900 V 660 C 150 600, 90 580, 90 520 V 340 C 90 280, 150 260, 150 200 V 0"
          dur="6s"
          begin="0.8s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Status Tags */}
      <g className="git-status-tag tag-flow">
        <rect x="94" y="729" width="46" height="20" rx="4" fill="#F6F8FA" stroke="#D0D7DE" strokeWidth="1" />
        <text x="117" y="743" textAnchor="middle" fill="#0969DA" fontSize="10" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="600">
          flow
        </text>
      </g>

      <g className="git-status-tag tag-error">
        <rect x="34" y="469" width="46" height="20" rx="4" fill="#FFEBE9" stroke="#FF8182" strokeWidth="1" />
        <text x="57" y="483" textAnchor="middle" fill="#CF222E" fontSize="10" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="600">
          error
        </text>
      </g>

      <g className="git-status-tag tag-retry">
        <rect x="34" y="369" width="46" height="20" rx="4" fill="#DDF4FF" stroke="#54AEFF" strokeWidth="1" />
        <text x="57" y="383" textAnchor="middle" fill="#0969DA" fontSize="10" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="600">
          retry
        </text>
      </g>

      <g className="git-status-tag tag-merge">
        <rect x="90" y="129" width="50" height="20" rx="4" fill="#FBEFFF" stroke="#D8B9FF" strokeWidth="1" />
        <text x="115" y="143" textAnchor="middle" fill="#8250DF" fontSize="10" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="600">
          merge
        </text>
      </g>
    </svg>
  );
};

export default GitFlowGraph;
