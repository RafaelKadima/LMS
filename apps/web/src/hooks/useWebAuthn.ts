'use client';

import { useState, useCallback } from 'react';
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { api } from '@/lib/api';

export function useWebAuthn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && browserSupportsWebAuthn();

  const registerPasskey = useCallback(async (deviceName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const options = await api.webauthn.getRegistrationOptions();
      const registration = await startRegistration({ optionsJSON: options });
      const credential = await api.webauthn.verifyRegistration(registration, deviceName);
      return credential;
    } catch (err: any) {
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Operacao cancelada pelo usuario'
          : err?.response?.data?.message || err?.message || 'Erro ao registrar passkey';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithPasskey = useCallback(async (email?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { options, sessionId } = await api.webauthn.getAuthenticationOptions(email);
      const authentication = await startAuthentication({ optionsJSON: options });
      const userData = await api.webauthn.verifyAuthentication(sessionId, authentication);
      return userData;
    } catch (err: any) {
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Operacao cancelada pelo usuario'
          : err?.response?.data?.message || err?.message || 'Erro ao autenticar com passkey';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isLoading,
    error,
    registerPasskey,
    loginWithPasskey,
    clearError: () => setError(null),
  };
}
