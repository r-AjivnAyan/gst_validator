import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BillUploader from './components/BillUploader';
import LoadingSpinner from './components/LoadingSpinner';
import ResultsDisplay from './components/ResultsDisplay';
import { analyzeBill } from './services/geminiService';
import { AnalysisResult, BillItem, HistoryItem, IndianStates } from './types';
import HsnLookup from './components/HsnLookup';
import { ErrorIcon, CloseIcon, ScanIcon, HistoryIcon } from './components/Icons';
import CameraCapture from './components/CameraCapture';
import ImageLightbox from './components/ImageLightbox';
import OnboardingModal from './components/OnboardingModal';
import HistoryView from './components/HistoryView';
import FeatureTour, { TourStep } from './components/FeatureTour';
import SettingsModal from './components/SettingsModal';

type Theme = 'light' | 'dark';
type View = 'scan' | 'history';

const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'dark' || storedTheme === 'light') {
            return storedTheme;
        }
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

// NEW COMPONENT: ImagePreview
interface ImagePreviewProps {
  images: string[];
  onRemove: (index: number) => void;
  onAnalyze: () => void;
  onAddMore: () => void;
}
const ImagePreview: React.FC<ImagePreviewProps> = ({ images, onRemove, onAnalyze, onAddMore }) => {
    return (
        <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 shadow-sm animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100 text-center">Selected Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {images.map((imgSrc, index) => (
                    <div key={index} className="relative group">
                        <img src={imgSrc} alt={`Preview ${index + 1}`} className="rounded-lg object-cover w-full h-32 border border-slate-200 dark:border-slate-700" />
                        <button 
                            onClick={() => onRemove(index)} 
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                            aria-label={`Remove image ${index + 1}`}
                        >
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button 
                    onClick={onAddMore}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-cyan-500 hover:text-cyan-600 transition-colors"
                >
                    <span className="text-3xl font-thin">+</span>
                    <span>Add More</span>
                </button>
            </div>
            <div className="text-center">
                <button
                    onClick={onAnalyze}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
                >
                    Analyze {images.length} Image{images.length > 1 ? 's' : ''}
                </button>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  
  type AppState = 'idle' | 'preview' | 'loading' | 'results' | 'error';
  const [appState, setAppState] = useState<AppState>('idle');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [billImages, setBillImages] = useState<string[]>([]); 
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [view, setView] = useState<View>('scan');
  const [loadingMessage, setLoadingMessage] = useState<string>('Analyzing your bill...');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [userState, setUserState] = useState<string | null>(localStorage.getItem('userState'));

  const fileInputRefForAddingMore = React.useRef<HTMLInputElement>(null);
  
  const tourSteps: TourStep[] = [
    {
      target: '#tour-step-1',
      title: '1. Scan or Upload',
      content: 'Start here! Scan a bill with your camera or upload an image to begin the analysis.',
      placement: 'bottom'
    },
    {
      target: '#tour-step-2',
      title: '2. Look Up GST Codes',
      content: 'Curious about GST rates? Use this tool to find the correct tax slab for any item.',
      placement: 'top'
    },
    {
      target: '#tour-step-3',
      title: '3. Review Your History',
      content: "We've got your back. Your past scans are automatically saved here for future reference.",
      placement: 'bottom'
    }
  ];

  useEffect(() => {
    // Onboarding check
    if (localStorage.getItem('hasVisited') !== 'true') {
      setShowOnboarding(true);
    }
    // Load history
    try {
        const storedHistory = localStorage.getItem('scanHistory');
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }
    } catch (e) {
        console.error("Failed to parse scan history:", e);
        localStorage.removeItem('scanHistory'); // Clear corrupted data
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    const newImageUrls = newFiles.map(file => URL.createObjectURL(file));
    setImageFiles(prev => [...prev, ...newFiles]);
    setBillImages(prev => [...prev, ...newImageUrls]);
    setAppState('preview');
  };
  
  const handleSingleImageFile = (file: File) => {
    setIsCameraOpen(false);
    setImageFiles([file]);
    setBillImages([URL.createObjectURL(file)]);
    setAppState('preview');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    URL.revokeObjectURL(billImages[indexToRemove]);
    const updatedFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    const updatedImageUrls = billImages.filter((_, index) => index !== indexToRemove);
    setImageFiles(updatedFiles);
    setBillImages(updatedImageUrls);
    if (updatedFiles.length === 0) {
        setAppState('idle');
    }
  };
  
  const handleAnalyze = async () => {
    if (!userState) {
        setIsSettingsOpen(true);
        setError("Please select your state first to ensure accurate tax validation.");
        setAppState('error');
        return;
    }
    setAppState('loading');
    setAnalysisResult(null);
    setError(null);
    
    try {
      const result = await analyzeBill(imageFiles, userState, setLoadingMessage);
      setAnalysisResult(result);
      setAppState('results');
      // Save to history
      const newHistoryItem: HistoryItem = {
          ...result,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
      };
      const updatedHistory = [newHistoryItem, ...history].slice(0, 50); // Keep latest 50
      setHistory(updatedHistory);
      localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setAppState('error');
      console.error(err);
    }
  };

  const handleReset = () => {
    billImages.forEach(url => URL.revokeObjectURL(url));
    setAnalysisResult(null);
    setError(null);
    setBillImages([]);
    setImageFiles([]);
    setIsCameraOpen(false);
    setAppState('idle');
  };
  
  const handleSelectHistoryItem = (item: HistoryItem) => {
      setAnalysisResult(item);
      setBillImages([]); // No images for historical items
      setImageFiles([]);
      setAppState('results');
      setView('scan'); // Switch back to scan view to show the result
  };
  
  const handleClearHistory = () => {
      setHistory([]);
      localStorage.removeItem('scanHistory');
  }

  const handleReportSubmit = (item: BillItem, comment: string) => {
    console.log("Report submitted for item:", item.itemName);
    console.log("Comment:", comment);
  };
  
  const handleTourComplete = () => {
    setIsTourActive(false);
    localStorage.setItem('hasCompletedTour', 'true');
  };
  
  const handleSaveSettings = (newState: string) => {
    setUserState(newState);
    localStorage.setItem('userState', newState);
    setIsSettingsOpen(false);
    if(appState === 'error' && error?.includes("select your state")){
        handleReset();
    }
  };

  const renderScanView = () => {
    switch(appState) {
        case 'idle':
            return <BillUploader onScanClick={() => setIsCameraOpen(true)} onFileUpload={handleImageFiles} isLoading={false} />;
        case 'preview':
            return (
                <div>
                     <input type="file" ref={fileInputRefForAddingMore} onChange={(e) => handleImageFiles(e.target.files)} className="hidden" accept="image/*" multiple />
                    <ImagePreview images={billImages} onRemove={handleRemoveImage} onAnalyze={handleAnalyze} onAddMore={() => fileInputRefForAddingMore.current?.click()} />
                </div>
            );
        case 'loading':
            return <LoadingSpinner message={loadingMessage} />;
        case 'results':
            return (
                 <div>
                    <ResultsDisplay result={analysisResult!} billImages={billImages} onReportSubmit={handleReportSubmit} onImageClick={setLightboxImage} />
                    <div className="text-center mt-8">
                        <button onClick={handleReset} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105">
                            Scan Another Bill
                        </button>
                    </div>
                </div>
            );
        case 'error':
             return (
              <div className="text-center p-8 border-2 border-dashed border-red-300 rounded-2xl bg-red-50/70 dark:bg-red-900/20 shadow-sm">
                  <ErrorIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2 text-red-800 dark:text-red-300">Analysis Failed</h2>
                  <p className="text-red-600 dark:text-red-400 mb-6 max-w-md mx-auto">{error}</p>
                  <button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
                      Try Again
                  </button>
              </div>
            );
        default:
            return null;
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {showOnboarding && <OnboardingModal onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('hasVisited', 'true');
          if (!localStorage.getItem('userState')) {
              setIsSettingsOpen(true);
          } else if (localStorage.getItem('hasCompletedTour') !== 'true') {
              setIsTourActive(true);
          }
      }} />}
      {isSettingsOpen && <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentState={userState} 
        onSave={handleSaveSettings}
        theme={theme}
        toggleTheme={toggleTheme}
        />}
      {isTourActive && <FeatureTour steps={tourSteps} onComplete={handleTourComplete} />}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Header theme={theme} toggleTheme={toggleTheme} onOpenSettings={() => setIsSettingsOpen(true)} userState={userState}/>
        <main className="mt-8">
          {isCameraOpen && <CameraCapture onCapture={handleSingleImageFile} onClose={() => setIsCameraOpen(false)} />}
          {lightboxImage && <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}
          
          <div className={isCameraOpen ? 'hidden' : ''}>
            <div className="mb-6 border-b border-slate-200 dark:border-slate-700 flex">
                <button 
                    onClick={() => { setView('scan'); if(appState !== 'idle' && appState !== 'preview') handleReset(); }}
                    className={`flex items-center justify-center gap-2 w-1/2 py-3 text-sm font-semibold transition-colors border-b-2 ${view === 'scan' ? 'text-cyan-600 dark:text-cyan-500 border-cyan-600' : 'text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <ScanIcon className="w-5 h-5"/> New Scan
                </button>
                 <button
                    id="tour-step-3"
                    onClick={() => setView('history')}
                    className={`flex items-center justify-center gap-2 w-1/2 py-3 text-sm font-semibold transition-colors border-b-2 ${view === 'history' ? 'text-cyan-600 dark:text-cyan-500 border-cyan-600' : 'text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <HistoryIcon className="w-5 h-5"/> History ({history.length})
                </button>
            </div>

            {view === 'scan' && (
              <div className="space-y-8">
                {renderScanView()}
                {appState === 'idle' && <HsnLookup />}
              </div>
            )}

            {view === 'history' && (
              <HistoryView history={history} onSelect={handleSelectHistoryItem} onClear={handleClearHistory} />
            )}
          </div>

        </main>
        <footer className={`mt-12 text-center text-slate-500 dark:text-slate-400 text-sm ${isCameraOpen ? 'hidden' : ''}`}>
            <p className="mt-4">
                Disclaimer: This tool is for informational purposes only and does not constitute legal or financial advice. Always consult a qualified professional for tax matters. Your images are processed by Google's services and are subject to their privacy policy.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default App;