export type UserRole = 'admin' | 'teacher' | 'student';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  studentName?: string; // If role is student, links to student profile name
  email?: string;
  avatarUrl?: string;
}

// Generate First Initial + Last Name username (e.g., Alex Burke -> ABurke)
export const generateStudentUsername = (fullName: string): string => {
  if (!fullName) return '';
  const clean = fullName.trim().replace(/\s+/g, ' ');
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

// Validate user credentials
export const authenticateUser = (
  usernameInput: string, 
  passwordInput: string,
  availableStudents: string[]
): { success: boolean; user?: AppUser; error?: string } => {
  const u = usernameInput.trim();
  const p = passwordInput.trim();

  if (!u) {
    return { success: false, error: 'Please enter a username.' };
  }
  if (!p) {
    return { success: false, error: 'Please enter a password.' };
  }

  // 1. Check Admin credentials (admin / 5678)
  if (u.toLowerCase() === 'admin') {
    if (p === '5678') {
      return {
        success: true,
        user: {
          id: 'u-admin',
          username: 'admin',
          name: 'Administrator',
          role: 'admin',
          email: 'admin@hteim.edu'
        }
      };
    } else {
      return { success: false, error: 'Incorrect password for Admin (Default is 5678).' };
    }
  }

  // 2. Check Teacher credentials (teacher / 12345)
  if (u.toLowerCase() === 'teacher' || u.toLowerCase() === 'faculty') {
    if (p === '12345') {
      return {
        success: true,
        user: {
          id: 'u-teacher',
          username: 'teacher',
          name: 'Rev. Dr. Faculty Instructor',
          role: 'teacher',
          email: 'teacher@hteim.edu'
        }
      };
    } else {
      return { success: false, error: 'Incorrect password for Teacher (Default is 12345).' };
    }
  }

  // 3. Check Student accounts (First Initial + Last Name / 12345)
  // Match input username against all students in directory
  const normalizedInput = u.toLowerCase();

  const matchedStudentName = availableStudents.find(sName => {
    const generatedUsername = generateStudentUsername(sName).toLowerCase();
    const rawLower = sName.toLowerCase().replace(/\s+/g, '');
    return generatedUsername === normalizedInput || rawLower === normalizedInput;
  });

  if (matchedStudentName) {
    if (p === '12345') {
      const canonicalUsername = generateStudentUsername(matchedStudentName);
      return {
        success: true,
        user: {
          id: `u-student-${matchedStudentName.toLowerCase().replace(/\s+/g, '-')}`,
          username: canonicalUsername,
          name: matchedStudentName,
          role: 'student',
          studentName: matchedStudentName,
          email: `${canonicalUsername.toLowerCase()}@student.hteim.edu`
        }
      };
    } else {
      return { success: false, error: `Incorrect password for student ${u} (Default is 12345).` };
    }
  }

  return { 
    success: false, 
    error: `Username "${u}" not found in system. (For Admin use 'admin' / 5678, for Teacher use 'teacher' / 12345, or a Student username e.g. 'ABurke' / 12345).` 
  };
};
