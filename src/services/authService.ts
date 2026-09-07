/**
 * ============================================================================
 * PRIMARY AUTHENTICATION SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Handles user authentication, credential matching, session resolution,
 * and token management. Integrates with the Express API (/api/auth/session),
 * Supabase Auth, and isolated Google OAuth boundary.
 */

import { apiClient, ApiClientError } from './apiClient';
import { supabase } from '../lib/supabaseClient';
import { AppUser } from '../lib/userAuth';
import { authenticateWithSupabase, AuthVerificationResult } from '../lib/supabaseAuth';
import { 
  acquireGoogleOAuthToken, 
  subscribeToGoogleOAuthState, 
  logoutGoogleOAuth 
} from './firebaseAdapter';
import { isDemoUser } from '../data/guards';
import { logger } from '../lib/logger';
import { UserRole } from '../types/rbac';

export interface AuthLoginCredentials {
  email: string;
  password?: string;
}

export interface AuthSessionResponse {
  status: string;
  user: {
    email: string;
    role: UserRole;
    permissions: Record<string, boolean>;
    studentName?: string;
  };
}

export interface AuthSession {
  user: AppUser | null;
  isAuthenticated: boolean;
  token?: string | null;
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Authenticates user session with Express backend API
 */
export async function getAuthSession(email: string, requestedRole?: string): Promise<AuthSessionResponse> {
  const cleanEmail = email?.toLowerCase()?.trim();
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    throw new ApiClientError('A valid email address is required to resolve auth session', 400, '/auth/session', 'validation');
  }

  if (isDemoUser(cleanEmail)) {
    throw new ApiClientError('Demo persona accounts cannot authenticate in production sessions', 403, '/auth/session', 'unauthorized');
  }

  return apiClient.post<AuthSessionResponse>('/auth/session', {
    email: cleanEmail,
    requestedRole,
  });
}

/**
 * Primary user login through Supabase Auth with fallback to portal credentials.
 */
export async function loginWithSupabaseAuth(
  email: string,
  pass: string,
  userCredentialsList: any[] = []
): Promise<AuthVerificationResult> {
  const cleanEmail = email?.toLowerCase()?.trim();
  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }

  if (isDemoUser(cleanEmail)) {
    return { success: false, error: 'Demo accounts cannot authenticate in live production mode.' };
  }

  if (!pass || pass.trim().length === 0) {
    return { success: false, error: 'Password is required.' };
  }

  const result = await authenticateWithSupabase(cleanEmail, pass, userCredentialsList);
  if (result.success && cleanEmail) {
    apiClient.setUserEmail(cleanEmail);
  }
  return result;
}

/**
 * Logs out the active user session across Supabase Auth and Google OAuth boundary.
 */
export async function logoutUserSession(): Promise<void> {
  apiClient.setUserEmail(null);
  apiClient.setAuthToken(null);
  try {
    await supabase.auth.signOut();
  } catch (err) {
    logger.warn('Supabase signOut error:', err);
  }
  await logoutGoogleOAuth();
}

/**
 * Initiates Google OAuth Popup flow via the isolated firebaseAdapter.
 */
export async function loginWithGoogleOAuth(): Promise<{ user: any; accessToken: string } | null> {
  const result = await acquireGoogleOAuthToken();
  if (result?.accessToken) {
    apiClient.setAuthToken(result.accessToken);
    if (result.user?.email) {
      apiClient.setUserEmail(result.user.email);
    }
  }
  return result;
}

/**
 * Subscribes to Google OAuth state changes via the service boundary adapter.
 */
export function subscribeToOAuthState(
  onSuccess: (user: any, token: string) => void,
  onFailure: () => void
): () => void {
  return subscribeToGoogleOAuthState((user, token) => {
    if (token) apiClient.setAuthToken(token);
    if (user?.email) apiClient.setUserEmail(user.email);
    onSuccess(user, token);
  }, onFailure);
}

export const authService = {
  getAuthSession,
  loginWithSupabaseAuth,
  logoutUserSession,
  loginWithGoogleOAuth,
  subscribeToOAuthState,
};
