import React, { useEffect } from 'react';
import { CloseIcon } from './Icons';

interface ImageLightboxProps {
    src: string;
    onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, onClose }) => {
    
    // Close on escape key press
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
        >
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-colors"
                aria-label="Close image viewer"
            >
                <CloseIcon className="w-6 h-6" />
            </button>
            <div 
                className="relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
            >
                <img 
                    src={src} 
                    alt="Enlarged scanned bill" 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
            </div>
        </div>
    );
};

export default ImageLightbox;
