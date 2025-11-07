import React from 'react';
import { CloseIcon, ShieldCheckIcon } from './Icons';

interface OnboardingModalProps {
    onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in"
            aria-modal="true"
            role="dialog"
            aria-labelledby="onboarding-title"
        >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative transform transition-all animate-fade-in-slide-up">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                    aria-label="Close welcome message"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
                
                <div className="text-center">
                    <ShieldCheckIcon className="w-12 h-12 text-cyan-600 dark:text-cyan-500 mx-auto mb-4"/>
                    <h2 id="onboarding-title" className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Welcome to GST Validator!</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Your tool for ensuring fair and accurate billing.</p>
                </div>
                
                <div className="mt-6 text-left space-y-4">
                    <div>
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Tips for Best Results:</h3>
                        <ul className="list-disc list-inside mt-1 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                            <li>Place the bill on a flat, well-lit surface.</li>
                            <li>Avoid shadows and ensure the text is clear.</li>
                            <li>Capture the entire bill, corner to corner.</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Privacy Notice:</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            To analyze your bill, images are sent to Google's secure servers for processing. We do not store your images after the analysis is complete.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button 
                        onClick={onClose} 
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-10 rounded-lg w-full sm:w-auto transition-transform transform hover:scale-105"
                    >
                        Got it, let's start!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
