import * as jose from 'jose';
import { logger } from '../../lib/logger';

/**
 * Google's public JWKS endpoint for Firebase Authentication ID tokens.
 */
const FIREBASE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);

// Cached remote JWKS set for Firebase Auth verification
const firebaseJWKS = jose.createRemoteJWKSet(FIREBASE_JWKS_URL, {
  cooldownDuration: 30000, // 30s cooldown for key refresh
  cacheMaxAge: 600000,    // 10 min cache
});

export interface VerifiedFirebaseToken {
  uid: string;
  email: string;
  emailVerified?: boolean;
  name?: string;
  picture?: string;
  role?: string;
}

/**
 * Retrieves the configured Firebase Project ID.
 */
export function getFirebaseProjectId(): string {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    'classroomhq-qzqnp';
  return projectId;
}

/**
 * Authoritative Firebase ID Token verification.
 * 
 * Verifies that the token:
 * 1. Is signed with one of Google's public keys from the official JWKS endpoint
 * 2. Has audience equal to the Firebase Project ID
 * 3. Has issuer equal to `https://securetoken.google.com/<projectId>`
 * 4. Has not expired
 * 5. Contains a valid Firebase UID (sub)
 */
export async function verifyIdToken(rawToken: string): Promise<VerifiedFirebaseToken> {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('No token provided');
  }

  const token = rawToken.startsWith('Bearer ')
    ? rawToken.substring(7).trim()
    : rawToken.trim();

  if (!token) {
    throw new Error('Token is empty');
  }

  const projectId = getFirebaseProjectId();

  // Support test environment mock tokens (for unit/integration testing with Vitest)
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    if (token.startsWith('test-token:')) {
      const parts = token.split(':');
      return {
        uid: parts[1] || 'test-uid',
        email: parts[2] || 'test@hteim.edu',
        role: parts[3] || 'student',
        emailVerified: true
      };
    }
  }

  try {
    const { payload } = await jose.jwtVerify(token, firebaseJWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    });

    const uid = (payload.sub || payload.user_id) as string;
    if (!uid) {
      throw new Error('Token missing Firebase UID (sub)');
    }

    const email = (payload.email as string) || '';

    return {
      uid,
      email: email.toLowerCase().trim(),
      emailVerified: Boolean(payload.email_verified),
      name: (payload.name as string) || undefined,
      picture: (payload.picture as string) || undefined,
      role: (payload.role as string) || undefined,
    };
  } catch (error: any) {
    logger.warn(`Firebase ID Token verification failed: ${error.message || error}`);
    throw new Error(`Invalid Firebase ID token: ${error.message || 'Signature verification failed'}`);
  }
}
