'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseFaceDetectionOptions {
  enabled: boolean;
  onFaceDetected?: () => void;
  onFaceLost?: () => void;
  detectionInterval?: number;
  gracePeriod?: number;
  scoreThreshold?: number;
}

interface UseFaceDetectionReturn {
  webcamRef: React.RefObject<HTMLVideoElement | null>;
  isModelLoaded: boolean;
  isDetecting: boolean;
  facePresent: boolean;
  cameraActive: boolean;
  error: string | null;
}

export function useFaceDetection({
  enabled,
  onFaceDetected,
  onFaceLost,
  detectionInterval = 500,
  gracePeriod = 3000,
  scoreThreshold = 0.5,
}: UseFaceDetectionOptions): UseFaceDetectionReturn {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gracePeriodRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const facePresentRef = useRef(false);
  const onFaceDetectedRef = useRef(onFaceDetected);
  const onFaceLostRef = useRef(onFaceLost);
  const mountedRef = useRef(false);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [facePresent, setFacePresent] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep callback refs up-to-date
  useEffect(() => {
    onFaceDetectedRef.current = onFaceDetected;
  }, [onFaceDetected]);

  useEffect(() => {
    onFaceLostRef.current = onFaceLost;
  }, [onFaceLost]);

  // Stop detection helper
  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (gracePeriodRef.current) {
      clearTimeout(gracePeriodRef.current);
      gracePeriodRef.current = null;
    }
    setIsDetecting(false);
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      streamRef.current = null;
    }
    if (webcamRef.current) {
      webcamRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Main effect: single initialization lifecycle
  useEffect(() => {
    if (!enabled) {
      stopDetection();
      stopCamera();
      return;
    }

    mountedRef.current = true;

    const init = async () => {
      // 1. Load face-api.js models (only once)
      if (!faceApiRef.current) {
        try {
          const faceapi = await import('face-api.js');
          faceApiRef.current = faceapi;
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
          if (!mountedRef.current) return;
          setIsModelLoaded(true);
        } catch (err) {
          console.error('Failed to load face-api.js models:', err);
          if (!mountedRef.current) return;
          setError('Erro ao carregar modelos de detecção facial');
          return;
        }
      }

      // 2. Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
        });

        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          await webcamRef.current.play();
        }

        setCameraActive(true);
        setError(null);
      } catch (err: any) {
        console.error('Camera access error:', err);
        if (!mountedRef.current) return;
        if (err.name === 'NotAllowedError') {
          setError('camera_permission_denied');
        } else {
          setError('Erro ao acessar câmera');
        }
        setCameraActive(false);
        return;
      }

      // 3. Wait for video readyState before starting detection
      const video = webcamRef.current;
      if (!video || !mountedRef.current) return;

      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve();
          return;
        }
        const onCanPlay = () => {
          video.removeEventListener('canplay', onCanPlay);
          resolve();
        };
        video.addEventListener('canplay', onCanPlay);
      });

      if (!mountedRef.current) return;

      // 4. Start detection loop (guard against double-start)
      if (intervalRef.current) return;

      const faceapi = faceApiRef.current;
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold,
      });

      setIsDetecting(true);

      intervalRef.current = setInterval(async () => {
        if (!webcamRef.current || webcamRef.current.readyState !== 4) return;
        if (!mountedRef.current) return;

        try {
          const detection = await faceapi.detectSingleFace(
            webcamRef.current,
            options,
          );

          if (!mountedRef.current) return;

          if (detection) {
            // Face detected - cancel any pending grace period
            if (gracePeriodRef.current) {
              clearTimeout(gracePeriodRef.current);
              gracePeriodRef.current = null;
            }

            if (!facePresentRef.current) {
              facePresentRef.current = true;
              setFacePresent(true);
              onFaceDetectedRef.current?.();
            }
          } else {
            // No face - start grace period if face was present
            if (facePresentRef.current && !gracePeriodRef.current) {
              gracePeriodRef.current = setTimeout(() => {
                if (!mountedRef.current) return;
                facePresentRef.current = false;
                setFacePresent(false);
                onFaceLostRef.current?.();
                gracePeriodRef.current = null;
              }, gracePeriod);
            }
          }
        } catch {
          // Silently ignore detection errors (can happen during transitions)
        }
      }, detectionInterval);
    };

    init();

    return () => {
      mountedRef.current = false;
      stopDetection();
      stopCamera();
    };
  }, [enabled, scoreThreshold, detectionInterval, gracePeriod, stopDetection, stopCamera]);

  return {
    webcamRef,
    isModelLoaded,
    isDetecting,
    facePresent,
    cameraActive,
    error,
  };
}
