import React, { useRef } from 'react';
import { CameraIcon } from './Icons';

interface BillUploaderProps {
  onScanClick: () => void;
  onFileUpload: (files: FileList | null) => void;
  isLoading: boolean;
}

const BillUploader: React.FC<BillUploaderProps> = ({ onScanClick, onFileUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div id="tour-step-1" className="text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
      <h2 className="text-2xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Ready to Verify?</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Use your camera for a live scan or upload image(s).</p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        multiple
      />
       <button
            onClick={onScanClick}
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 flex items-center gap-2 mx-auto disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
            <CameraIcon className="w-6 h-6 animate-subtle-pulse" />
            <span>Scan with Camera</span>
        </button>
        <button
          onClick={handleUploadClick}
          disabled={isLoading}
          className="mt-4 text-sm font-medium text-cyan-700 dark:text-cyan-500 hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          or upload from gallery (multiple allowed)
        </button>
    </div>
  );
};

export default BillUploader;