import React, { useState, useEffect, useLayoutEffect } from 'react';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface FeatureTourProps {
  steps: TourStep[];
  onComplete: () => void;
}

const FeatureTour: React.FC<FeatureTourProps> = ({ steps, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const currentStep = steps[currentStepIndex];

  useLayoutEffect(() => {
    const updatePosition = () => {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        // Give scrolling a moment to settle before measuring
        setTimeout(() => {
          setTargetRect(element.getBoundingClientRect());
        }, 300);
      }
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStepIndex, currentStep.target]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const getTooltipPosition = () => {
    if (!targetRect) return {};
    const placement = currentStep.placement || 'bottom';
    const offset = 12; // 12px gap between element and tooltip
    
    switch (placement) {
      case 'top':
        return {
          top: targetRect.top - offset,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translate(-50%, -100%)',
        };
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - offset,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + offset,
          transform: 'translateY(-50%)',
        };
      case 'bottom':
      default:
        return {
          top: targetRect.bottom + offset,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
        };
    }
  };

  if (!targetRect) return null;

  return (
    <div className="fixed inset-0 z-[1000]" aria-live="polite">
      <div className="fixed inset-0 bg-black/60 animate-fade-in" onClick={onComplete}></div>
      
      <div
        className="fixed border-2 border-cyan-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6),0_0_20px_2px_rgba(6,182,212,0.7)] transition-all duration-300 ease-in-out pointer-events-none"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
        }}
      />

      <div
        className="fixed z-[1001] bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-4 w-72 transition-all duration-300 ease-in-out animate-fade-in-slide-up"
        style={getTooltipPosition()}
        role="dialog"
        aria-labelledby="tour-title"
      >
        <h3 id="tour-title" className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">{currentStep.title}</h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{currentStep.content}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {currentStepIndex + 1} / {steps.length}
          </span>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 px-3 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-1 rounded-md transition-colors"
            >
              {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureTour;