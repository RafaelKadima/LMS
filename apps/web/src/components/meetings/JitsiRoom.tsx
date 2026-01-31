'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface JitsiRoomProps {
  roomName: string;
  displayName: string;
  email?: string;
  onLeave?: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

// Domínio do Jitsi: self-hosted ou fallback para meet.jit.si
const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';

export function JitsiRoom({ roomName, displayName, email, onLeave }: JitsiRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [embedFailed, setEmbedFailed] = useState(false);

  const jitsiUrl = `https://${JITSI_DOMAIN}/${roomName}#config.prejoinConfig.enabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&userInfo.displayName="${encodeURIComponent(displayName)}"`;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;

    const timeout = setTimeout(() => {
      // If API doesn't load in 10s, show fallback
      if (!apiRef.current) setEmbedFailed(true);
    }, 10000);

    script.onload = () => {
      clearTimeout(timeout);
      if (!containerRef.current || !window.JitsiMeetExternalAPI) {
        setEmbedFailed(true);
        return;
      }

      try {
        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName,
            email: email || '',
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinConfig: { enabled: false },
            disableDeepLinking: true,
            disableInviteFunctions: true,
            lobbyModeEnabled: false,
            requireDisplayName: false,
            enableLobbyChat: false,
            hideLobbyButton: true,
            enableUserRolesBasedOnToken: false,
            desktopSharingEnabled: true,
            desktopSharingFrameRate: { min: 5, max: 30 },
            // Configurações de compartilhamento de tela
            // Nomes mapeados pelo ScreenObtainer.ts do lib-jitsi-meet
            screenShareSettings: {
              desktopSurfaceSwitching: 'include',
              desktopPreferCurrentTab: false,
              desktopSelfBrowserSurface: 'exclude',
              desktopSystemAudio: 'include',
            },
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            MOBILE_APP_PROMO: false,
            HIDE_INVITE_MORE_HEADER: true,
            HIDE_DEEP_LINKING_LOGO: true,
            APP_NAME: 'MotoChefe Meet',
            NATIVE_APP_NAME: 'MotoChefe Meet',
            PROVIDER_NAME: 'Universidade MotoChefe',
            DEFAULT_BACKGROUND: '#111111',
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'chat',
              'raisehand',
              'participants-pane',
              'tileview',
              'select-background',
              'fullscreen',
              'hangup',
            ],
          },
        });

        // Garantir que o iframe tenha permissões para compartilhar tela
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe) {
          iframe.setAttribute(
            'allow',
            'camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media; picture-in-picture; screen-wake-lock'
          );
        }

        apiRef.current.addEventListener('readyToClose', () => {
          onLeave?.();
        });
      } catch {
        setEmbedFailed(true);
      }
    };

    script.onerror = () => {
      clearTimeout(timeout);
      setEmbedFailed(true);
    };

    document.head.appendChild(script);

    return () => {
      clearTimeout(timeout);
      apiRef.current?.dispose();
      script.remove();
    };
  }, [roomName, displayName, email, onLeave]);

  if (embedFailed) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-surface-dark gap-4">
        <p className="text-white/60 text-center max-w-md">
          A videoconferência será aberta em uma nova aba.
        </p>
        <a
          href={jitsiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir Videoconferência
        </a>
        <button
          onClick={onLeave}
          className="text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-black"
    />
  );
}
