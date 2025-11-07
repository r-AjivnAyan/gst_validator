import React from 'react';
import { HistoryItem } from '../types';
import { CheckCircleIcon, WarningIcon, HistoryIcon, TrashIcon } from './Icons';

interface HistoryViewProps {
    history: HistoryItem[];
    onSelect: (item: HistoryItem) => void;
    onClear: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelect, onClear }) => {
    if (history.length === 0) {
        return (
            <div className="text-center p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 shadow-sm animate-fade-in">
                <HistoryIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No Scan History</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Your past bill analyses will appear here.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Past Scans</h2>
                 <button 
                    onClick={onClear} 
                    className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <TrashIcon className="w-4 h-4" />
                    Clear History
                 </button>
            </div>
            {history.map((item, index) => {
                const isVerified = item.overallStatus === 'VERIFIED';
                return (
                    <button 
                        key={item.id} 
                        onClick={() => onSelect(item)}
                        className="w-full text-left p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md hover:border-cyan-500 dark:hover:border-cyan-600 hover:-translate-y-0.5 transition-all flex items-center gap-4 animate-fade-in-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex-shrink-0">
                            {isVerified 
                                ? <CheckCircleIcon className="w-8 h-8 text-green-500" /> 
                                : <WarningIcon className="w-8 h-8 text-orange-500" />
                            }
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{item.storeName}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {new Date(item.timestamp).toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                             <p className="font-semibold text-slate-700 dark:text-slate-300">₹{item.totalAmount.toFixed(2)}</p>
                        </div>
                    </button>
                )
            })}
        </div>
    );
};

export default HistoryView;
