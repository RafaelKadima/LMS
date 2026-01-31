'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { api } from '@/lib/api';
import { Camera, CameraOff, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface FaceDetectionOverlayProps {
  courseId: string;
  lessonId: string;
  onPauseRequest: () => void;
  onResumeRequest: () => void;
  getVideoTime: () => number;
}

export function FaceDetectionOverlay({
  courseId,
  lessonId,
  onPauseRequest,
  onResumeRequest,
  getVideoTime,
}: FaceDetectionOverlayProps) {
  const eventQueueRef = useRef<Array<{
    type: string;
    timestamp: string;
    videoTime?: number;
    courseId: string;
    lessonId: string;
  }>>([]);
  const batchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedByFaceRef = useRef(false);

  // Queue an engagement event (batched every 30s)
  const queueEvent = useCallback(
    (type: string) => {
      eventQueueRef.current.push({
        type,
        timestamp: new Date().toISOString(),
        videoTime: getVideoTime(),
        courseId,
        lessonId,
      });
    },
    [courseId, lessonId, getVideoTime],
  );

  // Send queued events in batch
  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;

    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      await api.engagement.sendBatch(events);
    } catch (err) {
      // Re-queue on failure
      eventQueueRef.current = [...events, ...eventQueueRef.current];
      console.error('Failed to send engagement events:', err);
    }
  }, []);

  const handleFaceDetected = useCallback(() => {
    queueEvent('face_detected');
    if (pausedByFaceRef.current) {
      pausedByFaceRef.current = false;
      queueEvent('video_resumed_face_back');
      onResumeRequest();
    }
  }, [queueEvent, onResumeRequest]);

  const handleFaceLost = useCallback(() => {
    queueEvent('face_lost');
    queueEvent('video_paused_no_face');
    pausedByFaceRef.current = true;
    onPauseRequest();
  }, [queueEvent, onPauseRequest]);

  const { webcamRef, isModelLoaded, isDetecting, facePresent, cameraActive, error } =
    useFaceDetection({
      enabled: true,
      onFaceDetected: handleFaceDetected,
      onFaceLost: handleFaceLost,
      detectionInterval: 500,
      gracePeriod: 3000,
      scoreThreshold: 0.5,
    });

  // Session start/end events
  useEffect(() => {
    queueEvent('session_start');

    // Start batch flush interval (every 30s)
    batchIntervalRef.current = setInterval(flushEvents, 30000);

    return () => {
      queueEvent('session_end');

      // Use sendBeacon for reliable delivery on unmount (async flushEvents won't complete)
      if (eventQueueRef.current.length > 0) {
        const payload = JSON.stringify({ events: eventQueueRef.current });
        const blob = new Blob([payload], { type: 'application/json' });
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        navigator.sendBeacon(`${baseUrl}/engagement/events/batch`, blob);
        eventQueueRef.current = [];
      }

      if (batchIntervalRef.current) {
        clearInterval(batchIntervalRef.current);
      }
    };
  }, [queueEvent, flushEvents]);

  // Log camera permission denied
  useEffect(() => {
    if (error === 'camera_permission_denied') {
      queueEvent('camera_permission_denied');
    }
  }, [error, queueEvent]);

  // Status indicator colors
  const getStatusColor = () => {
    if (!cameraActive || error) return 'bg-gray-500';
    if (!isModelLoaded || !isDetecting) return 'bg-yellow-500';
    return facePresent ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (!cameraActive || error) return <CameraOff className="w-3 h-3" />;
    if (!isModelLoaded || !isDetecting) return <Camera className="w-3 h-3" />;
    return facePresent ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />;
  };

  const getStatusText = () => {
    if (error === 'camera_permission_denied') return 'Câmera não permitida';
    if (error) return 'Erro na câmera';
    if (!isModelLoaded) return 'Carregando detecção...';
    if (!cameraActive) return 'Iniciando câmera...';
    if (!isDetecting) return 'Preparando detecção...';
    return facePresent ? 'Presença detectada' : 'Aluno ausente';
  };

  return (
    <>
      {/* Webcam preview - bottom right corner */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="relative rounded-lg overflow-hidden shadow-lg border border-white/10 bg-black">
          <video
            ref={webcamRef as React.RefObject<HTMLVideoElement>}
            muted
            playsInline
            className="w-40 h-30 object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Status indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${facePresent && isDetecting ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] text-white/80 font-body">{getStatusText()}</span>
          </div>
        </div>
      </div>

      {/* Full overlay when face lost */}
      {isDetecting && !facePresent && pausedByFaceRef.current && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center space-y-4 p-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white">
                Vídeo pausado
              </h3>
              <p className="text-sm text-white/60 font-body mt-2 max-w-sm">
                Não detectamos sua presença. O vídeo será retomado automaticamente
                quando você voltar.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/40">
              <Camera className="w-4 h-4" />
              <span className="text-xs font-body">Aguardando detecção facial...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
