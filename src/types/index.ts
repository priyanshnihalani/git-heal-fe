export type RunStatus =
  | 'Detected'
  | 'Investigating'
  | 'Patching'
  | 'Verifying'
  | 'PR opened'
  | 'Merged'
  | 'Failed to fix'
  | 'Queued (token limit)';

export type StepName = 'Detect' | 'Investigate' | 'Patch' | 'Verify' | 'Open PR';
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface RunStep {
  name: StepName;
  status: StepStatus;
  timestamp?: string;
  duration?: string;
  tokens?: number; // AI tokens consumed by this step
  summary?: string;
}

export interface DiffLine {
  type: 'context' | 'add' | 'del';
  code: string;
}

export interface PatchDiff {
  filePath: string;
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

export interface SandboxResult {
  passed: boolean;
  summary: string;
  duration: string;
  testFiles: {
    path: string;
    passed: boolean;
    duration: string;
  }[];
}

export interface AgentReasoningStep {
  id: string;
  title: string;
  detail: string;
  status: 'passed' | 'warning' | 'info';
  timestamp: string;
}

export interface Run {
  id: string;
  repo: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  status: RunStatus;
  createdAt: string;
  relativeTime: string;
  duration: string;
  prNumber?: number;
  prUrl?: string;
  githubRunUrl: string;
  steps: RunStep[];
  failingLog: string[];
  rootCause: string;
  patch?: PatchDiff;
  sandbox?: SandboxResult;
  reasoningSteps?: AgentReasoningStep[];
  failureReason?: string;
  humanRecommendation?: string;
}

export interface Repo {
  id: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  language: string;
  hasWorkflows: boolean;
  workflowFile?: string;
  lastCiStatus: 'success' | 'failure' | 'none';
  monitored: boolean;
}

export interface User {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
  email: string;
}

export interface EnvVar {
  id: string;
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface UserSettings {
  emailOnPrOpened: boolean;
  emailOnFixFailed: boolean;
  watchedBranches: string;
  onlyWatchedBranches: boolean;
  // Stage C Usage settings
  pauseOnThresholdEnabled?: boolean;
  pauseThresholdPercent?: 80 | 90 | 100;
  emailOnTokenThreshold?: boolean;
  // Environment variables for sandbox verification
  envVars?: EnvVar[];
}

export type UsageRange =
  | { preset: 'today' | '7d' | '30d' | 'month' }
  | { preset: 'custom'; from: string; to: string }; // ISO dates

export interface DailyTokenUsage {
  date: string;
  used: number;
  limit: number | null;
}

export interface StageTokenUsage {
  stage: 'investigate' | 'patch' | 'critic';
  input: number;
  output: number;
}

export interface RepoTokenUsage {
  repo: string;
  used: number;
  runs: number;
}

export interface TokenUsage {
  range: { from: string; to: string };
  limit: { daily: number | null; monthly?: number | null };
  used: number;
  remaining: number | null; // null for 7d, 30d, custom
  resetsAt: string; // next daily reset, ISO
  byDay: DailyTokenUsage[];
  byStage: StageTokenUsage[];
  byRepo: RepoTokenUsage[];
}

export interface DashboardStats {
  reposMonitored: number;
  failuresDetected30d: number;
  fixesVerified: number;
  mergeRate: number; // percentage, e.g. 84
}
