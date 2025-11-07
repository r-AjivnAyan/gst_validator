import React, { useState, useEffect } from 'react';
import { AnalysisResult, BillItem, ValidationStatus } from '../types';
import { CheckCircleIcon, WarningIcon, FlagIcon, ShareIcon } from './Icons';
import { sanitizeText } from '../utils/security';

const useCountUp = (end: number, duration = 1500) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const endValue = end;
        if (start === endValue) return;

        const totalFrames = Math.round(duration / (1000 / 60));
        let currentFrame = 0;

        const counter = setInterval(() => {
            currentFrame++;
            const progress = currentFrame / totalFrames;
            const newCount = start + (endValue - start) * progress;
            setCount(parseFloat(newCount.toFixed(2)));

            if (currentFrame === totalFrames) {
                clearInterval(counter);
                setCount(endValue);
            }
        }, 1000 / 60);

        return () => {
            clearInterval(counter);
        };
    }, [end, duration]);

    return count;
};

const CountUpNumber: React.FC<{ value: number }> = ({ value }) => {
    const count = useCountUp(value);
    return <span>{count.toFixed(2)}</span>
}


const getStatusColorClasses = (status: ValidationStatus): string => {
  switch (status) {
    case ValidationStatus.CORRECT:
      return 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20';
    case ValidationStatus.INCORRECT_CALCULATION:
    case ValidationStatus.INCORRECT_TAX_SLAB:
      return 'border-orange-400 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-900/20';
    case ValidationStatus.SUSPICIOUS:
    case ValidationStatus.MISSING_INFO:
      return 'border-yellow-400 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/20';
    default:
      return 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20';
  }
};

const StatusIcon: React.FC<{ status: ValidationStatus }> = ({ status }) => {
    if (status === ValidationStatus.CORRECT) {
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
    }
    return <WarningIcon className="w-6 h-6 text-orange-500" />;
};

const SummaryCard: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    const isVerified = result.overallStatus === 'VERIFIED';
    return (
        <div className={`p-4 rounded-lg mb-6 flex items-start gap-4 ${isVerified ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700' : 'bg-orange-100 dark:bg-orange-900/30 border-orange-400 dark:border-orange-700'} border animate-fade-in`}>
            {isVerified ? <CheckCircleIcon className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" /> : <WarningIcon className="w-8 h-8 text-orange-600 mt-1 flex-shrink-0" />}
            <div>
                <h3 className={`text-xl font-bold ${isVerified ? 'text-green-800 dark:text-green-300' : 'text-orange-800 dark:text-orange-300'}`}>
                    {isVerified ? 'Bill Verified' : 'Issues Found'}
                </h3>
                <p className={`mt-1 ${isVerified ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
                    {isVerified ? 'All tax calculations and GST codes appear to be correct.' : 'We found potential issues with tax calculations or GST slabs on your bill.'}
                </p>
            </div>
        </div>
    );
};


const ItemCard: React.FC<{ item: BillItem, onReportSubmit: (item: BillItem, comment: string) => void, index: number }> = ({ item, onReportSubmit, index }) => {
  const hasIssue = item.status !== ValidationStatus.CORRECT;
  const [showReportForm, setShowReportForm] = useState(false);
  const [comment, setComment] = useState('');
  const [isReported, setIsReported] = useState(false);

  const handleReport = () => {
    if (comment.trim()) {
        onReportSubmit(item, comment);
        setIsReported(true);
        setShowReportForm(false);
    }
  };

  const suggestionParts = item.suggestion?.split('Action:');

  return (
    <div 
        className={`border rounded-lg mb-3 transition-all duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-cyan-900/50 hover:-translate-y-1 ${getStatusColorClasses(item.status)} animate-fade-in-slide-up`}
        style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="p-4">
        <div className="flex justify-between items-start gap-4">
            <div className="flex-grow">
                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{sanitizeText(item.itemName)}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {item.quantity} x ₹{item.price.toFixed(2)} = <span className="font-semibold text-slate-700 dark:text-slate-300">₹{item.total.toFixed(2)}</span>
                </p>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">Tax: <span className="font-semibold text-slate-700 dark:text-slate-300">₹{item.taxAmount.toFixed(2)}</span></p>
            </div>
            <div className="flex-shrink-0">
                <StatusIcon status={item.status} />
            </div>
        </div>
        {hasIssue && (
            <div className="mt-3 pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                <div className="text-sm text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 p-3 rounded-md">
                   {suggestionParts && suggestionParts.length === 2 ? (
                        <>
                            <p><span className="font-bold">Rule:</span>{sanitizeText(suggestionParts[0].replace('Rule:', '').trim())}</p>
                            <p className="mt-1"><span className="font-bold">Action:</span>{sanitizeText(suggestionParts[1].trim())}</p>
                        </>
                    ) : (
                        <p><span className="font-bold">Suggestion: </span>{sanitizeText(item.suggestion)}</p>
                    )}
                </div>
                 <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showReportForm ? 'max-h-60' : 'max-h-0'}`}>
                    {isReported ? (
                        <p className="text-sm text-green-700 dark:text-green-400 font-medium text-center py-2">✓ Report Submitted. Thank you!</p>
                    ) : (
                        <div className="space-y-2 pt-2">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment about this issue (optional)..."
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                rows={2}
                            ></textarea>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowReportForm(false)} className="text-sm text-slate-600 dark:text-slate-300 font-medium px-3 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                                <button onClick={handleReport} className="text-sm bg-cyan-600 text-white font-medium px-3 py-1 rounded-md hover:bg-cyan-700 disabled:bg-slate-400" disabled={!comment.trim()}>Submit Report</button>
                            </div>
                        </div>
                    )}
                </div>

                {!isReported && !showReportForm && (
                     <button onClick={() => setShowReportForm(true)} className="w-full text-left text-sm text-slate-600 dark:text-slate-300 font-medium p-2 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 flex items-center gap-2 transition-colors">
                        <FlagIcon className="w-4 h-4" />
                        Notice something wrong? Report this item.
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};


interface ResultsDisplayProps {
  result: AnalysisResult;
  billImages: string[] | null;
  onReportSubmit: (item: BillItem, comment: string) => void;
  onImageClick: (src: string) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, billImages, onReportSubmit, onImageClick }) => {
  const [shareFeedback, setShareFeedback] = useState('');
  
  const handleShare = async () => {
    setShareFeedback('');
    let summary = `GST Bill Analysis for ${result.storeName} (${result.billDate})\n`;
    summary += `--------------------------------------\n`;
    summary += `Overall Status: ${result.overallStatus}\n`;
    summary += `Total Bill: ₹${result.totalAmount.toFixed(2)}\n`;
    summary += `Total Tax: ₹${result.totalTax.toFixed(2)}\n`;
    summary += `--------------------------------------\n\n`;

    const issues = result.items.filter(item => item.status !== ValidationStatus.CORRECT);
    if (issues.length > 0) {
        summary += `Found ${issues.length} potential issue(s):\n\n`;
        issues.forEach((item, index) => {
            summary += `${index + 1}. Item: ${item.itemName}\n`;
            summary += `   Status: ${item.status}\n`;
            if (item.suggestion) {
                summary += `   Suggestion: ${item.suggestion}\n\n`;
            }
        });
    } else {
        summary += "No issues found. All items appear to be GST compliant.\n";
    }
    summary += "\nGenerated by GST Validator App.";

    if (navigator.share) {
        try {
            await navigator.share({
                title: `GST Bill Analysis: ${result.storeName}`,
                text: summary,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        try {
            await navigator.clipboard.writeText(summary);
            setShareFeedback('Copied to clipboard!');
        } catch (error) {
            setShareFeedback('Failed to copy.');
        }
        setTimeout(() => setShareFeedback(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{sanitizeText(result.storeName)}</h2>
         <div className="relative">
            <button onClick={handleShare} className="flex items-center gap-2 text-sm font-medium text-cyan-700 dark:text-cyan-500 hover:underline">
              <ShareIcon className="w-5 h-5"/> Share
            </button>
            {shareFeedback && <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded-md animate-fade-in">{shareFeedback}</span>}
         </div>
      </div>
      {billImages && billImages.length > 0 && (
        <div className="animate-fade-in">
          <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">Scanned Image(s)</h3>
          <div className="flex overflow-x-auto space-x-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
            {billImages.map((image, index) => (
              <button 
                key={index} 
                className="flex-shrink-0 p-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 transition-transform transform hover:scale-105 hover:shadow-lg"
                onClick={() => onImageClick(image)}
                aria-label={`View scanned bill page ${index + 1}`}
              >
                <img 
                  src={image} 
                  alt={`Scanned bill page ${index + 1}`} 
                  className="rounded-sm h-40 w-auto object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-slate-500 dark:text-slate-400">{sanitizeText(result.billDate)}</p>
          <div className="mt-4 flex justify-around">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Tax</p>
                    <p className="text-2xl font-semibold text-cyan-700 dark:text-cyan-500">₹<CountUpNumber value={result.totalTax} /></p>
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Bill Total</p>
                    <p className="text-2xl font-semibold text-cyan-700 dark:text-cyan-500">₹<CountUpNumber value={result.totalAmount} /></p>
                </div>
          </div>
      </div>
      
      <SummaryCard result={result} />

      <div>
        <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200 animate-fade-in" style={{ animationDelay: '200ms' }}>Item Breakdown</h3>
        {result.items.map((item, index) => (
          <ItemCard key={index} item={item} onReportSubmit={onReportSubmit} index={index} />
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;