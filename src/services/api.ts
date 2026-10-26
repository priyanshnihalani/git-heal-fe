import type {
  Repo,
  Run,
  User,
  UserSettings,
  DashboardStats,
  DiffLine,
  TokenUsage,
  UsageRange,
} from '../types';

// Helper to compute additions/deletions from diff lines
export function computeDiffCounts(lines: DiffLine[]): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const line of lines) {
    if (line.type === 'add') additions++;
    else if (line.type === 'del') deletions++;
  }
  return { additions, deletions };
}

const STORAGE_KEYS = {
  USER: 'githeal_user',
  REPOS: 'githeal_repos',
  RUNS: 'githeal_runs',
  SETTINGS: 'githeal_settings',
};

const SEED_USER: User = {
  id: 'usr_849201',
  login: 'alex-developer',
  name: 'Alex Chen',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  email: 'alex@acme.corp',
};

const SEED_REPOS: Repo[] = [
  {
    id: 'repo_auth',
    name: 'auth-service',
    fullName: 'acme/auth-service',
    isPrivate: true,
    language: 'TypeScript',
    hasWorkflows: true,
    workflowFile: '.github/workflows/ci.yml',
    lastCiStatus: 'failure',
    monitored: false,
  },
  {
    id: 'repo_pipeline',
    name: 'data-pipeline',
    fullName: 'acme/data-pipeline',
    isPrivate: true,
    language: 'Python',
    hasWorkflows: true,
    workflowFile: '.github/workflows/test.yml',
    lastCiStatus: 'failure',
    monitored: false,
  },
  {
    id: 'repo_payments',
    name: 'payment-gateway',
    fullName: 'acme/payment-gateway',
    isPrivate: true,
    language: 'Go',
    hasWorkflows: true,
    workflowFile: '.github/workflows/build-test.yml',
    lastCiStatus: 'success',
    monitored: false,
  },
  {
    id: 'repo_marketing',
    name: 'marketing-site',
    fullName: 'acme/marketing-site',
    isPrivate: false,
    language: 'TypeScript',
    hasWorkflows: true,
    workflowFile: '.github/workflows/deploy.yml',
    lastCiStatus: 'success',
    monitored: false,
  },
  {
    id: 'repo_legacy',
    name: 'legacy-crm-sync',
    fullName: 'acme/legacy-crm-sync',
    isPrivate: true,
    language: 'Java',
    hasWorkflows: false,
    lastCiStatus: 'none',
    monitored: false,
  },
];

const SEED_DIFF_LINES: DiffLine[] = [
  { type: 'context', code: 'export function isTokenValid(token: string) {' },
  { type: 'context', code: '  const decoded = jwt.decode(token);' },
  { type: 'del', code: '- return decoded.exp > Date.now();' },
  { type: 'add', code: '+ if (!decoded?.exp) return false;' },
  { type: 'add', code: '+ return decoded.exp * 1000 > Date.now();' },
  { type: 'context', code: '}' },
];

const SEED_RUNS: Run[] = [
  {
    id: 'run_4812',
    repo: 'acme/auth-service',
    branch: 'feat/refresh-rotation',
    commitHash: 'd4e8a1f',
    commitMessage: 'fix(auth): handle expired token edge-case on session refresh',
    status: 'PR opened',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    relativeTime: '12m ago',
    duration: '42s',
    prNumber: 48,
    prUrl: 'https://github.com/acme/auth-service/pull/48',
    githubRunUrl: 'https://github.com/acme/auth-service/actions/runs/14829381',
    steps: [
      { name: 'Detect', status: 'completed', duration: '2s', summary: 'Workflow ci.yml failed at step "Run test suite"' },
      { name: 'Investigate', status: 'completed', duration: '9s', tokens: 3200, summary: 'Parsed stack trace: TokenExpiredError expected Date in milliseconds' },
      { name: 'Patch', status: 'completed', duration: '14s', tokens: 8800, summary: 'Synthesized minimal fix in src/auth/token.ts (+2 -1 lines)' },
      { name: 'Verify', status: 'completed', duration: '12s', tokens: 6400, summary: '15/15 tests passing in isolated Docker sandbox' },
      { name: 'Open PR', status: 'completed', duration: '5s', summary: 'Opened PR #48 with reproduction tests' },
    ],
    failingLog: [
      'FAIL test/auth.test.ts > isTokenValid > rejects expired token immediately',
      'AssertionError: expected true to be false',
      '    at /app/src/auth/token.ts:14:12',
      '    at isTokenValid (/app/src/auth/token.ts:12:10)',
      '    at test/auth.test.ts:32:16',
      '    Note: JWT "exp" is represented in seconds since Unix epoch, but Date.now() returns milliseconds.',
    ],
    rootCause:
      'JWT claims represent expiry timestamps (exp) in seconds since the Unix epoch. The comparison was evaluating `decoded.exp > Date.now()` directly against millisecond timestamps, causing valid tokens to immediately evaluate as expired.',
    patch: {
      filePath: 'src/auth/token.ts',
      lines: SEED_DIFF_LINES,
      ...computeDiffCounts(SEED_DIFF_LINES),
    },
    sandbox: {
      passed: true,
      summary: '15/15 passing, 0 regressions',
      duration: '11.8s',
      testFiles: [
        { path: 'test/auth.test.ts', passed: true, duration: '2.1s' },
        { path: 'test/session.test.ts', passed: true, duration: '3.4s' },
        { path: 'test/integration/jwt-rotation.test.ts', passed: true, duration: '6.3s' },
      ],
    },
    reasoningSteps: [
      {
        id: 'rs_1',
        title: 'Extracted failing test assertion',
        detail: 'Identified test failure in test/auth.test.ts line 32. Failure is a semantic unit mismatch (seconds vs ms).',
        status: 'passed',
        timestamp: '12m ago',
      },
      {
        id: 'rs_2',
        title: 'Explored callers of isTokenValid',
        detail: 'Checked 4 call sites across auth middleware. Verified null check is also required for unsigned mock tokens.',
        status: 'passed',
        timestamp: '11m ago',
      },
      {
        id: 'rs_3',
        title: 'Sandbox verification run 1',
        detail: 'Applied patch to sandbox container. Ran test suite. All 15 tests passed with zero side-effects.',
        status: 'passed',
        timestamp: '10m ago',
      },
    ],
  },
  {
    id: 'run_4811',
    repo: 'acme/data-pipeline',
    branch: 'fix/consumer-payload',
    commitHash: '9c2b4a1',
    commitMessage: 'fix(consumer): handle null payload in webhook stream',
    status: 'Verifying',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    relativeTime: '3m ago',
    duration: '28s',
    githubRunUrl: 'https://github.com/acme/data-pipeline/actions/runs/14829377',
    steps: [
      { name: 'Detect', status: 'completed', duration: '3s', summary: 'Pytest failed on TestEventStreamConsumer' },
      { name: 'Investigate', status: 'completed', duration: '11s', tokens: 3100, summary: 'AttributeError: NoneType object has no attribute "get"' },
      { name: 'Patch', status: 'completed', duration: '14s', tokens: 9200, summary: 'Proposed guard clause in stream_consumer.py (+3 -1)' },
      { name: 'Verify', status: 'in_progress', duration: 'running...', tokens: 5800, summary: 'Running pytest in Docker sandbox container' },
      { name: 'Open PR', status: 'pending' },
    ],
    failingLog: [
      '============================= FAILURES =============================',
      '__________________ test_consumer_empty_payload ___________________',
      'events/consumer.py:48: in process_event',
      '    event_type = payload.get("type", "unknown")',
      'E   AttributeError: "NoneType" object has no attribute "get"',
    ],
    rootCause:
      'The consumer assumed an empty Kafka message would deserialise into an empty dictionary, but a tombstone message yields None, throwing an uncaught AttributeError.',
    patch: {
      filePath: 'events/consumer.py',
      lines: [
        { type: 'context', code: 'def process_event(payload: dict | None) -> None:' },
        { type: 'del', code: '-    event_type = payload.get("type", "unknown")' },
        { type: 'add', code: '+    if payload is None:' },
        { type: 'add', code: '+        return' },
        { type: 'add', code: '+    event_type = payload.get("type", "unknown")' },
        { type: 'context', code: '    dispatch(event_type, payload)' },
      ],
      additions: 3,
      deletions: 1,
    },
    sandbox: {
      passed: true,
      summary: 'Tests executing in isolated container',
      duration: 'In progress',
      testFiles: [
        { path: 'tests/test_consumer.py', passed: true, duration: '1.2s' },
        { path: 'tests/test_stream.py', passed: true, duration: '2.8s' },
      ],
    },
  },
  {
    id: 'run_4810',
    repo: 'acme/payment-gateway',
    branch: 'chore/stripe-v14',
    commitHash: '7f1c3d0',
    commitMessage: 'chore(deps): update stripe-node SDK to v14',
    status: 'Merged',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    relativeTime: '4h ago',
    duration: '38s',
    prNumber: 31,
    prUrl: 'https://github.com/acme/payment-gateway/pull/31',
    githubRunUrl: 'https://github.com/acme/payment-gateway/actions/runs/14829100',
    steps: [
      { name: 'Detect', status: 'completed', duration: '2s', summary: 'Build failed: undefined property "charges" in Stripe.PaymentIntent' },
      { name: 'Investigate', status: 'completed', duration: '8s', tokens: 2800, summary: 'Stripe v14 renamed charges.data[0] to latest_charge expansion' },
      { name: 'Patch', status: 'completed', duration: '12s', tokens: 7400, summary: 'Updated charge reference (+4 -2 lines)' },
      { name: 'Verify', status: 'completed', duration: '11s', tokens: 5200, summary: '28/28 integration tests passing' },
      { name: 'Open PR', status: 'completed', duration: '5s', summary: 'PR #31 merged by @alex-developer' },
    ],
    failingLog: [
      'src/handlers/webhook.ts:42:28 - error TS2339: Property "charges" does not exist on type "PaymentIntent".',
      '42   const chargeId = intent.charges.data[0]?.id;',
      '                             ~~~~~~~',
    ],
    rootCause:
      'Stripe SDK v14 migrated PaymentIntent charges to `latest_charge` string or expanded object, removing the deprecated `charges` property.',
    patch: {
      filePath: 'src/handlers/webhook.ts',
      lines: [
        { type: 'context', code: 'export function handlePaymentIntent(intent: Stripe.PaymentIntent) {' },
        { type: 'del', code: '-  const chargeId = intent.charges?.data?.[0]?.id;' },
        { type: 'add', code: '+  const chargeId = typeof intent.latest_charge === "string"' },
        { type: 'add', code: '+    ? intent.latest_charge' },
        { type: 'add', code: '+    : intent.latest_charge?.id;' },
        { type: 'context', code: '  return recordTransaction(chargeId);' },
      ],
      additions: 3,
      deletions: 1,
    },
    sandbox: {
      passed: true,
      summary: '28/28 passing, 0 regressions',
      duration: '14.2s',
      testFiles: [
        { path: 'test/stripe.test.ts', passed: true, duration: '4.2s' },
        { path: 'test/webhook.test.ts', passed: true, duration: '10.0s' },
      ],
    },
  },
  {
    id: 'run_4809',
    repo: 'acme/auth-service',
    branch: 'fix/grpc-channel',
    commitHash: 'e1a90c2',
    commitMessage: 'fix(grpc): retry connection on UNAVAILABLE status',
    status: 'Failed to fix',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    relativeTime: '18h ago',
    duration: '1m 24s',
    githubRunUrl: 'https://github.com/acme/auth-service/actions/runs/14828550',
    steps: [
      { name: 'Detect', status: 'completed', duration: '3s', summary: 'CI failed in step "Integration test"' },
      { name: 'Investigate', status: 'completed', duration: '14s', tokens: 4100, summary: 'Deadlock in gRPC pool client initialization' },
      { name: 'Patch', status: 'completed', duration: '28s', tokens: 12400, summary: 'Attempted 3 patch variants with backoff strategies' },
      { name: 'Verify', status: 'failed', duration: '35s', tokens: 7200, summary: 'Sandbox tests failed with socket exhaustion' },
      { name: 'Open PR', status: 'failed', summary: 'Did not open PR due to sandbox verification failure' },
    ],
    failingLog: [
      'Error: 14 UNAVAILABLE: No connection established',
      '    at Object.callErrorFromStatus (/node_modules/@grpc/grpc-js/build/src/call.js:31:26)',
      '    at Object.onReceiveStatus (/node_modules/@grpc/grpc-js/build/src/client.js:192:52)',
      '    at Deadline exceeded in integration/pool.test.ts:88:14',
    ],
    rootCause:
      'The failing test relies on an unmocked external Redis sentinel service that is unreachable in ephemeral CI environments. Patch attempts could not verify passing tests without modifying integration infrastructure.',
    failureReason:
      'GitHeal attempted 3 minimal backoff patches, but the test failure stems from external Redis networking in the test environment rather than application code logic.',
    humanRecommendation:
      'Check if the Redis sentinel sidecar container is specified in `.github/workflows/ci.yml`. The test failed due to connection refused on port 26379.',
  },
];

const SEED_SETTINGS: UserSettings = {
  emailOnPrOpened: true,
  emailOnFixFailed: true,
  watchedBranches: 'main, master, release/*',
  onlyWatchedBranches: true,
  pauseOnThresholdEnabled: false,
  pauseThresholdPercent: 90,
  emailOnTokenThreshold: true,
  envVars: [
    { id: 'env_1', key: 'NODE_ENV', value: 'test', isSecret: false },
    { id: 'env_2', key: 'CI', value: 'true', isSecret: false },
    { id: 'env_3', key: 'TEST_DATABASE_URL', value: 'postgres://test:test@localhost:5432/testdb', isSecret: true },
  ],
};

// ==========================================
// API Layer
// ==========================================

export const api = {
  // Auth
  auth: {
    async getSession(): Promise<{ user: User | null; isAuthenticated: boolean; hasConnectedRepos: boolean }> {
      await new Promise((r) => setTimeout(r, 40));
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      let rawUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (!rawUser && isLocal) {
        // Auto-seed user on localhost so all post-login pages are instantly accessible
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(SEED_USER));
        rawUser = JSON.stringify(SEED_USER);
      }

      if (!rawUser) {
        return { user: null, isAuthenticated: false, hasConnectedRepos: false };
      }

      const user: User = JSON.parse(rawUser);
      let repos = await api.repos.getConnected();

      if (repos.length === 0 && isLocal) {
        // Pre-connect sample repos on localhost so dashboard and runs work immediately
        await api.repos.connectRepos(['repo_auth', 'repo_pipeline']);
        repos = await api.repos.getConnected();
      }

      return {
        user,
        isAuthenticated: true,
        hasConnectedRepos: repos.length > 0,
      };
    },

    async login(user: User = SEED_USER): Promise<User> {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;
    },

    async logout(): Promise<void> {
      localStorage.removeItem(STORAGE_KEYS.USER);
    },
  },

  // Repos
  repos: {
    async getAll(): Promise<Repo[]> {
      await new Promise((r) => setTimeout(r, 10));
      const raw = localStorage.getItem(STORAGE_KEYS.REPOS);
      if (raw) {
        return JSON.parse(raw);
      }
      localStorage.setItem(STORAGE_KEYS.REPOS, JSON.stringify(SEED_REPOS));
      return SEED_REPOS;
    },

    async getConnected(): Promise<Repo[]> {
      const all = await api.repos.getAll();
      return all.filter((r) => r.monitored);
    },

    async connectRepos(repoIds: string[]): Promise<Repo[]> {
      await new Promise((r) => setTimeout(r, 10));
      const all = await api.repos.getAll();
      const updated = all.map((r) => ({
        ...r,
        monitored: repoIds.includes(r.id) ? true : r.monitored,
      }));
      localStorage.setItem(STORAGE_KEYS.REPOS, JSON.stringify(updated));
      return updated.filter((r) => r.monitored);
    },

    async disconnectRepo(repoId: string): Promise<Repo[]> {
      await new Promise((r) => setTimeout(r, 10));
      const all = await api.repos.getAll();
      const updated = all.map((r) => (r.id === repoId ? { ...r, monitored: false } : r));
      localStorage.setItem(STORAGE_KEYS.REPOS, JSON.stringify(updated));
      return updated.filter((r) => r.monitored);
    },
  },

  // Runs
  runs: {
    async getAll(filter?: { repo?: string; status?: string }): Promise<Run[]> {
      await new Promise((r) => setTimeout(r, 10));
      const raw = localStorage.getItem(STORAGE_KEYS.RUNS);
      let list: Run[] = raw ? JSON.parse(raw) : SEED_RUNS;
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(SEED_RUNS));
      }

      if (filter?.repo && filter.repo !== 'all') {
        list = list.filter((r) => r.repo === filter.repo);
      }
      if (filter?.status && filter.status !== 'all') {
        list = list.filter((r) => r.status.toLowerCase() === filter.status?.toLowerCase());
      }
      return list;
    },

    async getById(id: string): Promise<Run | null> {
      await new Promise((r) => setTimeout(r, 100));
      const all = await api.runs.getAll();
      return all.find((r) => r.id === id) || null;
    },

    async rerun(id: string): Promise<Run> {
      await new Promise((r) => setTimeout(r, 200));
      const all = await api.runs.getAll();
      const run = all.find((r) => r.id === id);
      if (!run) throw new Error('Run not found');

      const updated: Run = {
        ...run,
        status: 'Investigating',
        duration: 're-running...',
        steps: run.steps.map((s, idx) => ({
          ...s,
          status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'pending',
        })),
      };

      const newList = all.map((r) => (r.id === id ? updated : r));
      localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(newList));
      return updated;
    },

    async dismiss(id: string): Promise<void> {
      await new Promise((r) => setTimeout(r, 150));
      const all = await api.runs.getAll();
      const newList = all.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(newList));
    },

    async getStats(): Promise<DashboardStats> {
      const connectedRepos = await api.repos.getConnected();
      const allRuns = await api.runs.getAll();
      const verifiedCount = allRuns.filter((r) => r.status === 'PR opened' || r.status === 'Merged').length;
      const mergedCount = allRuns.filter((r) => r.status === 'Merged').length;
      const mergeRate = verifiedCount > 0 ? Math.round((mergedCount / verifiedCount) * 100) : 0;

      return {
        reposMonitored: connectedRepos.length,
        failuresDetected30d: allRuns.length,
        fixesVerified: verifiedCount,
        mergeRate: mergeRate || 84, // Realistic default
      };
    },
  },

  // Settings
  settings: {
    async get(): Promise<UserSettings> {
      await new Promise((r) => setTimeout(r, 80));
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return JSON.parse(raw);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(SEED_SETTINGS));
      return SEED_SETTINGS;
    },

    async update(patch: Partial<UserSettings>): Promise<UserSettings> {
      await new Promise((r) => setTimeout(r, 150));
      const current = await api.settings.get();
      const updated = { ...current, ...patch };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    },

    async deleteAllData(): Promise<void> {
      await new Promise((r) => setTimeout(r, 300));
      localStorage.clear();
    },
  },

  // ========================================================
  // Usage & Limits API (Token consumption tracking)
  //
  // NOTE: In a production backend, this aggregates a
  // `token_usage_events` table (run_id, stage, model, input_tokens, output_tokens, created_at)
  // recorded from each LLM response's usage field.
  // ========================================================
  usage: {
    async getTokenUsage(range: UsageRange = { preset: 'today' }, repoId?: string): Promise<TokenUsage> {
      await new Promise((r) => setTimeout(r, 80));

      const dailyLimit = 500000;
      let usedToday = 182400; // Baseline ok: 36.5%

      // Dev-only query flag: ?mockUsage=ok|low|limit to preview three states for QA
      if (typeof window !== 'undefined' && import.meta.env.DEV) {
        const urlParams = new URLSearchParams(window.location.search);
        const mockFlag = urlParams.get('mockUsage');
        if (mockFlag === 'low') {
          usedToday = 420000; // 84% (amber, "Running low")
        } else if (mockFlag === 'limit') {
          usedToday = 500000; // 100% (red, "Limit reached")
        } else if (mockFlag === 'ok') {
          usedToday = 182400;
        }
      }

      // Next reset time (midnight local today)
      const now = new Date();
      const nextReset = new Date(now);
      nextReset.setHours(24, 0, 0, 0);

      // Generate 30 days of daily history ending today
      const byDay: TokenUsage['byDay'] = [];
      const dayValues = [
        usedToday,
        342000,
        468000, // 93.6% -> amber bar!
        210400,
        482000, // 96.4% -> amber bar!
        195000,
        289000,
        312000,
        174000,
        240000,
        380000,
        410000,
        155000,
        290000,
        320000,
        210000,
        470000, // amber bar
        190000,
        230000,
        310000,
        280000,
        160000,
        350000,
        290000,
        180000,
        260000,
        330000,
        220000,
        310000,
        240000,
      ];

      for (let i = 0; i < 30; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        byDay.push({
          date: dateStr,
          used: dayValues[i] || 250000,
          limit: dailyLimit,
        });
      }
      // Reverse to chronological order (oldest to newest)
      byDay.reverse();

      let used = usedToday;
      let remaining: number | null = null;
      let fromDate = now.toISOString().split('T')[0];
      let toDate = now.toISOString().split('T')[0];

      if (range.preset === 'today') {
        used = usedToday;
        remaining = Math.max(0, dailyLimit - usedToday);
        fromDate = toDate;
      } else if (range.preset === '7d') {
        const slice = byDay.slice(-7);
        used = slice.reduce((sum, d) => sum + d.used, 0);
        remaining = null; // Do NOT show "left" for 7d
        fromDate = slice[0].date;
      } else if (range.preset === '30d') {
        used = byDay.reduce((sum, d) => sum + d.used, 0);
        remaining = null; // Do NOT show "left" for 30d
        fromDate = byDay[0].date;
      } else if (range.preset === 'month') {
        // Current month
        used = 1894200;
        const monthlyCap = 5000000;
        remaining = monthlyCap - used;
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      } else if (range.preset === 'custom') {
        fromDate = range.from;
        toDate = range.to;
        // Approximate usage from days in range
        used = 1240000;
        remaining = null; // Do NOT show "left" for custom
      }

      // Stage breakdown (Investigate, Patch, Critic/Verify)
      let byStage: TokenUsage['byStage'] = [
        { stage: 'investigate', input: Math.round(used * 0.22), output: Math.round(used * 0.05) },
        { stage: 'patch', input: Math.round(used * 0.42), output: Math.round(used * 0.12) },
        { stage: 'critic', input: Math.round(used * 0.15), output: Math.round(used * 0.04) },
      ];

      // Repo breakdown
      let byRepo: TokenUsage['byRepo'] = [
        { repo: 'acme/auth-service', used: Math.round(used * 0.48), runs: 2 },
        { repo: 'acme/data-pipeline', used: Math.round(used * 0.32), runs: 1 },
        { repo: 'acme/payment-gateway', used: Math.round(used * 0.20), runs: 1 },
      ];

      if (repoId && repoId !== 'all') {
        byRepo = byRepo.filter((r) => r.repo === repoId);
        if (byRepo.length > 0) {
          used = byRepo[0].used;
          if (range.preset === 'today') {
            remaining = Math.max(0, dailyLimit - used);
          }
        }
      }

      return {
        range: { from: fromDate, to: toDate },
        limit: {
          daily: dailyLimit,
          monthly: range.preset === 'month' ? 5000000 : undefined,
        },
        used,
        remaining,
        resetsAt: nextReset.toISOString(),
        byDay: range.preset === '7d' ? byDay.slice(-7) : byDay,
        byStage,
        byRepo,
      };
    },

    subscribeTokenUsage(cb: (usage: TokenUsage) => void, range: UsageRange = { preset: 'today' }): () => void {
      let isSubscribed = true;

      const trigger = async () => {
        if (!isSubscribed || (typeof document !== 'undefined' && document.hidden)) return;
        try {
          const data = await api.usage.getTokenUsage(range);
          if (isSubscribed) cb(data);
        } catch {
          // Handled gracefully in subscriber
        }
      };

      // Initial call
      trigger();

      const intervalId = window.setInterval(trigger, 5000);

      const handleVisibilityChange = () => {
        if (!document.hidden && isSubscribed) {
          trigger();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        isSubscribed = false;
        window.clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    },
  },
};
