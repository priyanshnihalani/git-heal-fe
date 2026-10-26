import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  children,
}) => {
  return (
    <header className="page-header-block">
      <div className="page-header-main">
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-desc">{description}</p>}
      </div>
      {(action || children) && (
        <div className="page-header-action">
          {action}
          {children}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
