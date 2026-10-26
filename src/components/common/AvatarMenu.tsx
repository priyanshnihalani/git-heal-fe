import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/tokenUtils';
import './AvatarMenu.css';

export const AvatarMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const initials = getInitials(user?.name, user?.login);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="avatar-menu-wrap" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`avatar-trigger-btn ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`User menu for ${user?.name || 'Account'}`}
      >
        {user?.avatarUrl && !imgError ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="avatar-photo"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="avatar-initials-fallback" aria-hidden="true">
            {initials}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="avatar-dropdown-panel" role="menu" aria-label="User navigation">
          <div className="avatar-user-badge">
            <span className="user-display-name">{user?.name || 'Alex Chen'}</span>
            <span className="user-handle">@{user?.login || 'alex-developer'}</span>
          </div>

          <div className="dropdown-divider" />

          <Link
            to="/usage"
            className="dropdown-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <svg className="menu-icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75Zm0 5a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1-.75-.75Z" />
            </svg>
            <span>Usage</span>
          </Link>

          <Link
            to="/settings"
            className="dropdown-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <svg className="menu-icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z" />
              <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
            </svg>
            <span>Settings</span>
          </Link>

          <div className="dropdown-divider" />

          <button
            type="button"
            className="dropdown-item text-danger"
            role="menuitem"
            onClick={handleSignOut}
          >
            <svg className="menu-icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M3 4.25a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5h-4A.25.25 0 0 0 3.5 5.25v5.5c0 .138.112.25.25.25h4a.75.75 0 0 1 0 1.5h-4A1.75 1.75 0 0 1 2 10.75v-5.5C2 4.284 2.784 3.5 3.75 3.5h.001ZM10.22 5.22a.75.75 0 0 1 1.06 0l2.5 2.5a.75.75 0 0 1 0 1.06l-2.5 2.5a.75.75 0 1 1-1.06-1.06L11.44 9H6.75a.75.75 0 0 1 0-1.5h4.69L10.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AvatarMenu;
