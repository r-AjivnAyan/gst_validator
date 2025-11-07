import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, ZoomInIcon, ZoomOutIcon } from './Icons';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [track, setTrack] = useState<MediaStreamTrack | null>(null);

    const [zoomCapabilities, setZoomCapabilities] = useState<{min: number, max: number, step: number} | null>(null);
    const [zoomValue, setZoomValue] = useState(1);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        let activeStream: MediaStream | null = null;
        const initCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });
                activeStream = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }

                const videoTrack = mediaStream.getVideoTracks()[0];
                setTrack(videoTrack);
                
                const capabilities = videoTrack.getCapabilities();
                if ('zoom' in capabilities && capabilities.zoom) {
                    const zoomCaps = capabilities.zoom as {min: number, max: number, step: number};
                    setZoomCapabilities(zoomCaps);
                    const settings = videoTrack.getSettings();
                    // FIX: Property 'zoom' does not exist on type 'MediaTrackSettings'. Cast to 'any' to bypass type error for this non-standard property.
                    setZoomValue((settings as any).zoom || zoomCaps.min);
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please ensure permissions are granted in your browser settings.");
            }
        };

        initCamera();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (track && zoomCapabilities) {
            // FIX: Object literal may only specify known properties, and 'zoom' does not exist in type 'MediaTrackConstraintSet'. Cast to 'any' to bypass type error.
            track.applyConstraints({ advanced: [{ zoom: zoomValue } as any] })
              .catch(e => console.error("Could not apply zoom", e));
        }
    }, [zoomValue, track, zoomCapabilities]);
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `bill-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        onCapture(file);
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };
    
    if (error) {
        return (
             <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center text-white p-4">
                 <p className="text-xl mb-4 text-center">{error}</p>
                 <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                    Close
                 </button>
             </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between items-center animate-fade-in">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black bg-opacity-40 rounded-full text-white hover:bg-opacity-60 transition-colors" aria-label="Close camera">
                <CloseIcon className="w-6 h-6"/>
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center">
                {zoomCapabilities && (
                    <div className="w-full max-w-xs flex items-center gap-2 mb-4 px-2">
                        <ZoomOutIcon className="w-6 h-6 text-white" />
                        <input
                            type="range"
                            min={zoomCapabilities.min}
                            max={zoomCapabilities.max}
                            step={zoomCapabilities.step}
                            value={zoomValue}
                            onChange={(e) => setZoomValue(parseFloat(e.target.value))}
                            className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                            aria-label="Zoom slider"
                        />
                         <ZoomInIcon className="w-6 h-6 text-white" />
                    </div>
                )}
                
                <button 
                    onClick={handleCapture} 
                    className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30 hover:ring-white/50 transition-all transform hover:scale-105"
                    aria-label="Capture image"
                >
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-black"></div>
                </button>
            </div>
        </div>
    );
};

export default CameraCapture;