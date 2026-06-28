import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types/api/auth';

interface AuthStore extends AuthState {
  setLogin: (user: User, token: string, refreshToken: string) => void;
  setLogout: () => void;
  updateToken: (token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,

      setLogin: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          role: user.role,
          isAuthenticated: true,
        }),

      setLogout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          role: null,
          isAuthenticated: false,
        }),

      updateToken: (token, refreshToken) =>
        set({ token, refreshToken }),
    }),
    {
      name: 'buslocator-auth',
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken, user: state.user, role: state.role, isAuthenticated: state.isAuthenticated }),
    }
  )
);
