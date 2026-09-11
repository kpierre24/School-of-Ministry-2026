import { User } from 'firebase/auth';

export interface AuthUser extends User {
  role?: 'admin' | 'student' | 'teacher';
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
