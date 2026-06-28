export interface User {
  id: string;
  email: string;
  role: 'student' | 'driver' | 'admin' | 'superadmin';
  name: string;
  phone?: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  role: User['role'] | null;
  isAuthenticated: boolean;
}
