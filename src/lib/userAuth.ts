export type UserRole = 'admin' | 'teacher' | 'student';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  username?: string;
  studentName?: string; // If role is student, links to student profile name
  studentId?: string; // Student ID for messaging and records
  moduleOrDepartment?: string;
  avatarUrl?: string;
  phone?: string;
  status?: 'active' | 'suspended';
  mustChangePassword?: boolean;
}

export interface UserCredential {
  id: string;
  email: string; // Primary login email
  username?: string; // Canonical format / username alias (e.g. ABurke, admin)
  name: string;
  role: UserRole;
  studentName?: string;
  moduleOrDepartment?: string;
  passwordHash: string; // Default 'password1' or custom encrypted/stored password
  mustChangePassword: boolean;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
}

export const DEFAULT_USER_PASSWORD = 'password1';
export const DEFAULT_ADMIN_EMAIL = 'kpierre24@gmail.com';
export const DEFAULT_ADMIN_NAME = 'Kendell Pierre';

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

// Derive canonical student email if custom email not set in student profile
export const getStudentEmailFromName = (fullName: string, customEmail?: string): string => {
  if (customEmail && customEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail.trim())) {
    return customEmail.trim().toLowerCase();
  }
  const username = generateStudentUsername(fullName);
  if (!username) return 'student@student.hteim.edu';
  return `${username.toLowerCase()}@student.hteim.edu`;
};

// Derive faculty email from teacher name if not set
export const getFacultyEmailFromName = (fullName: string, customEmail?: string): string => {
  if (customEmail && customEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail.trim())) {
    return customEmail.trim().toLowerCase();
  }
  const clean = (fullName || 'faculty').trim().toLowerCase().replace(/^(rev|dr|pastor|apostle|bishop|minister|evangelist|elder)\.?\s+/i, '');
  const slug = clean.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  return `${slug || 'teacher'}@hteim.edu`;
};

// Validate user credentials against the dynamic credentials list (Email or Username)
export const authenticateUser = (
  identifierInput: string, 
  passwordInput: string,
  credentials: UserCredential[]
): { success: boolean; user?: AppUser; error?: string; mustChangePassword?: boolean } => {
  const idLower = identifierInput.trim().toLowerCase();
  const p = passwordInput.trim();

  if (!idLower) {
    return { success: false, error: 'Please enter your email address.' };
  }
  if (!p) {
    return { success: false, error: 'Please enter your password.' };
  }

  // Find user by Email (case-insensitive) or by username / name
  const cred = (credentials || []).filter(Boolean).find(c => 
    (c && c.email && c.email.toLowerCase() === idLower) ||
    (c && c.username && c.username.toLowerCase() === idLower) ||
    (c && c.name && c.name.toLowerCase() === idLower)
  );

  if (cred) {
    if (cred.status === 'suspended') {
      return { 
        success: false, 
        error: 'This account has been suspended by the administrator. Please contact academic affairs at info@hteim.edu.' 
      };
    }

    // Direct password match (handles 'password1', '1234', custom passwords, and legacy pins)
    const isDefaultInput = (p === 'password1' || p === '1234');
    const isDefaultHash = (cred.passwordHash === 'password1' || cred.passwordHash === '1234' || cred.passwordHash === 'password' || cred.mustChangePassword);

    if (cred.passwordHash === p || (isDefaultInput && isDefaultHash)) {
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
        mustChangePassword: cred.mustChangePassword
      };
      
      return {
        success: true,
        user,
        mustChangePassword: cred.mustChangePassword
      };
    } else {
      return { success: false, error: 'Incorrect password. Default for first login is "password1".' };
    }
  }

  // Helpful suggestion if user tried admin
  if (idLower === 'admin' || idLower === 'admin@hteim.edu') {
    const adminUser = (credentials || []).filter(Boolean).find(c => c && c.role === 'admin');
    if (adminUser) {
      if (adminUser.passwordHash === p || p === DEFAULT_USER_PASSWORD) {
        return {
          success: true,
          user: {
            id: adminUser.id,
            email: adminUser.email,
            username: adminUser.username || 'admin',
            name: adminUser.name,
            role: 'admin',
            mustChangePassword: adminUser.mustChangePassword
          },
          mustChangePassword: adminUser.mustChangePassword
        };
      }
    }
  }

  return { 
    success: false, 
    error: `Account with email "${identifierInput}" was not found. Please verify spelling or contact the administrator to create your account.` 
  };
};

// Ensure all student profiles, faculty, and Kendell Pierre admin account have dynamic credentials in the system
export const ensureUserCredentials = (
  currentCredentials: UserCredential[],
  studentNames: string[],
  facultyList: Array<{ id?: string; name: string; email?: string; module?: string }> = [],
  studentEmailMap: Record<string, string> = {}
): { updatedCredentials: UserCredential[]; changed: boolean } => {
  let updated = [...(currentCredentials || [])].filter(Boolean);
  let changed = false;

  // 1. Ensure Kendell Pierre (kpierre24@gmail.com) Admin account exists
  const adminIdx = updated.findIndex(c => 
    c && (
      (c.email && c.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()) ||
      (c.username && c.username.toLowerCase() === 'admin')
    )
  );

  if (adminIdx === -1) {
    updated.unshift({
      id: 'u-admin-kpierre',
      email: DEFAULT_ADMIN_EMAIL,
      username: 'admin',
      name: DEFAULT_ADMIN_NAME,
      role: 'admin',
      passwordHash: DEFAULT_USER_PASSWORD,
      mustChangePassword: true,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    changed = true;
  } else {
    // Migrate legacy admin to Kendell Pierre / kpierre24@gmail.com
    const existing = updated[adminIdx];
    if (existing.email !== DEFAULT_ADMIN_EMAIL || existing.name !== DEFAULT_ADMIN_NAME) {
      updated[adminIdx] = {
        ...existing,
        email: DEFAULT_ADMIN_EMAIL,
        name: DEFAULT_ADMIN_NAME,
        role: 'admin',
        username: 'admin',
        status: existing.status || 'active',
        createdAt: existing.createdAt || new Date().toISOString()
      };
      changed = true;
    }
  }

  // 2. Ensure Faculty / Teachers exist with proper email accounts
  const defaultTeachers = [
    { name: 'Dr. Gillian Selkridge', email: 'gillian.selkridge@hteim.edu', module: 'Module 1: Apostolic Foundations' },
    { name: 'Rev. Samuel Selkridge', email: 'samuel.selkridge@hteim.edu', module: 'Module 2: Practical Evangelism' },
    { name: 'Pastor Gale Grant', email: 'gale.grant@hteim.edu', module: 'Module 3: Ministerial Ethics' },
    { name: 'Minister Christy Ruben', email: 'christy.ruben@hteim.edu', module: 'Module 4: Homiletics & Hermeneutics' },
    { name: 'Rev. Garod Andrews', email: 'garod.andrews@hteim.edu', module: 'Module 5: Church Leadership' }
  ];

  const allFaculty = facultyList && facultyList.length > 0 ? facultyList : defaultTeachers;

  allFaculty.forEach(teacher => {
    if (!teacher || !teacher.name) return;
    const email = getFacultyEmailFromName(teacher.name, teacher.email);
    const hasTeacher = updated.some(c => 
      c && (
        (c.email && c.email.toLowerCase() === email.toLowerCase()) ||
        (c.name && c.name.toLowerCase() === teacher.name.toLowerCase())
      )
    );

    if (!hasTeacher) {
      updated.push({
        id: `u-teacher-${teacher.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        email: email,
        username: teacher.name.toLowerCase().replace(/[^a-z0-9]/g, '.'),
        name: teacher.name,
        role: 'teacher',
        moduleOrDepartment: teacher.module || 'Faculty Instructor',
        passwordHash: DEFAULT_USER_PASSWORD,
        mustChangePassword: true,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      changed = true;
    }
  });

  // 3. Ensure each student profile in roster has a credential (email taken from profile, default password 'password1')
  studentNames.forEach(sName => {
    if (!sName || typeof sName !== 'string') return;
    const nameClean = sName.trim();
    if (!nameClean) return;
    const username = generateStudentUsername(nameClean);
    const studentKey = nameClean.toLowerCase().trim();
    const email = getStudentEmailFromName(nameClean, studentEmailMap[studentKey]);
    
    const existingIndex = updated.findIndex(c => 
      c && (
        (c.studentName && c.studentName.toLowerCase().trim() === studentKey) ||
        (c.email && c.email.toLowerCase().trim() === email.toLowerCase()) ||
        (c.username && c.username.toLowerCase() === username.toLowerCase())
      )
    );

    if (existingIndex === -1) {
      updated.push({
        id: `u-student-${nameClean.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        email: email,
        username: username,
        name: nameClean,
        role: 'student',
        studentName: nameClean,
        passwordHash: DEFAULT_USER_PASSWORD,
        mustChangePassword: true,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      changed = true;
    } else {
      // Sync student profile email if custom email updated
      const existing = updated[existingIndex];
      if (studentEmailMap[studentKey] && existing.email !== studentEmailMap[studentKey]) {
        updated[existingIndex] = {
          ...existing,
          email: studentEmailMap[studentKey]
        };
        changed = true;
      }
    }
  });

  return { updatedCredentials: updated, changed };
};

// Create a new user (Admin, Teacher, or Student)
export const createUserCredential = (
  credentials: UserCredential[],
  newUser: {
    name: string;
    email: string;
    role: UserRole;
    studentName?: string;
    moduleOrDepartment?: string;
    customPassword?: string;
    requirePasswordChange?: boolean;
  }
): { success: boolean; updatedCredentials: UserCredential[]; error?: string; user?: UserCredential } => {
  const emailClean = newUser.email.trim().toLowerCase();
  const nameClean = newUser.name.trim();

  if (!nameClean) {
    return { success: false, updatedCredentials: credentials, error: 'Full name is required.' };
  }
  if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
    return { success: false, updatedCredentials: credentials, error: 'A valid email address is required.' };
  }

  // Check uniqueness
  const emailExists = (credentials || []).some(c => c && c.email && c.email.toLowerCase() === emailClean);
  if (emailExists) {
    return { success: false, updatedCredentials: credentials, error: `An account with email "${emailClean}" already exists.` };
  }

  const username = generateStudentUsername(nameClean);
  const newCred: UserCredential = {
    id: `u-${newUser.role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email: emailClean,
    username: username || emailClean.split('@')[0],
    name: nameClean,
    role: newUser.role,
    studentName: newUser.role === 'student' ? (newUser.studentName || nameClean) : undefined,
    moduleOrDepartment: newUser.moduleOrDepartment,
    passwordHash: newUser.customPassword || DEFAULT_USER_PASSWORD,
    mustChangePassword: newUser.requirePasswordChange !== undefined ? newUser.requirePasswordChange : true,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const updatedCredentials = [newCred, ...credentials];
  return { success: true, updatedCredentials, user: newCred };
};

// Reset a user's password back to 'password1' with mustChangePassword = true
export const resetUserPassword = (
  credentials: UserCredential[],
  emailOrUsername: string,
  newPassword?: string
): UserCredential[] => {
  const idLower = (emailOrUsername || '').toLowerCase().trim();
  return (credentials || []).map(c => {
    if (!c) return c;
    if (
      (c.email && c.email.toLowerCase().trim() === idLower) ||
      (c.username && c.username.toLowerCase().trim() === idLower) ||
      (c.name && c.name.toLowerCase().trim() === idLower)
    ) {
      return {
        ...c,
        passwordHash: newPassword || DEFAULT_USER_PASSWORD,
        mustChangePassword: true // Must change on next login
      };
    }
    return c;
  });
};

// Update user details
export const updateUserCredential = (
  credentials: UserCredential[],
  id: string,
  updates: Partial<Omit<UserCredential, 'id' | 'createdAt'>>
): UserCredential[] => {
  return credentials.map(c => {
    if (c.id === id) {
      return {
        ...c,
        ...updates
      };
    }
    return c;
  });
};

// Delete user account
export const deleteUserCredential = (
  credentials: UserCredential[],
  id: string
): UserCredential[] => {
  return credentials.filter(c => c.id !== id);
};

