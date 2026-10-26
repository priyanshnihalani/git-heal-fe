import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../common/Skeleton';

export const AuthCallbackPage: React.FC = () => {
  const { login, refreshSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const completeAuth = async () => {
      await login();
      await refreshSession();
      if (active) {
        navigate('/onboarding', { replace: true });
      }
    };
    completeAuth();
    return () => {
      active = false;
    };
  }, [login, refreshSession, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px',
        fontFamily: 'var(--font-sans, sans-serif)',
      }}
    >
      <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Skeleton width="100%" height={24} />
        <Skeleton width="80%" height={16} />
      </div>
      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Authenticating with GitHub...</p>
    </div>
  );
};

export default AuthCallbackPage;
