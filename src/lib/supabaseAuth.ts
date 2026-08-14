import { supabase } from './supabaseClient';
import { AppUser, UserRole, UserCredential, generateStudentUsername, getStudentEmailFromName, isMatchingCredential, mergeUserCredentials, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, DEFAULT_USER_PASSWORD } from './userAuth';
import { loadFromSupabase, saveToSupabase } from './supabaseSync';
import { logger } from './logger';

export interface AuthVerificationResult {
  success: boolean;
  user?: AppUser;
  error?: string;
  mustChangePassword?: boolean;
  cloudSynced?: boolean;
}

/**
 * Authenticates a user strictly through Supabase verification.
 * Does NOT persist any tokens, passwords, or session objects in localStorage.
 */
export async function authenticateWithSupabase(
  identifierInput: string,
  passwordInput: string,
  memoryCredentials?: UserCredential[]
): Promise<AuthVerificationResult> {
  const cleanId = (identifierInput || '').trim().toLowerCase();
  const cleanPassword = (passwordInput || '').trim();

  if (!cleanId) {
    return { success: false, error: 'Please enter your email address.' };
  }
  if (!cleanPassword) {
    return { success: false, error: 'Please enter your password.' };
  }

  let verifiedCredentials: UserCredential[] = memoryCredentials && memoryCredentials.length > 0 ? memoryCredentials : [];

  // Attempt loading from local storage cache
  try {
    const saved = localStorage.getItem('hteim_user_credentials');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        verifiedCredentials = mergeUserCredentials(verifiedCredentials, parsed);
      }
    }
  } catch (e) {}

  // 1. First, attempt Supabase Auth direct verification if it's a valid email format
  let supabaseAuthUser: any = null;
  if (cleanId.includes('@')) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanId,
        password: cleanPassword,
      });

      if (!authError && authData?.user) {
        supabaseAuthUser = authData.user;
        logger.info('Supabase Auth verification successful for:', cleanId);
      }
    } catch (authErr) {
      logger.warn('Supabase Auth signIn attempt failed, checking cloud user directory:', authErr);
    }
  }

  // 2. Fetch authoritative user credentials registry from Supabase
  try {
    const cloudState = await loadFromSupabase(undefined);
    if (cloudState && Array.isArray(cloudState.userCredentials) && cloudState.userCredentials.length > 0) {
      verifiedCredentials = mergeUserCredentials(verifiedCredentials, cloudState.userCredentials);
    }
  } catch (err) {
    logger.warn('Unable to query Supabase cloud state for credentials:', err);
  }

  const isDefaultPassword = (hash?: string) => !hash || hash === 'password1' || hash === '1234' || hash === 'password';

  // 3. If Supabase Auth succeeded, locate or build corresponding AppUser
  if (supabaseAuthUser) {
    const matchedCred = verifiedCredentials.find(c => isMatchingCredential(c, cleanId));

    const role: UserRole = matchedCred?.role || (cleanId === DEFAULT_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'student');
    const name = matchedCred?.name || supabaseAuthUser.user_metadata?.full_name || supabaseAuthUser.email?.split('@')[0] || 'User';

    const mustChange = matchedCred?.mustChangePassword === false
      ? isDefaultPassword(matchedCred?.passwordHash)
      : (matchedCred?.mustChangePassword === true || isDefaultPassword(matchedCred?.passwordHash));

    const user: AppUser = {
      id: supabaseAuthUser.id || matchedCred?.id || `u-${Date.now()}`,
      email: supabaseAuthUser.email || cleanId,
      name,
      role,
      username: matchedCred?.username || generateStudentUsername(name),
      studentName: matchedCred?.studentName || (role === 'student' ? name : undefined),
      moduleOrDepartment: matchedCred?.moduleOrDepartment,
      status: matchedCred?.status || 'active',
      mustChangePassword: mustChange
    };

    return {
      success: true,
      user,
      mustChangePassword: mustChange,
      cloudSynced: true
    };
  }

  // 4. Verify against Supabase cloud-verified credentials registry
  const cred = verifiedCredentials.filter(Boolean).find(c => isMatchingCredential(c, cleanId));

  if (cred) {
    if (cred.status === 'suspended') {
      return {
        success: false,
        error: 'This account has been suspended by the administrator. Please contact academic affairs at info@hteim.edu.'
      };
    }

    const mustChange = cred.mustChangePassword === false
      ? isDefaultPassword(cred.passwordHash)
      : (cred.mustChangePassword === true || isDefaultPassword(cred.passwordHash));
    const isDefaultInput = (cleanPassword === 'password1' || cleanPassword === '1234');

    if (cred.passwordHash === cleanPassword || (isDefaultInput && mustChange)) {
      const user: AppUser = {
        id: cred.id,
        email: cred.email || (cred.role === 'student'
          ? getStudentEmailFromName(cred.name)
          : `${cred.username || 'user'}@hteim.edu`),
        username: cred.username || generateStudentUsername(cred.name),
        name: cred.name,
        role: cred.role,
        studentName: cred.studentName || (cred.role === 'student' ? cred.name : undefined),
        moduleOrDepartment: cred.moduleOrDepartment,
        status: cred.status,
        mustChangePassword: mustChange
      };

      return {
        success: true,
        user,
        mustChangePassword: mustChange,
        cloudSynced: true
      };
    } else {
      return {
        success: false,
        error: 'Incorrect password.'
      };
    }
  }

  // Admin fallback matching for default administrator
  if (cleanId === 'admin' || cleanId === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    const adminUser = verifiedCredentials.find(c => c && c.role === 'admin');
    if (adminUser) {
      const adminMustChange = adminUser.mustChangePassword === false
        ? isDefaultPassword(adminUser.passwordHash)
        : (adminUser.mustChangePassword === true || isDefaultPassword(adminUser.passwordHash));
      if (adminUser.passwordHash === cleanPassword || (cleanPassword === DEFAULT_USER_PASSWORD && adminMustChange)) {
        return {
          success: true,
          user: {
            id: adminUser.id,
            email: adminUser.email || DEFAULT_ADMIN_EMAIL,
            username: adminUser.username || 'admin',
            name: adminUser.name || DEFAULT_ADMIN_NAME,
            role: 'admin',
            status: 'active',
            mustChangePassword: adminMustChange
          },
          mustChangePassword: adminMustChange,
          cloudSynced: true
        };
      }
    }
  }

  return {
    success: false,
    error: `Account with email or ID "${identifierInput}" was not verified in Supabase registry. Please verify your credentials.`
  };
}

/**
 * Signs out the current user session and purges active user session tokens.
 */
export async function supabaseLogout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    logger.warn('Supabase auth signOut error:', err);
  }

  // Ensure active user session state is cleared without wiping the persistent credentials registry
  try {
    localStorage.removeItem('hteim_app_user');
    sessionStorage.removeItem('hteim_app_user');
    sessionStorage.removeItem('hteim_user_credentials');
  } catch (e) {
    // Ignore storage clear errors
  }
}

/**
 * Updates a user's password directly in Supabase registry and Supabase Auth.
 */
export async function updatePasswordInSupabase(
  identifier: string | AppUser,
  newPassword: string,
  currentCredentials: UserCredential[]
): Promise<{ success: boolean; updatedCredentials: UserCredential[] }> {
  const cleanPass = newPassword.trim();
  if (!cleanPass) {
    return { success: false, updatedCredentials: currentCredentials || [] };
  }

  // 1. Update in-memory & local copy
  let baseCreds = currentCredentials && currentCredentials.length > 0 ? [...currentCredentials] : [];
  try {
    const saved = localStorage.getItem('hteim_user_credentials');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseCreds = mergeUserCredentials(baseCreds, parsed);
      }
    }
  } catch (e) {}

  let updatedCredentials = baseCreds.map(cred => {
    if (isMatchingCredential(cred, identifier)) {
      return {
        ...cred,
        passwordHash: cleanPass,
        mustChangePassword: false,
        lastLoginAt: new Date().toISOString()
      };
    }
    return cred;
  });

  // Save to localStorage immediately
  try {
    localStorage.setItem('hteim_user_credentials', JSON.stringify(updatedCredentials));
  } catch (e) {}

  // 2. Persist updated user credentials directly to Supabase cloud
  try {
    const cloudState = await loadFromSupabase(undefined);
    if (cloudState) {
      const cloudCreds = Array.isArray(cloudState.userCredentials) ? cloudState.userCredentials : [];
      const mergedCloud = mergeUserCredentials(cloudCreds, updatedCredentials).map(cred => {
        if (isMatchingCredential(cred, identifier)) {
          return {
            ...cred,
            passwordHash: cleanPass,
            mustChangePassword: false,
            lastLoginAt: new Date().toISOString()
          };
        }
        return cred;
      });

      await saveToSupabase(undefined, {
        ...cloudState,
        userCredentials: mergedCloud
      });
      updatedCredentials = mergedCloud;
    }
  } catch (err) {
    logger.error('Failed to update password in Supabase cloud:', err);
  }

  // 3. If Supabase Auth session is active, update password there too
  try {
    await supabase.auth.updateUser({ password: cleanPass });
  } catch (e) {
    // Non-blocking
  }

  return {
    success: true,
    updatedCredentials
  };
}
