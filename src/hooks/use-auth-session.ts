import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import type { ApiResponse, UserSession } from '@shared/types';
const TOKEN_STORAGE_KEY = 'unison_auth_token';
const TOKEN_EXPIRATION_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before actual expiration
export function useAuthSession() {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  // Ref to hold the latest token and expiresAt for use in closures (e.g., setInterval)
  const tokenRef = useRef<string | null>(token);
  const expiresAtRef = useRef<Date | null>(expiresAt);
  useEffect(() => {
    tokenRef.current = token;
    expiresAtRef.current = expiresAt;
  }, [token, expiresAt]);
  const saveSession = useCallback((session: UserSession) => {
    setToken(session.token);
    const expiryDate = new Date(session.expiresAt);
    setExpiresAt(expiryDate);
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(session));
  }, []);
  const invalidateSession = useCallback(() => {
    setToken(null);
    setExpiresAt(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    toast.info('Session expired', { description: 'Your session has ended. Please refresh to get a new one.' });
  }, []);
  const requestToken = useCallback(async (): Promise<string | null> => {
    setIsLoadingSession(true);
    setSessionError(null);
    try {
      const response = await fetch('/api/token', { method: 'POST' });
      if (!response.ok) {
        const errorData: ApiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<UserSession> = await response.json();
      if (data.success && data.data) {
        saveSession(data.data);
        toast.success('Session started', { description: 'You can now post messages.' });
        return data.data.token;
      } else {
        setSessionError(data.error || 'Failed to get session token.');
        toast.error('Failed to start session', { description: data.error || 'Please try again.' });
        return null;
      }
    } catch (e) {
      console.error('Error requesting token:', e);
      setSessionError(e instanceof Error ? e.message : 'An unknown error occurred.');
      toast.error('Network error', { description: e instanceof Error ? e.message : 'Could not start session.' });
      return null;
    } finally {
      setIsLoadingSession(false);
    }
  }, [saveSession]);
  const refreshToken = useCallback(async (): Promise<string | null> => {
    const currentToken = tokenRef.current;
    if (!currentToken) {
      console.warn('No token to refresh, requesting a new one.');
      return requestToken();
    }
    setIsLoadingSession(true);
    setSessionError(null);
    try {
      const response = await fetch('/api/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken }),
      });
      if (!response.ok) {
        const errorData: ApiResponse = await response.json();
        if (response.status === 401) {
          invalidateSession(); // Token invalid/expired on server, clear client session
          toast.error('Session invalid', { description: 'Your session has expired. Requesting a new one.' });
          return requestToken(); // Request a new token immediately
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<UserSession> = await response.json();
      if (data.success && data.data) {
        saveSession(data.data);
        toast.info('Session refreshed', { description: 'Your session has been extended.' });
        return data.data.token;
      } else {
        setSessionError(data.error || 'Failed to refresh session token.');
        toast.error('Failed to refresh session', { description: data.error || 'Please try again.' });
        return null;
      }
    } catch (e) {
      console.error('Error refreshing token:', e);
      setSessionError(e instanceof Error ? e.message : 'An unknown error occurred.');
      toast.error('Network error', { description: e instanceof Error ? e.message : 'Could not refresh session.' });
      return null;
    } finally {
      setIsLoadingSession(false);
    }
  }, [saveSession, invalidateSession, requestToken]);
  // Initial load from localStorage
  useEffect(() => {
    const storedSession = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedSession) {
      try {
        const session: UserSession = JSON.parse(storedSession);
        const expiryDate = new Date(session.expiresAt);
        if (expiryDate.getTime() > Date.now()) {
          setToken(session.token);
          setExpiresAt(expiryDate);
          toast.success('Session restored', { description: 'Welcome back!' });
        } else {
          invalidateSession();
          toast.info('Previous session expired', { description: 'Please refresh to get a new one.' });
        }
      } catch (e) {
        console.error('Failed to parse stored session:', e);
        invalidateSession();
      }
    }
    setIsLoadingSession(false); // Initial load complete
  }, [invalidateSession]);
  // Proactive token refresh timer
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;
    if (token && expiresAt) {
      const timeToRefresh = expiresAt.getTime() - Date.now() - TOKEN_EXPIRATION_BUFFER_MS;
      if (timeToRefresh > 0) {
        refreshTimer = setTimeout(() => {
          console.log('Proactively refreshing token...');
          refreshToken();
        }, timeToRefresh);
      } else {
        // If already past buffer, refresh immediately
        console.log('Token already past refresh buffer, refreshing now...');
        refreshToken();
      }
    }
    return () => clearTimeout(refreshTimer);
  }, [token, expiresAt, refreshToken]);
  const getToken = useCallback(() => tokenRef.current, []);
  return {
    token,
    expiresAt,
    isLoadingSession,
    sessionError,
    requestToken,
    refreshToken,
    invalidateSession,
    getToken,
  };
}