import React, { useState } from 'react';
import { CloseIcon, LocationMarkerIcon } from './Icons';
import { IndianStates } from '../types';
import { getStateFromGeolocation } from '../services/geminiService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentState: string | null;
    onSave: (newState: string) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentState, onSave, theme, toggleTheme }) => {
    const [selectedState, setSelectedState] = useState(currentState || Object.values(IndianStates)[0]);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(selectedState);
    };
    
    const handleAutoLocate = () => {
        setIsLocating(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const state = await getStateFromGeolocation(latitude, longitude);
                    if (Object.values(IndianStates).includes(state as IndianStates)) {
                        setSelectedState(state);
                        onSave(state); // Auto-save and close
                    } else {
                        setLocationError("Could not determine a valid Indian state from your location. Please select manually.");
                    }
                } catch (err) {
                    setLocationError("Failed to determine state from location. Please select manually.");
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError("Location access denied. Please enable it in your browser settings.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError("Location information is unavailable.");
                        break;
                    case error.TIMEOUT:
                        setLocationError("The request to get user location timed out.");
                        break;
                    default:
                        setLocationError("An unknown error occurred while getting location.");
                        break;
                }
                setIsLocating(false);
            },
            { timeout: 10000 }
        );
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in"
            aria-modal="true"
            role="dialog"
            aria-labelledby="settings-title"
        >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 relative transform transition-all animate-fade-in-slide-up">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                    aria-label="Close settings"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
                
                <div className="text-center">
                    <h2 id="settings-title" className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your preferences.</p>
                </div>
                
                <div className="mt-6 space-y-4">
                     <div>
                        <label htmlFor="state-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Your State / Union Territory
                        </label>
                        <select
                            id="state-select"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            disabled={isLocating}
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-50"
                        >
                            {Object.values(IndianStates).map(stateName => (
                                <option key={stateName} value={stateName}>
                                    {stateName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleAutoLocate}
                        disabled={isLocating}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-cyan-700 dark:text-cyan-500 border border-cyan-600 dark:border-cyan-500 px-3 py-2.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isLocating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span>Locating...</span>
                            </>
                        ) : (
                             <>
                                <LocationMarkerIcon className="w-5 h-5" />
                                <span>Use My Current Location</span>
                            </>
                        )}
                    </button>
                    {locationError && <p className="text-xs text-center text-red-600 dark:text-red-400">{locationError}</p>}
                    
                    {/* NEW: Dark Mode Toggle */}
                    <div className="flex items-center justify-between pt-2">
                        <label htmlFor="dark-mode-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Dark Mode
                        </label>
                        <button
                            id="dark-mode-toggle"
                            onClick={toggleTheme}
                            role="switch"
                            aria-checked={theme === 'dark'}
                            className={`${theme === 'dark' ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
                        >
                            <span
                                aria-hidden="true"
                                className={`${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </button>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200">State GST Rule</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Selecting your state allows us to accurately validate local taxes (CGST + SGST for intra-state transactions) vs. central taxes (IGST for inter-state transactions).
                    </p>
                </div>


                <div className="mt-6">
                    <button 
                        onClick={handleSave} 
                        disabled={isLocating}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg w-full transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Save and Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;