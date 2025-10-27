import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { loadModels, detectFace } from '@/lib/faceRecognition';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface FaceScannerProps {
  onFaceDetected: (descriptor: Float32Array) => void;
  onError: (error: string) => void;
  isProcessing?: boolean;
}

export function FaceScanner({ onFaceDetected, onError, isProcessing }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      try {
        await loadModels();
        
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });

        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsLoading(false);
            startScanning();
          };
        }
      } catch (err) {
        console.error('Camera error:', err);
        onError('Unable to access camera. Please grant camera permissions.');
        setIsLoading(false);
      }
    }

    initCamera();

    return () => {
      mounted = false;
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = () => {
    if (scanIntervalRef.current) return;

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || isProcessing) return;

      try {
        const detection = await detectFace(videoRef.current);
        
        if (detection) {
          setIsFaceDetected(true);
          
          // Draw detection box
          const canvas = canvasRef.current;
          const displaySize = {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          };
          
          canvas.width = displaySize.width;
          canvas.height = displaySize.height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const resizedDetections = faceapi.resizeResults(detection, displaySize);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          }
          
          // Call the callback with the descriptor
          if (detection.descriptor) {
            onFaceDetected(detection.descriptor);
          }
        } else {
          setIsFaceDetected(false);
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }
    }, 100);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden bg-card animate-fade-in">
        <video
          ref={videoRef}
          className="w-full h-auto mirror"
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className={`w-64 h-64 rounded-full border-4 transition-all duration-300 ${
              isFaceDetected 
                ? 'border-success animate-pulse-glow' 
                : 'border-primary opacity-50'
            }`}>
              {isFaceDetected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-success animate-fade-in" />
                </div>
              )}
            </div>
            
            {/* Scanning line */}
            {!isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
              </div>
            )}
          </div>
        </div>
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-foreground">Initializing camera...</p>
            </div>
          </div>
        )}
        
        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-foreground">Processing...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Status indicators */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
          isFaceDetected ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
        }`}>
          {isFaceDetected ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">
            {isFaceDetected ? 'Face Detected' : 'No Face Detected'}
          </span>
        </div>
      </div>
      
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
