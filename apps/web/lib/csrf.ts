/**
 * CSRF Token Management
 *
 * Handles fetching and caching of CSRF tokens for API requests.
 * Tokens are required for all state-changing operations (POST, PUT, DELETE).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300/api';

let csrfToken: string | null = null;

/**
 * Fetches a CSRF token from the API server.
 * Caches the token for subsequent requests.
 *
 * @returns Promise resolving to the CSRF token
 * @throws Error if token fetch fails
 */
export async function getCsrfToken(): Promise<string> {
  // Return cached token if available
  if (csrfToken) {
    return csrfToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Required for cookie-based session
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.csrfToken) {
      throw new Error('CSRF token not found in response');
    }

    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('[CSRF] Error fetching token:', error);
    throw error;
  }
}

/**
 * Clears the cached CSRF token.
 * Call this when receiving a 403 Forbidden response to force token refresh.
 */
export function clearCsrfToken(): void {
  csrfToken = null;
}

/**
 * Gets CSRF token headers for fetch requests.
 * Automatically fetches token if not cached.
 *
 * @returns Promise resolving to headers object with CSRF token
 */
export async function getCsrfHeaders(): Promise<Record<string, string>> {
  const token = await getCsrfToken();
  return {
    'X-CSRF-Token': token,
  };
}
