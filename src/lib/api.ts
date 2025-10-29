import type { ApiResponse } from '@shared/types';
// This function needs a way to get the current token.
// Since it's a utility, it cannot use hooks directly.
// We will pass a getToken function from the useAuthSession hook.
export async function authenticatedFetch<T>(
  input: RequestInfo,
  init: RequestInit = {},
  getToken: () => string | null,
  invalidateSession: () => void
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers = {
    ...init.headers,
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const response = await fetch(input, { ...init, headers });
    if (response.status === 401 || response.status === 403) {
      console.warn('Authentication error (401/403) detected. Invalidating session.');
      invalidateSession(); // Trigger session invalidation on auth errors
      return { success: false, error: 'Authentication required or session expired.' };
    }
    if (!response.ok) {
      const errorData: ApiResponse = await response.json();
      return { success: false, error: errorData.error || `HTTP error! status: ${response.status}` };
    }
    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (e) {
    console.error('Network or API request failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'An unknown network error occurred.' };
  }
}