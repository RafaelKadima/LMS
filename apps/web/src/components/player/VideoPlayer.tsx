'use client';

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { api } from '@/lib/api';
import { CONFIG } from '@motochefe/shared/utils';

export interface VideoPlayerHandle {
  pause: () => void;
  play: () => void;
  getCurrentTime: () => number;
}

interface VideoPlayerProps {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  manifestUrl?: string;
  videoUrl?: string;
  startPosition?: number;
  duration: number;
  onComplete?: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  {
    lessonId,
    lessonTitle,
    courseId,
    courseTitle,
    manifestUrl,
    videoUrl,
    startPosition = 0,
    duration: propDuration,
    onComplete,
  }: VideoPlayerProps,
  ref: React.Ref<VideoPlayerHandle>,
) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const secondsWatchedRef = useRef(0);
  const lastPositionRef = useRef(startPosition);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  useImperativeHandle(ref, () => ({
    pause: () => {
      if (playerRef.current && !playerRef.current.paused()) {
        playerRef.current.pause();
      }
    },
    play: () => {
      if (playerRef.current && playerRef.current.paused()) {
        playerRef.current.play();
      }
    },
    getCurrentTime: () => {
      return playerRef.current?.currentTime() || 0;
    },
  }));

  // Atualizar ref quando onComplete mudar
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize Video.js player
    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-fluid');
    videoRef.current.appendChild(videoElement);

    // Determinar source baseado no tipo de vídeo disponível
    const sources = manifestUrl
      ? [{ src: manifestUrl, type: 'application/x-mpegURL' }]
      : videoUrl
        ? [{ src: videoUrl, type: 'video/mp4' }]
        : [];

    const player = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      fluid: true,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      html5: {
        vhs: {
          overrideNative: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      sources,
    });

    playerRef.current = player;

    // Funções auxiliares
    const sendHeartbeat = async (
      currentTime: number,
      event: 'playing' | 'paused' | 'seeked' | 'ended',
      videoDuration: number
    ) => {
      if (videoDuration < 1) return;
      try {
        await api.sendHeartbeat({
          lessonId,
          currentTime,
          duration: Math.round(videoDuration),
          playbackRate: player.playbackRate() || 1,
          event,
        });
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    };

    const sendXAPIStatement = async (
      verb: 'played' | 'paused' | 'seeked' | 'completed',
      data: Record<string, number>
    ) => {
      if (!data.duration || data.duration < 1) return;
      try {
        await api.sendXAPIStatement({
          verb,
          lessonId,
          lessonTitle,
          courseId,
          courseTitle,
          data,
        });
      } catch (error) {
        console.error('Failed to send xAPI statement:', error);
      }
    };

    const markComplete = async (videoDuration: number) => {
      if (videoDuration < 1) return;
      try {
        await api.markComplete({
          lessonId,
          finalTime: Math.round(videoDuration),
          totalWatched: secondsWatchedRef.current,
        });
        await sendXAPIStatement('completed', {
          duration: Math.round(videoDuration),
          totalWatched: secondsWatchedRef.current,
        });
        onCompleteRef.current?.();
      } catch (error) {
        console.error('Failed to mark complete:', error);
      }
    };

    // Set start position when ready
    player.ready(() => {
      if (startPosition > 0) {
        player.currentTime(startPosition);
      }
    });

    // Event handlers
    player.on('play', () => {
      const currentTime = player.currentTime() || 0;
      const videoDuration = player.duration() || propDuration;

      if (videoDuration >= 1) {
        sendXAPIStatement('played', { currentTime, duration: Math.round(videoDuration) });
      }

      // Start heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setInterval(() => {
        const time = player.currentTime() || 0;
        const dur = player.duration() || propDuration;
        sendHeartbeat(time, 'playing', dur);
        secondsWatchedRef.current += CONFIG.HEARTBEAT_INTERVAL_MS / 1000;
      }, CONFIG.HEARTBEAT_INTERVAL_MS);
    });

    player.on('pause', () => {
      const currentTime = player.currentTime() || 0;
      const videoDuration = player.duration() || propDuration;

      sendHeartbeat(currentTime, 'paused', videoDuration);
      if (videoDuration >= 1) {
        sendXAPIStatement('paused', { currentTime, duration: Math.round(videoDuration) });
      }

      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    });

    player.on('seeked', () => {
      const currentTime = player.currentTime() || 0;
      const videoDuration = player.duration() || propDuration;

      sendHeartbeat(currentTime, 'seeked', videoDuration);
      if (videoDuration >= 1) {
        sendXAPIStatement('seeked', {
          timeFrom: lastPositionRef.current,
          timeTo: currentTime,
          duration: Math.round(videoDuration),
        });
      }
      lastPositionRef.current = currentTime;
    });

    player.on('ended', () => {
      const videoDuration = player.duration() || propDuration;

      sendHeartbeat(videoDuration, 'ended', videoDuration);

      // Check if watched >= 90%
      if (videoDuration >= 1) {
        const percentWatched = (secondsWatchedRef.current / videoDuration) * 100;
        if (percentWatched >= CONFIG.COMPLETION_THRESHOLD) {
          markComplete(videoDuration);
        }
      }

      // Clear interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    });

    player.on('error', () => {
      const error = player.error();
      console.error('Video player error:', error);
    });

    // Cleanup
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [manifestUrl, videoUrl, startPosition, propDuration, lessonId, lessonTitle, courseId, courseTitle]);

  return (
    <div className="video-player-container">
      <div ref={videoRef} className="aspect-video" />
    </div>
  );
});
