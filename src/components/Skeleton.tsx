import React from 'react';

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-fadeIn ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton skeleton-text"
          style={{ width: idx === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`card animate-fadeIn ${className}`}>
      <div className="skeleton skeleton-title" style={{ width: '40%' }} />
      <SkeletonText lines={3} />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = ''
}) => {
  return (
    <div className={`table-container animate-fadeIn ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, idx) => (
              <th key={idx}>
                <div className="skeleton" style={{ height: '16px', width: '60%' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx}>
              {Array.from({ length: cols }).map((_, cIdx) => (
                <td key={cIdx}>
                  <div
                    className="skeleton"
                    style={{
                      height: '14px',
                      width: cIdx === 0 ? '70%' : '50%'
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
