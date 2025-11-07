import React from 'react';

interface LoadingSpinnerProps {
    message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <div role="status" aria-live="polite">
        <p className="text-slate-600 dark:text-slate-400 font-medium text-lg text-center">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;