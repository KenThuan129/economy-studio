import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  title,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <button
          type="button"
          aria-label="More information"
          className="text-slate-400 hover:text-slate-200 transition-colors cursor-help p-0.5"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 w-64 p-2.5 bg-slate-900 border border-slate-700/80 rounded-lg shadow-xl shadow-black/50 text-xs text-slate-200 pointer-events-none transition-opacity duration-150 animate-in fade-in zoom-in-95 ${getPositionClasses()}`}
        >
          {title && (
            <div className="font-semibold text-slate-100 mb-1 border-b border-slate-800 pb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              {title}
            </div>
          )}
          <div className="leading-relaxed text-slate-300">{content}</div>
        </div>
      )}
    </div>
  );
};
