import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GitHubLoginPage from './components/GitHubLoginPage';
import AuthCallbackPage from './components/auth/AuthCallbackPage';
import OnboardingPage from './components/onboarding/OnboardingPage';
import DashboardPage from './components/dashboard/DashboardPage';
import RunDetailPage from './components/runs/RunDetailPage';
import SettingsPage from './components/settings/SettingsPage';
import UsagePage from './components/usage/UsagePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<GitHubLoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Onboarding Route (Protected, with custom focused layout) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute withAppShell={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute withAppShell={true}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Usage Route */}
          <Route
            path="/usage"
            element={
              <ProtectedRoute withAppShell={true}>
                <UsagePage />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Run Detail Route */}
          <Route
            path="/runs/:id"
            element={
              <ProtectedRoute withAppShell={true}>
                <RunDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Settings Route */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute withAppShell={true}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
