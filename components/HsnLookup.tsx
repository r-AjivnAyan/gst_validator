import React, { useState } from 'react';
import { lookupHsnCode } from '../services/geminiService';
import { HsnResult } from '../types';
import { BookOpenIcon } from './Icons';
import { sanitizeText } from '../utils/security';

const HsnLookup: React.FC = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<HsnResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shakeError, setShakeError] = useState<boolean>(false);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const handleLookup = async () => {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length < 3) {
            setError("Please enter a more descriptive item name (at least 3 characters).");
            setShakeError(true);
            setTimeout(() => setShakeError(false), 500);
            return;
        }

        setIsLoading(true);
        setResult(null);
        setError(null);
        setIsCopied(false);
        try {
            const hsnData = await lookupHsnCode(trimmedQuery);
            setResult(hsnData);
        } catch (err: any) {
             setError(err.message || "An unexpected error occurred during the lookup.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        if (error) setError(null);
        if (result) setResult(null);
        if (isCopied) setIsCopied(false);
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleLookup();
        }
    };

    const handleCopy = () => {
        if (result?.code) {
            navigator.clipboard.writeText(result.code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    }

    return (
        <div id="tour-step-2" className="p-6 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
                <BookOpenIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-500"/>
                <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">HSN/SAC Code Lookup</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1 mb-4">Find the correct GST slab for any item.</p>
            <div className={`flex gap-2 ${shakeError ? 'animate-shake' : ''}`}>
                <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter item name (e.g., 'biscuits', 'laptop')"
                    className={`flex-grow p-3 border rounded-lg focus:ring-2 transition bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 ${error ? 'border-red-400 ring-red-200 focus:border-red-500' : 'border-slate-300 dark:border-slate-600 focus:border-cyan-500 focus:ring-cyan-500'}`}
                    disabled={isLoading}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'hsn-error' : undefined}
                />
                <button
                    onClick={handleLookup}
                    disabled={isLoading || !query.trim()}
                    className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg transition disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed"
                >
                    {isLoading ? '...' : 'Search'}
                </button>
            </div>

            {isLoading && (
                 <div className="text-center p-4 mt-4">
                    <div className="w-8 h-8 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Searching for GST details...</p>
                 </div>
            )}

            {error && <p id="hsn-error" className="mt-3 text-sm text-center text-red-600 dark:text-red-400 font-medium">{error}</p>}
            
            {result && (
                <div className="mt-4 p-4 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/80 rounded-lg space-y-4 animate-fade-in">
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">HSN/SAC Code</p>
                                <p className="text-xl font-semibold text-cyan-700 dark:text-cyan-500">{sanitizeText(result.code)}</p>
                            </div>
                            <button
                                onClick={handleCopy}
                                className={`px-3 py-1 text-sm rounded-md transition ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            >
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Description</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{sanitizeText(result.description)}</p>
                    </div>
                    
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">GST Rates</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">IGST</p>
                                <p className="font-semibold text-slate-700 dark:text-slate-300">{sanitizeText(result.igst)}</p>
                            </div>
                             <div className="bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">CGST</p>
                                <p className="font-semibold text-slate-700 dark:text-slate-300">{sanitizeText(result.cgst)}</p>
                            </div>
                             <div className="bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">SGST</p>
                                <p className="font-semibold text-slate-700 dark:text-slate-300">{sanitizeText(result.sgst)}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Details</p>
                        <p className="text-slate-800 dark:text-slate-300 text-sm bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">{sanitizeText(result.details)}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HsnLookup;