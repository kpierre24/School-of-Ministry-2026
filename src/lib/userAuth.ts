export type UserRole = 'admin' | 'teacher' | 'student';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  studentName?: string; // If role is student, links to student profile name
  studentId?: string; // Student ID for messaging and records
  email?: string;
  avatarUrl?: string;
}

export interface UserCredential {
  id: string;
  username: string; // Canonical format, e.g., ABurke, admin, teacher
  name: string;
  role: UserRole;
  studentName?: string;
  passwordHash: string; // Numeric PIN or custom password
  mustChangePassword: boolean;
}

// Generate First Initial + Last Name username (e.g., Alex Burke -> ABurke)
export const generateStudentUsername = (fullName: any): string => {
  if (!fullName) return '';
  const str = typeof fullName === 'string' ? fullName : (typeof fullName === 'object' && fullName.name ? fullName.name : String(fullName));
  if (typeof str !== 'string' || !str) return '';
  const clean = str.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  if (parts.length === 1) {
    // Single name (e.g., "Afeshia")
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  }
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastName = parts[parts.length - 1];
  // Sanitize non-alphanumeric characters from last name if any
  const cleanLastName = lastName.replace(/[^a-zA-Z]/g, '');
  if (!cleanLastName) return `${firstInitial}Student`;
  const formattedLastName = cleanLastName.charAt(0).toUpperCase() + cleanLastName.slice(1).toLowerCase();
  return `${firstInitial}${formattedLastName}`;
};

// Validate user credentials against the dynamic credentials list
export const authenticateUser = (
  usernameInput: string, 
  passwordInput: string,
  credentials: UserCredential[]
): { success: boolean; user?: AppUser; error?: string; mustChangePassword?: boolean } => {
  const u = usernameInput.trim().toLowerCase();
  const p = passwordInput.trim();

  if (!u) {
    return { success: false, error: 'Please enter a username.' };
  }
  if (!p) {
    return { success: false, error: 'Please enter a password.' };
  }

  // Find user by username (case-insensitive)
  const cred = credentials.find(c => c.username.toLowerCase() === u);

  if (cred) {
    if (cred.passwordHash === p) {
      const user: AppUser = {
        id: cred.id,
        username: cred.username,
        name: cred.name,
        role: cred.role,
        studentName: cred.studentName,
        email: cred.role === 'student' 
          ? `${cred.username.toLowerCase()}@student.hteim.edu` 
          : `${cred.username.toLowerCase()}@hteim.edu`
      };
      
      return {
        success: true,
        user,
        mustChangePassword: cred.mustChangePassword
      };
    } else {
      return { success: false, error: 'Incorrect password.' };
    }
  }

  return { 
    success: false, 
    error: `Username "${usernameInput}" not found in system. (Please check spelling or contact the administrator if you forgot your credentials).` 
  };
};

// Ensure all student profiles and default staff accounts have dynamic credentials in the system
export const ensureUserCredentials = (
  currentCredentials: UserCredential[],
  studentNames: string[]
): { updatedCredentials: UserCredential[]; changed: boolean } => {
  const updated = [...(currentCredentials || [])];
  let changed = false;

  // 1. Ensure Admin exists (default PIN 12345)
  const hasAdmin = updated.some(c => c.username.toLowerCase() === 'admin');
  if (!hasAdmin) {
    updated.push({
      id: 'u-admin',
      username: 'admin',
      name: 'Administrator',
      role: 'admin',
      passwordHash: '12345',
      mustChangePassword: true
    });
    changed = true;
  }

  // 2. Ensure Teacher/Faculty exists (default PIN 12345)
  const hasTeacher = updated.some(c => c.username.toLowerCase() === 'teacher');
  if (!hasTeacher) {
    updated.push({
      id: 'u-teacher',
      username: 'teacher',
      name: 'Rev. Dr. Faculty Instructor',
      role: 'teacher',
      passwordHash: '12345',
      mustChangePassword: true
    });
    changed = true;
  }

  // 3. Ensure each student profile has a credential (default PIN 1234)
  studentNames.forEach(sName => {
    if (!sName || typeof sName !== 'string') return;
    const username = generateStudentUsername(sName);
    if (!username) return;
    
    const hasStudent = updated.some(c => c.username.toLowerCase() === username.toLowerCase());
    if (!hasStudent) {
      updated.push({
        id: `u-student-${sName.toLowerCase().replace(/\s+/g, '-')}`,
        username: username,
        name: sName,
        role: 'student',
        studentName: sName,
        passwordHash: '1234',
        mustChangePassword: true
      });
      changed = true;
    }
  });

  return { updatedCredentials: updated, changed };
};

// Reset a user's password back to defaults (or custom set by admin)
export const resetUserPassword = (
  credentials: UserCredential[],
  username: string,
  newPassword?: string
): UserCredential[] => {
  return credentials.map(c => {
    if (c.username.toLowerCase() === username.toLowerCase()) {
      const defaultPin = c.role === 'student' ? '1234' : '12345';
      return {
        ...c,
        passwordHash: newPassword || defaultPin,
        mustChangePassword: true // Must change on next login
      };
    }
    return c;
  });
};
