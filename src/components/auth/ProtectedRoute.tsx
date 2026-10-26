import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../common/Skeleton';
import AppShell from '../common/AppShell';

interface ProtectedRouteProps {
  children: React.ReactNode;
  withAppShell?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  withAppShell = true,
}) => {
  const { isAuthenticated, hasConnectedRepos, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
        }}
      >
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton width="100%" height={28} />
          <Skeleton width="70%" height={16} />
          <Skeleton width="90%" height={16} />
        </div>
      </div>
    );
  }

  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Guard 1: Must be authenticated (on localhost, api.auth.getSession auto-seeds session)
  if (!isAuthenticated && !isLocal) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Guard 2: Authenticated with zero repos -> must complete onboarding (skip lockout on localhost if navigating directly)
  if (!hasConnectedRepos && location.pathname !== '/onboarding' && !isLocal) {
    return <Navigate to="/onboarding" replace />;
  }

  // Guard 3: Authenticated with repos -> in production, bounce away from /onboarding to /dashboard.
  // On localhost, allow directly previewing /onboarding anytime!
  if (hasConnectedRepos && location.pathname === '/onboarding' && !isLocal) {
    return <Navigate to="/dashboard" replace />;
  }

  if (withAppShell) {
    return <AppShell>{children}</AppShell>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
